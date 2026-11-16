CREATE TABLE "Imagem" (
    "id_imagem" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caminho" TEXT NOT NULL,
    "data_upload" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_user" INTEGER NOT NULL,
    CONSTRAINT "Imagem_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "Usuario" ("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Imagem_caminho_key" ON "Imagem"("caminho");
CREATE UNIQUE INDEX "Imagem_id_user_key" ON "Imagem"("id_user");
