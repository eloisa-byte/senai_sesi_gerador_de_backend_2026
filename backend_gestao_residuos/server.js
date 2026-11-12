const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* Importar as rotas */
const usuarioroutes = require("./src/routes/usuario.routes");
const ocorrenciaroutes = require("./src/routes/ocorrencia.routes");

app.use("/usuarios", usuarioroutes);
app.use("/ocorrencias", ocorrenciaroutes);

app.listen(3000, () => {
  console.log("Servidor Online");
});
