# Gerador Automatizado de Back-End Node.js via SQL

Ferramenta de linha de comando (CLI) desenvolvida em Node.js puro para automatizar a criação completa de projetos back-end em arquitetura de 3 camadas (**Routes**, **Controllers** e **Models**) a partir de um script SQL.

## Características Principais

- **100% Offline e Sem IA:** Utiliza apenas módulos nativos do próprio Node.js (`fs`, `path`, `readline` e `child_process`) e expressões regulares (Regex), sem depender de inteligência artificial para gerar o código.
- **Entrada Única via SQL:** Lê diretamente o script `CREATE DATABASE` e `CREATE TABLE` colado no terminal, identificando automaticamente o nome do banco, todas as tabelas, colunas e tipos de dados.
- **Arquitetura MVC Completa:** Cria a árvore de diretórios (`src/config`, `src/controllers`, `src/models`, `src/routes`), `server.js`, `package.json` e `.gitignore`.
- **CRUD e Segurança:** Gera as 5 operações (`cadastrar`, `listar`, `buscar`, `excluir` e `atualizar`) para cada tabela com proteção contra SQL Injection (`?`) e ocultação automática da coluna `senha` nas consultas da tabela `usuario`.
- **Coleção Thunder Client Pronta:** Gera um arquivo `.json` pronto para importar no Thunder Client com todas as rotas organizadas em pastas e corpos JSON preenchidos de acordo com os tipos de dados do SQL.

## Pré-requisitos

- **Node.js** instalado na máquina.
- **MySQL / MariaDB** (ex: XAMPP) rodando para conectar o banco de dados.

## Como Usar

1. Abra o terminal na pasta onde está o arquivo `gerar.js`.
2. Execute o comando:
   ```bash
   node gerar.js
   ```
3. Quando aparecer **`Cole o seu código SQL e pressione ENTER:`**, cole o seu script SQL completo no terminal.
4. O programa criará automaticamente a pasta `backend_<nome_do_banco>`, montará todos os arquivos e instalará as dependências (`express`, `cors` e `mysql2`).
5. Entre na pasta criada e inicie o servidor:
   ```bash
   cd backend_<nome_do_banco>
   npm run dev
   ```

## Como Testar no Thunder Client

1. Abra a extensão **Thunder Client** no VS Code e vá na aba **Collections**.
2. Clique no menu (**`≡`**) e escolha **Import**.
3. Selecione o arquivo `thunder-collection_<nome_do_banco>.json` criado dentro da pasta do projeto.
4. Todas as rotas (`POST`, `GET`, `PATCH`, `DELETE`) já estarão prontas para teste.

## Estrutura Gerada

```text
backend_<nome_do_banco>/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── <tabela>.controller.js
│   ├── models/
│   │   └── <tabela>.model.js
│   └── routes/
│       └── <tabela>.routes.js
├── .gitignore
├── package.json
├── server.js
└── thunder-collection_<nome_do_banco>.json
```
## Demonstração e Prints das Funcionalidades

### 1. Execução do Gerador no Terminal
![Execução do Gerador](prints/01-gerador-terminal.png)

### 2. Estrutura de Pastas e Arquivos Gerados
![Estrutura de Pastas](prints/02-estrutura-gerada.png)

### 3. Testes das Rotas no Thunder Client

#### Cadastrar (`POST /cadastrar` - Status 201)
![Rota Cadastrar](prints/03-cadastrar.png)

#### Listar (`GET /listar` - Status 200)
![Rota Listar](prints/04-listar.png)

#### Buscar por ID (`GET /buscar/:id` - Status 200)
![Rota Buscar](prints/05-buscar.png)

#### Atualizar (`PATCH /atualizar/:id` - Status 200)
![Rota Atualizar](prints/06-atualizar.png)

#### Excluir (`DELETE /excluir/:id` - Status 204)
![Rota Excluir](prints/07-excluir.png)