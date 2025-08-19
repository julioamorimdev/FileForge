"""
Classe principal do FileForge
"""

import asyncio
import time
import os
import mimetypes
from pathlib import Path
from typing import Union, List, Optional
import glob

from .types import (
    ConversionOptions, ConversionResult, MetadataResult,
    BatchConversionOptions, BatchConversionResult,
    FileForgeConfig, Plugin, SupportedFormat
)
from .plugin_manager import PluginManager
from ..utils.metadata_extractor import MetadataExtractor
from ..utils.file_utils import FileUtils
from ..utils.stream_processor import StreamProcessor


class FileForge:
    """Classe principal do FileForge para conversão de arquivos"""
    
    def __init__(self, config: Optional[FileForgeConfig] = None):
        """Inicializa o FileForge com configuração opcional"""
        self.config = config or FileForgeConfig()
        self.plugin_manager = PluginManager(self.config)
        self.metadata_extractor = MetadataExtractor(self.config)
        self.stream_processor = StreamProcessor(self.config)
        
        # Carregar plugins padrão
        self._load_default_plugins()
    
    async def convert(
        self,
        input_data: Union[str, bytes, Path],
        output_format: str,
        options: Optional[ConversionOptions] = None
    ) -> ConversionResult:
        """
        Converte um arquivo para o formato especificado
        
        Args:
            input_data: Caminho do arquivo, bytes ou objeto Path
            output_format: Formato de saída desejado
            options: Opções de conversão
            
        Returns:
            Resultado da conversão
        """
        start_time = time.time()
        options = options or ConversionOptions()
        options.output_format = output_format
        
        try:
            # Preparar dados de entrada
            input_buffer, input_path = await self._prepare_input(input_data)
            original_format = await self._detect_format(input_buffer, input_path)
            
            # Validar formatos
            if not self.is_format_supported(original_format, 'input'):
                raise ValueError(f"Formato de entrada não suportado: {original_format}")
            
            if not self.is_format_supported(output_format, 'output'):
                raise ValueError(f"Formato de saída não suportado: {output_format}")
            
            # Extrair metadados se solicitado
            metadata = None
            if options.metadata:
                metadata = await self.extract_metadata(input_buffer, original_format)
            
            # Executar conversão
            output_data = await self._execute_conversion(
                input_buffer, original_format, output_format, options
            )
            
            # Preparar resultado
            result = ConversionResult(
                success=True,
                original_format=original_format,
                output_format=output_format,
                original_size=len(input_buffer),
                output_size=len(output_data),
                processing_time=time.time() - start_time,
                data=output_data,
                metadata=metadata
            )
            
            # Salvar arquivo se especificado
            if options.output_dir or options.output_name:
                output_path = await self._save_output(
                    output_data, output_format, options, input_path
                )
                result.output_path = output_path
            
            return result
            
        except Exception as e:
            return ConversionResult(
                success=False,
                original_format='unknown',
                output_format=output_format,
                original_size=0,
                processing_time=time.time() - start_time,
                errors=[str(e)]
            )
    
    async def convert_batch(
        self,
        patterns: Union[str, List[str]],
        output_format: str,
        options: Optional[BatchConversionOptions] = None
    ) -> BatchConversionResult:
        """
        Converte múltiplos arquivos em lote
        
        Args:
            patterns: Padrão(ões) de arquivos para converter
            output_format: Formato de saída
            options: Opções de conversão em lote
            
        Returns:
            Resultado da conversão em lote
        """
        start_time = time.time()
        options = options or BatchConversionOptions()
        patterns_list = [patterns] if isinstance(patterns, str) else patterns
        
        # Encontrar todos os arquivos
        files = []
        for pattern in patterns_list:
            matches = glob.glob(pattern, recursive=True)
            files.extend(matches)
        
        total_files = len(files)
        results = []
        errors = []
        
        # Semáforo para controlar concorrência
        semaphore = asyncio.Semaphore(options.max_concurrency)
        
        async def convert_file(file_path: str) -> Optional[ConversionResult]:
            async with semaphore:
                try:
                    result = await self.convert(file_path, output_format, options)
                    
                    if options.on_progress:
                        options.on_progress(len(results) + 1, total_files, file_path)
                    
                    return result
                    
                except Exception as e:
                    error_msg = str(e)
                    errors.append({"file": file_path, "error": error_msg})
                    
                    if options.on_error:
                        options.on_error(e, file_path)
                    
                    if not options.continue_on_error:
                        raise
                    
                    return None
        
        # Executar conversões
        tasks = [convert_file(file_path) for file_path in files]
        completed_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filtrar resultados válidos
        results = [r for r in completed_results if isinstance(r, ConversionResult)]
        
        return BatchConversionResult(
            total_files=total_files,
            success_count=len([r for r in results if r.success]),
            error_count=len(errors),
            results=results,
            errors=errors,
            total_time=time.time() - start_time
        )
    
    async def extract_metadata(
        self,
        input_data: Union[str, bytes, Path],
        format_hint: Optional[str] = None
    ) -> MetadataResult:
        """
        Extrai metadados de um arquivo
        
        Args:
            input_data: Dados de entrada
            format_hint: Dica do formato (opcional)
            
        Returns:
            Metadados extraídos
        """
        input_buffer, input_path = await self._prepare_input(input_data)
        detected_format = format_hint or await self._detect_format(input_buffer, input_path)
        
        return await self.metadata_extractor.extract(
            input_buffer, detected_format, input_path
        )
    
    def add_plugin(self, plugin: Plugin) -> None:
        """Adiciona um plugin customizado"""
        self.plugin_manager.add_plugin(plugin)
    
    def remove_plugin(self, name: str) -> None:
        """Remove um plugin"""
        self.plugin_manager.remove_plugin(name)
    
    def get_supported_formats(self) -> List[SupportedFormat]:
        """Lista todos os formatos suportados"""
        return self.plugin_manager.get_supported_formats()
    
    def is_format_supported(self, format_name: str, type_: str = 'input') -> bool:
        """Verifica se um formato é suportado"""
        return self.plugin_manager.is_format_supported(format_name, type_)
    
    # Métodos privados
    
    async def _prepare_input(self, input_data: Union[str, bytes, Path]) -> tuple[bytes, Optional[str]]:
        """Prepara os dados de entrada"""
        if isinstance(input_data, bytes):
            return input_data, None
        
        if isinstance(input_data, (str, Path)):
            file_path = str(input_data)
            with open(file_path, 'rb') as f:
                data = f.read()
            return data, file_path
        
        raise ValueError("Tipo de entrada não suportado")
    
    async def _detect_format(self, buffer: bytes, file_path: Optional[str] = None) -> str:
        """Detecta o formato do arquivo"""
        # Tentar detectar pelo caminho do arquivo primeiro
        if file_path:
            ext = Path(file_path).suffix.lower().lstrip('.')
            if ext and self.is_format_supported(ext):
                return ext
        
        # Detectar pelo tipo MIME
        mime_type, _ = mimetypes.guess_type('dummy' + (Path(file_path).suffix if file_path else ''))
        if mime_type:
            ext = mimetypes.guess_extension(mime_type)
            if ext:
                ext = ext.lstrip('.')
                if self.is_format_supported(ext):
                    return ext
        
        # Detectar pela assinatura do arquivo
        return FileUtils.detect_format_by_signature(buffer)
    
    async def _execute_conversion(
        self,
        input_data: bytes,
        input_format: str,
        output_format: str,
        options: ConversionOptions
    ) -> bytes:
        """Executa a conversão"""
        # Se os formatos são iguais, apenas otimizar
        if input_format == output_format:
            return await self._optimize_file(input_data, output_format, options)
        
        # Encontrar plugin adequado
        plugin = self.plugin_manager.find_plugin(input_format, output_format)
        if not plugin:
            raise ValueError(f"Conversão não suportada: {input_format} → {output_format}")
        
        # Executar conversão
        result = await plugin.convert(input_data, options)
        return result if isinstance(result, bytes) else result.encode('utf-8')
    
    async def _optimize_file(
        self,
        input_data: bytes,
        format_name: str,
        options: ConversionOptions
    ) -> bytes:
        """Otimiza um arquivo no mesmo formato"""
        if options.compression.value == 'none':
            return input_data
        
        # Aplicar otimizações baseadas no formato
        plugin = self.plugin_manager.find_plugin(format_name, format_name)
        if plugin:
            result = await plugin.convert(input_data, options)
            return result if isinstance(result, bytes) else result.encode('utf-8')
        
        return input_data
    
    async def _save_output(
        self,
        data: bytes,
        format_name: str,
        options: ConversionOptions,
        original_path: Optional[str] = None
    ) -> str:
        """Salva o arquivo de saída"""
        output_dir = options.output_dir or (
            str(Path(original_path).parent) if original_path else './'
        )
        
        output_name = options.output_name
        if not output_name and original_path:
            base_name = Path(original_path).stem
            output_name = f"{base_name}.{format_name}"
        elif not output_name:
            output_name = f"output.{format_name}"
        
        output_path = Path(output_dir) / output_name
        
        # Criar diretório se não existir
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Salvar arquivo
        with open(output_path, 'wb') as f:
            f.write(data)
        
        return str(output_path)
    
    def _load_default_plugins(self) -> None:
        """Carrega os plugins padrão"""
        # Os plugins padrão serão carregados automaticamente
        # pelo PluginManager
        pass
