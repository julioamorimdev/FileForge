/**
 * Plugin para conversão de documentos
 */

import { Plugin } from '../core/Plugin';
import { ConversionOptions, MetadataResult } from '../core/types';

export class DocumentPlugin extends Plugin {
  readonly name = 'document-plugin';
  readonly version = '1.0.0';
  readonly inputFormats = ['pdf', 'docx', 'txt', 'md', 'html'];
  readonly outputFormats = ['pdf', 'docx', 'txt', 'md', 'html'];

  async convert(input: Buffer | string, options: ConversionOptions): Promise<Buffer> {
    const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
    const inputFormat = await this.detectFormat(buffer);
    const outputFormat = options.outputFormat?.toLowerCase();

    if (!outputFormat) {
      throw new Error('Formato de saída não especificado');
    }

    // Rotas de conversão
    switch (`${inputFormat}->${outputFormat}`) {
      case 'pdf->txt':
        return this.pdfToText(buffer, options);
      case 'pdf->md':
        return this.pdfToMarkdown(buffer, options);
      case 'docx->txt':
        return this.docxToText(buffer);
      case 'docx->md':
        return this.docxToMarkdown(buffer);
      case 'docx->html':
        return this.docxToHtml(buffer);
      case 'txt->pdf':
        return this.textToPdf(buffer, options);
      case 'txt->docx':
        return this.textToDocx(buffer);
      case 'md->html':
        return this.markdownToHtml(buffer);
      case 'md->pdf':
        return this.markdownToPdf(buffer, options);
      case 'html->pdf':
        return this.htmlToPdf(buffer, options);
      case 'html->txt':
        return this.htmlToText(buffer);
      default:
        throw new Error(`Conversão não suportada: ${inputFormat} -> ${outputFormat}`);
    }
  }

  async extractMetadata(input: Buffer | string): Promise<MetadataResult> {
    const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
    const format = await this.detectFormat(buffer);

    const baseMetadata: MetadataResult = {
      format: format.toUpperCase(),
      mimeType: this.getMimeType(format),
      fileSize: buffer.length,
    };

    switch (format) {
      case 'pdf':
        return { ...baseMetadata, ...(await this.extractPdfMetadata(buffer)) };
      case 'docx':
        return { ...baseMetadata, ...(await this.extractDocxMetadata(buffer)) };
      default:
        return baseMetadata;
    }
  }

  // Métodos de conversão específicos

  private async pdfToText(buffer: Buffer, options: ConversionOptions): Promise<Buffer> {
    if (options.ocr) {
      return this.pdfToTextWithOCR(buffer);
    }
    
    // Usar pdf-parse para extrair texto
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(buffer);
    return Buffer.from(data.text, 'utf8');
  }

  private async pdfToTextWithOCR(buffer: Buffer): Promise<Buffer> {
    // Converter PDF para imagens e aplicar OCR
    const { createWorker } = await import('tesseract.js');
    
    try {
      const worker = await createWorker('por');
      
      // Por enquanto, aplicar OCR diretamente no buffer do PDF
      // TODO: Implementar conversão de página PDF para imagem
      const { data: { text } } = await worker.recognize(buffer);
      
      await worker.terminate();
      
      return Buffer.from(text, 'utf8');
    } catch (error) {
      // Fallback para extração de texto normal
      return this.pdfToText(buffer, { ocr: false });
    }
  }

  private async pdfToMarkdown(buffer: Buffer, options: ConversionOptions): Promise<Buffer> {
    const textBuffer = await this.pdfToText(buffer, options);
    const text = textBuffer.toString('utf8');
    
    // Converter texto simples para Markdown básico
    const markdown = this.textToMarkdown(text);
    return Buffer.from(markdown, 'utf8');
  }

  private async docxToText(buffer: Buffer): Promise<Buffer> {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return Buffer.from(result.value, 'utf8');
  }

  private async docxToMarkdown(buffer: Buffer): Promise<Buffer> {
    // Por enquanto, converter para HTML e depois para Markdown
    const htmlBuffer = await this.docxToHtml(buffer);
    const html = htmlBuffer.toString('utf8');
    
    // Conversão básica HTML para Markdown
    const markdown = this.htmlToMarkdown(html);
    return Buffer.from(markdown, 'utf8');
  }

  private async docxToHtml(buffer: Buffer): Promise<Buffer> {
    const mammoth = await import('mammoth');
    const result = await mammoth.convertToHtml({ buffer });
    return Buffer.from(result.value, 'utf8');
  }

  private async textToPdf(buffer: Buffer, options: ConversionOptions): Promise<Buffer> {
    const { PDFDocument, rgb } = await import('pdf-lib');
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    
    const text = buffer.toString('utf8');
    const fontSize = 12;
    const margin = 50;
    const lineHeight = fontSize * 1.2;
    const maxWidth = width - (margin * 2);
    
    // Quebrar texto em linhas
    const lines = this.wrapText(text, maxWidth, fontSize);
    
    let y = height - margin;
    for (const line of lines) {
      if (y < margin) {
        // Nova página
        const newPage = pdfDoc.addPage();
        y = newPage.getSize().height - margin;
        page.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
      } else {
        page.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
      }
      y -= lineHeight;
    }

    return Buffer.from(await pdfDoc.save());
  }

