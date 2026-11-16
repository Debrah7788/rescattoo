import { api } from "./api-client.js";

// ======================================
// CONTROLE DE EDIÇÃO
// ======================================

let idEditando = null;
let idGatoAdocao = null;
let secaoAtual = "inicio";
let usuarioAutenticado = null;
const historicoNavegacao = [];
let toastTimeout;

const token = () => localStorage.getItem("rescatto_token");

function limparSessao() {
    localStorage.removeItem("rescatto_token");
    localStorage.removeItem("rescatto_usuario");
    atualizarEstadoAutenticacao(null);
}

function cabecalhoAutenticado() {
    return token() ? { Authorization: `Bearer ${token()}` } : {};
}

async function validarSessao() {
    return api.json("/auth/perfil", {
        headers: cabecalhoAutenticado(),
        cache: "no-store"
    });
}

function atualizarEstadoAutenticacao(usuario) {
    usuarioAutenticado = usuario;
    document.getElementById("nomeUsuarioLogado").textContent = usuario
        ? `Olá, ${usuario.nome} (${usuario.perfil === "admin" ? "administrador" : "usuário"})`
        : "";
    document.getElementById("usuarioLogado").style.display = usuario ? "block" : "none";
    document.getElementById("linkPerfil").style.display = usuario ? "block" : "none";
    document.getElementById("linkLogin").style.display = usuario ? "none" : "block";
    document.getElementById("linkLogout").style.display = usuario ? "block" : "none";
    document.getElementById("avatarCabecalho").src = usuario?.imagem || "placeholder.jpg";
    document.getElementById("avatarPerfil").src = usuario?.imagem || "placeholder.jpg";
}

function mostrarMensagem(id, mensagem) {
    const elemento = document.getElementById(id);
    elemento.textContent = mensagem;
    elemento.hidden = !mensagem;
}

function mostrarToast(mensagem, tipo = "sucesso") {
    const toast = document.getElementById("toast");
    window.clearTimeout(toastTimeout);
    toast.textContent = mensagem;
    toast.className = tipo === "erro" ? "erro" : "";
    toast.hidden = false;
    toastTimeout = window.setTimeout(() => { toast.hidden = true; }, 4000);
}

