#!/usr/bin/env python3
"""
FileForge CLI Tool
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import List, Optional

import click
from tqdm import tqdm

from .core.fileforge import FileForge
from .core.types import ConversionOptions, BatchConversionOptions


@click.group()
@click.version_option(version="1.0.0")
def cli():
    """FileForge - Framework avançado de conversão de arquivos multi-formato"""
    pass


@cli.command()
@click.argument('input_file', type=click.Path(exists=True))
@click.option('-t', '--to', 'output_format', required=True, help='Formato de saída')
@click.option('-o', '--output', help='Caminho de saída')
@click.option('-q', '--quality', type=int, default=85, help='Qualidade da conversão (0-100)')
@click.option('-c', '--compress', default='medium', 
              type=click.Choice(['none', 'low', 'medium', 'high', 'maximum']),
              help='Nível de compressão')
@click.option('--ocr', is_flag=True, help='Ativar OCR para extração de texto')
@click.option('--ocr-lang', default='por', help='Idioma para OCR')
@click.option('--metadata', is_flag=True, help='Extrair metadados')
@click.option('--resize', help='Redimensionar imagem (ex: 800x600)')
@click.option('--rotate', type=int, help='Rotacionar imagem (graus)')
@click.option('--streaming', is_flag=True, help='Usar streaming para arquivos grandes')
@click.option('--debug', is_flag=True, help='Modo debug')
def convert(input_file, output_format, output, quality, compress, ocr, ocr_lang, 
           metadata, resize, rotate, streaming, debug):
    """Converte um arquivo para outro formato"""
    
    async def run_convert():
        forge = FileForge()
        
        # Preparar opções
        options = ConversionOptions(
            output_format=output_format,
            output_dir=str(Path(output).parent) if output else None,
            output_name=Path(output).name if output else None,
            quality=quality,
            compression=compress,
            ocr=ocr,
            ocr_language=ocr_lang,
            metadata=metadata,
            streaming=streaming,
            debug=debug
        )
        
        # Opções de imagem
        if resize or rotate:
            image_opts = {}
            if resize:
                image_opts['resize'] = resize
            if rotate:
                image_opts['rotate'] = rotate
            options.image = image_opts
        
        try:
            with tqdm(desc="Convertendo", unit="arquivo") as pbar:
                result = await forge.convert(input_file, output_format, options)
                pbar.update(1)
            
            if result.success:
                click.echo(click.style("✅ Conversão concluída com sucesso!", fg='green'))
                
                click.echo(click.style("\nDetalhes da conversão:", fg='blue'))
                click.echo(f"  Formato original: {result.original_format}")
                click.echo(f"  Formato de saída: {result.output_format}")
                click.echo(f"  Tamanho original: {format_bytes(result.original_size)}")
                click.echo(f"  Tamanho final: {format_bytes(result.output_size or 0)}")
                click.echo(f"  Tempo de processamento: {result.processing_time:.2f}s")
                
                if result.output_path:
                    click.echo(f"  Arquivo salvo em: {click.style(result.output_path, fg='cyan')}")
                
                if result.metadata and metadata:
                    click.echo(click.style("\nMetadados:", fg='blue'))
                    click.echo(json.dumps(result.metadata.__dict__, indent=2, default=str))
            else:
                click.echo(click.style("❌ Falha na conversão", fg='red'))
                for error in result.errors:
                    click.echo(click.style(f"  {error}", fg='red'))
                sys.exit(1)
                
        except Exception as e:
            click.echo(click.style(f"❌ Erro durante a conversão: {e}", fg='red'))
            sys.exit(1)
    
    asyncio.run(run_convert())


@cli.command()
@click.argument('patterns', nargs=-1, required=True)
@click.option('-t', '--to', 'output_format', required=True, help='Formato de saída')
@click.option('-o', '--output', help='Diretório de saída')
@click.option('-c', '--compress', default='medium',
              type=click.Choice(['none', 'low', 'medium', 'high', 'maximum']),
              help='Nível de compressão')
@click.option('--ocr', is_flag=True, help='Ativar OCR para extração de texto')
@click.option('--metadata', is_flag=True, help='Extrair metadados')
@click.option('--max-concurrent', type=int, default=5, help='Máximo de conversões paralelas')
@click.option('--continue-on-error', is_flag=True, help='Continuar em caso de erro')
@click.option('--debug', is_flag=True, help='Modo debug')
def batch(patterns, output_format, output, compress, ocr, metadata, 
         max_concurrent, continue_on_error, debug):
    """Converte múltiplos arquivos em lote"""
    
    async def run_batch():
        forge = FileForge()
        
        progress_bar = None
        
        def on_progress(current, total, file_path):
            nonlocal progress_bar
            if progress_bar is None:
                progress_bar = tqdm(total=total, desc="Convertendo arquivos")
            progress_bar.set_postfix(file=Path(file_path).name)
            progress_bar.update(1)
        
        def on_error(error, file_path):
            click.echo(click.style(f"\n❌ Erro em {file_path}: {error}", fg='red'))
        
        options = BatchConversionOptions(
            patterns=list(patterns),
            output_format=output_format,
            output_dir=output,
            compression=compress,
            ocr=ocr,
            metadata=metadata,
            max_concurrency=max_concurrent,
            continue_on_error=continue_on_error,
            debug=debug,
            on_progress=on_progress,
            on_error=on_error
        )
        
        try:
            result = await forge.convert_batch(list(patterns), output_format, options)
            
            if progress_bar:
                progress_bar.close()
            
            if result.success_count > 0:
                click.echo(click.style("✅ Conversão em lote concluída!", fg='green'))
                
                click.echo(click.style("\nResumo:", fg='blue'))
                click.echo(f"  Total de arquivos: {result.total_files}")
                click.echo(f"  Sucessos: {click.style(str(result.success_count), fg='green')}")
                click.echo(f"  Erros: {click.style(str(result.error_count), fg='red')}")
                click.echo(f"  Tempo total: {result.total_time:.2f}s")
                
                if result.errors:
                    click.echo(click.style("\nErros:", fg='red'))
                    for error_info in result.errors:
                        click.echo(f"  {error_info['file']}: {error_info['error']}")
            else:
                click.echo(click.style("❌ Nenhum arquivo foi convertido com sucesso", fg='red'))
                sys.exit(1)
                
        except Exception as e:
            if progress_bar:
                progress_bar.close()
            click.echo(click.style(f"❌ Erro durante a conversão em lote: {e}", fg='red'))
            sys.exit(1)
    
    asyncio.run(run_batch())


@cli.command()
@click.argument('input_file', type=click.Path(exists=True))
@click.option('--json', 'output_json', is_flag=True, help='Saída em formato JSON')
@click.option('--save', help='Salvar metadados em arquivo')
def metadata(input_file, output_json, save):
    """Extrai metadados de um arquivo"""
    
    async def run_metadata():
        forge = FileForge()
        
        try:
            with tqdm(desc="Extraindo metadados", unit="arquivo") as pbar:
                result = await forge.extract_metadata(input_file)
                pbar.update(1)
            
            click.echo(click.style("✅ Metadados extraídos com sucesso!", fg='green'))
            
            if output_json:
                output = json.dumps(result.__dict__, indent=2, default=str)
                click.echo(output)
                
                if save:
                    with open(save, 'w') as f:
                        f.write(output)
                    click.echo(click.style(f"Metadados salvos em: {save}", fg='blue'))
            else:
                click.echo(click.style("\nMetadados:", fg='blue'))
                click.echo(f"  Formato: {result.format}")
                click.echo(f"  Tipo MIME: {result.mime_type}")
                click.echo(f"  Tamanho: {format_bytes(result.file_size)}")
                
                if result.dimensions:
                    click.echo(f"  Dimensões: {result.dimensions['width']}x{result.dimensions['height']}")
                
                if result.duration:
                    click.echo(f"  Duração: {result.duration}s")
                
                if result.document:
                    click.echo(click.style("\nDocumento:", fg='blue'))
                    doc = result.document
                    if 'page_count' in doc:
                        click.echo(f"    Páginas: {doc['page_count']}")
                    if 'word_count' in doc:
                        click.echo(f"    Palavras: {doc['word_count']}")
                    if 'title' in doc:
                        click.echo(f"    Título: {doc['title']}")
                    if 'author' in doc:
                        click.echo(f"    Autor: {doc['author']}")
                
                if result.exif:
                    click.echo(click.style("\nEXIF:", fg='blue'))
                    for key, value in result.exif.items():
                        click.echo(f"    {key}: {value}")
                        
        except Exception as e:
            click.echo(click.style(f"❌ Erro ao extrair metadados: {e}", fg='red'))
            sys.exit(1)
    
    asyncio.run(run_metadata())


@cli.command()
@click.option('--category', help='Filtrar por categoria')
def formats(category):
    """Lista todos os formatos suportados"""
    
    async def run_formats():
        forge = FileForge()
        
        try:
            supported_formats = forge.get_supported_formats()
            
            if category:
                supported_formats = [f for f in supported_formats if f.category == category]
            
            click.echo(click.style("Formatos suportados:", fg='blue'))
            click.echo()
            
            categories = list(set(f.category for f in supported_formats))
            
            for cat in sorted(categories):
                click.echo(click.style(f"{cat.upper()}:", fg='yellow'))
                
                cat_formats = [f for f in supported_formats if f.category == cat]
                for fmt in sorted(cat_formats, key=lambda x: x.extension):
                    capabilities = []
                    if fmt.can_read:
                        capabilities.append(click.style('leitura', fg='green'))
                    if fmt.can_write:
                        capabilities.append(click.style('escrita', fg='blue'))
                    if fmt.has_metadata:
                        capabilities.append(click.style('metadados', fg='magenta'))
                    
                    caps_str = ', '.join(capabilities) if capabilities else 'nenhuma'
                    click.echo(f"  {fmt.extension.upper()}: {fmt.description} ({caps_str})")
                
                click.echo()
                
        except Exception as e:
            click.echo(click.style(f"❌ Erro ao listar formatos: {e}", fg='red'))
            sys.exit(1)
    
    asyncio.run(run_formats())


@cli.command()
@click.argument('input_file', type=click.Path(exists=True))
def info(input_file):
    """Mostra informações sobre um arquivo"""
    
    async def run_info():
        try:
            file_path = Path(input_file)
            stat = file_path.stat()
            
            forge = FileForge()
            
            click.echo(click.style("Informações do arquivo:", fg='blue'))
            click.echo(f"  Caminho: {click.style(str(file_path), fg='cyan')}")
            click.echo(f"  Tamanho: {format_bytes(stat.st_size)}")
            click.echo(f"  Criado: {stat.st_ctime}")
            click.echo(f"  Modificado: {stat.st_mtime}")
            
            # Detectar formato
            with open(file_path, 'rb') as f:
                buffer = f.read(1024)  # Ler apenas o início
            
            metadata = await forge.extract_metadata(buffer)
            click.echo(f"  Formato detectado: {metadata.format}")
            click.echo(f"  Tipo MIME: {metadata.mime_type}")
            
            # Mostrar formatos de conversão disponíveis
            formats_list = forge.get_supported_formats()
            input_format = metadata.format.lower()
            available_outputs = [
                f.extension.upper() 
                for f in formats_list 
                if f.can_write and f.extension != input_format
            ]
            
            if available_outputs:
                click.echo(click.style("\nFormatos de conversão disponíveis:", fg='blue'))
                click.echo(f"  {', '.join(sorted(available_outputs))}")
                
        except Exception as e:
            click.echo(click.style(f"❌ Erro ao obter informações do arquivo: {e}", fg='red'))
            sys.exit(1)
    
    asyncio.run(run_info())


def format_bytes(bytes_size: int) -> str:
    """Formatar tamanho em bytes"""
    sizes = ['B', 'KB', 'MB', 'GB']
    if bytes_size == 0:
        return '0 B'
    
    import math
    i = math.floor(math.log(bytes_size) / math.log(1024))
    return f"{bytes_size / (1024 ** i):.1f} {sizes[i]}"


def main():
    """Entry point para o CLI"""
    cli()


if __name__ == '__main__':
    main()
