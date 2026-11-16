import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../../src/schemas/authSchemas.js";
import { gatoBodySchema, gatoQuerySchema } from "../../src/schemas/gatoSchemas.js";
import { solicitacaoAdocaoSchema } from "../../src/schemas/adocaoSchemas.js";

test("registerSchema normalizes valid email and defaults profile", () => {
  const result = registerSchema.safeParse({
    headers: {},
    body: {
      nome: " Ana ",
      endereco: "João Pessoa",
      contato: " ANA@gmail.com ",
      senha: "SenhaValida123"
    }
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.body.contato, "ana@gmail.com");
    assert.equal(result.data.body.perfil, "usuario");
    assert.equal(result.data.body.nome, "Ana");
  }
});

test("registerSchema rejects missing, empty, and invalid credentials", () => {
  assert.equal(registerSchema.safeParse({ headers: {}, body: {} }).success, false);
  assert.equal(registerSchema.safeParse({
    headers: {},
    body: {
      nome: " ",
      endereco: "",
      contato: "not-an-email",
      senha: "short"
    }
  }).success, false);
});

test("gato schemas apply defaults and reject blank fields and out-of-range pagination", () => {
  const body = {
    nome_gato: "Mimi",
    idade: "2 meses",
    sexo: "F",
    cor: "Cinza",
    porte: "Pequeno",
    status: "Disponível"
  };
  const valid = gatoBodySchema.safeParse({ body });
  assert.equal(valid.success, true);
  if (valid.success) assert.equal(valid.data.body.temperamento, "");

  assert.equal(gatoBodySchema.safeParse({
    body: { ...body, nome_gato: "   " }
  }).success, false);
  assert.equal(gatoQuerySchema.safeParse({ query: { pagina: "", limite: "101" } }).success, false);
  assert.equal(gatoQuerySchema.safeParse({ query: {} }).success, true);
});

test("adoption schema rejects an unaccepted term and short justification", () => {
  const result = solicitacaoAdocaoSchema.safeParse({
    params: { id: "1" },
    body: {
      telefone: "83999999999",
      cidade: "João Pessoa",
      tipo_moradia: "casa",
      tela_protecao: true,
      outros_animais: false,
      justificativa: "Quero adotar.",
      termo_aceito: false
    }
  });
  assert.equal(result.success, false);
});
