# ECU Doctor

Aplicação web de diagnóstico de central eletrônica (ECU) com Node.js e Express, pronta para deploy na Vercel.

## O que faz

1. **Upload do arquivo de diagnóstico** — aceita JSON, CSV e texto (códigos de falha e leituras do scanner).
2. **Testes físicos manuais** — seção para inserir medições de multímetro e osciloscópio quando faltarem dados eletrônicos.
3. **Relatório combinado** — possíveis falhas com grau de confiança, orientações de teste e próximos passos, em linguagem simples.

## Rodar localmente

```bash
npm install
npm start
```

Abra http://localhost:3000

> O Live Server não serve para rodar este projeto: ele é estático e não expõe a API. Use sempre `npm start`.

## Deploy no Git + Vercel

### 1. Criar o repositório

```bash
git init
git add .
git commit -m "ECU Doctor - diagnóstico de central"
```

### 2. Enviar para o GitHub

```bash
git remote add origin https://github.com/SEU-USUARIO/ecu-doctor.git
git branch -M main
git push -u origin main
```

### 3. Publicar na Vercel

Painel da Vercel → **Add New** → **Project** → importe o repositório:

- **Framework Preset:** Other
- **Build Command:** *(vazio)*
- **Output Directory:** *(vazio)*
- **Install Command:** `npm install`

Nenhuma variável de ambiente é necessária. O `vercel.json` já encaminha todas as rotas para a função em `api/index.js`.

Alternativa pela linha de comando:

```bash
npm i -g vercel
vercel
```

## Estrutura

```
api/index.js        App Express (função serverless)
server.js           Entrada local
lib/parser.js       Leitura e normalização do arquivo (JSON/CSV/texto)
lib/analyzer.js     Motor de regras sobre dados automáticos
lib/manual.js       Validação e avaliação dos testes físicos
lib/merge.js        Combinação automático + manual
lib/report.js       Montagem do relatório final
lib/labels.js       Termos técnicos traduzidos para linguagem simples
lib/rules/          Códigos de falha e limites elétricos
lib/flash/          Stub para futura programação/limpeza da ECU
public/             Frontend (HTML, CSS, JS)
```

## Expandir

- Novas falhas: adicionar em `lib/rules/codes.js` ou regras em `lib/analyzer.js`.
- Novos limites de medição: `lib/rules/thresholds.js`.
- Novos termos traduzidos: `lib/labels.js`.
- Programação da ECU: implementar as funções de `lib/flash/index.js`.

## Limites

- Upload de até 4 MB por arquivo (limite da Vercel para funções serverless).
- Sem banco de dados: nada é persistido entre requisições.
