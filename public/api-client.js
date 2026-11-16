export class ApiError extends Error {
    constructor(status, message, details) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

export function createApiClient({ fetchImpl, storage }) {
    async function request(url, options = {}) {
        const headers = new Headers(options.headers || {});
        const token = storage.getItem("rescatto_token");
        if (token && !headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return fetchImpl(url, { ...options, headers });
    }

    async function json(url, options = {}) {
        const response = await request(url, options);
        let body;
        try {
            body = await response.json();
        } catch {
            body = undefined;
        }

        if (!response.ok) {
            throw new ApiError(
                response.status,
                body?.erro || `A solicitação falhou (${response.status}).`,
                body?.issues
            );
        }
        return body;
    }

    return { request, json };
}

export const api = createApiClient({
    fetchImpl: (...args) => fetch(...args),
    storage: { getItem: key => localStorage.getItem(key) }
});
