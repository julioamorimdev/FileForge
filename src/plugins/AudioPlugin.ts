/**
 * Plugin para conversão de áudio (placeholder)
 */

import { Plugin } from '../core/Plugin';
import { ConversionOptions } from '../core/types';

export class AudioPlugin extends Plugin {
  readonly name = 'audio-plugin';
  readonly version = '1.0.0';
  readonly inputFormats = ['mp3', 'wav', 'ogg', 'm4a'];
  readonly outputFormats = ['mp3', 'wav', 'ogg', 'm4a'];

  async convert(input: Buffer | string, options: ConversionOptions): Promise<Buffer> {
    // TODO: Implementar conversão de áudio
    // Por enquanto, retorna o input como está
    const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
    return buffer;
  }
}