function escaparHtml(valor) {
    return String(valor).replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

async function mensagemErro(resposta, padrao, formulario = document) {
    try {
        const dados = await resposta.json();
        if (dados.issues?.length) {
            dados.issues.forEach(issue => {
                const nomeCampo = issue.path.split(".").pop();
                const campo = formulario.querySelector(`[name="${nomeCampo}"]`);
                if (campo) {
                    campo.setCustomValidity(issue.message);
                    campo.reportValidity();
                }
            });
            return dados.issues.map(issue => `${issue.path}: ${issue.message}`).join(" ");
        }
        return dados.erro || padrao;
    } catch {
        return padrao;
    }
}

window.logout = function () {
    limparSessao();
    historicoNavegacao.length = 0;
    secaoAtual = "inicio";
    document.getElementById("formCadastro").reset();
    document.querySelectorAll("[data-formulario]").forEach(item => item.classList.remove("ativa"));
    document.querySelector("[data-formulario='usuario']").classList.add("ativa");
    mostrar("inicio");
};

window.mostrar = function (id, registrarHistorico = true) {
    const areasProtegidas = ["gatos", "adocao", "perfil", "painelAdmin", "cadastroGato", "editarGato"];
    if (areasProtegidas.includes(id) && !usuarioAutenticado) {
        mostrarMensagem("erroLogin", "Cadastre-se e faça login para acessar os gatos e os processos de adoção.");
        id = "login";
    }

    const areasAdmin = ["painelAdmin", "cadastroGato", "editarGato"];
    if (areasAdmin.includes(id) && usuarioAutenticado && usuarioAutenticado.perfil !== "admin") {
        mostrarToast("Esta área é exclusiva para administradores.", "erro");
        id = "gatos";
    }

    if (id === secaoAtual) return;

    if (registrarHistorico) {
        historicoNavegacao.push(secaoAtual);
    }

    document
        .querySelectorAll("section")
        .forEach(secao => {
            secao.classList.remove("active");
        });

    document
        .getElementById(id)
        .classList.add("active");
    secaoAtual = id;
};

window.voltar = function () {
    const secaoAnterior = historicoNavegacao.pop() || "inicio";
    window.mostrar(secaoAnterior, false);
};


// ======================================
// CADASTRO DE USUÁRIO OU ADMINISTRADOR
// ======================================

document
    .querySelectorAll("form [name]")
    .forEach(campo => {
        campo.addEventListener("input", () => campo.setCustomValidity(""));
        campo.addEventListener("change", () => campo.setCustomValidity(""));
    });

document
    .querySelectorAll("[data-formulario]")
    .forEach(aba => aba.addEventListener("click", function () {
        document.querySelectorAll("[data-formulario]").forEach(item => item.classList.remove("ativa"));
        this.classList.add("ativa");
    }));

document
    .getElementById("formCadastro")
    .addEventListener("submit", async function (e) {

        e.preventDefault();

        mostrarMensagem("erroCadastro", "");

        const perfil = document.querySelector("[data-formulario].ativa").dataset.formulario;
        const contato = document.getElementById("cadastroContato").value.trim();
        const senha = document.getElementById("cadastroSenha").value;
        const confirmacao = document.getElementById("cadastroConfirmacao").value;
        const campoContato = document.getElementById("cadastroContato");
        const campoSenha = document.getElementById("cadastroSenha");
        const emailValido = /^(?!.*\.\.)[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@gmail\.com$/i.test(contato);
        const senhaValida = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/.test(senha);

        document.getElementById("cadastroConfirmacao").setCustomValidity(
            senha === confirmacao ? "" : "As senhas precisam ser iguais."
        );
        if (senha !== confirmacao) {
            this.reportValidity();
            return;
        }

        if (!emailValido) {
            campoContato.setCustomValidity("Informe um e-mail Gmail válido, como nome@gmail.com.");
            campoContato.reportValidity();
            mostrarToast(campoContato.validationMessage, "erro");
            return;
        }
        if (!senhaValida) {
            campoSenha.setCustomValidity("A senha deve ter de 8 a 72 caracteres, com maiúscula, minúscula e número.");
            campoSenha.reportValidity();
            mostrarToast(campoSenha.validationMessage, "erro");
            return;
        }
        const headers = { "Content-Type": "application/json" };
        if (perfil === "admin") {
            headers["X-Admin-Key"] = document.getElementById("adminKey").value;
        }

        let resposta;
        try {
            resposta = await api.request("/auth/register", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    nome: document.getElementById("cadastroNome").value,
                    contato,
                    senha,
                    endereco: document.getElementById("cadastroEndereco").value,
                    perfil
                })
            });
        } catch {
            const mensagem = "Não foi possível conectar ao servidor.";
            mostrarMensagem("erroCadastro", mensagem);
            mostrarToast(mensagem, "erro");
            return;
        }

        if (!resposta.ok) {
            const mensagem = await mensagemErro(resposta, "Não foi possível criar a conta.", this);
            mostrarMensagem("erroCadastro", mensagem);
            mostrarToast(mensagem, "erro");
            return;
        }

        await resposta.json();
        this.reset();
        document.querySelectorAll("[data-login-perfil]").forEach(item => item.classList.remove("ativa"));
        document.querySelector(`[data-login-perfil='${perfil}']`).classList.add("ativa");
        document.getElementById("loginContato").value = contato;
        mostrarMensagem("erroLogin", `${perfil === "admin" ? "Administrador" : "Usuário"} cadastrado. Faça login para acessar os gatos.`);
        mostrarToast("Cadastro concluído. Um e-mail de boas-vindas foi solicitado.");
        mostrar("login");
    });


// ======================================
// LOGIN DE USUÁRIO OU ADMINISTRADOR
// ======================================

