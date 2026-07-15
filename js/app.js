// js/app.js
// Inicializador General y Enrutador de SweetCost Cloud

// Inicialización de Supabase con la clave de producción
const supabaseUrl = 'https://bywdlwnsziivnbhbfcpm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5d2Rsd25zemlpdm5iaGJmY3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4ODA0ODQsImV4cCI6MjA5OTQ1NjQ4NH0.MIPmdlOnrcNJn8YT92za4qHS-NYDIyFEP6_sSNuhBPE';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
window.supabase = supabaseClient;

// Listener de sesión nativo para el enrutamiento de vistas
window.supabase.auth.onAuthStateChange(async (event, session) => {
    const authContainer = document.getElementById("auth-container");
    const navbarApp = document.getElementById("navbar-app");
    const mainContainer = document.getElementById("main-container");

    if (session) {
        // Guardar token y usuario activo globalmente
        window.sessionToken = session.access_token;
        window.currentUser = session.user;

        // Ocultar Auth y mostrar Dashboard
        if (authContainer) authContainer.classList.add("hidden");
        if (navbarApp) navbarApp.classList.remove("hidden");
        if (mainContainer) mainContainer.classList.remove("hidden");

        // Carga de datos en cascada y seeding automatizado
        try {
            if (typeof window.cargarIngredientesDesdeSupabase === 'function') {
                await window.cargarIngredientesDesdeSupabase();
            }
            if (typeof window.cargarRecetasDesdeSupabase === 'function') {
                await window.cargarRecetasDesdeSupabase();
            }
            
            // Lanzar el Seeder si el usuario tiene 0 recetas guardadas
            if (typeof window.ejecutarSeederSiEsNecesario === 'function') {
                const seEjecuto = await window.ejecutarSeederSiEsNecesario(session.user.id);
                if (seEjecuto) {
                    // Si se agregaron recetas de muestra, recargamos la info desde la nube
                    if (typeof window.cargarIngredientesDesdeSupabase === 'function') {
                        await window.cargarIngredientesDesdeSupabase();
                    }
                    if (typeof window.cargarRecetasDesdeSupabase === 'function') {
                        await window.cargarRecetasDesdeSupabase();
                    }
                }
            }
        } catch (err) {
            console.error("Error en la inicialización de datos de usuario:", err);
        }
    } else {
        // Limpiar sesión activa
        window.sessionToken = null;
        window.currentUser = null;

        // Ocultar Dashboard y mostrar Auth
        if (authContainer) authContainer.classList.remove("hidden");
        if (navbarApp) navbarApp.classList.add("hidden");
        if (mainContainer) mainContainer.classList.add("hidden");
    }
});

// Estado Global en Memoria (se sincroniza con Supabase en vez del viejo localStorage)
window.sweetcostIngredientes = [];
window.sweetcostRecetas = [];

