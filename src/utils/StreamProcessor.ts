/**
 * Processador de streaming para arquivos grandes
 */

import { Readable, Transform, pipeline } from 'stream';
import { promisify } from 'util';
import { FileForgeConfig } from '../core/types';

const pipelineAsync = promisify(pipeline);

export class StreamProcessor {
  private config: FileForgeConfig;

  constructor(config: FileForgeConfig) {
    this.config = config;
  }

  /**
   * Cria um stream de leitura a partir de um Buffer
   */
  createReadStream(buffer: Buffer, chunkSize?: number): Readable {
    const size = chunkSize || this.getOptimalChunkSize();
    let offset = 0;

    return new Readable({
      read() {
        if (offset >= buffer.length) {
          this.push(null); // End of stream
          return;
        }

        const chunk = buffer.subarray(offset, Math.min(offset + size, buffer.length));
        offset += chunk.length;
        this.push(chunk);
      }
    });
  }

  /**
   * Cria um transform stream para processamento de dados
   */
  createTransformStream(
    transformFn: (chunk: Buffer) => Promise<Buffer> | Buffer
  ): Transform {
    return new Transform({
      async transform(chunk: Buffer, encoding, callback) {
        try {
          const result = await transformFn(chunk);
          callback(null, result);
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      }
    });
  }

  /**
   * Processa um stream com uma função de transformação
   */
  async processStream(
    inputStream: Readable,
    transformFn: (chunk: Buffer) => Promise<Buffer> | Buffer
  ): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const transformStream = this.createTransformStream(transformFn);

    transformStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    await pipelineAsync(inputStream, transformStream);
    
    return Buffer.concat(chunks);
  }

  /**
   * Processa um arquivo grande em chunks
   */
  async processLargeFile(
    buffer: Buffer,
    processFn: (chunk: Buffer, index: number) => Promise<Buffer>,
    chunkSize?: number
  ): Promise<Buffer> {
    const size = chunkSize || this.getOptimalChunkSize();
    const chunks: Buffer[] = [];
    
    for (let i = 0; i < buffer.length; i += size) {
      const chunk = buffer.subarray(i, Math.min(i + size, buffer.length));
      const chunkIndex = Math.floor(i / size);
      
      const processedChunk = await processFn(chunk, chunkIndex);
      chunks.push(processedChunk);
    }

    return Buffer.concat(chunks);
  }

  /**
   * Cria um stream de conversão para processamento em lote
   */
  createConversionStream(
    convertFn: (data: Buffer) => Promise<Buffer>
  ): Transform {
    const bufferSize = this.getOptimalChunkSize();
    let buffer = Buffer.alloc(0);

    return new Transform({
      async transform(chunk: Buffer, encoding, callback) {
        try {
          buffer = Buffer.concat([buffer, chunk]);

          // Processar quando o buffer atingir o tamanho desejado
          if (buffer.length >= bufferSize) {
            const result = await convertFn(buffer);
            buffer = Buffer.alloc(0);
            callback(null, result);
          } else {
            callback();
          }
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      },

      async flush(callback) {
        try {
          if (buffer.length > 0) {
            const result = await convertFn(buffer);
            callback(null, result);
          } else {
            callback();
          }
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      }
    });
  }

  /**
   * Monitora o progresso de um stream
   */
  createProgressStream(
    totalSize: number,
    onProgress: (progress: number, bytesProcessed: number) => void
  ): Transform {
    let bytesProcessed = 0;

    return new Transform({
      transform(chunk: Buffer, encoding, callback) {
        bytesProcessed += chunk.length;
        const progress = Math.min((bytesProcessed / totalSize) * 100, 100);
        onProgress(progress, bytesProcessed);
        callback(null, chunk);
      }
    });
  }

  /**
   * Cria um stream com limitação de taxa (throttling)
   */
  createThrottleStream(bytesPerSecond: number): Transform {
    let lastTime = Date.now();
    let bytesThisSecond = 0;

    return new Transform({
      transform(chunk: Buffer, encoding, callback) {
        const now = Date.now();
        const timeDiff = now - lastTime;

        if (timeDiff >= 1000) {
          // Reset contador a cada segundo
          bytesThisSecond = 0;
          lastTime = now;
        }

        bytesThisSecond += chunk.length;

        if (bytesThisSecond > bytesPerSecond) {
          // Delay para respeitar o limite de taxa
          const delay = 1000 - timeDiff;
          setTimeout(() => callback(null, chunk), delay);
        } else {
          callback(null, chunk);
        }
      }
    });
  }

  /**
   * Combina múltiplos streams em paralelo
   */
  async processParallelStreams<T>(
    streams: Readable[],
    processFn: (stream: Readable, index: number) => Promise<T>
  ): Promise<T[]> {
    const promises = streams.map((stream, index) => processFn(stream, index));
    return Promise.all(promises);
  }

  /**
   * Calcula o tamanho ótimo de chunk baseado na configuração de memória
   */
  private getOptimalChunkSize(): number {
    const memoryMode = this.config.memory || 'normal';
    
    const chunkSizes = {
      low: 64 * 1024,      // 64KB
      normal: 256 * 1024,  // 256KB
      high: 1024 * 1024,   // 1MB
    };

    return chunkSizes[memoryMode];
  }

  /**
   * Verifica se um arquivo deve ser processado via streaming
   */
  shouldUseStreaming(fileSize: number): boolean {
    const memoryMode = this.config.memory || 'normal';
    
    const thresholds = {
      low: 10 * 1024 * 1024,    // 10MB
      normal: 50 * 1024 * 1024,  // 50MB
      high: 100 * 1024 * 1024,   // 100MB
    };

    return fileSize > thresholds[memoryMode];
  }

  /**
   * Estima o uso de memória para um arquivo
   */
  estimateMemoryUsage(fileSize: number): number {
    const chunkSize = this.getOptimalChunkSize();
    const overhead = 1.5; // Fator de overhead para processamento
    
    // Memória necessária = tamanho do chunk + overhead
    return Math.min(chunkSize * overhead, fileSize * overhead);
  }
}
