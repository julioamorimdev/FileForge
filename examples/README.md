# Exemplos de Uso - FileForge

Esta pasta contém exemplos práticos de como usar o FileForge em diferentes cenários.

## 📁 Arquivos de Exemplo

### JavaScript/Node.js
- `basic-usage.js` - Exemplos básicos e avançados
- `serverless-example.js` - Uso em AWS Lambda
- `plugin-development.js` - Como criar plugins customizados

### Python
- `basic-usage.py` - Exemplos básicos e avançados
- `async-examples.py` - Uso com async/await
- `custom-plugin.py` - Plugin customizado em Python

## 🚀 Executando os Exemplos

### JavaScript
```bash
# Instalar dependências
npm install

# Executar exemplo básico
node examples/basic-usage.js

# Executar exemplo específico
node -e "require('./examples/basic-usage.js').exemploBasico()"
```

### Python
```bash
# Instalar dependências
pip install fileforge

# Executar exemplo básico
python examples/basic-usage.py

# Executar exemplo específico
python -c "from examples.basic_usage import exemplo_basico; import asyncio; asyncio.run(exemplo_basico())"
```

## 📚 Cenários de Uso

### 1. Conversão Simples
```javascript
const { FileForge } = require('fileforge');
const forge = new FileForge();

// PDF para texto
await forge.convert('documento.pdf', 'txt');

// Imagem para PDF
await forge.convert('imagem.jpg', 'pdf');
```

### 2. Conversão com OCR
```javascript
// Extrair texto de imagem digitalizada
const resultado = await forge.convert('scan.jpg', 'txt', {
  ocr: true,
  ocrLanguage: 'por'
});
```

### 3. Conversão em Lote
```javascript
// Converter todos os PDFs para Markdown
await forge.convertBatch(['*.pdf'], 'md', {
  outputDir: './convertidos',
  maxConcurrency: 3
});
```

### 4. Metadados
```javascript
// Extrair informações detalhadas
const metadata = await forge.extractMetadata('foto.jpg');
console.log(metadata.exif); // Dados EXIF da câmera
```

### 5. Plugin Customizado
```javascript
// Criar conversor personalizado
const meuPlugin = {
  name: 'conversor-especial',
  inputFormats: ['txt'],
  outputFormats: ['especial'],
  convert: async (input) => {
    return Buffer.from(`PROCESSADO: ${input.toString()}`);
  }
};

forge.addPlugin(meuPlugin);
```

## 🔧 Casos de Uso Avançados

### Serverless (AWS Lambda)
```javascript
exports.handler = async (event) => {
  const forge = new FileForge({ 
    memory: 'low',
    tempDir: '/tmp' 
  });
  
  return await forge.convert(
    event.inputFile, 
    event.outputFormat
  );
};
```

### Streaming para Arquivos Grandes
```javascript
// Processar arquivo de 100MB sem sobrecarregar memória
await forge.convert('arquivo-grande.pdf', 'txt', {
  streaming: true,
  bufferSize: 64 * 1024 // 64KB chunks
});
```

### Compressão Inteligente
```javascript
// Reduzir tamanho mantendo qualidade
await forge.convert('imagem.jpg', 'jpg', {
  compression: 'high',
  quality: 80,
  image: {
    resize: '1920x1080'
  }
});
```

## 🎯 Conversões Populares

### Documentos
```javascript
// Office para PDF
await forge.convert('documento.docx', 'pdf');

// PDF para Markdown
await forge.convert('relatorio.pdf', 'md', { ocr: true });

// HTML para PDF
await forge.convert('webpage.html', 'pdf');
```

### Imagens
```javascript
// Converter e redimensionar
await forge.convert('foto.jpg', 'png', {
  image: { resize: '800x600' }
});

// Extrair texto de imagem
await forge.convert('texto-escaneado.jpg', 'txt', {
  ocr: true
});
```

### Dados
```javascript
// Excel para CSV
await forge.convert('planilha.xlsx', 'csv');

// JSON para CSV
await forge.convert('dados.json', 'csv');
```

## 🐛 Debugging

### Modo Debug
```javascript
const forge = new FileForge({ 
  logging: { level: 'debug' }
});

await forge.convert('arquivo.pdf', 'txt', { 
  debug: true 
});
```

### Tratamento de Erros
```javascript
try {
  const resultado = await forge.convert('arquivo.pdf', 'txt');
  
  if (!resultado.success) {
    console.error('Erros:', resultado.errors);
    console.warn('Avisos:', resultado.warnings);
  }
} catch (error) {
  console.error('Erro fatal:', error.message);
}
```

## 📊 Performance

### Monitoramento
```javascript
const resultado = await forge.convert('arquivo.pdf', 'txt');

console.log(`Tempo: ${resultado.processingTime}ms`);
console.log(`Tamanho original: ${resultado.originalSize} bytes`);
console.log(`Tamanho final: ${resultado.outputSize} bytes`);
```

### Otimização
```javascript
// Para múltiplas conversões
const forge = new FileForge({
  memory: 'high',
  cache: { enabled: true, maxSize: 200 }
});
```

## 🔗 Links Úteis

- [Documentação Completa](https://github.com/julioamorimdev/FileForge/wiki)
- [Lista de Formatos Suportados](https://github.com/julioamorimdev/FileForge#formatos-suportados)
- [Desenvolvimento de Plugins](https://github.com/julioamorimdev/FileForge/wiki/Plugin-Development)
- [Issues e Suporte](https://github.com/julioamorimdev/FileForge/issues)

---

💡 **Dica**: Execute `fileforge formats` no terminal para ver todos os formatos suportados!