// Función utilitaria global para capitalizar textos
window.capitalizarTexto = (texto) => {
    if (!texto) return "";
    const trimmed = texto.trim();
    if (trimmed.length === 0) return "";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

// Función utilitaria global para mostrar confirmación personalizada
window.mostrarConfirmacion = (titulo, mensaje, alAceptar) => {
    const modal = document.getElementById("modal-confirmacion");
    const tit = document.getElementById("modal-confirm-titulo");
    const msg = document.getElementById("modal-confirm-mensaje");
    const btnAceptar = document.getElementById("btn-confirm-aceptar");
    const btnCancelar = document.getElementById("btn-confirm-cancelar");

    if (!modal || !tit || !msg || !btnAceptar || !btnCancelar) {
        if (confirm(mensaje)) {
            alAceptar();
        }
        return;
    }

    tit.textContent = titulo;
    msg.textContent = mensaje;
    modal.classList.remove("hidden");

    const nuevoBtnAceptar = btnAceptar.cloneNode(true);
    const nuevoBtnCancelar = btnCancelar.cloneNode(true);
    btnAceptar.replaceWith(nuevoBtnAceptar);
    btnCancelar.replaceWith(nuevoBtnCancelar);

    nuevoBtnAceptar.addEventListener("click", () => {
        modal.classList.add("hidden");
        alAceptar();
    });

    nuevoBtnCancelar.addEventListener("click", () => {
        modal.classList.add("hidden");
    });
};

// Inicialización de la UI y Manejo de Pestañas
document.addEventListener("DOMContentLoaded", () => {
    const btnTabIngredientes = document.getElementById("btn-tab-ingredientes");
    const btnTabInsumos = document.getElementById("btn-tab-insumos");
    const btnTabRecetas = document.getElementById("btn-tab-recetas");

    // Elementos de navegación móvil
    const btnMobileTabIngredientes = document.getElementById("btn-mobile-tab-ingredientes");
    const btnMobileTabInsumos = document.getElementById("btn-mobile-tab-insumos");
    const btnMobileTabRecetas = document.getElementById("btn-mobile-tab-recetas");
    const btnMobileCargaRapida = document.getElementById("btn-mobile-carga-rapida");
    const btnMobileCerrarSesion = document.getElementById("btn-mobile-cerrar-sesion");
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");

    const seccionRecetas = document.getElementById("seccion-recetas");
    const seccionIngredientes = document.getElementById("seccion-ingredientes");
    const inputBuscarGlobal = document.getElementById("input-buscar-global");
    const panelCargaRapida = document.getElementById("panel-carga-rapida");

    window.activeTab = "recetas";

    const setActiveTab = (tab) => {
        window.activeTab = tab;
        if (inputBuscarGlobal) {
            inputBuscarGlobal.value = "";
            inputBuscarGlobal.placeholder = tab === "recetas" ? "Buscar recetas..." : (tab === "ingredientes" ? "Buscar ingredientes..." : "Buscar insumos...");
        }

        const tituloSeccion = document.querySelector("#seccion-ingredientes h2");
        const tituloCargaRapida = document.getElementById("titulo-carga-rapida");
        const labelNombreRapido = document.getElementById("label-nombre-rapido");
        const inputNombreRapido = document.getElementById("input-nombre-rapido");

        if (tab === "ingredientes") {
            seccionRecetas.classList.add("hidden");
            seccionIngredientes.classList.remove("hidden");

            if (tituloSeccion) tituloSeccion.textContent = "Listado de Ingredientes";
            if (tituloCargaRapida) tituloCargaRapida.textContent = "Carga Rápida";
            if (labelNombreRapido) labelNombreRapido.textContent = "Nombre del Ingrediente";
            if (inputNombreRapido) inputNombreRapido.placeholder = "Ej. Harina 0000";

            if (typeof window.renderizarTablaIngredientes === 'function') {
                window.renderizarTablaIngredientes();
            }

            if (panelCargaRapida) {
                panelCargaRapida.classList.remove("hidden");
            }

            if (btnTabIngredientes) btnTabIngredientes.classList.replace("bg-white", "bg-[var(--secondary-container)]");
            if (btnTabInsumos) btnTabInsumos.classList.replace("bg-[var(--secondary-container)]", "bg-white");
            if (btnTabRecetas) btnTabRecetas.classList.replace("bg-[var(--secondary-container)]", "bg-white");

            if (btnMobileTabIngredientes) {
                btnMobileTabIngredientes.classList.add("bg-[var(--secondary-container)]");
                btnMobileTabIngredientes.classList.remove("bg-white");
            }
            if (btnMobileTabInsumos) {
                btnMobileTabInsumos.classList.add("bg-white");
                btnMobileTabInsumos.classList.remove("bg-[var(--secondary-container)]");
            }
            if (btnMobileTabRecetas) {
                btnMobileTabRecetas.classList.add("bg-white");
                btnMobileTabRecetas.classList.remove("bg-[var(--secondary-container)]");
            }
        } else if (tab === "insumos") {
            seccionRecetas.classList.add("hidden");
            seccionIngredientes.classList.remove("hidden");

            if (tituloSeccion) tituloSeccion.textContent = "Listado de Insumos";
            if (tituloCargaRapida) tituloCargaRapida.textContent = "Carga Rápida Insumos";
            if (labelNombreRapido) labelNombreRapido.textContent = "Nombre del Insumo";
            if (inputNombreRapido) inputNombreRapido.placeholder = "Ej. Caja para Tortas, Moldes";

            if (typeof window.renderizarTablaIngredientes === 'function') {
                window.renderizarTablaIngredientes();
            }

            if (panelCargaRapida) {
                panelCargaRapida.classList.remove("hidden");
            }

            if (btnTabInsumos) btnTabInsumos.classList.replace("bg-white", "bg-[var(--secondary-container)]");
            if (btnTabIngredientes) btnTabIngredientes.classList.replace("bg-[var(--secondary-container)]", "bg-white");
            if (btnTabRecetas) btnTabRecetas.classList.replace("bg-[var(--secondary-container)]", "bg-white");

            if (btnMobileTabInsumos) {
                btnMobileTabInsumos.classList.add("bg-[var(--secondary-container)]");
                btnMobileTabInsumos.classList.remove("bg-white");
            }
            if (btnMobileTabIngredientes) {
                btnMobileTabIngredientes.classList.add("bg-white");
                btnMobileTabIngredientes.classList.remove("bg-[var(--secondary-container)]");
            }
            if (btnMobileTabRecetas) {
                btnMobileTabRecetas.classList.add("bg-white");
                btnMobileTabRecetas.classList.remove("bg-[var(--secondary-container)]");
            }
        } else {
            seccionIngredientes.classList.add("hidden");
            seccionRecetas.classList.remove("hidden");

            if (typeof window.renderizarGridRecetas === 'function') {
                window.renderizarGridRecetas();
            }

            if (panelCargaRapida) {
                panelCargaRapida.classList.add("hidden");
            }

            if (btnTabRecetas) btnTabRecetas.classList.replace("bg-white", "bg-[var(--secondary-container)]");
            if (btnTabIngredientes) btnTabIngredientes.classList.replace("bg-[var(--secondary-container)]", "bg-white");
            if (btnTabInsumos) btnTabInsumos.classList.replace("bg-[var(--secondary-container)]", "bg-white");

            if (btnMobileTabRecetas) {
                btnMobileTabRecetas.classList.add("bg-[var(--secondary-container)]");
                btnMobileTabRecetas.classList.remove("bg-white");
            }
            if (btnMobileTabIngredientes) {
                btnMobileTabIngredientes.classList.add("bg-white");
                btnMobileTabIngredientes.classList.remove("bg-[var(--secondary-container)]");
            }
            if (btnMobileTabInsumos) {
                btnMobileTabInsumos.classList.add("bg-white");
                btnMobileTabInsumos.classList.remove("bg-[var(--secondary-container)]");
            }
        }
    };

    if (btnTabIngredientes) btnTabIngredientes.addEventListener("click", () => setActiveTab("ingredientes"));
    if (btnTabInsumos) btnTabInsumos.addEventListener("click", () => setActiveTab("insumos"));
    if (btnTabRecetas) btnTabRecetas.addEventListener("click", () => setActiveTab("recetas"));

    if (btnMobileTabIngredientes) btnMobileTabIngredientes.addEventListener("click", () => setActiveTab("ingredientes"));
    if (btnMobileTabInsumos) btnMobileTabInsumos.addEventListener("click", () => setActiveTab("insumos"));
    if (btnMobileTabRecetas) btnMobileTabRecetas.addEventListener("click", () => setActiveTab("recetas"));

    if (btnMobileCerrarSesion && btnCerrarSesion) {
        btnMobileCerrarSesion.addEventListener("click", () => {
            btnCerrarSesion.click();
        });
    }

    // Colapsar/Expandir Panel de Carga Rápida
    const btnToggleCargaRapida = document.getElementById("btn-toggle-carga-rapida");
    const formCargaRapida = document.getElementById("form-carga-rapida");

    if (btnToggleCargaRapida && formCargaRapida) {
        btnToggleCargaRapida.addEventListener("click", () => {
            const isHidden = formCargaRapida.classList.toggle("hidden");
            btnToggleCargaRapida.textContent = isHidden ? "▼" : "▲";
        });
    }

    if (btnMobileCargaRapida) {
        btnMobileCargaRapida.addEventListener("click", () => {
            if (btnToggleCargaRapida) {
                btnToggleCargaRapida.click();
            }
        });
    }

    // Buscador Dinámico Global
    if (inputBuscarGlobal) {
        inputBuscarGlobal.addEventListener("input", (e) => {
            const termino = e.target.value.toLowerCase().trim();
            if (window.activeTab === "ingredientes" || window.activeTab === "insumos") {
                if (typeof window.renderizarTablaIngredientes === 'function') {
                    window.renderizarTablaIngredientes(termino);
                }
            } else {
                if (typeof window.renderizarGridRecetas === 'function') {
                    window.renderizarGridRecetas(termino);
                }
            }
        });
    }
});
