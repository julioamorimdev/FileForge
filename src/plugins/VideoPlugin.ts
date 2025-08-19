/**
 * Plugin para conversão de vídeo (placeholder)
 */

import { Plugin } from '../core/Plugin';
import { ConversionOptions } from '../core/types';

export class VideoPlugin extends Plugin {
  readonly name = 'video-plugin';
  readonly version = '1.0.0';
  readonly inputFormats = ['mp4', 'avi', 'mov', 'webm'];
  readonly outputFormats = ['mp4', 'avi', 'mov', 'webm', 'gif'];

  async convert(input: Buffer | string, options: ConversionOptions): Promise<Buffer> {
    // TODO: Implementar conversão de vídeo
    // Por enquanto, retorna o input como está
    const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
    return buffer;
  }
}
