"""
Tipos e estruturas de dados do FileForge
"""

from typing import Dict, List, Optional, Any, Union, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class CompressionLevel(Enum):
    """Níveis de compressão"""
    NONE = "none"
    LOW = "low" 
    MEDIUM = "medium"
    HIGH = "high"
    MAXIMUM = "maximum"


class MemoryMode(Enum):
    """Modos de uso de memória"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"


class LogLevel(Enum):
    """Níveis de log"""
    ERROR = "error"
    WARN = "warn"
    INFO = "info"
    DEBUG = "debug"


@dataclass
class ConversionOptions:
    """Opções para conversão de arquivos"""
    output_format: Optional[str] = None
    output_dir: Optional[str] = None
    output_name: Optional[str] = None
    compression: CompressionLevel = CompressionLevel.MEDIUM
    quality: int = 85
    ocr: bool = False
    ocr_language: str = "por"
    metadata: bool = False
    streaming: bool = False
    buffer_size: int = 256 * 1024  # 256KB
    format_options: Dict[str, Any] = field(default_factory=dict)
    
    # Opções de IA
    ai: Optional[Dict[str, Any]] = None
    
    # Opções de TTS
    tts: Optional[Dict[str, Any]] = None
    
    # Opções de imagem
    image: Optional[Dict[str, Any]] = None
    
    # Opções de vídeo
    video: Optional[Dict[str, Any]] = None
    
    # Opções de áudio
    audio: Optional[Dict[str, Any]] = None
    
    debug: bool = False
    plugin: Optional[str] = None


@dataclass
class ConversionResult:
    """Resultado de uma conversão"""
    success: bool
    original_format: str
    output_format: str
    original_size: int
    processing_time: float
    output_path: Optional[str] = None
    data: Optional[bytes] = None
    output_size: Optional[int] = None
    metadata: Optional['MetadataResult'] = None
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


@dataclass
class MetadataResult:
    """Metadados extraídos de um arquivo"""
    format: str
    mime_type: str
    file_size: int
    created: Optional[datetime] = None
    modified: Optional[datetime] = None
    dimensions: Optional[Dict[str, int]] = None
    duration: Optional[float] = None
    fps: Optional[float] = None
    bitrate: Optional[int] = None
    exif: Optional[Dict[str, Any]] = None
    document: Optional[Dict[str, Any]] = None
    extracted_text: Optional[str] = None
    custom: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BatchConversionOptions(ConversionOptions):
    """Opções para conversão em lote"""
    patterns: List[str] = field(default_factory=list)
    max_concurrency: int = 5
    continue_on_error: bool = True
    on_progress: Optional[Callable[[int, int, str], None]] = None
    on_error: Optional[Callable[[Exception, str], None]] = None


@dataclass
class BatchConversionResult:
    """Resultado de conversão em lote"""
    total_files: int
    success_count: int
    error_count: int
    results: List[ConversionResult]
    errors: List[Dict[str, str]]
    total_time: float


@dataclass
class FileForgeConfig:
    """Configuração do FileForge"""
    temp_dir: str = "/tmp"
    memory: MemoryMode = MemoryMode.NORMAL
    timeout: int = 300  # 5 minutos em segundos
    plugins: List['Plugin'] = field(default_factory=list)
    cache: Optional[Dict[str, Any]] = None
    logging: Optional[Dict[str, Any]] = None


@dataclass
class SupportedFormat:
    """Informações sobre um formato suportado"""
    extension: str
    mime_type: str
    category: str
    description: str
    can_read: bool
    can_write: bool
    has_metadata: bool


class Plugin:
    """Classe base para plugins"""
    
    @property
    def name(self) -> str:
        """Nome único do plugin"""
        raise NotImplementedError
    
    @property
    def version(self) -> str:
        """Versão do plugin"""
        raise NotImplementedError
    
    @property
    def input_formats(self) -> List[str]:
        """Formatos de entrada suportados"""
        raise NotImplementedError
    
    @property
    def output_formats(self) -> List[str]:
        """Formatos de saída suportados"""
        raise NotImplementedError
    
    async def convert(self, input_data: Union[bytes, str], options: ConversionOptions) -> Union[bytes, str]:
        """Converte dados de entrada para o formato de saída"""
        raise NotImplementedError
    
    async def extract_metadata(self, input_data: Union[bytes, str]) -> MetadataResult:
        """Extrai metadados do arquivo (opcional)"""
        raise NotImplementedError("Plugin não suporta extração de metadados")
    
    def validate_options(self, options: ConversionOptions) -> bool:
        """Valida opções de conversão (opcional)"""
        return True
    
    async def initialize(self) -> None:
        """Inicialização do plugin (opcional)"""
        pass
    
    async def cleanup(self) -> None:
        """Limpeza do plugin (opcional)"""
        pass
    
    def can_convert(self, input_format: str, output_format: str) -> bool:
        """Verifica se o plugin pode processar a conversão"""
        return (
            input_format in self.input_formats and 
            output_format in self.output_formats
        )
    
    def get_info(self) -> Dict[str, Any]:
        """Obtém informações do plugin"""
        return {
            "name": self.name,
            "version": self.version,
            "input_formats": self.input_formats,
            "output_formats": self.output_formats
        }