document
    .querySelectorAll("[data-login-perfil]")
    .forEach(aba => aba.addEventListener("click", function () {
        document.querySelectorAll("[data-login-perfil]").forEach(item => item.classList.remove("ativa"));
        this.classList.add("ativa");
    }));

document
    .getElementById("formLogin")
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        const perfil = document.querySelector("[data-login-perfil].ativa").dataset.loginPerfil;
        const contato = document.getElementById("loginContato").value.trim();
        const senha = document.getElementById("loginSenha").value;
        const campoContato = document.getElementById("loginContato");
        const campoSenha = document.getElementById("loginSenha");

        mostrarMensagem("erroLogin", "");
        if (!/^(?!.*\.\.)[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@gmail\.com$/i.test(contato)) {
            campoContato.setCustomValidity("Informe um e-mail Gmail válido, como nome@gmail.com.");
            campoContato.reportValidity();
            mostrarToast(campoContato.validationMessage, "erro");
            return;
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/.test(senha)) {
            campoSenha.setCustomValidity("A senha deve ter de 8 a 72 caracteres, com maiúscula, minúscula e número.");
            campoSenha.reportValidity();
            mostrarToast(campoSenha.validationMessage, "erro");
            return;
        }

        let resposta;
        try {
            resposta = await api.request("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contato, senha, perfil })
            });
        } catch {
            const mensagem = "Não foi possível conectar ao servidor.";
            mostrarMensagem("erroLogin", mensagem);
            mostrarToast(mensagem, "erro");
            return;
        }

        if (!resposta.ok) {
            const mensagem = await mensagemErro(resposta, "E-mail ou senha incorretos.", this);
            mostrarMensagem("erroLogin", mensagem);
            mostrarToast(mensagem, "erro");
            return;
        }

        const dados = await resposta.json();
        localStorage.setItem("rescatto_token", dados.token);
        this.reset();
        try {
            const sessao = await validarSessao();
            const usuario = sessao.usuario;
            atualizarEstadoAutenticacao(usuario);
            const secaoInicial = usuario.perfil === "admin" ? "painelAdmin" : "gatos";
            mostrar(secaoInicial);
            if (usuario.perfil === "admin") {
                await carregarGatosAdmin();
            } else {
                await carregarGatos();
            }
        } catch (erro) {
            limparSessao();
            const mensagem = "Login realizado, mas a sessão não foi validada. Faça login novamente.";
            mostrarMensagem("erroLogin", mensagem);
            mostrarToast(mensagem, "erro");
        }
    });

let urlPreviaImagem = null;
const entradaImagem = document.getElementById("arquivoImagem");

entradaImagem.addEventListener("change", function () {
    const erro = document.getElementById("erroImagem");
    const arquivo = this.files?.[0];
    erro.textContent = "";
    erro.hidden = true;

    if (urlPreviaImagem) URL.revokeObjectURL(urlPreviaImagem);
    urlPreviaImagem = null;
    if (!arquivo) {
        document.getElementById("avatarPerfil").src = usuarioAutenticado?.imagem || "placeholder.jpg";
        return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
        erro.textContent = "A imagem deve ter no máximo 2 MB.";
        erro.hidden = false;
        this.value = "";
        document.getElementById("avatarPerfil").src = usuarioAutenticado?.imagem || "placeholder.jpg";
        return;
    }
    if (!["image/jpeg", "image/png", "image/gif"].includes(arquivo.type)) {
        erro.textContent = "Tipo não permitido. Escolha uma imagem JPEG, PNG ou GIF.";
        erro.hidden = false;
        this.value = "";
        document.getElementById("avatarPerfil").src = usuarioAutenticado?.imagem || "placeholder.jpg";
        return;
    }

    urlPreviaImagem = URL.createObjectURL(arquivo);
    document.getElementById("avatarPerfil").src = urlPreviaImagem;
});

