# Guia de Contribuição - FileForge 🤝

Obrigado por considerar contribuir com o FileForge! Este documento fornece diretrizes para contribuir com o projeto.

## 🚀 Como Contribuir

### 1. Reportando Bugs

- Use o [GitHub Issues](https://github.com/julioamorimdev/FileForge/issues)
- Descreva o problema detalhadamente
- Inclua passos para reproduzir o bug
- Mencione sua versão do Node.js/Python e sistema operacional

### 2. Sugerindo Melhorias

- Use o [GitHub Issues](https://github.com/julioamorimdev/FileForge/issues) com a label "enhancement"
- Descreva claramente a funcionalidade desejada
- Explique por que seria útil para a comunidade

### 3. Contribuindo com Código

#### Configuração do Ambiente

```bash
# Clone o repositório
git clone https://github.com/julioamorimdev/FileForge.git
cd FileForge

# Instale dependências do JavaScript
npm install

# Instale dependências do Python
pip install -e .[dev]

# Execute os testes
npm test
python -m pytest
```

#### Fluxo de Desenvolvimento

1. **Fork** o repositório
2. **Clone** seu fork localmente
3. **Crie uma branch** para sua feature:
   ```bash
   git checkout -b feature/nome-da-feature
   ```
4. **Faça suas alterações** seguindo os padrões do projeto
5. **Execute os testes**:
   ```bash
   npm test
   python -m pytest
   ```
6. **Commit** suas mudanças:
   ```bash
   git commit -m "feat: adiciona conversão de EPUB para PDF"
   ```
7. **Push** para sua branch:
   ```bash
   git push origin feature/nome-da-feature
   ```
8. **Abra um Pull Request**

## 📝 Padrões de Código

### JavaScript/TypeScript
- Use ESLint e Prettier (configuração já incluída)
- Siga o padrão de nomenclatura camelCase
- Documente funções públicas com JSDoc
- Mantenha cobertura de testes > 80%

### Python
- Siga PEP 8
- Use type hints
- Documente com docstrings no formato Google
- Use black para formatação
- Mantenha cobertura de testes > 80%

## 🧩 Criando Plugins

### Estrutura de um Plugin

```javascript
// JavaScript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  formats: {
    input: ['txt'],
    output: ['custom']
  },
  convert: async (input, options) => {
    // Lógica de conversão
    return output;
  },
  metadata: async (input) => {
    // Extração de metadados (opcional)
    return metadata;
  }
};

module.exports = myPlugin;
```

```python
# Python
from fileforge.plugin import Plugin

class MyPlugin(Plugin):
    name = 'my-plugin'
    version = '1.0.0'
    input_formats = ['txt']
    output_formats = ['custom']
    
    async def convert(self, input_data, options):
        # Lógica de conversão
        return output_data
    
    async def extract_metadata(self, input_data):
        # Extração de metadados (opcional)
        return metadata
```

### Adicionando Formatos

Para adicionar suporte a novos formatos:

1. Crie um plugin na pasta `plugins/`
2. Implemente os métodos necessários
3. Adicione testes em `tests/plugins/`
4. Atualize a documentação

## 🧪 Testes

### Executando Testes

```bash
# JavaScript
npm test
npm run test:watch
npm run test:coverage

# Python  
python -m pytest
python -m pytest --watch
python -m pytest --cov
```

### Escrevendo Testes

- Teste todas as funcionalidades públicas
- Use arquivos de exemplo pequenos nos testes
- Teste casos de erro e edge cases
- Mantenha testes rápidos (< 1s por teste)

## 📋 Checklist do Pull Request

Antes de abrir um PR, verifique:

- [ ] Código segue os padrões estabelecidos
- [ ] Testes passam em ambas as versões (JS e Python)
- [ ] Cobertura de testes mantida
- [ ] Documentação atualizada
- [ ] CHANGELOG.md atualizado
- [ ] Commit messages seguem o padrão
- [ ] PR tem descrição clara

## 🏷️ Padrão de Commit Messages

Usamos [Conventional Commits](https://conventionalcommits.org/):

- `feat`: nova funcionalidade
- `fix`: correção de bug
- `docs`: mudanças na documentação
- `style`: formatação, sem mudança de lógica
- `refactor`: refatoração de código
- `test`: adição ou correção de testes
- `chore`: tarefas de manutenção

Exemplos:
```
feat: adiciona suporte para conversão EPUB → PDF
fix: corrige erro de memória em arquivos grandes
docs: atualiza exemplos de uso da API
```

## 🐛 Debugging

### Logs de Debug

```javascript
// JavaScript
const forge = new FileForge({ debug: true });
```

```python
# Python
import logging
logging.basicConfig(level=logging.DEBUG)

forge = FileForge(debug=True)
```

### Ferramentas Úteis

- **JavaScript**: VS Code com extensões ESLint e Prettier
- **Python**: VS Code com extensão Python, PyCharm
- **Git**: GitKraken, SourceTree ou linha de comando

## 🆘 Precisa de Ajuda?

- 📧 Email: contato@julioamorim.com.br
- 💬 [GitHub Discussions](https://github.com/julioamorimdev/FileForge/discussions)
- 🐛 [GitHub Issues](https://github.com/julioamorimdev/FileForge/issues)

## 🙏 Reconhecimentos

Todos os contribuidores são listados no arquivo [CONTRIBUTORS.md](CONTRIBUTORS.md).

---

**Obrigado por contribuir com o FileForge! 🔥**
