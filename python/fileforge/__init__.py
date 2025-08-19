"""
FileForge - Framework avançado de conversão de arquivos multi-formato
"""

from .core.fileforge import FileForge
from .core.types import ConversionOptions, ConversionResult, MetadataResult
from .core.plugin import Plugin

__version__ = "1.0.0"
__author__ = "Julio Amorim"
__email__ = "contato@julioamorim.com.br"

__all__ = [
    "FileForge",
    "ConversionOptions",
    "ConversionResult", 
    "MetadataResult",
    "Plugin"
]
