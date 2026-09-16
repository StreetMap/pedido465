document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // CONFIGURAÇÕES DA VIAGEM
    // =====================================================

    // Nova Xavantina - MT
    const ORIGEM = [-14.6725, -52.3551];

    // Cocalinho - MT
    const DESTINO = [-14.3974, -50.9957];

    // Código de acesso
    const CODIGO_ACESSO = "39450";

    // =====================================================
    // VIAGEM DE 8 HORAS
    // =====================================================

    const DURACAO_VIAGEM =
        8 * 60 * 60 * 1000;

    // NÃO alterar depois que a viagem começar
    const STORAGE_START_KEY =
        "inicio_viagem_nova_xavantina_cocalinho";

    const STORAGE_VERSION_KEY =
        "viagem_versao";

    const VIAGEM_VERSAO = "1";


    // =====================================================
    // VARIÁVEIS
    // =====================================================

    let map = null;

    let fullRoute = [];

    let retainedMarker = null;

    let polyline = null;

    let animationFrame = null;


    // =====================================================
    // ELEMENTOS
    // =====================================================

    const loginOverlay =
        document.getElementById("login-overlay");

    const loginButton =
        document.getElementById("btn-login");

    const accessCode =
        document.getElementById("access-code");

    const infoCard =
        document.getElementById("info-card");

    const distanceElement =
        document.getElementById("distance");

    const durationElement =
        document.getElementById("duration");

    const resetButton =
        document.getElementById("btn-reset");

    const statusBadge =
        document.getElementById("time-badge");


    // =====================================================
    // EVENTOS
    // =====================================================

    loginButton?.addEventListener(
        "click",
        verificarCodigo
    );


    accessCode?.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                verificarCodigo();
            }

        }
    );


    resetButton?.addEventListener(
        "click",
        encerrarRastreamento
    );


    // =====================================================
    // INICIAR
    // =====================================================

    verificarSessaoSalva();


    // =====================================================
    // LOGIN
    // =====================================================

    function verificarCodigo() {

        if (!accessCode) {
            return;
        }


        const code =
            accessCode.value.trim();


        if (code !== CODIGO_ACESSO) {

            alert(
                "Código de rastreio inválido. Tente novamente."
            );

            accessCode.value = "";

            localStorage.removeItem(
                "codigoAtivo"
            );

            return;
        }


        localStorage.setItem(
            "codigoAtivo",
            code
        );


        carregarInterface();
    }


    // =====================================================
    // VERIFICAR SESSÃO
    // =====================================================

    function verificarSessaoSalva() {

        const codigo =
            localStorage.getItem(
                "codigoAtivo"
            );


        if (codigo === CODIGO_ACESSO) {

            carregarInterface();

        }

    }


    // =====================================================
    // CARREGAR INTERFACE
    // =====================================================

    async function carregarInterface() {

        if (loginButton) {

            loginButton.innerText =
                "Carregando rota...";

            loginButton.disabled = true;

        }


        try {

            await buscarRota();


            if (loginOverlay) {
                loginOverlay.style.display =
                    "none";
            }


            if (infoCard) {
                infoCard.style.display =
                    "block";
            }


            iniciarMapa();


        } catch (error) {

            console.error(error);


            alert(
                "Não foi possível carregar a rota."
            );


            if (loginButton) {

                loginButton.innerText =
                    "Acompanhar entrega";

                loginButton.disabled = false;

            }

        }

    }


    // =====================================================
    // BUSCAR ROTA
    // =====================================================

    async function buscarRota() {

        const start =
            `${ORIGEM[1]},${ORIGEM[0]}`;


        const end =
            `${DESTINO[1]},${DESTINO[0]}`;


        const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${start};${end}` +
            `?overview=full&geometries=geojson`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Erro ao consultar rota."
            );

        }


        const data =
            await response.json();


        if (
            data.code !== "Ok" ||
            !data.routes ||
            data.routes.length === 0
        ) {

            throw new Error(
                "Rota não encontrada."
            );

        }


        const route =
            data.routes[0];


        fullRoute =
            route.geometry.coordinates.map(
                coordinate => [
                    coordinate[1],
                    coordinate[0]
                ]
            );


        atualizarInformacoes(
            route.distance
        );

    }


    // =====================================================
    // INFORMAÇÕES
    // =====================================================

    function atualizarInformacoes(
        distanciaMetros
    ) {

        const km =
            distanciaMetros / 1000;


        if (distanceElement) {

            distanceElement.innerText =
                `${km.toFixed(0)} km`;

        }


        if (durationElement) {

            durationElement.innerText =
                "8 horas";

        }

    }


    // =====================================================
    // MAPA
    // =====================================================

    function iniciarMapa() {

        if (map) {
            return;
        }


        map =
            L.map("map", {
                zoomControl: true
            });


        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,

                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);


        // =================================================
        // ROTA
        // =================================================

        polyline =
            L.polyline(
                fullRoute,
                {
                    color: "#2563eb",

                    weight: 5,

                    opacity: 0.8
                }
            ).addTo(map);


        // =================================================
        // ORIGEM
        // =================================================

        L.marker(ORIGEM)
            .addTo(map)
            .bindPopup(
                "<strong>🚛 Saída</strong><br>" +
                "Nova Xavantina - MT"
            );


        // =================================================
        // DESTINO
        // =================================================

        L.marker(DESTINO)
            .addTo(map)
            .bindPopup(
                "<strong>📦 Destino</strong><br>" +
                "Cocalinho - MT"
            );


        // =================================================
        // ÍCONE DO CAMINHÃO
        // =================================================

        const truckIcon =
            L.divIcon({

                className:
                    "truck-marker",

                html:
                    "<div>🚛</div>",

                iconSize:
                    [40, 40],

                iconAnchor:
                    [20, 35]

            });


        retainedMarker =
            L.marker(
                ORIGEM,
                {
                    icon: truckIcon,

                    zIndexOffset: 1000
                }
            ).addTo(map);


        retainedMarker.bindPopup(
            "<strong>🚛 Caminhão</strong><br>" +
            "Pendente de pagamento de nota fiscal"
        );


        // =================================================
        // ENQUADRAR ROTA
        // =================================================

        map.fitBounds(
            polyline.getBounds(),
            {
                padding: [30, 30]
            }
        );


        // Configura o status inicial como PENDENTE e mantém parado
        configurarStatusPendente();
    }


    // =====================================================
    // STATUS PENDENTE (CAMINHÃO PARADO)
    // =====================================================

    function configurarStatusPendente() {
        if (statusBadge) {
            statusBadge.innerText = "PENDENTE";
            statusBadge.style.background = "#f59e0b"; // Cor laranja para pendência
        }
    }


    // =====================================================
    // ENCERRAR RASTREAMENTO
    // =====================================================

    function encerrarRastreamento() {

        const confirmar =
            confirm(
                "Deseja realmente encerrar o rastreamento?"
            );


        if (!confirmar) {
            return;
        }


        localStorage.removeItem(
            "codigoAtivo"
        );


        localStorage.removeItem(
            STORAGE_START_KEY
        );


        localStorage.removeItem(
            STORAGE_VERSION_KEY
        );


        if (animationFrame) {

            cancelAnimationFrame(
                animationFrame
            );

        }


        location.reload();

    }

});
