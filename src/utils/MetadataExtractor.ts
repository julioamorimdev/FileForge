/**
 * Extrator de metadados para diferentes formatos de arquivo
 */

import { MetadataResult, FileForgeConfig } from '../core/types';
import * as exifr from 'exifr';
import * as fs from 'fs';

export class MetadataExtractor {
  private config: FileForgeConfig;

  constructor(config: FileForgeConfig) {
    this.config = config;
  }

  /**
   * Extrai metadados de um arquivo
   */
  async extract(
    buffer: Buffer,
    format: string,
    filePath?: string
  ): Promise<MetadataResult> {
    const baseMetadata: MetadataResult = {
      format: format.toUpperCase(),
      mimeType: this.getMimeType(format),
      fileSize: buffer.length,
      created: filePath ? await this.getFileCreationDate(filePath) : undefined,
      modified: filePath ? await this.getFileModificationDate(filePath) : undefined,
    };

    // Extrair metadados específicos por formato
    switch (format.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'tiff':
        return { ...baseMetadata, ...(await this.extractImageMetadata(buffer)) };
      
      case 'pdf':
        return { ...baseMetadata, ...(await this.extractPDFMetadata(buffer)) };
      
      case 'docx':
        return { ...baseMetadata, ...(await this.extractDocxMetadata(buffer)) };
      
      case 'xlsx':
        return { ...baseMetadata, ...(await this.extractXlsxMetadata(buffer)) };
      
      case 'mp3':
      case 'wav':
        return { ...baseMetadata, ...(await this.extractAudioMetadata(buffer)) };
      
      case 'mp4':
      case 'avi':
        return { ...baseMetadata, ...(await this.extractVideoMetadata(buffer)) };
      
      default:
        return baseMetadata;
    }
  }

  /**
   * Extrai metadados de imagens
   */
  private async extractImageMetadata(buffer: Buffer): Promise<Partial<MetadataResult>> {
    try {
      // Usar sharp para dimensões básicas
      const sharp = await import('sharp');
      const image = sharp.default(buffer);
      const metadata = await image.metadata();

      const result: Partial<MetadataResult> = {
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0,
        },
      };

      // Tentar extrair EXIF
      try {
        const exifData = await exifr.parse(buffer);
        if (exifData) {
          result.exif = this.processExifData(exifData);
        }
      } catch (error) {
        // EXIF não disponível ou erro na leitura
      }

      return result;
    } catch (error) {
      return {};
    }
  }

  /**
   * Extrai metadados de PDFs
   */
  private async extractPDFMetadata(buffer: Buffer): Promise<Partial<MetadataResult>> {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(buffer);
      
      const pageCount = pdfDoc.getPageCount();
      const title = pdfDoc.getTitle();
      const author = pdfDoc.getAuthor();
      const subject = pdfDoc.getSubject();
      const creator = pdfDoc.getCreator();
      const producer = pdfDoc.getProducer();
      const creationDate = pdfDoc.getCreationDate();
      const modificationDate = pdfDoc.getModificationDate();

      return {
        document: {
          pageCount,
          title: title || undefined,
          author: author || undefined,
          subject: subject || undefined,
          creator: creator || undefined,
          producer: producer || undefined,
          creationDate: creationDate || undefined,
          modificationDate: modificationDate || undefined,
        },
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Extrai metadados de documentos DOCX
   */
  private async extractDocxMetadata(buffer: Buffer): Promise<Partial<MetadataResult>> {
    try {
      const mammoth = await import('mammoth');
      
      // Extrair texto para contagem de palavras
      const result = await mammoth.extractRawText({ buffer });
      const wordCount = result.value.split(/\s+/).filter(word => word.length > 0).length;

      // TODO: Implementar extração de propriedades do documento DOCX
      // Isso requer parsing do XML interno do arquivo DOCX
      
      return {
        document: {
          wordCount,
        },
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Extrai metadados de planilhas XLSX
   */
  private async extractXlsxMetadata(buffer: Buffer): Promise<Partial<MetadataResult>> {
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      const sheetNames = workbook.SheetNames;
      const sheetCount = sheetNames.length;
      
      // Contar células com dados
      let totalCells = 0;
      sheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
        totalCells += (range.e.r - range.s.r + 1) * (range.e.c - range.s.c + 1);
      });

      return {
        document: {
          // Usar campos customizados para planilhas
        },
        custom: {
          sheetCount,
          totalCells,
          sheetNames,
        },
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Extrai metadados de arquivos de áudio
   */
  private async extractAudioMetadata(buffer: Buffer): Promise<Partial<MetadataResult>> {
    try {
      // TODO: Implementar extração de metadados de áudio
      // Pode usar bibliotecas como node-id3 ou music-metadata
      
      return {
        // Placeholder para metadados de áudio
        custom: {
          // title, artist, album, year, genre, etc.
        },
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Extrai metadados de arquivos de vídeo
   */
  private async extractVideoMetadata(buffer: Buffer): Promise<Partial<MetadataResult>> {
    try {
      // TODO: Implementar extração de metadados de vídeo
      // Pode usar ffprobe ou bibliotecas similares
      
      return {
        // Placeholder para metadados de vídeo
        custom: {
          // codec, resolution, fps, duration, etc.
        },
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Processa dados EXIF para formato padrão
   */
  private processExifData(exifData: any): Record<string, any> {
    const processed: Record<string, any> = {};

    // Mapear campos EXIF comuns
    const fieldMap: Record<string, string> = {
      Make: 'camera',
      Model: 'model',
      ISO: 'iso',
      FNumber: 'aperture',
      ExposureTime: 'shutterSpeed',
      FocalLength: 'focalLength',
      DateTime: 'dateTime',
      GPSLatitude: 'gpsLatitude',
      GPSLongitude: 'gpsLongitude',
    };

    for (const [exifKey, standardKey] of Object.entries(fieldMap)) {
      if (exifData[exifKey] !== undefined) {
        processed[standardKey] = exifData[exifKey];
      }
    }

    // Processar GPS se disponível
    if (exifData.GPSLatitude && exifData.GPSLongitude) {
      processed.gps = {
        lat: exifData.GPSLatitude,
        lng: exifData.GPSLongitude,
      };
    }

    return processed;
  }

  /**
   * Obtém o tipo MIME para um formato
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      md: 'text/markdown',
      html: 'text/html',
      csv: 'text/csv',
      json: 'application/json',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      zip: 'application/zip',
    };

    return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Obtém a data de criação do arquivo
   */
  private async getFileCreationDate(filePath: string): Promise<Date | undefined> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.birthtime;
    } catch {
      return undefined;
    }
  }

  /**
   * Obtém a data de modificação do arquivo
   */
  private async getFileModificationDate(filePath: string): Promise<Date | undefined> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.mtime;
    } catch {
      return undefined;
    }
  }
}
