# rescattoo

## Usuários e credenciais

O modelo Prisma `Usuario` contém `id_usuario`, `nome`, `endereco`, `contato`, `senha` e `perfil`. `contato` é o e-mail/login e tem restrição `@unique` no banco. O schema Zod normaliza o e-mail para minúsculas, aceita somente Gmail e valida nome e senha (8 a 72 caracteres, com maiúscula, minúscula e número). Perfis aceitos são `usuario` e `admin`.

A senha nunca é salva em texto puro: `cadastrarUsuario` aplica `bcrypt.hash(senha, 10)` antes de persistir, e `loginUsuario` usa `bcrypt.compare`. O hash não é enviado nas respostas. E-mail repetido retorna `409`; dados inválidos retornam `400`.

## Cadastro, login e autorização

- `POST /auth/register`: cria usuário (201); cadastro de administrador requer `ADMIN_KEY` no header `X-Admin-Key`.
- `POST /auth/login`: verifica e-mail, perfil e senha; emite JWT após autenticação (200). Usuário inexistente, senha incorreta ou perfil incompatível retornam `401`, sem revelar qual credencial falhou.
- `GET /auth/perfil`: rota protegida para validar o token e obter os dados públicos do usuário.
- `GET /gatos` e demais rotas `/gatos`: exigem `Authorization: Bearer <token>`. Criar, editar e excluir gatos também requer perfil `admin` (403 para outros perfis).
- `POST /gatos/:id/solicitacoes-adocao`: exige autenticação e associa a solicitação ao usuário do token.

O middleware `autenticar` verifica assinatura e validade do JWT e popula `req.usuario`. A duração do token é configurada por `JWT_EXPIRES_IN` (padrão `7d`). No navegador, somente o token fica em `localStorage`; o perfil é carregado e validado pela API em cada início de sessão e mantido em memória. Logout remove o token. A interface redireciona usuários não autenticados para o login e restringe as telas administrativas ao perfil admin; as rotas também são protegidas no servidor.

## Testes REST Client

Inicie o servidor e abra [`requests.http`](./requests.http) no VS Code com a extensão REST Client. Execute, em ordem, o cadastro, os cenários inválidos, as chamadas protegidas sem token e o login válido. O valor de `@token` é capturado da resposta do login e enviado como Bearer no perfil e na listagem de gatos. O arquivo também demonstra cadastro duplicado (409), senha incorreta (401), acesso protegido (401 sem token / 200 com token) e operações administrativas.

Para testar o fluxo administrativo, configure um valor próprio em `ADMIN_KEY` no `.env` e substitua `@adminKey` em `requests.http` pelo valor local. Não compartilhe nem faça commit desse valor. Altere os e-mails de teste se já existirem no banco.

## Validação, erros e e-mail

### Schemas e respostas HTTP

Os schemas Zod ficam em `src/schemas/` e são aplicados na declaração das rotas pelo middleware genérico `validate(schema)`, antes dos Controllers. `gatoSchemas.ts` valida body obrigatório/tamanho, `params.id` como número inteiro positivo e `query.pagina`/`query.limite` como inteiros positivos (limite máximo 100). `authSchemas.ts` valida e normaliza e-mail e senha; `adocaoSchemas.ts` valida os campos e comprimentos do formulário de adoção. A validação dos dados de entrada fica nesses schemas, sem repetir as mesmas regras nos Models ou Controllers.

O middleware encaminha `ZodError` ao `errorHandler`, que centraliza a resposta `400 Bad Request`, incluindo `issues` com `path` e `message`, por exemplo:

```json
{
  "erro": "Dados de entrada inválidos.",
  "issues": [
    { "path": "body.nome_gato", "message": "O campo é obrigatório." },
    { "path": "params.id", "message": "O ID deve ser positivo." }
  ]
}
```

`400` indica entrada malformada/inválida; `404` indica recurso ou rota inexistente (por exemplo, gato `999999`); `409` indica conflito com o estado persistido, como e-mail já cadastrado (`P2002`). Esses casos estão demonstrados em `requests.http`.

### Serviço de e-mail

`src/services/sendMail.ts` é o único módulo que importa Nodemailer. `src/config.ts` lê `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM` do ambiente; `.env.example` contém apenas valores vazios/placeholders, sem credenciais de SMTP. Configure os valores reais somente no `.env`, que não deve ser compartilhado nem commitado.

Sem SMTP configurado, o ambiente de desenvolvimento cria uma conta de teste com `nodemailer.createTestAccount()`. A mensagem contém as versões `text` e `html`; a URL de prévia da mensagem de teste é impressa no terminal depois do envio. Em produção, SMTP precisa estar configurado.

`cadastrarUsuario` só solicita o envio depois que a criação no banco foi concluída e a resposta `201` foi enviada. Por isso, falhas de validação ou cadastro duplicado não disparam e-mail. O envio é assíncrono: falhas são registradas com `console.error` e não alteram a resposta de cadastro já concluída. A sequência de cadastro válido, body inválido, ID/query inválidos e conflito está em `requests.http`; o comentário final descreve o teste manual de falha SMTP.

### Retorno no front-end

Os formulários em `public/index.html` usam validação nativa (`required`, `minlength`, `maxlength`, `type="email"` e `pattern`). `public/app.js` complementa com validação da senha e confirmação via `setCustomValidity`, mostra mensagens de sucesso/erro em toast e lê `issues` da API para associar a mensagem ao campo cujo `name` corresponde ao último segmento do `path` (por exemplo, `body.contato`).

Essas verificações no navegador servem para orientar o usuário rapidamente, não para proteger a aplicação: podem ser ignoradas ou alteradas pelo cliente. As mesmas restrições são aplicadas novamente pela API, e a unicidade do e-mail também é garantida pelo índice único no banco, inclusive em requisições concorrentes.

## Configuração e execução

Durante `npm install`, se `.env` não existir, ele é criado a partir de `.env.example`, que contém placeholders — não segredos reutilizáveis. Em desenvolvimento, sem `JWT_SECRET` configurado, uma chave temporária é gerada para o processo; tokens deixam de valer ao reiniciar o servidor. Em produção, configure `JWT_SECRET` aleatório com pelo menos 32 caracteres e `ADMIN_KEY` com pelo menos 16. Configure `CORS_ORIGINS` apenas se clientes de outras origens precisarem acessar a API.

`DATABASE_URL="file:./rescatto.db"` aponta para o banco local; o caminho é relativo a `prisma/schema.prisma`.

```bash
npm install
npx prisma generate
npm run dev
```

Servidor: `http://localhost:3000`.
