/**
 * Plugin para dados estruturados (JSON, CSV, etc.)
 */

import { Plugin } from '../core/Plugin';
import { ConversionOptions } from '../core/types';

export class DataPlugin extends Plugin {
  readonly name = 'data-plugin';
  readonly version = '1.0.0';
  readonly inputFormats = ['json', 'csv', 'xml'];
  readonly outputFormats = ['json', 'csv', 'xml'];

  async convert(input: Buffer | string, options: ConversionOptions): Promise<Buffer> {
    const inputText = Buffer.isBuffer(input) ? input.toString('utf8') : input;
    const inputFormat = this.detectInputFormat(inputText);
    const outputFormat = options.outputFormat?.toLowerCase();

    if (!outputFormat) {
      throw new Error('Formato de saída não especificado');
    }

    // Conversões suportadas
    if (inputFormat === 'json' && outputFormat === 'csv') {
      return this.jsonToCsv(inputText);
    } else if (inputFormat === 'csv' && outputFormat === 'json') {
      return this.csvToJson(inputText);
    }

    // Se não há conversão específica, retorna como está
    return Buffer.from(inputText, 'utf8');
  }

  private detectInputFormat(input: string): string {
    const trimmed = input.trim();
    
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return 'json';
    }
    
    if (trimmed.includes(',') && trimmed.split('\n').length > 1) {
      return 'csv';
    }
    
    if (trimmed.startsWith('<')) {
      return 'xml';
    }
    
    return 'text';
  }

  private jsonToCsv(jsonText: string): Buffer {
    try {
      const data = JSON.parse(jsonText);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON deve ser um array para conversão para CSV');
      }
      
      if (data.length === 0) {
        return Buffer.from('', 'utf8');
      }
      
      // Obter cabeçalhos
      const headers = Object.keys(data[0]);
      const csvLines = [headers.join(',')];
      
      // Adicionar linhas de dados
      for (const item of data) {
        const values = headers.map(header => {
          const value = item[header];
          // Escapar vírgulas e aspas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value?.toString() || '';
        });
        csvLines.push(values.join(','));
      }
      
      return Buffer.from(csvLines.join('\n'), 'utf8');
    } catch (error) {
      throw new Error(`Erro na conversão JSON para CSV: ${error}`);
    }
  }

  private csvToJson(csvText: string): Buffer {
    try {
      const lines = csvText.trim().split('\n');
      
      if (lines.length === 0) {
        return Buffer.from('[]', 'utf8');
      }
      
      // Primeira linha são os cabeçalhos
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];
      
      // Processar linhas de dados
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const item: Record<string, any> = {};
        
        for (let j = 0; j < headers.length; j++) {
          let value = values[j] || '';
          
          // Remover aspas se presentes
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).replace(/""/g, '"');
          }
          
          // Tentar converter para número se possível
          if (!isNaN(Number(value)) && value !== '') {
            item[headers[j]] = Number(value);
          } else {
            item[headers[j]] = value;
          }
        }
        
        data.push(item);
      }
      
      return Buffer.from(JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Erro na conversão CSV para JSON: ${error}`);
    }
  }
}
