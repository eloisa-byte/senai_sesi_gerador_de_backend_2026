const ocorrenciamodel = require("../models/ocorrencia.model");

const cadastrar = async (req, res) => {
  const resposta = await ocorrenciamodel.cadastrar(req.body);
  res.status(201).json(resposta).end();
};

const listar = async (req, res) => {
  const resposta = await ocorrenciamodel.listar();
  res.status(200).json(resposta).end();
};

const buscar = async (req, res) => {
  const resposta = await ocorrenciamodel.buscar(req.params.id);
  res.status(200).json(resposta).end();
};

const excluir = async (req, res) => {
  const resposta = await ocorrenciamodel.excluir(req.params.id);
  res.status(204).json(resposta).end();
};

const atualizar = async (req, res) => {
  const resposta = await ocorrenciamodel.atualizar(req.body, req.params.id);
  res.status(200).json(resposta).end();
};

module.exports = { cadastrar, listar, buscar, excluir, atualizar };
