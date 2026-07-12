// js/app.js

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
