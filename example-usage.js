/**
 * Exemplo prático de uso do FileForge
 * Este arquivo demonstra como usar a API real do FileForge
 */

const { FileForge } = require('./dist/index.js');
const fs = require('fs');
const path = require('path');

async function exemploCompleto() {
    console.log('🔥 FileForge - Exemplo Completo de Uso\n');

    // Inicializar FileForge
    const forge = new FileForge({
        memory: 'normal',
        timeout: 30000,
        logging: { level: 'info' }
    });

    console.log('📋 Formatos suportados:');
    const formats = forge.getSupportedFormats();
    formats.forEach(format => {
        const caps = [];
        if (format.canRead) caps.push('leitura');
        if (format.canWrite) caps.push('escrita');
        if (format.hasMetadata) caps.push('metadados');
        console.log(`  ${format.extension.toUpperCase()}: ${format.description} (${caps.join(', ')})`);
    });

    console.log('\n🔄 Testando conversões reais...\n');

    try {
        // 1. Testar conversão de texto para PDF (usando arquivos reais)
        if (fs.existsSync('./test-files/test-document.txt')) {
            console.log('📄 Convertendo TXT → PDF...');
            const txtToPdfResult = await forge.convert(
                './test-files/test-document.txt', 
                'pdf',
                {
                    outputDir: './api-converted',
                    outputName: 'api-converted-text.pdf',
                    metadata: true
                }
            );

            if (txtToPdfResult.success) {
                console.log(`✅ Sucesso! Arquivo salvo: ${txtToPdfResult.outputPath}`);
                console.log(`   Tamanho original: ${formatBytes(txtToPdfResult.originalSize)}`);
                console.log(`   Tamanho final: ${formatBytes(txtToPdfResult.outputSize)}`);
                console.log(`   Tempo: ${txtToPdfResult.processingTime}ms`);
            } else {
                console.log('❌ Erro na conversão:', txtToPdfResult.errors);
            }
        }

        // 2. Testar conversão de imagem
        if (fs.existsSync('./test-files/test-image.png')) {
            console.log('\n🖼️ Convertendo PNG → JPG com redimensionamento...');
            const imageResult = await forge.convert(
                './test-files/test-image.png',
                'jpg',
                {
                    outputDir: './api-converted',
                    outputName: 'api-converted-image.jpg',
                    quality: 85,
                    compression: 'medium',
                    image: {
                        resize: '600x400'
                    },
                    metadata: true
                }
            );

            if (imageResult.success) {
                console.log(`✅ Sucesso! Arquivo salvo: ${imageResult.outputPath}`);
                console.log(`   Redução de tamanho: ${Math.round((1 - imageResult.outputSize / imageResult.originalSize) * 100)}%`);
                
                if (imageResult.metadata) {
                    console.log(`   Dimensões originais: ${imageResult.metadata.dimensions?.width}x${imageResult.metadata.dimensions?.height}`);
                }
            } else {
                console.log('❌ Erro na conversão:', imageResult.errors);
            }
        }

        // 3. Testar conversão Markdown → HTML
        if (fs.existsSync('./test-files/test-document.md')) {
            console.log('\n📋 Convertendo Markdown → HTML...');
            const mdResult = await forge.convert(
                './test-files/test-document.md',
                'html',
                {
                    outputDir: './api-converted',
                    outputName: 'api-converted-markdown.html',
                    metadata: true
                }
            );

            if (mdResult.success) {
                console.log(`✅ Sucesso! Arquivo salvo: ${mdResult.outputPath}`);
            } else {
                console.log('❌ Erro na conversão:', mdResult.errors);
            }
        }

        // 4. Testar extração de metadados
        if (fs.existsSync('./test-files/test-image.png')) {
            console.log('\n📊 Extraindo metadados da imagem...');
            const metadata = await forge.extractMetadata('./test-files/test-image.png');
            
            console.log('   Formato:', metadata.format);
            console.log('   Tipo MIME:', metadata.mimeType);
            console.log('   Tamanho:', formatBytes(metadata.fileSize));
            if (metadata.dimensions) {
                console.log(`   Dimensões: ${metadata.dimensions.width}x${metadata.dimensions.height}`);
            }
        }

        // 5. Testar conversão em lote (simulada)
        console.log('\n📦 Testando conversão em lote...');
        const batchResult = await forge.convertBatch(
            ['./test-files/*.txt', './test-files/*.md'],
            'html',
            {
                outputDir: './api-converted/batch',
                maxConcurrency: 2,
                continueOnError: true,
                onProgress: (current, total, file) => {
                    console.log(`   Progresso: ${current}/${total} - ${path.basename(file)}`);
                }
            }
        );

        console.log(`📊 Resultado do lote:`);
        console.log(`   Total: ${batchResult.totalFiles} arquivos`);
        console.log(`   Sucessos: ${batchResult.successCount}`);
        console.log(`   Erros: ${batchResult.errorCount}`);
        console.log(`   Tempo total: ${batchResult.totalTime}ms`);

        // 6. Demonstrar plugin customizado
        console.log('\n🔌 Testando plugin customizado...');
        
        const pluginCustomizado = {
            name: 'uppercase-converter',
            version: '1.0.0',
            inputFormats: ['txt'],
            outputFormats: ['upper'],
            convert: async (input, options) => {
                const text = Buffer.isBuffer(input) ? input.toString('utf8') : input;
                const upperText = `CONVERTIDO PARA MAIÚSCULAS:\n\n${text.toUpperCase()}`;
                return Buffer.from(upperText, 'utf8');
            }
        };

        forge.addPlugin(pluginCustomizado);
        
        if (fs.existsSync('./test-files/test-document.txt')) {
            const pluginResult = await forge.convert(
                './test-files/test-document.txt',
                'upper',
                {
                    outputDir: './api-converted',
                    outputName: 'plugin-uppercase.txt'
                }
            );

            if (pluginResult.success) {
                console.log(`✅ Plugin funcionou! Arquivo: ${pluginResult.outputPath}`);
            }
        }

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        console.error('Stack:', error.stack);
    }

    console.log('\n🎉 Exemplo completo finalizado!');
    console.log('📁 Verifique os arquivos convertidos em: ./api-converted/');
}

function formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

// Executar exemplo
if (require.main === module) {
    exemploCompleto().catch(console.error);
}

module.exports = { exemploCompleto };
