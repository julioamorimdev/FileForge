/**
 * Utilitários para manipulação de arquivos
 */

import * as path from 'path';
import * as fs from 'fs';

export class FileUtils {
  /**
   * Detecta o formato do arquivo pela assinatura (magic bytes)
   */
  static detectFormatBySignature(buffer: Buffer): string {
    const signatures: Record<string, number[][]> = {
      pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
      jpg: [[0xFF, 0xD8, 0xFF]], // JPEG
      jpeg: [[0xFF, 0xD8, 0xFF]], // JPEG
      png: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]], // PNG
      gif: [[0x47, 0x49, 0x46, 0x38]], // GIF8
      zip: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]], // ZIP
      docx: [[0x50, 0x4B, 0x03, 0x04]], // DOCX (é um ZIP)
      xlsx: [[0x50, 0x4B, 0x03, 0x04]], // XLSX (é um ZIP)
      pptx: [[0x50, 0x4B, 0x03, 0x04]], // PPTX (é um ZIP)
      mp3: [[0x49, 0x44, 0x33], [0xFF, 0xFB], [0xFF, 0xF3], [0xFF, 0xF2]], // MP3
      wav: [[0x52, 0x49, 0x46, 0x46]], // RIFF (WAV)
      mp4: [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]], // MP4
      avi: [[0x52, 0x49, 0x46, 0x46]], // RIFF (AVI)
    };

    for (const [format, sigs] of Object.entries(signatures)) {
      for (const sig of sigs) {
        if (this.matchesSignature(buffer, sig)) {
          // Para arquivos ZIP, precisamos verificar o conteúdo para distinguir DOCX/XLSX/PPTX
          if (format === 'zip' || format === 'docx' || format === 'xlsx' || format === 'pptx') {
            const detectedOfficeFormat = this.detectOfficeFormat(buffer);
            if (detectedOfficeFormat) {
              return detectedOfficeFormat;
            }
          }
          return format;
        }
      }
    }

    // Tentar detectar por conteúdo textual
    if (this.isTextFile(buffer)) {
      if (this.isMarkdown(buffer)) return 'md';
      if (this.isHTML(buffer)) return 'html';
      if (this.isCSV(buffer)) return 'csv';
      if (this.isJSON(buffer)) return 'json';
      return 'txt';
    }

    return 'unknown';
  }

  /**
   * Verifica se o buffer corresponde a uma assinatura
   */
  private static matchesSignature(buffer: Buffer, signature: number[]): boolean {
    if (buffer.length < signature.length) return false;
    
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) return false;
    }
    
    return true;
  }

  /**
   * Detecta o formato específico de arquivos Office (DOCX/XLSX/PPTX)
   */
  private static detectOfficeFormat(buffer: Buffer): string | null {
    try {
      // Converter para string e procurar por indicadores específicos
      const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
      
      if (content.includes('word/')) return 'docx';
      if (content.includes('xl/')) return 'xlsx';
      if (content.includes('ppt/')) return 'pptx';
      
      return 'zip';
    } catch {
      return 'zip';
    }
  }

  /**
   * Verifica se é um arquivo de texto
   */
  private static isTextFile(buffer: Buffer): boolean {
    const sample = buffer.subarray(0, Math.min(1024, buffer.length));
    
    // Verifica se há muitos caracteres não-ASCII
    let nonAscii = 0;
    for (let i = 0; i < sample.length; i++) {
      const byte = sample[i];
      if (byte === 0) return false; // Arquivo binário
      if (byte > 127) nonAscii++;
    }
    
    // Se mais de 30% são não-ASCII, provavelmente é binário
    return (nonAscii / sample.length) < 0.3;
  }

  /**
   * Verifica se é um arquivo Markdown
   */
  private static isMarkdown(buffer: Buffer): boolean {
    const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
    const markdownPatterns = [
      /^#{1,6}\s/m, // Headers
      /^\*\s/m, // Unordered lists
      /^\d+\.\s/m, // Ordered lists
      /\[.*\]\(.*\)/, // Links
      /\*\*.*\*\*/, // Bold
      /\*.*\*/, // Italic
      /```/, // Code blocks
    ];
    
    return markdownPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Verifica se é um arquivo HTML
   */
  private static isHTML(buffer: Buffer): boolean {
    const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
    return /<html|<head|<body|<div|<p|<!DOCTYPE/i.test(content);
  }

  /**
   * Verifica se é um arquivo CSV
   */
  private static isCSV(buffer: Buffer): boolean {
    const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
    const lines = content.split('\n').slice(0, 5);
    
    if (lines.length < 2) return false;
    
    // Verifica se as linhas têm o mesmo número de vírgulas
    const commaCount = lines[0].split(',').length - 1;
    if (commaCount === 0) return false;
    
    return lines.slice(1).every(line => 
      Math.abs((line.split(',').length - 1) - commaCount) <= 1
    );
  }

  /**
   * Verifica se é um arquivo JSON
   */
  private static isJSON(buffer: Buffer): boolean {
    try {
      const content = buffer.toString('utf8').trim();
      JSON.parse(content);
      return content.startsWith('{') || content.startsWith('[');
    } catch {
      return false;
    }
  }

  /**
   * Obtém o tamanho do arquivo
   */
  static async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.promises.stat(filePath);
    return stats.size;
  }

  /**
   * Verifica se um arquivo existe
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cria um diretório se não existir
   */
  static async ensureDir(dirPath: string): Promise<void> {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }

  /**
   * Gera um nome de arquivo temporário único
   */
  static generateTempFileName(extension?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const ext = extension ? `.${extension}` : '';
    return `temp_${timestamp}_${random}${ext}`;
  }

  /**
   * Obtém a extensão de um arquivo
   */
  static getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase().slice(1);
  }

  /**
   * Obtém o nome do arquivo sem extensão
   */
  static getFileNameWithoutExtension(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Formata o tamanho do arquivo em formato legível
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)}${units[unitIndex]}`;
  }

  /**
   * Valida se um nome de arquivo é válido
   */
  static isValidFileName(fileName: string): boolean {
    const invalidChars = /[<>:"/\\|?*]/;
    const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    
    return (
      fileName.length > 0 &&
      fileName.length <= 255 &&
      !invalidChars.test(fileName) &&
      !reservedNames.test(fileName) &&
      !fileName.startsWith('.') &&
      !fileName.endsWith('.')
    );
  }
}
