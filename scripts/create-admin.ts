import bcrypt from 'bcrypt';
import prisma from '../src/prisma.ts';

const email = 'admteste@gmail.com';
const senha = 'SenhaForte123';

async function main() {
  const existente = await prisma.usuario.findUnique({ where: { contato: email } });

  if (existente) {
    console.log('USUARIO_JA_EXISTE');
    console.log(JSON.stringify({
      id_usuario: existente.id_usuario,
      nome: existente.nome,
      contato: existente.contato,
      perfil: existente.perfil
    }, null, 2));
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: {
      nome: 'Admin Teste',
      contato: email,
      senha: senhaHash,
      perfil: 'admin',
      endereco: 'Sistema'
    }
  });

  console.log('CRIADO');
  console.log(JSON.stringify({
    id_usuario: usuario.id_usuario,
    nome: usuario.nome,
    contato: usuario.contato,
    perfil: usuario.perfil
  }, null, 2));
}

main()
  .catch((erro) => {
    console.error('ERRO_AO_CRIAR_ADMIN', erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
