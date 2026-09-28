import nodemailer from "nodemailer";
import { NODE_ENV, SMTP_FROM, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER } from "../config.js";
let transporterPromise;
async function getTransporter() {
    if (!transporterPromise) {
        const hasSmtpSettings = Boolean(SMTP_HOST || SMTP_USER || SMTP_PASS);
        if (hasSmtpSettings && !(SMTP_HOST && SMTP_USER && SMTP_PASS)) {
            transporterPromise = Promise.reject(new Error("Configure SMTP_HOST, SMTP_USER e SMTP_PASS juntos."));
        }
        else if (hasSmtpSettings) {
            transporterPromise = Promise.resolve(nodemailer.createTransport({
                host: SMTP_HOST,
                port: SMTP_PORT,
                secure: SMTP_PORT === 465,
                auth: { user: SMTP_USER, pass: SMTP_PASS }
            }));
        }
        else if (NODE_ENV !== "production") {
            transporterPromise = nodemailer.createTestAccount().then(account => nodemailer.createTransport({
                host: account.smtp.host,
                port: account.smtp.port,
                secure: account.smtp.secure,
                auth: { user: account.user, pass: account.pass }
            }));
        }
        else {
            transporterPromise = Promise.reject(new Error("SMTP não configurado em produção."));
        }
    }
    try {
        return await transporterPromise;
    }
    catch (error) {
        transporterPromise = undefined;
        throw error;
    }
}
export async function sendWelcomeEmail(to, nome) {
    const transporter = await getTransporter();
    const nomeSeguro = nome.replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere] || caractere);
    let info;
    try {
        info = await transporter.sendMail({
            from: SMTP_FROM || "Rescatto <no-reply@rescatto.local>",
            to,
            subject: "Bem-vindo ao Rescatto!",
            text: `Olá, ${nome}! Seu cadastro no Rescatto foi concluído.`,
            html: `<h1>Olá, ${nomeSeguro}!</h1><p>Seu cadastro no <strong>Rescatto</strong> foi concluído com sucesso.</p>`
        });
    }
    catch (error) {
        transporterPromise = undefined;
        throw error;
    }
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl)
        console.log(`Prévia do e-mail de boas-vindas: ${previewUrl}`);
}
