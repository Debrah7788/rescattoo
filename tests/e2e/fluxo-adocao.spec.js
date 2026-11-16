import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test("usuário se cadastra, entra e envia uma solicitação de adoção", async ({ page }) => {
    const contato = `e2e${randomUUID().replaceAll("-", "").slice(0, 20)}@gmail.com`;
    await page.goto("/");

    await page.getByRole("link", { name: "Cadastre-se" }).click();
    await page.getByRole("textbox", { name: "Nome", exact: true }).fill("Pessoa E2E");
    await page.getByRole("textbox", { name: "nome@gmail.com" }).first().fill(contato);
    await page.getByLabel("Senha do cadastro").fill("TesteE2e123");
    await page.getByLabel("Confirme a senha").fill("TesteE2e123");
    await page.getByRole("textbox", { name: "Cidade / endereço" }).fill("João Pessoa");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByText("Usuário cadastrado. Faça login para acessar os gatos.")).toBeVisible();
    await page.getByLabel("Senha do login").fill("TesteE2e123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.getByRole("button", { name: "Adotar" }).first().click();
    await page.getByRole("textbox", { name: "Telefone" }).fill("+55 83 99999-8888");
    await page.getByRole("textbox", { name: "Cidade / Bairro" }).fill("João Pessoa");
    await page.getByLabel("Casa", { exact: true }).check();
    await page.getByLabel("Sim", { exact: true }).first().check();
    await page.getByLabel("Não", { exact: true }).last().check();
    await page.getByRole("textbox", { name: "Por que deseja adotar?" }).fill(
        "Tenho espaço, tempo e condições para cuidar do gato."
    );
    await page.getByLabel("Concordo com o Termo de Adoção").check();
    await page.getByRole("button", { name: "Enviar" }).click();

    await expect(page.getByRole("status")).toContainText("Solicitação de adoção registrada.");
});
