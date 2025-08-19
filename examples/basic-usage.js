/**
 * Exemplo básico de uso do FileForge
 */

const { FileForge } = require('fileforge');

async function exemploBasico() {
  console.log('🔥 FileForge - Exemplo Básico\n');
  
  const forge = new FileForge();
  
  try {
    // Conversão simples: PDF para texto
    console.log('Convertendo PDF para texto...');
    const resultado = await forge.convert('documento.pdf', 'txt', {
      ocr: true,
      metadata: true
    });
    
    if (resultado.success) {
      console.log('✅ Conversão bem-sucedida!');
      console.log(`📄 Formato original: ${resultado.originalFormat}`);
      console.log(`📄 Formato final: ${resultado.outputFormat}`);
      console.log(`📊 Tamanho original: ${formatBytes(resultado.originalSize)}`);
      console.log(`📊 Tamanho final: ${formatBytes(resultado.outputSize)}`);
      console.log(`⏱️  Tempo: ${resultado.processingTime}ms`);
      
      if (resultado.metadata) {
        console.log('\n📋 Metadados:');
        console.log(JSON.stringify(resultado.metadata, null, 2));
      }
    } else {
      console.error('❌ Erro na conversão:', resultado.errors);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function exemploAvancado() {
  console.log('\n🔥 FileForge - Exemplo Avançado\n');
  
  const forge = new FileForge({
    memory: 'high',
    cache: { enabled: true, maxSize: 200, ttl: 3600 }
  });
  
  try {
    // Conversão com opções avançadas
    console.log('Convertendo imagem para PDF com OCR...');
    const resultado = await forge.convert('imagem.jpg', 'pdf', {
      ocr: true,
      ocrLanguage: 'por',
      compression: 'high',
      image: {
        resize: '1200x800',
        rotate: 90
      },
      metadata: true
    });
    
    if (resultado.success) {
      console.log('✅ Conversão avançada bem-sucedida!');
      console.log(`💾 Arquivo salvo em: ${resultado.outputPath}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function exemploBatch() {
  console.log('\n🔥 FileForge - Conversão em Lote\n');
  
  const forge = new FileForge();
  
  try {
    // Conversão em lote
    console.log('Convertendo múltiplos PDFs para Markdown...');
    const resultado = await forge.convertBatch(
      ['*.pdf', 'documentos/*.pdf'], 
      'md',
      {
        outputDir: './convertidos',
        maxConcurrency: 3,
        continueOnError: true,
        onProgress: (atual, total, arquivo) => {
          console.log(`📄 Progresso: ${atual}/${total} - ${arquivo}`);
        }
      }
    );
    
    console.log('\n📊 Resumo da conversão em lote:');
    console.log(`📁 Total de arquivos: ${resultado.totalFiles}`);
    console.log(`✅ Sucessos: ${resultado.successCount}`);
    console.log(`❌ Erros: ${resultado.errorCount}`);
    console.log(`⏱️  Tempo total: ${resultado.totalTime}ms`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function exemploPlugin() {
  console.log('\n🔥 FileForge - Plugin Customizado\n');
  
  const forge = new FileForge();
  
  // Plugin customizado para conversão especial
  const pluginCustomizado = {
    name: 'meu-plugin',
    version: '1.0.0',
    inputFormats: ['txt'],
    outputFormats: ['custom'],
    convert: async (input, options) => {
      const texto = input.toString();
      const textoMaiusculo = texto.toUpperCase();
      return Buffer.from(`CONVERTIDO PELO MEU PLUGIN:\n${textoMaiusculo}`);
    }
  };
  
  forge.addPlugin(pluginCustomizado);
  
  try {
    const resultado = await forge.convert('texto.txt', 'custom');
    
    if (resultado.success) {
      console.log('✅ Plugin customizado funcionou!');
      console.log('📄 Resultado:', resultado.data.toString());
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

// Executar exemplos
async function executarExemplos() {
  await exemploBasico();
  await exemploAvancado();
  await exemploBatch();
  await exemploPlugin();
  
  console.log('\n🎉 Todos os exemplos foram executados!');
}

// Executar se chamado diretamente
if (require.main === module) {
  executarExemplos().catch(console.error);
}

module.exports = {
  exemploBasico,
  exemploAvancado,
  exemploBatch,
  exemploPlugin
};