document.getElementById("formImagem").addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const erro = document.getElementById("erroImagem");
    erro.textContent = "";
    erro.hidden = true;

    try {
        const resposta = await api.request("/api/users/image", {
            method: usuarioAutenticado?.imagem ? "PUT" : "POST",
            headers: cabecalhoAutenticado(),
            body: new FormData(this)
        });
        if (!resposta.ok) {
            throw new Error(await mensagemErro(resposta, "Não foi possível enviar a imagem.", this));
        }

        const dados = await resposta.json();
        usuarioAutenticado = { ...usuarioAutenticado, imagem: dados.imagem.caminho };
        atualizarEstadoAutenticacao(usuarioAutenticado);
        if (urlPreviaImagem) URL.revokeObjectURL(urlPreviaImagem);
        urlPreviaImagem = null;
        this.reset();
        mostrarToast("Foto do perfil atualizada.");
    } catch (falha) {
        const mensagem = falha instanceof Error ? falha.message : "Não foi possível enviar a imagem.";
        erro.textContent = mensagem;
        erro.hidden = false;
        mostrarToast(mensagem, "erro");
    }
});


// ======================================
// CADASTRAR / EDITAR GATO
// ======================================

document
    .getElementById("formGato")
    .addEventListener("submit", async function (e) {

        e.preventDefault();

        const gato = {

            nome_gato:
                document.getElementById("nomeGato").value,

            idade:
                document.getElementById("idade").value,

            sexo:
                document.getElementById("sexo").value,

            cor:
                document.getElementById("cor").value,

            porte:
                document.getElementById("porte").value,

            temperamento:
                document.getElementById("temperamento").value,

            status:
                document.getElementById("status").value,

            historico_tratamento:
                document.getElementById("historico").value

        };

        try {

            if (idEditando == null) {

                const resposta = await api.request("/gatos", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        ...cabecalhoAutenticado()
                    },

                    body: JSON.stringify(gato)

                });

                if (!resposta.ok) throw new Error(await mensagemErro(resposta, "Não foi possível cadastrar o gato.", this));

            }

            else {

                const resposta = await api.request(`/gatos/${idEditando}`, {

                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        ...cabecalhoAutenticado()
                    },

                    body: JSON.stringify(gato)

                });

                if (!resposta.ok) throw new Error(await mensagemErro(resposta, "Não foi possível atualizar o gato.", this));

                idEditando = null;

            }

            this.reset();
            mostrar("painelAdmin");
            carregarGatosAdmin();
            mostrarToast("Gato salvo com sucesso.");

        }

        catch (erro) {

            console.error(erro);
            mostrarToast(erro instanceof Error ? erro.message : "Erro ao salvar gato.", "erro");

        }

    });


// ======================================
// CARREGAR GATOS (ADOÇÃO)
// ======================================

async function carregarGatos() {

    if (!token()) return;

    try {

        const resposta = await api.request("/gatos", {
            headers: cabecalhoAutenticado(),
            cache: "no-store"
        });

        if (resposta.status === 401) {
            limparSessao();
            mostrar("login");
            mostrarMensagem("erroLogin", "Sua sessão expirou. Faça login novamente para acessar os gatos.");
            return;
        }

        const gatos = await resposta.json();

        const lista =
            document.getElementById("lista");

        lista.innerHTML = "";

        gatos.forEach((gato, index) => {

            const imagem =
                index < 3
                    ? `gato${index + 1}.jpg`
                    : "placeholder.jpg";

            lista.innerHTML += `

                <div class="card">

                    <img src="${imagem}" alt="Gato">

                    <h3>
                        ${escaparHtml(gato.nome_gato)}
                    </h3>

                    <p>
                        ${escaparHtml(gato.idade)} • ${escaparHtml(gato.sexo)}
                    </p>

                    <p>
                        ${escaparHtml(gato.cor)}
                    </p>

                    <button
                        onclick="escolherGato(${gato.id_gato}, '${imagem}')">

                        Adotar

                    </button>

                </div>

            `;

        });

    }

    catch (erro) {

        console.error(erro);
        mostrarToast(erro instanceof Error ? erro.message : "Erro ao carregar gatos.", "erro");

    }

}


