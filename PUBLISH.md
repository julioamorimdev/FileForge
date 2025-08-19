# Guia de Publicação - FileForge

Este documento contém instruções para publicar o FileForge nos registros NPM e PyPI.

## 📋 Pré-requisitos

### NPM
1. Conta no [npmjs.com](https://www.npmjs.com)
2. CLI do NPM instalado
3. Login realizado: `npm login`

### PyPI
1. Conta no [pypi.org](https://pypi.org)
2. `twine` instalado: `pip install twine`
3. Configuração de credenciais no `~/.pypirc`

## 🚀 Publicação NPM

### 1. Verificar o Build
```bash
# No diretório raiz do projeto
npm run build
npm test
npm run lint
```

### 2. Verificar o Pacote
```bash
# Simular publicação (dry-run)
npm publish --dry-run

# Verificar conteúdo do pacote
npm pack
tar -tzf fileforge-1.0.0.tgz
```

### 3. Publicar
```bash
# Primeira publicação
npm publish

# Para atualizações, incrementar versão primeiro
npm version patch  # ou minor, major
npm publish
```

## 🐍 Publicação PyPI

### 1. Preparar Ambiente Python
```bash
cd python/
python -m pip install --upgrade pip
pip install build twine
```

### 2. Build do Pacote
```bash
# Limpar builds anteriores
rm -rf dist/ build/ *.egg-info/

# Criar distribuições
python -m build
```

### 3. Verificar o Pacote
```bash
# Verificar arquivos gerados
ls dist/

# Verificar metadados
twine check dist/*
```

### 4. Publicar no TestPyPI (Recomendado primeiro)
```bash
# Upload para TestPyPI
twine upload --repository testpypi dist/*

# Testar instalação
pip install --index-url https://test.pypi.org/simple/ fileforge
```

### 5. Publicar no PyPI
```bash
# Upload para PyPI oficial
twine upload dist/*
```

## 📝 Checklist de Publicação

### Antes de Publicar
- [ ] Todos os testes passando
- [ ] Documentação atualizada
- [ ] CHANGELOG.md atualizado
- [ ] Versão incrementada em package.json e setup.py
- [ ] Build limpo sem erros
- [ ] Exemplos funcionando

### NPM
- [ ] `npm run build` executado com sucesso
- [ ] `npm test` passando
- [ ] `npm run lint` sem erros
- [ ] `npm publish --dry-run` verificado
- [ ] Publicado com `npm publish`

### PyPI
- [ ] Build Python criado com `python -m build`
- [ ] `twine check dist/*` passou
- [ ] Testado no TestPyPI
- [ ] Publicado no PyPI com `twine upload dist/*`

### Pós-Publicação
- [ ] Verificar se os pacotes estão disponíveis
- [ ] Testar instalação: `npm install fileforge` e `pip install fileforge`
- [ ] Atualizar documentação com novos links
- [ ] Criar release no GitHub
- [ ] Anunciar nas redes sociais

## 🔧 Comandos Úteis

### NPM
```bash
# Ver informações do pacote
npm info fileforge

# Despublicar (cuidado!)
npm unpublish fileforge@1.0.0 --force

# Listar versões
npm view fileforge versions --json
```

### PyPI
```bash
# Ver informações do pacote
pip show fileforge

# Instalar versão específica
pip install fileforge==1.0.0

# Listar versões disponíveis
pip index versions fileforge
```

## 🚨 Troubleshooting

### NPM
- **Erro 403**: Verificar se está logado (`npm whoami`)
- **Erro 404**: Nome do pacote pode já existir
- **Build falha**: Verificar dependências e TypeScript

### PyPI
- **Erro de credenciais**: Verificar `~/.pypirc` ou usar tokens
- **Arquivo já existe**: Incrementar versão
- **Dependências faltando**: Verificar `requirements.txt`

## 📊 Monitoramento

### NPM
- Dashboard: https://www.npmjs.com/package/fileforge
- Downloads: https://npm-stat.com/charts.html?package=fileforge

### PyPI
- Dashboard: https://pypi.org/project/fileforge/
- Downloads: https://pypistats.org/packages/fileforge

## 🔄 Atualizações Futuras

1. **Patch** (1.0.1): Correções de bugs
2. **Minor** (1.1.0): Novas funcionalidades compatíveis
3. **Major** (2.0.0): Mudanças que quebram compatibilidade

### Processo de Atualização
1. Atualizar código
2. Incrementar versão
3. Atualizar CHANGELOG.md
4. Executar testes
5. Publicar seguindo este guia

---

**Importante**: Sempre teste em ambiente de desenvolvimento antes de publicar em produção!
