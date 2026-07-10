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

// Inicialización de la UI y Manejo de Pestañas
document.addEventListener("DOMContentLoaded", () => {
    // 2. Intercambio de Pestañas
    const btnTabIngredientes = document.getElementById("btn-tab-ingredientes");
    const btnTabRecetas = document.getElementById("btn-tab-recetas");

    const seccionRecetas = document.getElementById("seccion-recetas");
    const seccionIngredientes = document.getElementById("seccion-ingredientes");

    const setActiveTab = (tab) => {
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

            // Estilos visuales del botón activo
            btnTabRecetas.classList.replace("bg-white", "bg-[var(--secondary-container)]");
            btnTabIngredientes.classList.replace("bg-[var(--secondary-container)]", "bg-white");
        }
    };

    // Listeners para los botones del Navbar
    btnTabIngredientes.addEventListener("click", () => setActiveTab("ingredientes"));
    btnTabRecetas.addEventListener("click", () => setActiveTab("recetas"));
});
