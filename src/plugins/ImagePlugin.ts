/**
 * Plugin para conversão de imagens
 */

import { Plugin } from '../core/Plugin';
import { ConversionOptions, MetadataResult } from '../core/types';

export class ImagePlugin extends Plugin {
  readonly name = 'image-plugin';
  readonly version = '1.0.0';
  readonly inputFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg'];
  readonly outputFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'pdf'];

  async convert(input: Buffer | string, options: ConversionOptions): Promise<Buffer> {
    const sharp = await import('sharp');
    
    let image = sharp.default(Buffer.isBuffer(input) ? input : Buffer.from(input));

    // Aplicar transformações baseadas nas opções
    if (options.image) {
      // Redimensionar
      if (options.image.resize) {
        const [width, height] = options.image.resize.split('x').map(Number);
        image = image.resize(width, height);
      }

      // Rotacionar
      if (options.image.rotate) {
        image = image.rotate(options.image.rotate);
      }

      // Cortar
      if (options.image.crop) {
        const { x, y, width, height } = options.image.crop;
        image = image.extract({ left: x, top: y, width, height });
      }
    }

    // Aplicar compressão
    if (options.compression && options.compression !== 'none') {
      const quality = this.getQualityFromCompression(options.compression);
      
      // Aplicar qualidade baseada no formato de saída
      const outputFormat = options.outputFormat?.toLowerCase();
      if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
        image = image.jpeg({ quality });
      } else if (outputFormat === 'png') {
        image = image.png({ compressionLevel: Math.floor(quality / 10) });
      } else if (outputFormat === 'webp') {
        image = image.webp({ quality });
      }
    }

    // Converter para o formato desejado
    const outputFormat = options.outputFormat?.toLowerCase();
    switch (outputFormat) {
      case 'jpg':
      case 'jpeg':
        image = image.jpeg();
        break;
      case 'png':
        image = image.png();
        break;
      case 'gif':
        image = image.gif();
        break;
      case 'webp':
        image = image.webp();
        break;
      case 'tiff':
        image = image.tiff();
        break;
      case 'pdf':
        return this.convertToPDF(await image.png().toBuffer());
      default:
        // Manter formato original se não especificado
        break;
    }

    return image.toBuffer();
  }

  async extractMetadata(input: Buffer | string): Promise<MetadataResult> {
    const sharp = await import('sharp');
    const exifr = await import('exifr');
    
    const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
    const image = sharp.default(buffer);
    const metadata = await image.metadata();

    const result: MetadataResult = {
      format: metadata.format?.toUpperCase() || 'UNKNOWN',
      mimeType: `image/${metadata.format}`,
      fileSize: buffer.length,
      dimensions: {
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
    };

    // Extrair EXIF se disponível
    try {
      const exifData = await exifr.parse(buffer);
      if (exifData) {
        result.exif = exifData;
      }
    } catch {
      // EXIF não disponível
    }

    return result;
  }

  private getQualityFromCompression(compression: string): number {
    const qualityMap: Record<string, number> = {
      low: 95,
      medium: 85,
      high: 75,
      maximum: 60,
    };
    return qualityMap[compression] || 85;
  }

  private async convertToPDF(imageBuffer: Buffer): Promise<Buffer> {
    const { PDFDocument } = await import('pdf-lib');
    const sharp = await import('sharp');
    
    // Obter dimensões da imagem
    const image = sharp.default(imageBuffer);
    const metadata = await image.metadata();
    
    // Criar PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([metadata.width || 595, metadata.height || 842]);
    
    // Incorporar imagem
    const pngImage = await pdfDoc.embedPng(imageBuffer);
    
    // Desenhar imagem na página
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: metadata.width || 595,
      height: metadata.height || 842,
    });

    return Buffer.from(await pdfDoc.save());
  }

  validateOptions(options: ConversionOptions): boolean {
    // Validar opções específicas de imagem
    if (options.image) {
      if (options.image.resize) {
        const [width, height] = options.image.resize.split('x').map(Number);
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
          return false;
        }
      }

      if (options.image.crop) {
        const { x, y, width, height } = options.image.crop;
        if (x < 0 || y < 0 || width <= 0 || height <= 0) {
          return false;
        }
      }
    }

    return true;
  }
}
