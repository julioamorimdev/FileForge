/**
 * FileForge - Framework avançado de conversão de arquivos multi-formato
 * @author Julio Amorim <contato@julioamorim.com.br>
 * @version 1.0.0
 */

export { FileForge } from './core/FileForge';
export { ConversionOptions, ConversionResult, MetadataResult } from './core/types';
export { Plugin } from './core/Plugin';
export * from './plugins';

// Re-export principais funcionalidades
import { FileForge } from './core/FileForge';
export default FileForge;