  private async textToDocx(buffer: Buffer): Promise<Buffer> {
    // TODO: Implementar conversão de texto para DOCX
    // Pode usar bibliotecas como docx ou officegen
    throw new Error('Conversão TXT -> DOCX ainda não implementada');
  }

  private async markdownToHtml(buffer: Buffer): Promise<Buffer> {
    const { marked } = await import('marked');
    const markdown = buffer.toString('utf8');
    const html = marked(markdown);
    
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 20px; }
    </style>
</head>
<body>
${html}
</body>
</html>`;

    return Buffer.from(fullHtml, 'utf8');
  }

  private async markdownToPdf(buffer: Buffer, options: ConversionOptions): Promise<Buffer> {
    const htmlBuffer = await this.markdownToHtml(buffer);
    return this.htmlToPdf(htmlBuffer, options);
  }

  private async htmlToPdf(buffer: Buffer, options: ConversionOptions): Promise<Buffer> {
    // TODO: Implementar conversão HTML para PDF
    // Por enquanto, retorna um PDF simples com o texto HTML
    const { PDFDocument, rgb } = await import('pdf-lib');
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    
    const html = buffer.toString('utf8');
    const text = this.stripHtmlTags(html);
    
    const fontSize = 12;
    const margin = 50;
    const lineHeight = fontSize * 1.2;
    const maxWidth = width - (margin * 2);
    
    // Quebrar texto em linhas
    const lines = this.wrapText(text, maxWidth, fontSize);
    
    let y = height - margin;
    for (const line of lines) {
      if (y < margin) {
        // Nova página
        const newPage = pdfDoc.addPage();
        y = newPage.getSize().height - margin;
        newPage.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
      } else {
        page.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
      }
      y -= lineHeight;
    }

    return Buffer.from(await pdfDoc.save());
  }

  private async htmlToText(buffer: Buffer): Promise<Buffer> {
    const cheerio = await import('cheerio');
    const html = buffer.toString('utf8');
    const $ = cheerio.load(html);
    
    // Remover scripts e styles
    $('script, style').remove();
    
    // Extrair texto
    const text = $.text();
    
    // Limpar espaços em branco excessivos
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    return Buffer.from(cleanText, 'utf8');
  }

  // Métodos auxiliares

  private async detectFormat(buffer: Buffer): Promise<string> {
    // Detectar formato baseado na assinatura do arquivo
    if (buffer.subarray(0, 4).toString() === '%PDF') return 'pdf';
    if (buffer.subarray(0, 2).toString('hex') === '504b') return 'docx'; // ZIP signature
    
    // Tentar detectar por conteúdo
    const content = buffer.toString('utf8', 0, Math.min(1000, buffer.length));
    if (content.includes('<html') || content.includes('<!DOCTYPE')) return 'html';
    if (content.includes('# ') || content.includes('## ')) return 'md';
    
    return 'txt';
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      md: 'text/markdown',
      html: 'text/html',
    };
    return mimeTypes[format] || 'text/plain';
  }

  private textToMarkdown(text: string): string {
    // Conversão básica de texto para Markdown
    const lines = text.split('\n');
    const markdown: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        markdown.push('');
        continue;
      }
      
      // Detectar possíveis títulos (linhas curtas em maiúscula)
      if (trimmed.length < 50 && trimmed === trimmed.toUpperCase()) {
        markdown.push(`## ${trimmed}`);
      } else {
        markdown.push(trimmed);
      }
    }
    
    return markdown.join('\n');
  }

  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    const avgCharWidth = fontSize * 0.6; // Estimativa
    const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);
    
    for (const word of words) {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }

  private htmlToMarkdown(html: string): string {
    // Conversão básica HTML para Markdown
    let markdown = html;
    
    // Headers
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
    
    // Bold and italic
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    
    // Links
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    
    // Paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    
    // Line breaks
    markdown = markdown.replace(/<br[^>]*>/gi, '\n');
    
    // Remove remaining HTML tags
    markdown = this.stripHtmlTags(markdown);
    
    // Clean up extra whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
    
    return markdown;
  }

  private async extractPdfMetadata(buffer: Buffer): Promise<Partial<MetadataResult>> {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(buffer);
      
      return {
        document: {
          pageCount: pdfDoc.getPageCount(),
          title: pdfDoc.getTitle() || undefined,
          author: pdfDoc.getAuthor() || undefined,
          subject: pdfDoc.getSubject() || undefined,
          creator: pdfDoc.getCreator() || undefined,
          producer: pdfDoc.getProducer() || undefined,
          creationDate: pdfDoc.getCreationDate() || undefined,
          modificationDate: pdfDoc.getModificationDate() || undefined,
        },
      };
    } catch {
      return {};
    }
  }

  private async extractDocxMetadata(buffer: Buffer): Promise<Partial<MetadataResult>> {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      const wordCount = result.value.split(/\s+/).filter(word => word.length > 0).length;
      
      return {
        document: {
          wordCount,
        },
      };
    } catch {
      return {};
    }
  }
}