// ======================================
// CARREGAR GATOS (ADMINISTRADOR)
// ======================================

async function carregarGatosAdmin() {

    if (!token()) return;

    try {

        const resposta = await api.request("/gatos", {
            headers: cabecalhoAutenticado(),
            cache: "no-store"
        });

        if (resposta.status === 401) {
            logout();
            return;
        }

        const gatos = await resposta.json();

        const lista =
            document.getElementById("listaAdmin");

        lista.innerHTML = "";

        gatos.forEach((gato, index) => {

            const imagem =
                index < 3
                    ? `gato${index + 1}.jpg`
                    : "placeholder.jpg";

            lista.innerHTML += `

                <div class="card">

                    <img
                        src="${imagem}"
                        alt="Gato">

                    <h3>
                        ${escaparHtml(gato.nome_gato)}
                    </h3>

                    <p>
                        <strong>Idade:</strong>
                        ${escaparHtml(gato.idade)}
                    </p>

                    <p>
                        <strong>Sexo:</strong>
                        ${escaparHtml(gato.sexo)}
                    </p>

                    <p>
                        <strong>Cor:</strong>
                        ${escaparHtml(gato.cor)}
                    </p>

                    <br>

                    <button
                        onclick="editar(${gato.id_gato})">

                        Editar

                    </button>

                    <button
                        style="background:#d9534f;margin-left:10px"
                        onclick="excluir(${gato.id_gato})">

                        Excluir

                    </button>

                </div>

            `;

        });

    }

    catch (erro) {

        console.error(erro);
        mostrarToast(erro instanceof Error ? erro.message : "Erro ao carregar gatos.", "erro");

    }

}


// ======================================
// EDITAR GATO
// ======================================

window.editar = async function (id) {

    try {

        const resposta =
            await api.request(`/gatos/${id}`, { headers: cabecalhoAutenticado() });

        if (!resposta.ok) {
            throw new Error(await mensagemErro(resposta, "Não foi possível buscar o gato."));
        }

        const gato =
            await resposta.json();

        idEditando = id;

        document.getElementById("editarNome").value =
            gato.nome_gato;

        document.getElementById("editarIdade").value =
            gato.idade;

        document.getElementById("editarSexo").value =
            gato.sexo;

        document.getElementById("editarCor").value =
            gato.cor;

        document.getElementById("editarPorte").value =
            gato.porte;

        document.getElementById("editarTemperamento").value =
            gato.temperamento || "";

        document.getElementById("editarStatus").value =
            gato.status;

        document.getElementById("editarHistorico").value =
            gato.historico_tratamento || "";

        mostrar("editarGato");

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }

    catch (erro) {

        console.error(erro);
        mostrarToast(erro instanceof Error ? erro.message : "Erro ao buscar gato.", "erro");

    }

};


// ======================================
// EXCLUIR GATO
// ======================================

window.excluir = async function (id) {

    const confirmar = confirm(
        "Deseja realmente excluir este gato?"
    );

    if (!confirmar) return;

    try {

        const resposta = await api.request(`/gatos/${id}`, {

            method: "DELETE",
            headers: cabecalhoAutenticado()

        });

        if (!resposta.ok) {
            throw new Error(await mensagemErro(resposta, "Não foi possível excluir o gato."));
        }

        mostrarToast("Gato excluído com sucesso.");

        carregarGatosAdmin();

    }

    catch (erro) {

        console.error(erro);
        mostrarToast(erro instanceof Error ? erro.message : "Erro ao excluir gato.", "erro");

    }

};


// ======================================
// ESCOLHER GATO
// ======================================

