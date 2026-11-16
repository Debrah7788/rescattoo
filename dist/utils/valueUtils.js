export function parseCookieHeader(header) {
    if (!header)
        return {};
    return Object.fromEntries(header.split(";").flatMap(cookie => {
        const separator = cookie.indexOf("=");
        if (separator < 0)
            return [];
        const name = cookie.slice(0, separator).trim();
        if (!name)
            return [];
        const value = cookie.slice(separator + 1).trim();
        return [[name, decodeURIComponent(value)]];
    }));
}
export function formatCurrency(value, locale = "pt-BR", currency = "BRL") {
    if (!Number.isFinite(value)) {
        throw new RangeError("O valor deve ser um número finito.");
    }
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}
