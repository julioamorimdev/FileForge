# FileForge 🔥

**Framework avançado de conversão de arquivos multi-formato**

[![NPM Version](https://img.shields.io/npm/v/fileforge)](https://www.npmjs.com/package/fileforge)
[![PyPI Version](https://img.shields.io/pypi/v/fileforge)](https://pypi.org/project/fileforge/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/julioamorimdev/FileForge)](https://github.com/julioamorimdev/FileForge)

## 🚀 Características

- **Multi-formato real**: Suporte a 15+ formatos incluindo documentos, imagens, áudio, vídeo, arquivos compactados
- **Conversões inteligentes**: PDF → áudio narrado, DOCX → Markdown, Vídeo → GIF
- **OCR integrado**: Extração de texto de imagens e PDFs
- **Extração de metadados**: EXIF, propriedades de áudio/vídeo, autor de documentos
- **API unificada**: `convert(input, output_format, options)`
- **CLI poderoso**: Ferramenta de linha de comando completa
- **Streaming**: Processamento de arquivos grandes sem sobrecarregar a memória
- **Batch conversion**: Conversão em massa de milhares de arquivos
- **Serverless-ready**: Otimizado para AWS Lambda e Cloud Functions
- **Extensível**: Sistema de plugins para funcionalidades customizadas

## 📦 Instalação

### Node.js (NPM)
```bash
npm install fileforge
```

### Python (PyPI)
```bash
pip install fileforge
```

## 🔧 Uso Rápido

### JavaScript/TypeScript
```javascript
import { FileForge } from 'fileforge';

const forge = new FileForge();

// Conversão simples
await forge.convert('document.pdf', 'markdown');

// Com opções avançadas
await forge.convert('image.jpg', 'pdf', {
  ocr: true,
  compression: 'high',
  metadata: true
});

// Batch conversion
await forge.convertBatch(['*.pdf', '*.docx'], 'markdown', {
  outputDir: './converted'
});
```

### Python
```python
from fileforge import FileForge

forge = FileForge()

# Conversão simples
forge.convert('document.pdf', 'markdown')

# Com opções avançadas
forge.convert('image.jpg', 'pdf', 
    ocr=True, 
    compression='high', 
    metadata=True
)

# Batch conversion
forge.convert_batch(['*.pdf', '*.docx'], 'markdown', 
    output_dir='./converted'
)
```

### CLI
```bash
# Conversão simples
fileforge convert document.pdf --to markdown

# Batch conversion
fileforge batch *.pdf --to markdown --output ./converted

# Com OCR e compressão
fileforge convert image.jpg --to pdf --ocr --compress high

# Extrair metadados
fileforge metadata document.pdf
```

## 🎯 Formatos Suportados

### Documentos
- **PDF** ↔ DOCX, TXT, Markdown, HTML, Imagens
- **DOCX** ↔ PDF, TXT, Markdown, HTML
- **TXT** ↔ PDF, DOCX, Markdown, HTML
- **Markdown** ↔ PDF, DOCX, HTML, TXT
- **HTML** ↔ PDF, DOCX, Markdown, TXT

### Planilhas
- **XLSX** ↔ CSV, PDF, HTML, JSON

### Apresentações
- **PPTX** ↔ PDF, Imagens, HTML

### Imagens
- **JPG/JPEG** ↔ PNG, PDF, SVG, WebP
- **PNG** ↔ JPG, PDF, SVG, WebP
- **SVG** ↔ PNG, JPG, PDF

### Áudio
- **MP3** ↔ WAV, OGG, M4A
- **WAV** ↔ MP3, OGG, M4A

### Vídeo
- **MP4** ↔ AVI, MOV, WebM, GIF
- **AVI** ↔ MP4, MOV, WebM

### Arquivos
- **ZIP** ↔ TAR, 7Z (extração e compressão)
- **JSON** ↔ CSV, XLSX, XML

## 🧠 Conversões Inteligentes

```javascript
// PDF para áudio narrado
await forge.convert('report.pdf', 'mp3', {
  tts: {
    voice: 'pt-BR',
    speed: 1.2
  }
});

// Vídeo para GIF otimizado
await forge.convert('video.mp4', 'gif', {
  fps: 10,
  resize: '480x320',
  duration: '0-30' // primeiros 30 segundos
});

// Documento para resumo com IA
await forge.convert('document.docx', 'summary.txt', {
  ai: {
    model: 'gpt-3.5-turbo',
    maxTokens: 500
  }
});
```

## 📊 Extração de Metadados

```javascript
const metadata = await forge.extractMetadata('photo.jpg');
console.log(metadata);
/*
{
  format: 'JPEG',
  dimensions: { width: 1920, height: 1080 },
  exif: {
    camera: 'Canon EOS R5',
    iso: 100,
    aperture: 'f/2.8',
    shutterSpeed: '1/60',
    gps: { lat: -23.5505, lng: -46.6333 }
  },
  fileSize: '2.5MB',
  created: '2024-01-15T10:30:00Z'
}
*/
```

## 🔌 Sistema de Plugins

```javascript
// Criar plugin customizado
const customPlugin = {
  name: 'pdf-watermark',
  convert: async (input, options) => {
    // Lógica do plugin
  }
};

forge.addPlugin(customPlugin);

// Usar plugin
await forge.convert('document.pdf', 'pdf', {
  plugin: 'pdf-watermark',
  watermark: 'CONFIDENCIAL'
});
```

## ☁️ Serverless

```javascript
// AWS Lambda
exports.handler = async (event) => {
  const forge = new FileForge({ 
    memory: 'low',
    tempDir: '/tmp' 
  });
  
  const result = await forge.convert(
    event.inputFile, 
    event.outputFormat
  );
  
  return result;
};
```

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Veja nosso [guia de contribuição](CONTRIBUTING.md).

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Julio Amorim**
- GitHub: [@julioamorimdev](https://github.com/julioamorimdev)
- Email: contato@julioamorim.com.br

## ⭐ Apoie o Projeto

Se este projeto foi útil para você, considere dar uma estrela no GitHub!

---

*Feito com ❤️ por [Julio Amorim](https://github.com/julioamorimdev)*
