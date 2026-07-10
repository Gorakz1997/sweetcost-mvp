// js/ingredientes.js

document.addEventListener("DOMContentLoaded", () => {
    const formCargaRapida = document.getElementById("form-carga-rapida");
    const inputNombre = document.getElementById("input-nombre-rapido");
    const inputPrecio = document.getElementById("input-precio-rapido");
    const selectUnidad = document.getElementById("select-unidad-rapida");

    // ID del ingrediente que se está editando de forma inline (null por defecto)
    window.editandoIngredienteId = null;

    // Función para re-renderizar la tabla de ingredientes reales
    window.renderizarTablaIngredientes = () => {
        const grid = document.getElementById("grid-ingredientes");
        const emptyState = document.getElementById("empty-ingredientes");

        // Mantener compatibilidad si el navegador cargó HTML viejo con tbody
        const oldBody = document.getElementById("tabla-ingredientes-body");
        const targetContainer = grid || oldBody;

        if (!targetContainer) return;

        targetContainer.innerHTML = ""; // Limpiar el contenido actual

        if (window.sweetcostIngredientes.length === 0) {
            if (emptyState) {
                emptyState.classList.remove("hidden");
                if (grid) grid.classList.add("hidden");
            } else if (oldBody) {
                oldBody.innerHTML = `<tr><td colspan="4" class="p-6 text-center font-bold text-gray-500 bg-white brutal-border">No tienes ingredientes ingresados todavía.</td></tr>`;
            }
            return;
        } else {
            if (emptyState) emptyState.classList.add("hidden");
            if (grid) grid.classList.remove("hidden");
        }

        // Poblar el contenedor con el array global
        window.sweetcostIngredientes.forEach((ing) => {
            const isEditing = (window.editandoIngredienteId === ing.id);

            if (grid) {
                // Nuevo diseño de Grid con Tarjetas Brutalistas
                const card = document.createElement("div");
                card.className = "brutal-card p-5 bg-white flex flex-col justify-between";

                if (isEditing) {
                    card.innerHTML = `
                        <div class="mb-4">
                            <h3 class="text-2xl font-black mb-1 truncate" title="${ing.nombre}">${ing.nombre}</h3>
                            <div class="flex items-center gap-1 mt-2">
                                <span class="text-xl font-black">$</span>
                                <input type="number" id="input-edit-precio-${ing.id}" class="brutal-input py-1 px-2 w-28 text-lg font-bold" value="${ing.precio}" step="0.01" min="0" inputmode="decimal">
                                <span class="text-sm text-[var(--on-surface-variant)] font-bold">/ ${ing.unidad}</span>
                            </div>
                        </div>
                        <div class="flex gap-3 mt-auto">
                            <button class="brutal-btn flex-1 py-2 bg-[var(--secondary-container)] text-[var(--on-secondary-container)] font-bold hover:-translate-y-1 transition-transform" onclick="guardarPrecioIngredienteInline('${ing.id}')">Guardar</button>
                            <button class="brutal-btn flex-1 py-2 bg-gray-200 text-gray-700 font-bold hover:-translate-y-1 transition-transform" onclick="cancelarEdicionPrecioInline()">Cancelar</button>
                        </div>
                    `;
                } else {
                    card.innerHTML = `
                        <div class="mb-4">
                            <h3 class="text-2xl font-black mb-1 truncate" title="${ing.nombre}">${ing.nombre}</h3>
                            <p class="text-xl font-bold text-[var(--primary)]">$${ing.precio.toFixed(2)} <span class="text-sm text-[var(--on-surface-variant)] font-normal">por ${ing.unidad}</span></p>
                        </div>
                        <div class="flex gap-3 mt-auto">
                            <button class="brutal-btn flex-1 py-2 bg-[var(--primary)] text-white font-bold hover:-translate-y-1 transition-transform" onclick="activarEdicionPrecioInline('${ing.id}')">Precio</button>
                            <button class="brutal-btn flex-1 py-2 bg-[var(--error)] text-white font-bold hover:-translate-y-1 transition-transform" onclick="eliminarIngrediente('${ing.id}')">Borrar</button>
                        </div>
                    `;
                }
                grid.appendChild(card);
            } else if (oldBody) {
                // Fallback a tabla para HTML cacheado
                const tr = document.createElement("tr");
                tr.className = "border-b-4 border-[var(--border-color)] hover:bg-[var(--surface-container-low)] transition-colors";

                if (isEditing) {
                    tr.innerHTML = `
                        <td class="p-3 border-r-4 border-[var(--border-color)] font-bold text-lg">${ing.nombre}</td>
                        <td class="p-3 border-r-4 border-[var(--border-color)] font-bold">
                            <div class="flex items-center gap-1">
                                <span>$</span>
                                <input type="number" id="input-edit-precio-${ing.id}" class="brutal-input py-0.5 px-1.5 w-20 text-sm font-bold" value="${ing.precio}" step="0.01" min="0" inputmode="decimal">
                            </div>
                        </td>
                        <td class="p-3 border-r-4 border-[var(--border-color)]">${ing.unidad}</td>
                        <td class="p-3">
                            <div class="flex justify-center items-center gap-3">
                                <button class="brutal-btn px-2 py-1 bg-[var(--secondary-container)] text-xs font-bold flex-1" onclick="guardarPrecioIngredienteInline('${ing.id}')">Guardar</button>
                                <button class="brutal-btn px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold flex-1" onclick="cancelarEdicionPrecioInline()">Cancelar</button>
                            </div>
                        </td>
                    `;
                } else {
                    tr.innerHTML = `
                        <td class="p-3 border-r-4 border-[var(--border-color)] font-bold text-lg">${ing.nombre}</td>
                        <td class="p-3 border-r-4 border-[var(--border-color)] font-bold">$${ing.precio.toFixed(2)}</td>
                        <td class="p-3 border-r-4 border-[var(--border-color)]">${ing.unidad}</td>
                        <td class="p-3">
                            <div class="flex justify-center items-center gap-3">
                                <button class="brutal-btn px-4 py-1.5 bg-[var(--primary)] text-white text-sm font-bold flex-1" onclick="activarEdicionPrecioInline('${ing.id}')">Precio</button>
                                <button class="brutal-btn px-4 py-1.5 bg-[var(--error)] text-white text-sm font-bold flex-1" onclick="eliminarIngrediente('${ing.id}')">Borrar</button>
                            </div>
                        </td>
                    `;
                }
                oldBody.appendChild(tr);
            }
        });
    };

    // 3. Carga de Ingredientes (Panel lateral rápido)
    formCargaRapida.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            const nombre = inputNombre.value.trim();
            const precio = parseFloat(inputPrecio.value);
            const unidad = selectUnidad.value;

            if (nombre && !isNaN(precio)) {
                // Generar ID único
                const nuevoIngrediente = {
                    id: 'ing_' + Date.now(),
                    nombre: nombre,
                    precio: precio,
                    unidad: unidad
                };

                // Añadir al estado global
                window.sweetcostIngredientes.push(nuevoIngrediente);
                localStorage.setItem('sweetcost_ingredientes', JSON.stringify(window.sweetcostIngredientes));

                // Limpiar formulario
                formCargaRapida.reset();

                // Refrescar vistas
                window.renderizarTablaIngredientes();
                if (typeof window.poblarSelectIngredientes === 'function') {
                    window.poblarSelectIngredientes();
                }
            }
        } catch (err) {
            console.error("Error al cargar ingrediente:", err);
        }
    });

    // Activar edición de precio inline
    window.activarEdicionPrecioInline = (id) => {
        window.editandoIngredienteId = id;
        window.renderizarTablaIngredientes();
    };

    // Cancelar edición de precio inline
    window.cancelarEdicionPrecioInline = () => {
        window.editandoIngredienteId = null;
        window.renderizarTablaIngredientes();
    };

    // Guardar precio inline sin alertas emergentes
    window.guardarPrecioIngredienteInline = (id) => {
        const input = document.getElementById(`input-edit-precio-${id}`);
        if (!input) return;

        const nuevoPrecio = parseFloat(input.value);
        if (!isNaN(nuevoPrecio) && nuevoPrecio >= 0) {
            const ingIndex = window.sweetcostIngredientes.findIndex(i => i.id === id);
            if (ingIndex !== -1) {
                window.sweetcostIngredientes[ingIndex].precio = nuevoPrecio;
                localStorage.setItem('sweetcost_ingredientes', JSON.stringify(window.sweetcostIngredientes));
                window.editandoIngredienteId = null;
                window.renderizarTablaIngredientes();

                if (typeof window.poblarSelectIngredientes === 'function') {
                    window.poblarSelectIngredientes();
                }

                // Actualizar costos y recetas automáticamente
                if (typeof window.renderizarGridRecetas === 'function') {
                    window.renderizarGridRecetas();
                }

                if (typeof window.renderizarTablaReceta === 'function') {
                    window.renderizarTablaReceta();
                    window.calcularCostos();
                }
            }
        } else {
            // Indicar error de manera visual pintando de rojo el borde del input y enfocándolo
            input.style.borderColor = "var(--error)";
            input.focus();
        }
    };

    // Función global para borrar ingrediente
    window.eliminarIngrediente = (id) => {
        const ingrediente = window.sweetcostIngredientes.find(i => i.id === id);
        const nombreIngrediente = ingrediente ? ingrediente.nombre : "este ingrediente";

        // Verificar si el ingrediente está en uso en alguna receta guardada
        const recetasConIngrediente = window.sweetcostRecetas.filter(receta => 
            receta.ingredientes.some(ing => ing.id === id)
        );

        if (recetasConIngrediente.length > 0) {
            const nombresRecetas = recetasConIngrediente.map(r => r.nombre).join(", ");
            const confirmar = confirm(`El ingrediente "${nombreIngrediente}" está en uso en las siguientes recetas: ${nombresRecetas}.\n¿Estás seguro de que deseas eliminarlo? Esto puede afectar los cálculos de costos.`);
            if (!confirmar) return;
        }

        window.sweetcostIngredientes = window.sweetcostIngredientes.filter(ing => ing.id !== id);
        localStorage.setItem('sweetcost_ingredientes', JSON.stringify(window.sweetcostIngredientes));
        window.renderizarTablaIngredientes();

        // Si la vista de recetas está abierta, actualizar su selector
        if (typeof window.poblarSelectIngredientes === 'function') {
            window.poblarSelectIngredientes();
        }

        // Refrescar el listado de recetas para reflejar el cambio en los costos
        if (typeof window.renderizarGridRecetas === 'function') {
            window.renderizarGridRecetas();
        }
    };

    // Renderizado inicial
    window.renderizarTablaIngredientes();
});
