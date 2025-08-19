/**
 * Classe base para plugins do FileForge
 */

import { ConversionOptions, MetadataResult } from './types';

export abstract class Plugin {
  /** Nome único do plugin */
  abstract readonly name: string;
  
  /** Versão do plugin */
  abstract readonly version: string;
  
  /** Formatos de entrada suportados */
  abstract readonly inputFormats: string[];
  
  /** Formatos de saída suportados */
  abstract readonly outputFormats: string[];

  /**
   * Converte dados de entrada para o formato de saída
   */
  abstract convert(
    input: Buffer | string,
    options: ConversionOptions
  ): Promise<Buffer | string>;

  /**
   * Extrai metadados do arquivo (opcional)
   */
  async extractMetadata?(input: Buffer | string): Promise<MetadataResult>;

  /**
   * Valida opções de conversão (opcional)
   */
  validateOptions?(options: ConversionOptions): boolean;

  /**
   * Inicialização do plugin (opcional)
   */
  async initialize?(): Promise<void>;

  /**
   * Limpeza do plugin (opcional)
   */
  async cleanup?(): Promise<void>;

  /**
   * Verifica se o plugin pode processar a conversão
   */
  canConvert(inputFormat: string, outputFormat: string): boolean {
    return (
      this.inputFormats.includes(inputFormat) &&
      this.outputFormats.includes(outputFormat)
    );
  }

  /**
   * Obtém informações do plugin
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      inputFormats: this.inputFormats,
      outputFormats: this.outputFormats
    };
  }
}

/**
 * Interface para plugins simples (sem herança de classe)
 */
export interface SimplePlugin {
  name: string;
  version: string;
  inputFormats: string[];
  outputFormats: string[];
  convert: (input: Buffer | string, options: ConversionOptions) => Promise<Buffer | string>;
  extractMetadata?: (input: Buffer | string) => Promise<MetadataResult>;
  validateOptions?: (options: ConversionOptions) => boolean;
}

/**
 * Wrapper para converter SimplePlugin em Plugin
 */
export class SimplePluginWrapper extends Plugin {
  readonly name: string;
  readonly version: string;
  readonly inputFormats: string[];
  readonly outputFormats: string[];
  
  private simplePlugin: SimplePlugin;

  constructor(simplePlugin: SimplePlugin) {
    super();
    this.simplePlugin = simplePlugin;
    this.name = simplePlugin.name;
    this.version = simplePlugin.version;
    this.inputFormats = simplePlugin.inputFormats;
    this.outputFormats = simplePlugin.outputFormats;
  }

  async convert(input: Buffer | string, options: ConversionOptions): Promise<Buffer | string> {
    return this.simplePlugin.convert(input, options);
  }

  async extractMetadata(input: Buffer | string): Promise<MetadataResult> {
    if (this.simplePlugin.extractMetadata) {
      return this.simplePlugin.extractMetadata(input);
    }
    throw new Error(`Plugin ${this.name} não suporta extração de metadados`);
  }

  validateOptions(options: ConversionOptions): boolean {
    if (this.simplePlugin.validateOptions) {
      return this.simplePlugin.validateOptions(options);
    }
    return true;
  }
}