window.escolherGato = async function (id, imagem) {

    try {

        const resposta =
            await api.request(`/gatos/${id}`, {
                headers: cabecalhoAutenticado()
            });

        if (!resposta.ok) {
            throw new Error(await mensagemErro(resposta, "Não foi possível carregar o gato."));
        }

        const gato =
            await resposta.json();

        idGatoAdocao = id;
        document.getElementById("adocaoSolicitanteNome").textContent = usuarioAutenticado?.nome || "";
        document.getElementById("adocaoSolicitanteContato").textContent = usuarioAutenticado?.contato || "";

        document
            .getElementById("imgGato")
            .src = imagem;

        document
            .getElementById("nomeGatoAdocao")
            .innerText = gato.nome_gato;

        document
            .getElementById("idadeGato")
            .innerText = gato.idade;

        document
            .getElementById("sexoGato")
            .innerText = gato.sexo;

        mostrar("adocao");

    }

    catch (erro) {

        console.error(erro);
        mostrarToast(erro instanceof Error ? erro.message : "Erro ao carregar o gato.", "erro");

    }

};


// ======================================
// FORMULÁRIO DE ADOÇÃO
// ======================================

document
    .getElementById("formAdocao")
    .addEventListener("submit", async function (e) {

        e.preventDefault();

        const formulario = new FormData(this);
        const dados = {
            telefone: String(formulario.get("telefone") || ""),
            cidade: String(formulario.get("cidade") || ""),
            tipo_moradia: String(formulario.get("tipo_moradia") || ""),
            tela_protecao: formulario.get("tela_protecao") === "true",
            outros_animais: formulario.get("outros_animais") === "true",
            justificativa: String(formulario.get("justificativa") || "").trim(),
            termo_aceito: formulario.get("termo_aceito") === "on"
        };

        try {
            const resposta = await api.request(`/gatos/${idGatoAdocao}/solicitacoes-adocao`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...cabecalhoAutenticado()
                },
                body: JSON.stringify(dados)
            });

            if (!resposta.ok) {
                throw new Error(await mensagemErro(resposta, "Não foi possível enviar a solicitação.", this));
            }

            this.reset();
            idGatoAdocao = null;
            mostrarToast("Solicitação de adoção registrada.");
            mostrar("gatos");
        } catch (erro) {
            mostrarToast(erro instanceof Error ? erro.message : "Não foi possível enviar a solicitação.", "erro");
        }

    });


// ======================================
// CARREGAR GATOS AO ABRIR A PÁGINA
// ======================================

window.onload = function () {

    atualizarEstadoAutenticacao(null);
    const tokenAtual = token();
    if (!tokenAtual) return;

    validarSessao()
        .then(dados => {
            atualizarEstadoAutenticacao(dados.usuario);
            const secaoInicial = dados.usuario.perfil === "admin" ? "painelAdmin" : "gatos";
            mostrar(secaoInicial, false);
            return dados.usuario.perfil === "admin" ? carregarGatosAdmin() : carregarGatos();
        })
        .catch(() => {
            limparSessao();
            mostrarMensagem("erroLogin", "Sua sessão expirou. Faça login novamente para continuar.");
        });

};


// ======================================
// FORMULÁRIO DE EDIÇÃO
// ======================================

document
    .getElementById("formEditarGato")
    .addEventListener("submit", async function (e) {

        e.preventDefault();

        const gato = {

            nome_gato:
                document.getElementById("editarNome").value,

            idade:
                document.getElementById("editarIdade").value,

            sexo:
                document.getElementById("editarSexo").value,

            cor:
                document.getElementById("editarCor").value,

            porte:
                document.getElementById("editarPorte").value,

            temperamento:
                document.getElementById("editarTemperamento").value,

            status:
                document.getElementById("editarStatus").value,

            historico_tratamento:
                document.getElementById("editarHistorico").value

        };

        try {
            const resposta = await api.request(`/gatos/${idEditando}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...cabecalhoAutenticado()
                },
                body: JSON.stringify(gato)
            });

            if (!resposta.ok) {
                throw new Error(await mensagemErro(resposta, "Não foi possível atualizar o gato.", this));
            }

            idEditando = null;
            this.reset();
            mostrarToast("Gato atualizado com sucesso.");
            mostrar("painelAdmin");
            carregarGatosAdmin();
            carregarGatos();
        } catch (erro) {
            mostrarToast(erro instanceof Error ? erro.message : "Não foi possível atualizar o gato.", "erro");
        }

    });