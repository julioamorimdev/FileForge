/**
 * Tipos e interfaces principais do FileForge
 */

export interface ConversionOptions {
  /** Formato de saída desejado */
  outputFormat?: string;
  
  /** Diretório de saída */
  outputDir?: string;
  
  /** Nome do arquivo de saída */
  outputName?: string;
  
  /** Opções de compressão */
  compression?: 'none' | 'low' | 'medium' | 'high' | 'maximum';
  
  /** Qualidade da conversão (0-100) */
  quality?: number;
  
  /** Ativar OCR para extração de texto */
  ocr?: boolean;
  
  /** Idioma para OCR */
  ocrLanguage?: string;
  
  /** Extrair metadados */
  metadata?: boolean;
  
  /** Opções de streaming para arquivos grandes */
  streaming?: boolean;
  
  /** Tamanho do buffer para streaming (bytes) */
  bufferSize?: number;
  
  /** Opções específicas por formato */
  formatOptions?: Record<string, any>;
  
  /** Opções de IA */
  ai?: {
    model?: string;
    apiKey?: string;
    maxTokens?: number;
    temperature?: number;
  };
  
  /** Opções de TTS (Text-to-Speech) */
  tts?: {
    voice?: string;
    speed?: number;
    pitch?: number;
  };
  
  /** Opções de processamento de imagem */
  image?: {
    resize?: string; // "width x height"
    rotate?: number;
    crop?: { x: number; y: number; width: number; height: number };
    watermark?: string;
  };
  
  /** Opções de processamento de vídeo */
  video?: {
    fps?: number;
    duration?: string; // "start-end" em segundos
    resolution?: string;
    codec?: string;
  };
  
  /** Opções de processamento de áudio */
  audio?: {
    bitrate?: string;
    sampleRate?: number;
    channels?: number;
  };
  
  /** Modo debug */
  debug?: boolean;
  
  /** Plugin customizado */
  plugin?: string;
}

export interface ConversionResult {
  /** Sucesso da conversão */
  success: boolean;
  
  /** Caminho do arquivo de saída */
  outputPath?: string;
  
  /** Dados do arquivo convertido (se streaming desabilitado) */
  data?: Buffer;
  
  /** Formato original */
  originalFormat: string;
  
  /** Formato de saída */
  outputFormat: string;
  
  /** Tamanho do arquivo original */
  originalSize: number;
  
  /** Tamanho do arquivo convertido */
  outputSize?: number;
  
  /** Tempo de processamento (ms) */
  processingTime: number;
  
  /** Metadados extraídos */
  metadata?: MetadataResult;
  
  /** Mensagens de erro */
  errors?: string[];
  
  /** Avisos */
  warnings?: string[];
}

export interface MetadataResult {
  /** Formato do arquivo */
  format: string;
  
  /** Tipo MIME */
  mimeType: string;
  
  /** Tamanho do arquivo */
  fileSize: number;
  
  /** Data de criação */
  created?: Date;
  
  /** Data de modificação */
  modified?: Date;
  
  /** Dimensões (para imagens/vídeos) */
  dimensions?: {
    width: number;
    height: number;
  };
  
  /** Duração (para áudio/vídeo) */
  duration?: number;
  
  /** Taxa de quadros (para vídeos) */
  fps?: number;
  
  /** Taxa de bits (para áudio/vídeo) */
  bitrate?: number;
  
  /** Dados EXIF (para imagens) */
  exif?: Record<string, any>;
  
  /** Propriedades de documento */
  document?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    pageCount?: number;
    wordCount?: number;
  };
  
  /** Texto extraído (se OCR ativado) */
  extractedText?: string;
  
  /** Metadados customizados */
  custom?: Record<string, any>;
}

export interface BatchConversionOptions extends ConversionOptions {
  /** Padrões de arquivos a serem convertidos */
  patterns: string[];
  
  /** Número máximo de conversões paralelas */
  maxConcurrency?: number;
  
  /** Continuar em caso de erro */
  continueOnError?: boolean;
  
  /** Callback de progresso */
  onProgress?: (completed: number, total: number, current: string) => void;
  
  /** Callback de erro */
  onError?: (error: Error, file: string) => void;
}

export interface BatchConversionResult {
  /** Total de arquivos processados */
  totalFiles: number;
  
  /** Arquivos convertidos com sucesso */
  successCount: number;
  
  /** Arquivos com erro */
  errorCount: number;
  
  /** Resultados individuais */
  results: ConversionResult[];
  
  /** Erros ocorridos */
  errors: Array<{ file: string; error: string }>;
  
  /** Tempo total de processamento */
  totalTime: number;
}

export interface FileForgeConfig {
  /** Diretório temporário */
  tempDir?: string;
  
  /** Modo de memória (low, normal, high) */
  memory?: 'low' | 'normal' | 'high';
  
  /** Timeout para conversões (ms) */
  timeout?: number;
  
  /** Plugins carregados */
  plugins?: Plugin[];
  
  /** Configurações de cache */
  cache?: {
    enabled: boolean;
    maxSize: number; // MB
    ttl: number; // segundos
  };
  
  /** Configurações de logging */
  logging?: {
    level: 'error' | 'warn' | 'info' | 'debug';
    file?: string;
  };
}

export interface Plugin {
  /** Nome do plugin */
  name: string;
  
  /** Versão do plugin */
  version: string;
  
  /** Formatos de entrada suportados */
  inputFormats: string[];
  
  /** Formatos de saída suportados */
  outputFormats: string[];
  
  /** Função de conversão */
  convert: (input: Buffer | string, options: ConversionOptions) => Promise<Buffer | string>;
  
  /** Função de extração de metadados (opcional) */
  extractMetadata?: (input: Buffer | string) => Promise<MetadataResult>;
  
  /** Validação de opções (opcional) */
  validateOptions?: (options: ConversionOptions) => boolean;
}

export interface SupportedFormat {
  /** Extensão do arquivo */
  extension: string;
  
  /** Tipo MIME */
  mimeType: string;
  
  /** Categoria */
  category: 'document' | 'image' | 'audio' | 'video' | 'archive' | 'data';
  
  /** Descrição */
  description: string;
  
  /** Suporte a leitura */
  canRead: boolean;
  
  /** Suporte a escrita */
  canWrite: boolean;
  
  /** Suporte a metadados */
  hasMetadata: boolean;
}
