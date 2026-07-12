// js/app.js

// Inicialización de Supabase con la clave de producción
const supabaseUrl = 'https://bywdlwnsziivnbhbfcpm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5d2Rsd25zemlpdm5iaGJmY3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4ODA0ODQsImV4cCI6MjA5OTQ1NjQ4NH0.MIPmdlOnrcNJn8YT92za4qHS-NYDIyFEP6_sSNuhBPE';
window.supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Listener de sesión nativo para el enrutamiento de vistas
window.supabase.auth.onAuthStateChange((event, session) => {
    const authContainer = document.getElementById("auth-container");
    const navbarApp = document.getElementById("navbar-app");
    const mainContainer = document.getElementById("main-container");

    if (session) {
        // Usuario autenticado
        if (authContainer) authContainer.classList.add("hidden");
        if (navbarApp) navbarApp.classList.remove("hidden");
        if (mainContainer) mainContainer.classList.remove("hidden");
    } else {
        // Usuario no autenticado
        if (authContainer) authContainer.classList.remove("hidden");
        if (navbarApp) navbarApp.classList.add("hidden");
        if (mainContainer) mainContainer.classList.add("hidden");
    }
});

// 1. Estado Global - Recuperación inicial desde localStorage
try {
    window.sweetcostIngredientes = JSON.parse(localStorage.getItem('sweetcost_ingredientes')) || [];
    window.sweetcostRecetas = JSON.parse(localStorage.getItem('sweetcost_recetas')) || [];
} catch (e) {
    console.error("Error al cargar datos desde localStorage:", e);
    window.sweetcostIngredientes = [];
    window.sweetcostRecetas = [];
}

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
        // Fallback si los elementos del modal no se encuentran
        if (confirm(mensaje)) {
            alAceptar();
        }
        return;
    }

    tit.textContent = titulo;
    msg.textContent = mensaje;
    modal.classList.remove("hidden");

    // Limpiar event listeners previos clonando y reemplazando los botones
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
    // 2. Intercambio de Pestañas
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
            // Mostrar Ingredientes, ocultar Recetas
            seccionRecetas.classList.add("hidden");
            seccionIngredientes.classList.remove("hidden");

            // Forzar renderizado
            if (typeof window.renderizarTablaIngredientes === 'function') {
                window.renderizarTablaIngredientes();
            }

            // Estilos visuales del botón activo
            btnTabIngredientes.classList.replace("bg-white", "bg-[var(--secondary-container)]");
            btnTabRecetas.classList.replace("bg-[var(--secondary-container)]", "bg-white");
        } else {
            // Mostrar Recetas, ocultar Ingredientes
            seccionIngredientes.classList.add("hidden");
            seccionRecetas.classList.remove("hidden");

            // Forzar renderizado
            if (typeof window.renderizarGridRecetas === 'function') {
                window.renderizarGridRecetas();
            }

            // Estilos visuales del botón activo
            btnTabRecetas.classList.replace("bg-white", "bg-[var(--secondary-container)]");
            btnTabIngredientes.classList.replace("bg-[var(--secondary-container)]", "bg-white");
        }
    };

    // Listeners para los botones del Navbar
    btnTabIngredientes.addEventListener("click", () => setActiveTab("ingredientes"));
    btnTabRecetas.addEventListener("click", () => setActiveTab("recetas"));

    // 3. Colapsar/Expandir Panel de Carga Rápida
    const btnToggleCargaRapida = document.getElementById("btn-toggle-carga-rapida");
    const formCargaRapida = document.getElementById("form-carga-rapida");

    if (btnToggleCargaRapida && formCargaRapida) {
        btnToggleCargaRapida.addEventListener("click", () => {
            const isHidden = formCargaRapida.classList.toggle("hidden");
            btnToggleCargaRapida.textContent = isHidden ? "▼" : "▲";
        });
    }

    // 4. Buscador Dinámico Global
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
