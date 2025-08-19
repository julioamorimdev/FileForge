#!/usr/bin/env node

/**
 * FileForge CLI Tool
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { FileForge } from '../core/FileForge';
import { ConversionOptions, BatchConversionOptions } from '../core/types';

const program = new Command();

program
  .name('fileforge')
  .description('Framework avançado de conversão de arquivos multi-formato')
  .version('1.0.0');

// Comando de conversão simples
program
  .command('convert')
  .description('Converte um arquivo para outro formato')
  .argument('<input>', 'arquivo de entrada')
  .option('-t, --to <format>', 'formato de saída')
  .option('-o, --output <path>', 'caminho de saída')
  .option('-q, --quality <number>', 'qualidade da conversão (0-100)', '85')
  .option('-c, --compress <level>', 'nível de compressão', 'medium')
  .option('--ocr', 'ativar OCR para extração de texto')
  .option('--ocr-lang <lang>', 'idioma para OCR', 'por')
  .option('--metadata', 'extrair metadados')
  .option('--resize <size>', 'redimensionar imagem (ex: 800x600)')
  .option('--rotate <degrees>', 'rotacionar imagem (graus)')
  .option('--streaming', 'usar streaming para arquivos grandes')
  .option('--debug', 'modo debug')
  .action(async (input, options) => {
    const spinner = ora('Iniciando conversão...').start();
    
    try {
      if (!options.to) {
        spinner.fail('Formato de saída é obrigatório. Use -t ou --to');
        process.exit(1);
      }

      if (!fs.existsSync(input)) {
        spinner.fail(`Arquivo não encontrado: ${input}`);
        process.exit(1);
      }

      const forge = new FileForge({
        logging: { level: options.debug ? 'debug' : 'info' }
      });

      const conversionOptions: ConversionOptions = {
        outputFormat: options.to,
        outputDir: options.output ? path.dirname(options.output) : undefined,
        outputName: options.output ? path.basename(options.output) : undefined,
        quality: parseInt(options.quality),
        compression: options.compress,
        ocr: options.ocr,
        ocrLanguage: options.ocrLang,
        metadata: options.metadata,
        streaming: options.streaming,
        debug: options.debug,
      };

      // Opções de imagem
      if (options.resize || options.rotate) {
        conversionOptions.image = {};
        if (options.resize) conversionOptions.image.resize = options.resize;
        if (options.rotate) conversionOptions.image.rotate = parseInt(options.rotate);
      }

      spinner.text = 'Convertendo arquivo...';
      
      const result = await forge.convert(input, options.to, conversionOptions);

      if (result.success) {
        spinner.succeed(chalk.green('Conversão concluída com sucesso!'));
        
        console.log(chalk.blue('\nDetalhes da conversão:'));
        console.log(`  Formato original: ${result.originalFormat}`);
        console.log(`  Formato de saída: ${result.outputFormat}`);
        console.log(`  Tamanho original: ${formatFileSize(result.originalSize)}`);
        console.log(`  Tamanho final: ${formatFileSize(result.outputSize || 0)}`);
        console.log(`  Tempo de processamento: ${result.processingTime}ms`);
        
        if (result.outputPath) {
          console.log(`  Arquivo salvo em: ${chalk.cyan(result.outputPath)}`);
        }

        if (result.metadata && options.metadata) {
          console.log(chalk.blue('\nMetadados:'));
          console.log(JSON.stringify(result.metadata, null, 2));
        }
      } else {
        spinner.fail(chalk.red('Falha na conversão'));
        if (result.errors) {
          result.errors.forEach(error => console.error(chalk.red(`  ${error}`)));
        }
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(chalk.red('Erro durante a conversão'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Comando de conversão em lote
program
  .command('batch')
  .description('Converte múltiplos arquivos em lote')
  .argument('<pattern...>', 'padrões de arquivos (ex: *.pdf *.docx)')
  .option('-t, --to <format>', 'formato de saída')
  .option('-o, --output <dir>', 'diretório de saída')
  .option('-c, --compress <level>', 'nível de compressão', 'medium')
  .option('--ocr', 'ativar OCR para extração de texto')
  .option('--metadata', 'extrair metadados')
  .option('--max-concurrent <number>', 'máximo de conversões paralelas', '5')
  .option('--continue-on-error', 'continuar em caso de erro')
  .option('--debug', 'modo debug')
  .action(async (patterns, options) => {
    const spinner = ora('Iniciando conversão em lote...').start();
    
    try {
      if (!options.to) {
        spinner.fail('Formato de saída é obrigatório. Use -t ou --to');
        process.exit(1);
      }

      const forge = new FileForge({
        logging: { level: options.debug ? 'debug' : 'info' }
      });

      const batchOptions: BatchConversionOptions = {
        patterns,
        outputFormat: options.to,
        outputDir: options.output,
        compression: options.compress,
        ocr: options.ocr,
        metadata: options.metadata,
        maxConcurrency: parseInt(options.maxConcurrent),
        continueOnError: options.continueOnError,
        debug: options.debug,
        onProgress: (completed, total, current) => {
          spinner.text = `Convertendo ${completed}/${total}: ${path.basename(current)}`;
        },
        onError: (error, file) => {
          console.error(chalk.red(`\nErro em ${file}: ${error.message}`));
        }
      };

      const result = await forge.convertBatch(patterns, options.to, batchOptions);

      if (result.successCount > 0) {
        spinner.succeed(chalk.green(`Conversão em lote concluída!`));
        
        console.log(chalk.blue('\nResumo:'));
        console.log(`  Total de arquivos: ${result.totalFiles}`);
        console.log(`  Sucessos: ${chalk.green(result.successCount)}`);
        console.log(`  Erros: ${chalk.red(result.errorCount)}`);
        console.log(`  Tempo total: ${result.totalTime}ms`);

        if (result.errors.length > 0) {
          console.log(chalk.red('\nErros:'));
          result.errors.forEach(({ file, error }) => {
            console.log(`  ${file}: ${error}`);
          });
        }
      } else {
        spinner.fail(chalk.red('Nenhum arquivo foi convertido com sucesso'));
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(chalk.red('Erro durante a conversão em lote'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Comando de extração de metadados
program
  .command('metadata')
  .description('Extrai metadados de um arquivo')
  .argument('<input>', 'arquivo de entrada')
  .option('--json', 'saída em formato JSON')
  .option('--save <path>', 'salvar metadados em arquivo')
  .action(async (input, options) => {
    const spinner = ora('Extraindo metadados...').start();
    
    try {
      if (!fs.existsSync(input)) {
        spinner.fail(`Arquivo não encontrado: ${input}`);
        process.exit(1);
      }

      const forge = new FileForge();
      const metadata = await forge.extractMetadata(input);

      spinner.succeed(chalk.green('Metadados extraídos com sucesso!'));

      if (options.json) {
        const output = JSON.stringify(metadata, null, 2);
        console.log(output);
        
        if (options.save) {
          fs.writeFileSync(options.save, output);
          console.log(chalk.blue(`Metadados salvos em: ${options.save}`));
        }
      } else {
        console.log(chalk.blue('\nMetadados:'));
        console.log(`  Formato: ${metadata.format}`);
        console.log(`  Tipo MIME: ${metadata.mimeType}`);
        console.log(`  Tamanho: ${formatFileSize(metadata.fileSize)}`);
        
        if (metadata.dimensions) {
          console.log(`  Dimensões: ${metadata.dimensions.width}x${metadata.dimensions.height}`);
        }
        
        if (metadata.duration) {
          console.log(`  Duração: ${metadata.duration}s`);
        }
        
        if (metadata.document) {
          console.log(chalk.blue('\nDocumento:'));
          if (metadata.document.pageCount) {
            console.log(`    Páginas: ${metadata.document.pageCount}`);
          }
          if (metadata.document.wordCount) {
            console.log(`    Palavras: ${metadata.document.wordCount}`);
          }
          if (metadata.document.title) {
            console.log(`    Título: ${metadata.document.title}`);
          }
          if (metadata.document.author) {
            console.log(`    Autor: ${metadata.document.author}`);
          }
        }
        
        if (metadata.exif) {
          console.log(chalk.blue('\nEXIF:'));
          Object.entries(metadata.exif).forEach(([key, value]) => {
            console.log(`    ${key}: ${value}`);
          });
        }
      }
    } catch (error) {
      spinner.fail(chalk.red('Erro ao extrair metadados'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Comando para listar formatos suportados
program
  .command('formats')
  .description('Lista todos os formatos suportados')
  .option('--category <category>', 'filtrar por categoria')
  .action(async (options) => {
    try {
      const forge = new FileForge();
      const formats = forge.getSupportedFormats();

      let filteredFormats = formats;
      if (options.category) {
        filteredFormats = formats.filter(f => f.category === options.category);
      }

      console.log(chalk.blue('Formatos suportados:'));
      console.log();

      const categories = [...new Set(filteredFormats.map(f => f.category))];
      
      for (const category of categories) {
        console.log(chalk.yellow(`${category.toUpperCase()}:`));
        
        const categoryFormats = filteredFormats.filter(f => f.category === category);
        categoryFormats.forEach(format => {
          const capabilities = [];
          if (format.canRead) capabilities.push(chalk.green('leitura'));
          if (format.canWrite) capabilities.push(chalk.blue('escrita'));
          if (format.hasMetadata) capabilities.push(chalk.magenta('metadados'));
          
          console.log(`  ${format.extension.toUpperCase()}: ${format.description} (${capabilities.join(', ')})`);
        });
        
        console.log();
      }
    } catch (error) {
      console.error(chalk.red('Erro ao listar formatos'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Comando de informações
program
  .command('info')
  .description('Mostra informações sobre um arquivo')
  .argument('<input>', 'arquivo de entrada')
  .action(async (input) => {
    try {
      if (!fs.existsSync(input)) {
        console.error(chalk.red(`Arquivo não encontrado: ${input}`));
        process.exit(1);
      }

      const stats = fs.statSync(input);
      const forge = new FileForge();
      
      console.log(chalk.blue('Informações do arquivo:'));
      console.log(`  Caminho: ${chalk.cyan(input)}`);
      console.log(`  Tamanho: ${formatFileSize(stats.size)}`);
      console.log(`  Criado: ${stats.birthtime.toLocaleString()}`);
      console.log(`  Modificado: ${stats.mtime.toLocaleString()}`);
      
      // Tentar detectar formato
      const buffer = fs.readFileSync(input);
      const metadata = await forge.extractMetadata(buffer);
      console.log(`  Formato detectado: ${metadata.format}`);
      console.log(`  Tipo MIME: ${metadata.mimeType}`);
      
      // Verificar formatos de conversão disponíveis
      const formats = forge.getSupportedFormats();
      const inputFormat = metadata.format.toLowerCase();
      const availableOutputs = formats
        .filter(f => f.canWrite && f.extension !== inputFormat)
        .map(f => f.extension.toUpperCase());
      
      if (availableOutputs.length > 0) {
        console.log(chalk.blue('\nFormatos de conversão disponíveis:'));
        console.log(`  ${availableOutputs.join(', ')}`);
      }
    } catch (error) {
      console.error(chalk.red('Erro ao obter informações do arquivo'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Função auxiliar para formatar tamanho de arquivo
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)}${units[unitIndex]}`;
}

// Executar CLI
program.parse();
