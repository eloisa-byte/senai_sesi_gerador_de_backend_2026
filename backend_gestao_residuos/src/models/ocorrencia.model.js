const con = require("../config/db");

const cadastrar = async ({ usuarioId, local, tipoResiduo, nivelRisco, data, status }) => {
  const [resultado] = await con.query(
    "INSERT INTO ocorrencia VALUES (DEFAULT, ?, ?, ?, ?, ?, ?);",
    [usuarioId, local, tipoResiduo, nivelRisco, data, status]
  );
  return { id: resultado.insertId, usuarioId, local, tipoResiduo, nivelRisco, data, status };
};

const listar = async () => {
  const [resultado] = await con.query(
    "SELECT * FROM ocorrencia;"
  );
  return resultado;
};

const buscar = async (id) => {
  const [resultado] = await con.query(
    "SELECT * FROM ocorrencia WHERE id = ?;",
    [id]
  );
  return resultado;
};

const excluir = async (id) => {
  const [resultado] = await con.query(
    "DELETE FROM ocorrencia WHERE id = ?;",
    [id]
  );
  return resultado;
};

const atualizar = async (dados, id) => {
  const [resultado] = await con.query(
    "UPDATE ocorrencia SET ? WHERE id = ?;",
    [dados, id]
  );
  return resultado;
};

module.exports = { cadastrar, listar, buscar, excluir, atualizar };
