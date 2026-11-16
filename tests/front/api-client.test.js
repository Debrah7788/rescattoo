import { describe, expect, it, vi } from "vitest";
import { api, createApiClient } from "../../public/api-client.js";

function createClient(response) {
    const fetchImpl = vi.fn().mockResolvedValue(response);
    const storage = {
        getItem: vi.fn().mockReturnValue("token-de-teste")
    };
    return { client: createApiClient({ fetchImpl, storage }), fetchImpl, storage };
}

describe("API client", () => {
    it("sends URL, method, bearer token, and JSON body", async () => {
        const { client, fetchImpl, storage } = createClient({
            ok: true,
            status: 200,
            json: async () => ({ id_gato: 7 })
        });

        await expect(client.json("/gatos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome_gato: "Mimi" })
        })).resolves.toEqual({ id_gato: 7 });

        expect(storage.getItem).toHaveBeenCalledWith("rescatto_token");
        expect(fetchImpl).toHaveBeenCalledOnce();
        const [url, options] = fetchImpl.mock.calls[0];
        expect(url).toBe("/gatos");
        expect(options.method).toBe("POST");
        expect(options.headers.get("Authorization")).toBe("Bearer token-de-teste");
        expect(options.body).toBe(JSON.stringify({ nome_gato: "Mimi" }));
    });

    it("preserves multipart headers for the browser to add the boundary", async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 201 });
        const client = createApiClient({
            fetchImpl,
            storage: { getItem: () => "abc" }
        });
        const formData = new FormData();
        formData.append("imagem", new Blob(["image"]), "foto.png");

        await client.request("/api/users/image", { method: "POST", body: formData });
        const [, options] = fetchImpl.mock.calls[0];
        expect(options.headers.get("Authorization")).toBe("Bearer abc");
        expect(options.headers.has("Content-Type")).toBe(false);
    });

    it("throws a typed error with API details for unsuccessful responses", async () => {
        const { client } = createClient({
            ok: false,
            status: 400,
            json: async () => ({
                erro: "Dados inválidos.",
                issues: [{ path: "body.nome_gato", message: "Obrigatório." }]
            })
        });

        await expect(client.json("/gatos", { method: "POST" })).rejects.toMatchObject({
            name: "ApiError",
            status: 400,
            message: "Dados inválidos.",
            details: [{ path: "body.nome_gato", message: "Obrigatório." }]
        });
    });

    it("uses a useful fallback when the error response is not JSON", async () => {
        const { client } = createClient({
            ok: false,
            status: 503,
            json: async () => { throw new Error("invalid json"); }
        });

        await expect(client.json("/gatos")).rejects.toMatchObject({
            name: "ApiError",
            status: 503,
            message: "A solicitação falhou (503)."
        });
    });

    it("uses the browser fetch and localStorage globals through the default client", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ usuario: { nome: "Ana" } })
        });
        const storageMock = { getItem: vi.fn().mockReturnValue("browser-token") };
        vi.stubGlobal("fetch", fetchMock);
        vi.stubGlobal("localStorage", storageMock);

        try {
            await expect(api.json("/auth/perfil")).resolves.toEqual({ usuario: { nome: "Ana" } });
            expect(storageMock.getItem).toHaveBeenCalledWith("rescatto_token");
            expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer browser-token");
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
