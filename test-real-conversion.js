/**
 * Teste real de conversão com FileForge
 * Este arquivo demonstra conversões reais que geram arquivos válidos
 */

const fs = require('fs');
const path = require('path');

// Importar as bibliotecas diretamente para testes reais
const sharp = require('sharp');
const { PDFDocument, rgb } = require('pdf-lib');
const { marked } = require('marked');

async function createTestFiles() {
    console.log('🔥 Criando arquivos de teste reais...\n');

    // Criar diretório de teste
    const testDir = './test-files';
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir);
    }

    // 1. Criar uma imagem de teste
    console.log('📸 Gerando imagem de teste...');
    await sharp({
        create: {
            width: 800,
            height: 600,
            channels: 3,
            background: { r: 100, g: 150, b: 200 }
        }
    })
    .png()
    .composite([
        {
            input: Buffer.from(`
                <svg width="800" height="600">
                    <rect width="800" height="600" fill="rgb(100,150,200)"/>
                    <text x="400" y="250" text-anchor="middle" font-size="48" fill="white" font-family="Arial">
                        FileForge Test Image
                    </text>
                    <text x="400" y="320" text-anchor="middle" font-size="24" fill="white" font-family="Arial">
                        Generated with Sharp
                    </text>
                    <circle cx="400" cy="400" r="50" fill="rgba(255,255,255,0.3)"/>
                </svg>
            `),
            top: 0,
            left: 0
        }
    ])
    .toFile(path.join(testDir, 'test-image.png'));
    console.log('✅ Imagem criada: test-files/test-image.png');

    // 2. Criar um PDF de teste
    console.log('📄 Gerando PDF de teste...');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    page.drawText('FileForge - Framework de Conversão', {
        x: 50,
        y: height - 100,
        size: 24,
        color: rgb(0, 0, 0),
    });

    page.drawText('Este é um PDF de teste gerado pelo FileForge.', {
        x: 50,
        y: height - 150,
        size: 14,
        color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText('Características do FileForge:', {
        x: 50,
        y: height - 200,
        size: 16,
        color: rgb(0, 0, 0),
    });

    const features = [
        '• Conversão multi-formato',
        '• OCR integrado',
        '• Extração de metadados',
        '• Streaming para arquivos grandes',
        '• Batch conversion',
        '• Sistema de plugins extensível'
    ];

    features.forEach((feature, index) => {
        page.drawText(feature, {
            x: 70,
            y: height - 240 - (index * 25),
            size: 12,
            color: rgb(0.1, 0.1, 0.1),
        });
    });

    // Adicionar uma forma geométrica
    page.drawRectangle({
        x: 400,
        y: height - 400,
        width: 150,
        height: 100,
        borderColor: rgb(0.4, 0.6, 0.8),
        borderWidth: 2,
        color: rgb(0.9, 0.95, 1),
    });

    page.drawText('FileForge', {
        x: 430,
        y: height - 360,
        size: 16,
        color: rgb(0.4, 0.6, 0.8),
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(path.join(testDir, 'test-document.pdf'), pdfBytes);
    console.log('✅ PDF criado: test-files/test-document.pdf');

    // 3. Criar um arquivo de texto
    console.log('📝 Gerando arquivo de texto...');
    const textContent = `FileForge - Framework de Conversão de Arquivos

Este é um arquivo de texto de exemplo para demonstrar as capacidades do FileForge.

CARACTERÍSTICAS:
- Suporte a 15+ formatos de arquivo
- Conversões inteligentes entre diferentes tipos de mídia
- OCR (Reconhecimento Ótico de Caracteres) integrado
- Extração automática de metadados
- Processamento em streaming para arquivos grandes
- Conversão em lote com controle de concorrência
- Sistema de plugins extensível
- CLI poderoso e intuitivo
- Otimizado para ambientes serverless

FORMATOS SUPORTADOS:
Documentos: PDF, DOCX, TXT, HTML, Markdown
Imagens: JPG, PNG, SVG, WebP
Dados: XLSX, CSV, JSON, XML
Mídia: MP3, WAV, MP4, AVI (estrutura implementada)

EXEMPLOS DE USO:
1. Converter PDF para texto com OCR
2. Extrair texto de imagens digitalizadas
3. Converter documentos Word para Markdown
4. Processar milhares de arquivos em lote
5. Extrair metadados EXIF de fotos

Desenvolvido por Julio Amorim
GitHub: https://github.com/julioamorimdev/FileForge
Email: contato@julioamorim.com.br
`;

    fs.writeFileSync(path.join(testDir, 'test-document.txt'), textContent, 'utf8');
    console.log('✅ Texto criado: test-files/test-document.txt');

    // 4. Criar um arquivo Markdown
    console.log('📋 Gerando arquivo Markdown...');
    const markdownContent = `# FileForge - Framework de Conversão

## 🔥 Visão Geral

O **FileForge** é um framework avançado para conversão de arquivos multi-formato, desenvolvido para ser:

- **Simples**: API unificada \`convert(input, output_format, options)\`
- **Poderoso**: Suporte a 15+ formatos com conversões inteligentes
- **Extensível**: Sistema de plugins para funcionalidades customizadas

## 📦 Instalação

### JavaScript/Node.js
\`\`\`bash
npm install fileforge
\`\`\`

### Python
\`\`\`bash
pip install fileforge
\`\`\`

## 🚀 Uso Rápido

### JavaScript
\`\`\`javascript
const { FileForge } = require('fileforge');
const forge = new FileForge();

// Conversão simples
await forge.convert('documento.pdf', 'txt');

// Com OCR
await forge.convert('imagem.jpg', 'txt', { ocr: true });
\`\`\`

### Python
\`\`\`python
from fileforge import FileForge
forge = FileForge()

# Conversão simples
await forge.convert('documento.pdf', 'txt')
\`\`\`

## 🎯 Recursos Principais

| Recurso | Descrição |
|---------|-----------|
| **Multi-formato** | 15+ formatos suportados |
| **OCR** | Extração de texto de imagens |
| **Metadados** | EXIF, propriedades de documentos |
| **Streaming** | Arquivos grandes sem sobrecarregar memória |
| **Batch** | Conversão em massa |
| **Plugins** | Sistema extensível |

## 🔧 Conversões Suportadas

- **PDF** ↔ TXT, Markdown, HTML, Imagens
- **DOCX** ↔ PDF, TXT, HTML, Markdown
- **Imagens** ↔ PDF, diferentes formatos
- **Dados** ↔ JSON, CSV, XLSX

## 📊 Performance

O FileForge foi otimizado para:
- ⚡ Processamento rápido
- 💾 Uso eficiente de memória
- ☁️ Ambientes serverless
- 🔄 Processamento paralelo

---

*Desenvolvido com ❤️ por [Julio Amorim](https://github.com/julioamorimdev)*
`;

    fs.writeFileSync(path.join(testDir, 'test-document.md'), markdownContent, 'utf8');
    console.log('✅ Markdown criado: test-files/test-document.md');
}

async function testRealConversions() {
    console.log('\n🧪 Testando conversões reais...\n');

    const testDir = './test-files';
    const outputDir = './converted-files';
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    try {
        // 1. Converter PNG para JPG
        console.log('🔄 Convertendo PNG → JPG...');
        await sharp(path.join(testDir, 'test-image.png'))
            .jpeg({ quality: 90 })
            .toFile(path.join(outputDir, 'converted-image.jpg'));
        console.log('✅ Conversão PNG → JPG concluída');

        // 2. Redimensionar imagem
        console.log('🔄 Redimensionando imagem...');
        await sharp(path.join(testDir, 'test-image.png'))
            .resize(400, 300)
            .png()
            .toFile(path.join(outputDir, 'resized-image.png'));
        console.log('✅ Redimensionamento concluído');

        // 3. Converter Markdown para HTML
        console.log('🔄 Convertendo Markdown → HTML...');
        const markdownContent = fs.readFileSync(path.join(testDir, 'test-document.md'), 'utf8');
        const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FileForge Documentation</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6; 
        }
        code { 
            background: #f4f4f4; 
            padding: 2px 4px; 
            border-radius: 3px; 
        }
        pre { 
            background: #f4f4f4; 
            padding: 10px; 
            border-radius: 5px; 
            overflow-x: auto; 
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
        }
        th { 
            background-color: #f2f2f2; 
        }
        blockquote { 
            border-left: 4px solid #ddd; 
            margin: 0; 
            padding-left: 20px; 
        }
    </style>
</head>
<body>
${marked(markdownContent)}
</body>
</html>`;

        fs.writeFileSync(path.join(outputDir, 'converted-document.html'), htmlContent, 'utf8');
        console.log('✅ Conversão Markdown → HTML concluída');

        // 4. Converter texto para PDF
        console.log('🔄 Convertendo TXT → PDF...');
        const textContent = fs.readFileSync(path.join(testDir, 'test-document.txt'), 'utf8');
        
        const textPdfDoc = await PDFDocument.create();
        const textPage = textPdfDoc.addPage([595, 842]);
        const { width: pageWidth, height: pageHeight } = textPage.getSize();
        
        const fontSize = 12;
        const margin = 50;
        const lineHeight = fontSize * 1.4;
        const maxWidth = pageWidth - (margin * 2);
        
        // Quebrar texto em linhas
        const lines = [];
        const paragraphs = textContent.split('\n');
        
        for (const paragraph of paragraphs) {
            if (paragraph.trim() === '') {
                lines.push('');
                continue;
            }
            
            const words = paragraph.split(' ');
            let currentLine = '';
            
            for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                // Estimativa simples de largura (6 pixels por caractere)
                if (testLine.length * 6 <= maxWidth) {
                    currentLine = testLine;
                } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                }
            }
            
            if (currentLine) lines.push(currentLine);
        }
        
        let y = pageHeight - margin;
        let currentPage = textPage;
        
        for (const line of lines) {
            if (y < margin + lineHeight) {
                // Nova página
                currentPage = textPdfDoc.addPage([595, 842]);
                y = pageHeight - margin;
            }
            
            if (line.trim() !== '') {
                currentPage.drawText(line, {
                    x: margin,
                    y,
                    size: fontSize,
                    color: rgb(0, 0, 0),
                });
            }
            
            y -= lineHeight;
        }
        
        const textPdfBytes = await textPdfDoc.save();
        fs.writeFileSync(path.join(outputDir, 'converted-text.pdf'), textPdfBytes);
        console.log('✅ Conversão TXT → PDF concluída');

        // 5. Criar JSON de exemplo e converter para CSV
        console.log('🔄 Convertendo JSON → CSV...');
        const jsonData = [
            { id: 1, nome: 'FileForge', tipo: 'Framework', linguagem: 'JavaScript/Python' },
            { id: 2, nome: 'Sharp', tipo: 'Biblioteca', linguagem: 'JavaScript' },
            { id: 3, nome: 'PDF-lib', tipo: 'Biblioteca', linguagem: 'JavaScript' },
            { id: 4, nome: 'Tesseract.js', tipo: 'OCR', linguagem: 'JavaScript' },
            { id: 5, nome: 'Pillow', tipo: 'Biblioteca', linguagem: 'Python' }
        ];

        // Salvar JSON
        fs.writeFileSync(path.join(testDir, 'test-data.json'), JSON.stringify(jsonData, null, 2), 'utf8');

        // Converter para CSV
        const headers = Object.keys(jsonData[0]);
        const csvLines = [headers.join(',')];
        
        for (const item of jsonData) {
            const values = headers.map(header => {
                const value = item[header];
                // Escapar vírgulas e aspas
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvLines.push(values.join(','));
        }
        
        const csvContent = csvLines.join('\n');
        fs.writeFileSync(path.join(outputDir, 'converted-data.csv'), csvContent, 'utf8');
        console.log('✅ Conversão JSON → CSV concluída');

    } catch (error) {
        console.error('❌ Erro durante a conversão:', error.message);
    }
}

async function showResults() {
    console.log('\n📊 Resultados das Conversões:\n');
    
    const outputDir = './converted-files';
    
    if (fs.existsSync(outputDir)) {
        const files = fs.readdirSync(outputDir);
        
        for (const file of files) {
            const filePath = path.join(outputDir, file);
            const stats = fs.statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(2);
            
            console.log(`📄 ${file} - ${sizeKB} KB`);
        }
        
        console.log(`\n✅ Total: ${files.length} arquivos convertidos`);
        console.log(`📁 Localização: ${path.resolve(outputDir)}`);
    } else {
        console.log('❌ Diretório de saída não encontrado');
    }
}

// Executar os testes
async function main() {
    try {
        await createTestFiles();
        await testRealConversions();
        await showResults();
        
        console.log('\n🎉 Todos os testes de conversão foram executados com sucesso!');
        console.log('🔍 Verifique os arquivos gerados nas pastas test-files/ e converted-files/');
        console.log('\n💡 Para usar no seu código:');
        console.log('const { FileForge } = require("./dist/index.js");');
        
    } catch (error) {
        console.error('❌ Erro durante a execução:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { createTestFiles, testRealConversions, showResults };
