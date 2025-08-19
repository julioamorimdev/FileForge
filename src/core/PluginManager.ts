/**
 * Gerenciador de plugins do FileForge
 */

import { Plugin, FileForgeConfig, SupportedFormat } from './types';
import { SimplePluginWrapper } from './Plugin';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private config: FileForgeConfig;

  constructor(config: FileForgeConfig) {
    this.config = config;
    this.loadBuiltinPlugins();
  }

  /**
   * Adiciona um plugin
   */
  addPlugin(plugin: Plugin | any): void {
    let pluginInstance: Plugin;
    
    // Se é um plugin simples (objeto), converter para Plugin
    if (typeof plugin === 'object' && !plugin.convert) {
      throw new Error('Plugin deve ter método convert');
    }
    
    // Se não é uma instância de Plugin, usar wrapper
    if (!plugin.getInfo) {
      pluginInstance = new SimplePluginWrapper(plugin);
    } else {
      pluginInstance = plugin;
    }

    if (this.plugins.has(pluginInstance.name)) {
      throw new Error(`Plugin '${pluginInstance.name}' já está registrado`);
    }

    // Validar plugin
    this.validatePlugin(pluginInstance);
    
    this.plugins.set(pluginInstance.name, pluginInstance);
  }

  /**
   * Remove um plugin
   */
  removePlugin(name: string): void {
    this.plugins.delete(name);
  }

  /**
   * Encontra um plugin capaz de converter entre os formatos especificados
   */
  findPlugin(inputFormat: string, outputFormat: string): Plugin | null {
    for (const plugin of this.plugins.values()) {
      if (
        plugin.inputFormats.includes(inputFormat) &&
        plugin.outputFormats.includes(outputFormat)
      ) {
        return plugin;
      }
    }
    return null;
  }

  /**
   * Lista todos os plugins registrados
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Obtém um plugin pelo nome
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Lista todos os formatos suportados
   */
  getSupportedFormats(): SupportedFormat[] {
    const formats: SupportedFormat[] = [];
    const formatMap = new Map<string, SupportedFormat>();

    for (const plugin of this.plugins.values()) {
      // Processar formatos de entrada
      for (const format of plugin.inputFormats) {
        if (!formatMap.has(format)) {
          formatMap.set(format, this.createFormatInfo(format, true, false));
        } else {
          formatMap.get(format)!.canRead = true;
        }
      }

      // Processar formatos de saída
      for (const format of plugin.outputFormats) {
        if (!formatMap.has(format)) {
          formatMap.set(format, this.createFormatInfo(format, false, true));
        } else {
          formatMap.get(format)!.canWrite = true;
        }
      }
    }

    return Array.from(formatMap.values());
  }

  /**
   * Verifica se um formato é suportado
   */
  isFormatSupported(format: string, type: 'input' | 'output' = 'input'): boolean {
    for (const plugin of this.plugins.values()) {
      if (type === 'input' && plugin.inputFormats.includes(format)) {
        return true;
      }
      if (type === 'output' && plugin.outputFormats.includes(format)) {
        return true;
      }
    }
    return false;
  }

  // Métodos privados

  private validatePlugin(plugin: Plugin): void {
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin deve ter um nome válido');
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error('Plugin deve ter uma versão válida');
    }

    if (!Array.isArray(plugin.inputFormats) || plugin.inputFormats.length === 0) {
      throw new Error('Plugin deve especificar formatos de entrada');
    }

    if (!Array.isArray(plugin.outputFormats) || plugin.outputFormats.length === 0) {
      throw new Error('Plugin deve especificar formatos de saída');
    }

    if (typeof plugin.convert !== 'function') {
      throw new Error('Plugin deve ter uma função convert');
    }
  }

  private createFormatInfo(
    format: string, 
    canRead: boolean, 
    canWrite: boolean
  ): SupportedFormat {
    const formatInfo = this.getFormatDetails(format);
    
    return {
      extension: format,
      mimeType: formatInfo.mimeType,
      category: formatInfo.category,
      description: formatInfo.description,
      canRead,
      canWrite,
      hasMetadata: formatInfo.hasMetadata
    };
  }

  private getFormatDetails(format: string) {
    const formatDetails: Record<string, any> = {
      // Documentos
      pdf: {
        mimeType: 'application/pdf',
        category: 'document',
        description: 'Portable Document Format',
        hasMetadata: true
      },
      docx: {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        category: 'document',
        description: 'Microsoft Word Document',
        hasMetadata: true
      },
      txt: {
        mimeType: 'text/plain',
        category: 'document',
        description: 'Plain Text',
        hasMetadata: false
      },
      md: {
        mimeType: 'text/markdown',
        category: 'document',
        description: 'Markdown',
        hasMetadata: false
      },
      html: {
        mimeType: 'text/html',
        category: 'document',
        description: 'HyperText Markup Language',
        hasMetadata: false
      },

      // Planilhas
      xlsx: {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        category: 'document',
        description: 'Microsoft Excel Spreadsheet',
        hasMetadata: true
      },
      csv: {
        mimeType: 'text/csv',
        category: 'data',
        description: 'Comma-Separated Values',
        hasMetadata: false
      },

      // Apresentações
      pptx: {
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        category: 'document',
        description: 'Microsoft PowerPoint Presentation',
        hasMetadata: true
      },

      // Imagens
      jpg: {
        mimeType: 'image/jpeg',
        category: 'image',
        description: 'JPEG Image',
        hasMetadata: true
      },
      jpeg: {
        mimeType: 'image/jpeg',
        category: 'image',
        description: 'JPEG Image',
        hasMetadata: true
      },
      png: {
        mimeType: 'image/png',
        category: 'image',
        description: 'Portable Network Graphics',
        hasMetadata: true
      },
      svg: {
        mimeType: 'image/svg+xml',
        category: 'image',
        description: 'Scalable Vector Graphics',
        hasMetadata: false
      },

      // Áudio
      mp3: {
        mimeType: 'audio/mpeg',
        category: 'audio',
        description: 'MPEG Audio Layer 3',
        hasMetadata: true
      },
      wav: {
        mimeType: 'audio/wav',
        category: 'audio',
        description: 'Waveform Audio File',
        hasMetadata: true
      },

      // Vídeo
      mp4: {
        mimeType: 'video/mp4',
        category: 'video',
        description: 'MPEG-4 Video',
        hasMetadata: true
      },
      avi: {
        mimeType: 'video/x-msvideo',
        category: 'video',
        description: 'Audio Video Interleave',
        hasMetadata: true
      },
      gif: {
        mimeType: 'image/gif',
        category: 'image',
        description: 'Graphics Interchange Format',
        hasMetadata: false
      },

      // Arquivos
      zip: {
        mimeType: 'application/zip',
        category: 'archive',
        description: 'ZIP Archive',
        hasMetadata: false
      },
      json: {
        mimeType: 'application/json',
        category: 'data',
        description: 'JavaScript Object Notation',
        hasMetadata: false
      }
    };

    return formatDetails[format] || {
      mimeType: 'application/octet-stream',
      category: 'data',
      description: 'Unknown Format',
      hasMetadata: false
    };
  }

  private loadBuiltinPlugins(): void {
    // Os plugins built-in são carregados pelo FileForge principal
    // para evitar dependências circulares
  }
}
