/**
 * Classe principal do FileForge
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { glob } from 'glob';
import * as mime from 'mime-types';
import { 
  ConversionOptions, 
  ConversionResult, 
  MetadataResult, 
  BatchConversionOptions,
  BatchConversionResult,
  FileForgeConfig,
  Plugin,
  SupportedFormat
} from './types';
import { PluginManager } from './PluginManager';
import { MetadataExtractor } from '../utils/MetadataExtractor';
import { FileUtils } from '../utils/FileUtils';
import { StreamProcessor } from '../utils/StreamProcessor';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

export class FileForge {
  private config: FileForgeConfig;
  private pluginManager: PluginManager;
  private metadataExtractor: MetadataExtractor;
  private streamProcessor: StreamProcessor;

  constructor(config: FileForgeConfig = {}) {
    this.config = {
      tempDir: config.tempDir || '/tmp',
      memory: config.memory || 'normal',
      timeout: config.timeout || 300000, // 5 minutos
      plugins: config.plugins || [],
      cache: config.cache || { enabled: false, maxSize: 100, ttl: 3600 },
      logging: config.logging || { level: 'info' },
      ...config
    };

    this.pluginManager = new PluginManager(this.config);
    this.metadataExtractor = new MetadataExtractor(this.config);
    this.streamProcessor = new StreamProcessor(this.config);

    // Carregar plugins padrão
    this.loadDefaultPlugins();
  }

  /**
   * Converte um arquivo para o formato especificado
   */
  async convert(
    input: string | Buffer,
    outputFormat: string,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    
    try {
      // Preparar dados de entrada
      const inputData = await this.prepareInput(input);
      const originalFormat = await this.detectFormat(inputData.buffer, inputData.path);
      
      // Validar formatos
      if (!this.isFormatSupported(originalFormat, 'input')) {
        throw new Error(`Formato de entrada não suportado: ${originalFormat}`);
      }
      
      if (!this.isFormatSupported(outputFormat, 'output')) {
        throw new Error(`Formato de saída não suportado: ${outputFormat}`);
      }

      // Extrair metadados se solicitado
      let metadata: MetadataResult | undefined;
      if (options.metadata) {
        metadata = await this.extractMetadata(inputData.buffer, originalFormat);
      }

      // Executar conversão
      const conversionResult = await this.executeConversion(
        inputData.buffer,
        originalFormat,
        outputFormat,
        options
      );

      // Preparar resultado
      const result: ConversionResult = {
        success: true,
        originalFormat,
        outputFormat,
        originalSize: inputData.buffer.length,
        outputSize: conversionResult.length,
        processingTime: Date.now() - startTime,
        data: conversionResult,
        metadata
      };

      // Salvar arquivo se especificado
      if (options.outputDir || options.outputName) {
        const outputPath = await this.saveOutput(
          conversionResult,
          outputFormat,
          options,
          inputData.path
        );
        result.outputPath = outputPath;
      }

      return result;

    } catch (error) {
      return {
        success: false,
        originalFormat: 'unknown',
        outputFormat,
        originalSize: 0,
        processingTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Converte múltiplos arquivos em lote
   */
  async convertBatch(
    patterns: string | string[],
    outputFormat: string,
    options: Partial<BatchConversionOptions> = {}
  ): Promise<BatchConversionResult> {
    const startTime = Date.now();
    const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
    
    // Encontrar todos os arquivos
    const files: string[] = [];
    for (const pattern of patternsArray) {
      const matches = await glob(pattern);
      files.push(...matches);
    }

    const totalFiles = files.length;
    const results: ConversionResult[] = [];
    const errors: Array<{ file: string; error: string }> = [];
    const maxConcurrency = options.maxConcurrency || 5;

    // Processar arquivos em batches
    for (let i = 0; i < files.length; i += maxConcurrency) {
      const batch = files.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(async (file) => {
        try {
          const result = await this.convert(file, outputFormat, options);
          
          if (options.onProgress) {
            options.onProgress(results.length + 1, totalFiles, file);
          }
          
          return result;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push({ file, error: errorMsg });
          
          if (options.onError) {
            options.onError(error instanceof Error ? error : new Error(errorMsg), file);
          }
          
          if (!options.continueOnError) {
            throw error;
          }
          
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(r => r !== null) as ConversionResult[]);
    }

    return {
      totalFiles,
      successCount: results.filter(r => r.success).length,
      errorCount: errors.length,
      results,
      errors,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * Extrai metadados de um arquivo
   */
  async extractMetadata(
    input: string | Buffer,
    format?: string
  ): Promise<MetadataResult> {
    const inputData = await this.prepareInput(input);
    const detectedFormat = format || await this.detectFormat(inputData.buffer, inputData.path);
    
    return this.metadataExtractor.extract(inputData.buffer, detectedFormat, inputData.path);
  }

  /**
   * Adiciona um plugin customizado
   */
  addPlugin(plugin: Plugin): void {
    this.pluginManager.addPlugin(plugin);
  }

  /**
   * Remove um plugin
   */
  removePlugin(name: string): void {
    this.pluginManager.removePlugin(name);
  }

  /**
   * Lista todos os formatos suportados
   */
  getSupportedFormats(): SupportedFormat[] {
    return this.pluginManager.getSupportedFormats();
  }

  /**
   * Verifica se um formato é suportado
   */
  isFormatSupported(format: string, type: 'input' | 'output' = 'input'): boolean {
    return this.pluginManager.isFormatSupported(format, type);
  }

  // Métodos privados

  private async prepareInput(input: string | Buffer): Promise<{ buffer: Buffer; path?: string }> {
    if (Buffer.isBuffer(input)) {
      return { buffer: input };
    }
    
    const buffer = await readFile(input);
    return { buffer, path: input };
  }

  private async detectFormat(buffer: Buffer, filePath?: string): Promise<string> {
    // Tentar detectar pelo caminho do arquivo primeiro
    if (filePath) {
      const ext = path.extname(filePath).toLowerCase().slice(1);
      if (ext && this.isFormatSupported(ext)) {
        return ext;
      }
    }

    // Detectar pelo tipo MIME baseado no caminho
    const mimeType = filePath ? (mime.lookup(filePath) || 'application/octet-stream') : 'application/octet-stream';
    const extension = mime.extension(mimeType);
    
    if (extension && this.isFormatSupported(extension)) {
      return extension;
    }

    // Detectar pela assinatura do arquivo
    return FileUtils.detectFormatBySignature(buffer);
  }

  private async executeConversion(
    input: Buffer,
    inputFormat: string,
    outputFormat: string,
    options: ConversionOptions
  ): Promise<Buffer> {
    // Se os formatos são iguais, apenas retorna o input (com possíveis otimizações)
    if (inputFormat === outputFormat) {
      return this.optimizeFile(input, outputFormat, options);
    }

    // Encontrar plugin adequado
    const plugin = this.pluginManager.findPlugin(inputFormat, outputFormat);
    if (!plugin) {
      throw new Error(`Conversão não suportada: ${inputFormat} → ${outputFormat}`);
    }

    // Executar conversão
    const optionsWithFormat = { ...options, outputFormat };
    const result = await plugin.convert(input, optionsWithFormat);
    return Buffer.isBuffer(result) ? result : Buffer.from(result);
  }

  private async optimizeFile(
    input: Buffer,
    format: string,
    options: ConversionOptions
  ): Promise<Buffer> {
    if (!options.compression || options.compression === 'none') {
      return input;
    }

    // Aplicar otimizações baseadas no formato e opções
    const plugin = this.pluginManager.findPlugin(format, format);
    if (plugin) {
      const optionsWithFormat = { ...options, outputFormat: format };
      const result = await plugin.convert(input, optionsWithFormat);
      return Buffer.isBuffer(result) ? result : Buffer.from(result);
    }

    return input;
  }

  private async saveOutput(
    data: Buffer,
    format: string,
    options: ConversionOptions,
    originalPath?: string
  ): Promise<string> {
    const outputDir = options.outputDir || (originalPath ? path.dirname(originalPath) : './');
    
    let outputName = options.outputName;
    if (!outputName && originalPath) {
      const baseName = path.basename(originalPath, path.extname(originalPath));
      outputName = `${baseName}.${format}`;
    } else if (!outputName) {
      outputName = `output.${format}`;
    }

    const outputPath = path.join(outputDir, outputName);
    
    // Criar diretório se não existir
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    // Salvar arquivo
    await writeFile(outputPath, data);
    
    return outputPath;
  }

  private loadDefaultPlugins(): void {
    // Carregar plugins padrão
    try {
      const { ImagePlugin } = require('../plugins/ImagePlugin');
      const { DocumentPlugin } = require('../plugins/DocumentPlugin');
      const { DataPlugin } = require('../plugins/DataPlugin');
      const { ArchivePlugin } = require('../plugins/ArchivePlugin');
      
      this.pluginManager.addPlugin(new ImagePlugin());
      this.pluginManager.addPlugin(new DocumentPlugin());
      this.pluginManager.addPlugin(new DataPlugin());
      this.pluginManager.addPlugin(new ArchivePlugin());
    } catch (error) {
      console.warn('Aviso: Alguns plugins não puderam ser carregados:', error instanceof Error ? error.message : String(error));
    }
  }
}
