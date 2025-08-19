# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2024-01-15

### Adicionado
- 🎉 Lançamento inicial do FileForge
- 📄 Suporte a conversão de documentos (PDF, DOCX, TXT, Markdown, HTML)
- 🖼️ Suporte a conversão de imagens (JPG, PNG, GIF, SVG, WebP)
- 🎵 Suporte a conversão de áudio (MP3, WAV)
- 🎬 Suporte a conversão de vídeo (MP4, AVI, GIF)
- 📊 Suporte a planilhas (XLSX, CSV)
- 🗜️ Suporte a arquivos compactados (ZIP)
- 📋 Suporte a dados estruturados (JSON)
- 🔍 OCR integrado para extração de texto de imagens e PDFs
- 📊 Extração de metadados (EXIF, propriedades de documento, etc.)
- ⚡ API unificada `convert(input, output_format, options)`
- 🖥️ CLI tool completo para uso no terminal
- 📦 Suporte a streaming para arquivos grandes
- 🔄 Modo batch conversion para múltiplos arquivos
- ☁️ Otimizado para serverless (AWS Lambda, Cloud Functions)
- 🔌 Sistema de plugins extensível
- 🗜️ Compressão otimizada durante conversão
- 🤖 Integração com IA para sumarização (opcional)
- 📚 Documentação completa e exemplos
- 🐍 Pacote Python (PyPI)
- 📦 Pacote JavaScript/TypeScript (NPM)

### Recursos Principais
- **Multi-formato**: 15+ formatos suportados
- **Conversões inteligentes**: PDF → áudio, DOCX → Markdown, Vídeo → GIF
- **OCR avançado**: Tesseract.js integrado
- **Metadados completos**: EXIF, propriedades de documento, etc.
- **Performance otimizada**: Streaming e processamento em lote
- **Extensibilidade**: Sistema de plugins robusto
- **Developer-friendly**: API simples e documentação completa

### Formatos Suportados

#### Documentos
- PDF ↔ DOCX, TXT, Markdown, HTML, Imagens
- DOCX ↔ PDF, TXT, Markdown, HTML  
- TXT ↔ PDF, DOCX, Markdown, HTML
- Markdown ↔ PDF, DOCX, HTML, TXT
- HTML ↔ PDF, DOCX, Markdown, TXT

#### Imagens
- JPG/JPEG ↔ PNG, PDF, SVG, WebP
- PNG ↔ JPG, PDF, SVG, WebP
- SVG ↔ PNG, JPG, PDF

#### Áudio & Vídeo
- MP3 ↔ WAV, OGG
- MP4 ↔ AVI, WebM, GIF
- Conversões inteligentes: PDF → MP3 (narração), Vídeo → GIF

#### Dados
- XLSX ↔ CSV, PDF, JSON
- JSON ↔ CSV, XLSX
- ZIP (extração e compressão)

### Tecnologias Utilizadas
- **JavaScript/TypeScript**: Sharp, PDF-lib, Mammoth, Tesseract.js
- **Python**: Pillow, PyPDF2, python-docx, pytesseract
- **CLI**: Commander.js, Click
- **Build**: TypeScript, Jest, pytest
- **Qualidade**: ESLint, Prettier, Black, MyPy

---

*Para versões futuras, consulte os [Issues](https://github.com/julioamorimdev/FileForge/issues) e [Milestones](https://github.com/julioamorimdev/FileForge/milestones) do projeto.*
