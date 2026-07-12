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
    const btnTabRecetas = document.getElementById("btn-tab-recetas");

    const seccionRecetas = document.getElementById("seccion-recetas");
    const seccionIngredientes = document.getElementById("seccion-ingredientes");
    const inputBuscarGlobal = document.getElementById("input-buscar-global");

    let activeTab = "recetas";

    const setActiveTab = (tab) => {
        activeTab = tab;
        if (inputBuscarGlobal) {
            inputBuscarGlobal.value = "";
            inputBuscarGlobal.placeholder = tab === "ingredientes" ? "Buscar ingredientes..." : "Buscar recetas...";
        }

        if (tab === "ingredientes") {
            seccionRecetas.classList.add("hidden");
            seccionIngredientes.classList.remove("hidden");

            if (typeof window.renderizarTablaIngredientes === 'function') {
                window.renderizarTablaIngredientes();
            }

            btnTabIngredientes.classList.replace("bg-white", "bg-[var(--secondary-container)]");
            btnTabRecetas.classList.replace("bg-[var(--secondary-container)]", "bg-white");
        } else {
            seccionIngredientes.classList.add("hidden");
            seccionRecetas.classList.remove("hidden");

            if (typeof window.renderizarGridRecetas === 'function') {
                window.renderizarGridRecetas();
            }

            btnTabRecetas.classList.replace("bg-white", "bg-[var(--secondary-container)]");
            btnTabIngredientes.classList.replace("bg-[var(--secondary-container)]", "bg-white");
        }
    };

    if (btnTabIngredientes) btnTabIngredientes.addEventListener("click", () => setActiveTab("ingredientes"));
    if (btnTabRecetas) btnTabRecetas.addEventListener("click", () => setActiveTab("recetas"));

    // Colapsar/Expandir Panel de Carga Rápida
    const btnToggleCargaRapida = document.getElementById("btn-toggle-carga-rapida");
    const formCargaRapida = document.getElementById("form-carga-rapida");

    if (btnToggleCargaRapida && formCargaRapida) {
        btnToggleCargaRapida.addEventListener("click", () => {
            const isHidden = formCargaRapida.classList.toggle("hidden");
            btnToggleCargaRapida.textContent = isHidden ? "▼" : "▲";
        });
    }

    // Buscador Dinámico Global
    if (inputBuscarGlobal) {
        inputBuscarGlobal.addEventListener("input", (e) => {
            const termino = e.target.value.toLowerCase().trim();
            if (activeTab === "ingredientes") {
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
