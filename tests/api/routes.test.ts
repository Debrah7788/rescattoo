import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import prisma from "../../src/prisma.js";

const prefix = `suite${Date.now()}`;
const adminContato = `${prefix}.admin@gmail.com`;
const usuarioContato = `${prefix}.user@gmail.com`;
const senha = "TesteSeguro123";
let adminToken = "";
let usuarioToken = "";
let adminId = 0;
let usuarioId = 0;

async function registrar(contato: string, perfil: "usuario" | "admin") {
  return request(app)
    .post("/auth/register")
    .set("X-Admin-Key", process.env.ADMIN_KEY || "")
    .send({ nome: perfil === "admin" ? "Admin Suite" : "User Suite", endereco: "Teste", contato, senha, perfil });
}

async function login(contato: string) {
  const response = await request(app).post("/auth/login").send({ contato, senha });
  assert.equal(response.status, 200);
  return response.body.token as string;
}

before(async () => {
  const admin = await registrar(adminContato, "admin");
  assert.equal(admin.status, 201);
  adminId = admin.body.usuario.id_usuario;

  const usuario = await registrar(usuarioContato, "usuario");
  assert.equal(usuario.status, 201);
  usuarioId = usuario.body.usuario.id_usuario;
  adminToken = await login(adminContato);
  usuarioToken = await login(usuarioContato);
});

after(async () => {
  await prisma.gato.deleteMany();
  await prisma.usuario.deleteMany({ where: { id_usuario: { in: [adminId, usuarioId] } } });
  await prisma.$disconnect();
});

test("registration returns 409 for duplicate email and rejects invalid input with 400", async () => {
  const duplicate = await registrar(usuarioContato, "usuario");
  assert.equal(duplicate.status, 409);

  const invalid = await request(app).post("/auth/register").send({
    nome: "",
    endereco: "",
    contato: "email-invalido",
    senha: "curta",
    perfil: "usuario"
  });
  assert.equal(invalid.status, 400);
});

test("authentication protects routes and regular users cannot mutate cats", async () => {
  assert.equal((await request(app).get("/gatos")).status, 401);

  const denied = await request(app)
    .post("/gatos")
    .set("Authorization", `Bearer ${usuarioToken}`)
    .send({ nome_gato: "Negado", idade: "1", sexo: "F", cor: "Preto", porte: "P", status: "Disponível" });
  assert.equal(denied.status, 403);

  const profile = await request(app)
    .get("/auth/perfil")
    .set("Authorization", `Bearer ${usuarioToken}`);
  assert.equal(profile.status, 200);
  assert.equal(profile.body.usuario.id_usuario, usuarioId);
  assert.notEqual(profile.body.usuario.id_usuario, adminId);
});

test("admin can create, read, update, and delete a cat", async () => {
  const gato = {
    nome_gato: "Gato da Suíte",
    idade: "2 meses",
    sexo: "F",
    cor: "Branco",
    porte: "Pequeno",
    status: "Disponível"
  };
  const created = await request(app)
    .post("/gatos")
    .set("Authorization", `Bearer ${adminToken}`)
    .send(gato);
  assert.equal(created.status, 201);
  const id = created.body.id_gato as number;

  const read = await request(app).get(`/gatos/${id}`).set("Authorization", `Bearer ${adminToken}`);
  assert.equal(read.status, 200);
  assert.equal(read.body.nome_gato, gato.nome_gato);

  const updated = await request(app)
    .put(`/gatos/${id}`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ ...gato, nome_gato: "Gato Atualizado" });
  assert.equal(updated.status, 200);
  assert.equal((await request(app).get(`/gatos/${id}`).set("Authorization", `Bearer ${adminToken}`)).body.nome_gato, "Gato Atualizado");

  assert.equal((await request(app).delete(`/gatos/${id}`).set("Authorization", `Bearer ${adminToken}`)).status, 204);
  assert.equal((await request(app).get(`/gatos/${id}`).set("Authorization", `Bearer ${adminToken}`)).status, 404);
});

test("image lookup is scoped to the authenticated user", async () => {
  await prisma.imagem.createMany({
    data: [
      { id_user: adminId, caminho: "/uploads/admin-suite.jpg" },
      { id_user: usuarioId, caminho: "/uploads/user-suite.jpg" }
    ]
  });

  const userImage = await request(app)
    .get("/api/users/image")
    .set("Authorization", `Bearer ${usuarioToken}`);
  assert.equal(userImage.status, 200);
  assert.equal(userImage.body.imagem.caminho, "/uploads/user-suite.jpg");

  const adminImage = await request(app)
    .get("/api/users/image")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(adminImage.body.imagem.caminho, "/uploads/admin-suite.jpg");
});
