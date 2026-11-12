const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

function gerarValorExemplo(nomeColuna, tipoSql) {
  const tipo = tipoSql.toLowerCase();
  const nome = nomeColuna.toLowerCase();

  if (nome.includes("email")) return "usuario@email.com";
  if (nome.includes("senha")) return "123456";
  if (nome.includes("nome")) return "Exemplo Nome";

  if (tipo.includes("enum")) {
    const matchEnum = tipoSql.match(/enum\s*\(\s*['"]([^'"]+)['"]/i);
    return matchEnum ? matchEnum[1] : "Ativo";
  }
  if (tipo.includes("int")) return 1;
  if (tipo.includes("decimal") || tipo.includes("float") || tipo.includes("double")) return 10.5;
  if (tipo.includes("date") || tipo.includes("time")) return "2026-11-12";
  if (tipo.includes("bool")) return true;

  return `Exemplo ${nomeColuna}`;
}

function analisarSQL(sqlTexto) {
  const matchBanco = sqlTexto.match(/create\s+database\s+(?:if\s+not\s+exists\s+)?`?([a-zA-Z0-9_]+)`?/i);
  const nomeBanco = matchBanco ? matchBanco[1].toLowerCase() : "meu_banco";

  const tabelas = [];
  const regexTabela = /create\s+table\s+(?:if\s+not\s+exists\s+)?`?([a-zA-Z0-9_]+)`?\s*\(([\s\S]*?)\)\s*;/gi;
  let match;

  while ((match = regexTabela.exec(sqlTexto)) !== null) {
    const nomeTabela = match[1].toLowerCase();
    const corpoTabela = match[2];

    const linhas = corpoTabela.split(/,(?![^(]*\))/);
    const colunas = [];
    const exemploBody = {};

    for (let linha of linhas) {
      linha = linha.trim();
      if (!linha) continue;

      if (/^(primary\s+key|foreign\s+key|unique|key|index|constraint)/i.test(linha)) {
        continue;
      }

      const partes = linha.split(/\s+/);
      const nomeColuna = partes[0].replace(/`/g, "");
      const tipoColuna = partes.slice(1).join(" ");

      if (nomeColuna.toLowerCase() !== "id") {
        colunas.push(nomeColuna);
        exemploBody[nomeColuna] = gerarValorExemplo(nomeColuna, tipoColuna);
      }
    }

    tabelas.push({ nome: nomeTabela, colunas, exemploBody });
  }

  return { nomeBanco, tabelas };
}

function criarProjeto(sqlTexto) {
  const { nomeBanco, tabelas } = analisarSQL(sqlTexto);

  if (tabelas.length === 0) {
    console.log("\n[ERRO] Nenhum comando CREATE TABLE válido foi encontrado no SQL enviado.");
    return;
  }

  const nomeProjeto = `backend_${nomeBanco}`;
  const raiz = path.join(process.cwd(), nomeProjeto);

  console.log(`\n\n[INFO] Banco identificado: ${nomeBanco}`);
  console.log(`[INFO] Pasta criada: ${nomeProjeto}`);
  console.log(`[INFO] Tabelas identificadas: ${tabelas.map((t) => t.nome).join(", ")}`);

  const pastas = [
    raiz,
    path.join(raiz, "src"),
    path.join(raiz, "src", "config"),
    path.join(raiz, "src", "controllers"),
    path.join(raiz, "src", "models"),
    path.join(raiz, "src", "routes"),
  ];

  pastas.forEach((pasta) => {
    if (!fs.existsSync(pasta)) {
      fs.mkdirSync(pasta, { recursive: true });
    }
  });

  fs.writeFileSync(path.join(raiz, ".gitignore"), "node_modules/\n");

  const packageJson = {
    name: nomeProjeto,
    version: "1.0.0",
    main: "server.js",
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
      dev: "node --watch server.js",
    },
    dependencies: {
      cors: "^2.8.5",
      express: "^4.19.2",
      mysql2: "^3.9.7",
    },
  };
  fs.writeFileSync(path.join(raiz, "package.json"), JSON.stringify(packageJson, null, 2));

  const dbContent = `const mysql = require("mysql2/promise");

const con = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "${nomeBanco}"
});

module.exports = con;
`;
  fs.writeFileSync(path.join(raiz, "src", "config", "db.js"), dbContent);

  let importsServer = "";
  let usesServer = "";
  const thunderFolders = [];
  const thunderRequests = [];

  tabelas.forEach((tabela, idxTabela) => {
    const { nome, colunas, exemploBody } = tabela;
    const rotaPlural = `${nome}s`;

    const desestruturacao = colunas.join(", ");
    const interrogacoes = colunas.map(() => "?").join(", ");

    const colunasSelect =
      nome === "usuario"
        ? "id, " + colunas.filter((c) => c.toLowerCase() !== "senha").join(", ")
        : "*";

    const retornoCadastro =
      nome === "usuario"
        ? `{ id: resultado.insertId, ${colunas.filter((c) => c.toLowerCase() !== "senha").join(", ")} }`
        : `{ id: resultado.insertId, ${desestruturacao} }`;

    const modelCode = `const con = require("../config/db");

const cadastrar = async ({ ${desestruturacao} }) => {
  const [resultado] = await con.query(
    "INSERT INTO ${nome} VALUES (DEFAULT, ${interrogacoes});",
    [${desestruturacao}]
  );
  return ${retornoCadastro};
};

const listar = async () => {
  const [resultado] = await con.query(
    "SELECT ${colunasSelect} FROM ${nome};"
  );
  return resultado;
};

const buscar = async (id) => {
  const [resultado] = await con.query(
    "SELECT ${colunasSelect} FROM ${nome} WHERE id = ?;",
    [id]
  );
  return resultado;
};

const excluir = async (id) => {
  const [resultado] = await con.query(
    "DELETE FROM ${nome} WHERE id = ?;",
    [id]
  );
  return resultado;
};

const atualizar = async (dados, id) => {
  const [resultado] = await con.query(
    "UPDATE ${nome} SET ? WHERE id = ?;",
    [dados, id]
  );
  return resultado;
};

module.exports = { cadastrar, listar, buscar, excluir, atualizar };
`;
    fs.writeFileSync(path.join(raiz, "src", "models", `${nome}.model.js`), modelCode);

    const controllerCode = `const ${nome}model = require("../models/${nome}.model");

const cadastrar = async (req, res) => {
  const resposta = await ${nome}model.cadastrar(req.body);
  res.status(201).json(resposta).end();
};

const listar = async (req, res) => {
  const resposta = await ${nome}model.listar();
  res.status(200).json(resposta).end();
};

const buscar = async (req, res) => {
  const resposta = await ${nome}model.buscar(req.params.id);
  res.status(200).json(resposta).end();
};

const excluir = async (req, res) => {
  const resposta = await ${nome}model.excluir(req.params.id);
  res.status(204).json(resposta).end();
};

const atualizar = async (req, res) => {
  const resposta = await ${nome}model.atualizar(req.body, req.params.id);
  res.status(200).json(resposta).end();
};

module.exports = { cadastrar, listar, buscar, excluir, atualizar };
`;
    fs.writeFileSync(path.join(raiz, "src", "controllers", `${nome}.controller.js`), controllerCode);

    const routesCode = `const express = require("express");
const routes = express.Router();

const { cadastrar, listar, buscar, excluir, atualizar } = require("../controllers/${nome}.controller");

routes.post("/cadastrar", cadastrar);
routes.get("/listar", listar);
routes.get("/buscar/:id", buscar);
routes.delete("/excluir/:id", excluir);
routes.patch("/atualizar/:id", atualizar);

module.exports = routes;
`;
    fs.writeFileSync(path.join(raiz, "src", "routes", `${nome}.routes.js`), routesCode);

    importsServer += `const ${nome}routes = require("./src/routes/${nome}.routes");\n`;
    usesServer += `app.use("/${rotaPlural}", ${nome}routes);\n`;

    const folderId = `folder_${nome}_${idxTabela}`;
    const dataAtual = new Date().toISOString();
    const baseUrl = `http://localhost:3000/${rotaPlural}`;
    const bodyFormatado = JSON.stringify(exemploBody, null, 2);

    const primeiraChave = colunas[0];
    const bodyPatch = JSON.stringify({ [primeiraChave]: exemploBody[primeiraChave] }, null, 2);

    thunderFolders.push({
      _id: folderId,
      name: rotaPlural.toUpperCase(),
      containerId: "",
      created: dataAtual,
      sortNum: (idxTabela + 1) * 10000,
    });

    const rotasCrud = [
      { nomeReq: "Cadastrar", metodo: "POST", url: `${baseUrl}/cadastrar`, body: bodyFormatado },
      { nomeReq: "Listar", metodo: "GET", url: `${baseUrl}/listar`, body: null },
      { nomeReq: "Buscar por ID", metodo: "GET", url: `${baseUrl}/buscar/1`, body: null },
      { nomeReq: "Atualizar", metodo: "PATCH", url: `${baseUrl}/atualizar/1`, body: bodyPatch },
      { nomeReq: "Excluir", metodo: "DELETE", url: `${baseUrl}/excluir/1`, body: null },
    ];

    rotasCrud.forEach((r, idxReq) => {
      const reqObj = {
        _id: `req_${nome}_${idxReq}_${Date.now()}`,
        colId: `col_${nomeBanco}`,
        containerId: folderId,
        name: r.nomeReq,
        url: r.url,
        method: r.metodo,
        sortNum: (idxReq + 1) * 10000,
        created: dataAtual,
        modified: dataAtual,
        headers: [],
        params: [],
        tests: [],
      };

      if (r.body) {
        reqObj.body = {
          type: "json",
          raw: r.body,
          form: [],
        };
      }

      thunderRequests.push(reqObj);
    });
  });

  const serverJs = `const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* Importar as rotas */
${importsServer}
${usesServer}
app.listen(3000, () => {
  console.log("Servidor Online");
});
`;
  fs.writeFileSync(path.join(raiz, "server.js"), serverJs);

  const thunderCollection = {
    client: "Thunder Client",
    collectionName: `API - ${nomeBanco}`,
    dateExported: new Date().toISOString(),
    version: "1.1",
    folders: thunderFolders,
    requests: thunderRequests,
  };

  const nomeArquivoThunder = `thunder-collection_${nomeBanco}.json`;
  fs.writeFileSync(
    path.join(raiz, nomeArquivoThunder),
    JSON.stringify(thunderCollection, null, 2)
  );

  console.log("\n[OK] Estrutura, arquivos MVC e coleção do Thunder Client gerados!");
  console.log(`[INFO] Arquivo para importar no Thunder Client: ${nomeArquivoThunder}`);
  console.log("[...] Instalando dependências (express, cors, mysql2)...\n");

  try {
    execSync("npm install", { cwd: raiz, stdio: "inherit" });
    console.log(`\n[SUCESSO] Projeto "${nomeProjeto}" pronto!`);

        console.log(`Para iniciar, digite:\n  cd ${nomeProjeto}\n  npm run dev\n`);
  } catch (erro) {
    console.log("\n[AVISO] Arquivos criados, mas houve erro ao rodar npm install.");
    console.log(`Entre na pasta "${nomeProjeto}" e rode "npm install" manualmente.`);
  }
}

function iniciar() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  process.stdout.write("\nCole o seu código SQL e pressione ENTER:\n> ");

  let linhasSql = [];
  let timer = null;

  rl.on("line", (linha) => {
    linhasSql.push(linha);

    clearTimeout(timer);
    timer = setTimeout(() => {
      const textoCompleto = linhasSql.join("\n").trim();
      if (textoCompleto.length > 0) {
        rl.close();
        criarProjeto(textoCompleto);
      }
    }, 300);
  });
}

iniciar();

