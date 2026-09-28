ALTER TABLE "Solicitacao_de_adocao" ADD COLUMN "telefone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Solicitacao_de_adocao" ADD COLUMN "cidade" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Solicitacao_de_adocao" ADD COLUMN "tipo_moradia" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Solicitacao_de_adocao" ADD COLUMN "tela_protecao" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Solicitacao_de_adocao" ADD COLUMN "outros_animais" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Solicitacao_de_adocao" ADD COLUMN "justificativa" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Solicitacao_de_adocao" ADD COLUMN "termo_aceito" BOOLEAN NOT NULL DEFAULT false;