export function validate(schema) {
    return (req, _res, next) => {
        const resultado = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
            headers: req.headers
        });
        if (!resultado.success) {
            return next(resultado.error);
        }
        const dados = resultado.data;
        if (dados.body !== undefined)
            req.body = dados.body;
        if (dados.params !== undefined)
            req.params = dados.params;
        if (dados.query !== undefined) {
            Object.defineProperty(req, "query", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: dados.query
            });
        }
        if (dados.headers !== undefined)
            req.headers = dados.headers;
        return next();
    };
}
