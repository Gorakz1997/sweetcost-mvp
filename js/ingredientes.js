// js/ingredientes.js
// Gestión de Ingredientes con Persistencia en Supabase

document.addEventListener("DOMContentLoaded", () => {
    const formCargaRapida = document.getElementById("form-carga-rapida");
    const inputNombre = document.getElementById("input-nombre-rapido");
    const inputPrecio = document.getElementById("input-precio-rapido");
    const selectUnidad = document.getElementById("select-unidad-rapida");
    const inputCantidadCompra = document.getElementById("input-cantidad-compra-rapida");

    // ID del ingrediente que se está editando de forma inline (null por defecto)
    window.editandoIngredienteId = null;

    // Función para re-renderizar la tabla de ingredientes
    window.renderizarTablaIngredientes = (filtro = "") => {
        const grid = document.getElementById("grid-ingredientes");
        const emptyState = document.getElementById("empty-ingredientes");

        // Mantener compatibilidad si el navegador cargó HTML viejo con tbody
        const oldBody = document.getElementById("tabla-ingredientes-body");
        const targetContainer = grid || oldBody;

        if (!targetContainer) return;

        targetContainer.innerHTML = ""; // Limpiar el contenido actual

        let ingredientesAMostrar = window.sweetcostIngredientes || [];
        if (filtro) {
            ingredientesAMostrar = ingredientesAMostrar.filter(ing => 
                ing.nombre.toLowerCase().includes(filtro)
            );
        }

        if (ingredientesAMostrar.length === 0) {
            if (emptyState) {
                if (filtro) {
                    emptyState.textContent = "No se encontraron ingredientes que coincidan con tu búsqueda";
                } else {
                    emptyState.textContent = "No tienes ingredientes creados todavía.";
                }
                emptyState.classList.remove("hidden");
                if (grid) grid.classList.add("hidden");
            } else if (oldBody) {
                const msj = filtro ? "No se encontraron ingredientes que coincidan con tu búsqueda." : "No tienes ingredientes ingresados todavía.";
                oldBody.innerHTML = `<tr><td colspan="4" class="p-6 text-center font-bold text-gray-500 bg-white brutal-border">${msj}</td></tr>`;
            }
            return;
        } else {
            if (emptyState) emptyState.classList.add("hidden");
            if (grid) grid.classList.remove("hidden");
        }

        // Poblar el contenedor con el array global
        ingredientesAMostrar.forEach((ing) => {
            const isEditing = (window.editandoIngredienteId === ing.id);
            const cantidadCompraVal = ing.cantidadCompra !== undefined ? ing.cantidadCompra : 1;
            const precioCompraVal = ing.precioCompra !== undefined ? ing.precioCompra : ing.precio;

            if (grid) {
                // Nuevo diseño de Grid con Tarjetas Brutalistas
                const card = document.createElement("div");
                card.className = "brutal-card p-5 bg-white flex flex-col justify-between";

                if (isEditing) {
                    const opcionesUnidad = ['kg', 'gramos', 'litro', 'ml', 'unidad'];
                    const optionsHtml = opcionesUnidad.map(opt => `<option value="${opt}" ${ing.unidad === opt ? 'selected' : ''}>${opt}</option>`).join('');

                    card.innerHTML = `
                        <div class="mb-4 flex flex-col gap-3">
                            <div>
                                <label class="block text-xs font-bold uppercase mb-1">Nombre</label>
                                <input type="text" id="input-edit-nombre-${ing.id}" class="brutal-input py-1.5 px-3 w-full text-base font-bold" value="${ing.nombre}" required>
                            </div>
                            <div>
                                <label class="block text-xs font-bold uppercase mb-1">Cantidad de Compra</label>
                                <input type="number" id="input-edit-cantidad-compra-${ing.id}" class="brutal-input py-1.5 px-3 w-full text-base font-bold" value="${cantidadCompraVal}" step="any" min="0.0001" required>
                            </div>
                            <div class="flex gap-2">
                                <div class="flex-1">
                                    <label class="block text-xs font-bold uppercase mb-1">Precio Compra ($)</label>
                                    <input type="number" id="input-edit-precio-compra-${ing.id}" class="brutal-input py-1.5 px-3 w-full text-base font-bold" value="${precioCompraVal.toFixed(2)}" step="0.01" min="0" inputmode="decimal" required>
                                </div>
                                <div class="w-24">
                                    <label class="block text-xs font-bold uppercase mb-1">Unidad</label>
                                    <select id="select-edit-unidad-${ing.id}" class="brutal-input py-1.5 px-3 w-full text-base font-bold bg-white cursor-pointer">
                                        ${optionsHtml}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-3 mt-auto">
                            <button class="brutal-btn flex-1 py-2 bg-[var(--secondary-container)] text-[var(--on-secondary-container)] font-bold hover:-translate-y-1 transition-transform" onclick="guardarEdicionIngredienteInline('${ing.id}')">Guardar</button>
                            <button class="brutal-btn flex-1 py-2 bg-gray-200 text-gray-700 font-bold hover:-translate-y-1 transition-transform" onclick="cancelarEdicionPrecioInline()">Cancelar</button>
                        </div>
                    `;
                } else {
                    card.innerHTML = `
                        <div class="mb-4">
                            <h3 class="text-2xl font-black mb-1 truncate" title="${ing.nombre}">${ing.nombre}</h3>
                            <p class="text-xl font-bold text-[var(--primary)]">$${ing.precio.toFixed(2)} <span class="text-sm text-[var(--on-surface-variant)] font-normal">por ${ing.unidad}</span></p>
                            <p class="text-xs font-bold text-gray-500 mt-1">Paquete: $${precioCompraVal.toFixed(2)} / ${cantidadCompraVal} ${ing.unidad}</p>
                        </div>
                        <div class="flex gap-3 mt-auto">
                            <button class="brutal-btn flex-1 py-2 bg-[var(--primary)] text-white font-bold hover:-translate-y-1 transition-transform" onclick="activarEdicionPrecioInline('${ing.id}')">Editar</button>
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
                    const opcionesUnidad = ['kg', 'gramos', 'litro', 'ml', 'unidad'];
                    const optionsHtml = opcionesUnidad.map(opt => `<option value="${opt}" ${ing.unidad === opt ? 'selected' : ''}>${opt}</option>`).join('');

                    tr.innerHTML = `
                        <td class="p-3 border-r-4 border-[var(--border-color)] font-bold text-lg">
                            <input type="text" id="input-edit-nombre-${ing.id}" class="brutal-input py-0.5 px-1.5 w-full text-sm font-bold" value="${ing.nombre}" required>
                        </td>
                        <td class="p-3 border-r-4 border-[var(--border-color)] font-bold">
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] uppercase font-bold text-gray-500">Cant: </label>
                                <input type="number" id="input-edit-cantidad-compra-${ing.id}" class="brutal-input py-0.5 px-1.5 w-20 text-sm font-bold" value="${cantidadCompraVal}" step="any" min="0.0001" required>
                                <label class="text-[10px] uppercase font-bold text-gray-500 mt-1">Precio: </label>
                                <div class="flex items-center gap-1">
                                    <span>$</span>
                                    <input type="number" id="input-edit-precio-compra-${ing.id}" class="brutal-input py-0.5 px-1.5 w-20 text-sm font-bold" value="${precioCompraVal.toFixed(2)}" step="0.01" min="0" inputmode="decimal" required>
                                </div>
                            </div>
                        </td>
                        <td class="p-3 border-r-4 border-[var(--border-color)]">
                            <select id="select-edit-unidad-${ing.id}" class="brutal-input py-0.5 px-1.5 text-sm font-bold bg-white cursor-pointer">
                                ${optionsHtml}
                            </select>
                        </td>
                        <td class="p-3">
                            <div class="flex justify-center items-center gap-3">
                                <button class="brutal-btn px-2 py-1 bg-[var(--secondary-container)] text-xs font-bold flex-1" onclick="guardarEdicionIngredienteInline('${ing.id}')">Guardar</button>
                                <button class="brutal-btn px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold flex-1" onclick="cancelarEdicionPrecioInline()">Cancelar</button>
                            </div>
                        </td>
                    `;
                } else {
                    tr.innerHTML = `
                        <td class="p-3 border-r-4 border-[var(--border-color)] font-bold text-lg">
                            <div>${ing.nombre}</div>
                            <div class="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Paquete: $${precioCompraVal.toFixed(2)} / ${cantidadCompraVal} ${ing.unidad}</div>
                        </td>
                        <td class="p-3 border-r-4 border-[var(--border-color)] font-bold">$${ing.precio.toFixed(2)}</td>
                        <td class="p-3 border-r-4 border-[var(--border-color)]">${ing.unidad}</td>
                        <td class="p-3">
                            <div class="flex justify-center items-center gap-3">
                                <button class="brutal-btn px-4 py-1.5 bg-[var(--primary)] text-white text-sm font-bold flex-1" onclick="activarEdicionPrecioInline('${ing.id}')">Editar</button>
                                <button class="brutal-btn px-4 py-1.5 bg-[var(--error)] text-white text-sm font-bold flex-1" onclick="eliminarIngrediente('${ing.id}')">Borrar</button>
                            </div>
                        </td>
                    `;
                }
                oldBody.appendChild(tr);
            }
        });
    };

    // Función global para cargar ingredientes desde Supabase
    window.cargarIngredientesDesdeSupabase = async () => {
        try {
            if (!window.supabase) return;
            const { data, error } = await window.supabase
                .from('ingredientes')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;

            window.sweetcostIngredientes = (data || []).map(item => ({
                id: item.id,
                nombre: item.nombre,
                cantidadCompra: parseFloat(item.cantidad_paquete),
                precioCompra: parseFloat(item.precio_paquete),
                unidad: item.unidad_medida,
                precio: parseFloat(item.precio_paquete) / parseFloat(item.cantidad_paquete) // LÓGICA DEL PRECIO UNITARIO
            }));

            window.renderizarTablaIngredientes();
            if (typeof window.poblarSelectIngredientes === 'function') {
                window.poblarSelectIngredientes();
            }
        } catch (err) {
            console.error("Error al cargar ingredientes desde Supabase:", err);
        }
    };

    // Guardado de Ingredientes (Panel de Carga Rápida)
    if (formCargaRapida) {
        formCargaRapida.addEventListener("submit", async (e) => {
            e.preventDefault();
            const originalText = document.getElementById("btn-guardar-rapido").textContent;
            try {
                const nombre = window.capitalizarTexto(inputNombre.value.trim());
                const precioTotal = parseFloat(inputPrecio.value);
                const unidad = selectUnidad.value;
                const cantidadCompra = parseFloat(inputCantidadCompra.value);

                if (nombre && !isNaN(precioTotal) && !isNaN(cantidadCompra) && cantidadCompra > 0) {
                    document.getElementById("btn-guardar-rapido").disabled = true;
                    document.getElementById("btn-guardar-rapido").textContent = "Guardando...";

                    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
                    if (userError || !user) throw new Error("Usuario no autenticado en Supabase.");

                    const { data, error } = await window.supabase
                        .from('ingredientes')
                        .insert([{
                            user_id: user.id,
                            nombre: nombre,
                            precio_paquete: precioTotal,
                            cantidad_paquete: cantidadCompra,
                            unidad_medida: unidad
                        }])
                        .select();

                    if (error) throw error;

                    const item = data[0];
                    const nuevoIngrediente = {
                        id: item.id,
                        nombre: item.nombre,
                        cantidadCompra: parseFloat(item.cantidad_paquete),
                        precioCompra: parseFloat(item.precio_paquete),
                        unidad: item.unidad_medida,
                        precio: parseFloat(item.precio_paquete) / parseFloat(item.cantidad_paquete)
                    };

                    window.sweetcostIngredientes.push(nuevoIngrediente);
                    formCargaRapida.reset();

                    window.renderizarTablaIngredientes();
                    if (typeof window.poblarSelectIngredientes === 'function') {
                        window.poblarSelectIngredientes();
                    }
                }
            } catch (err) {
                console.error("Error al guardar ingrediente:", err);
                alert("Error al guardar ingrediente en Supabase: " + (err.message || err));
            } finally {
                document.getElementById("btn-guardar-rapido").disabled = false;
                document.getElementById("btn-guardar-rapido").textContent = originalText;
            }
        });
    }

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

    // Guardar edición completa inline
    window.guardarEdicionIngredienteInline = async (id) => {
        const inputNombre = document.getElementById(`input-edit-nombre-${id}`);
        const inputCantidadCompra = document.getElementById(`input-edit-cantidad-compra-${id}`);
        const inputPrecioCompra = document.getElementById(`input-edit-precio-compra-${id}`);
        const selectUnidad = document.getElementById(`select-edit-unidad-${id}`);
        
        if (!inputNombre || !inputCantidadCompra || !inputPrecioCompra || !selectUnidad) return;

        const nuevoNombre = window.capitalizarTexto(inputNombre.value.trim());
        const nuevaCantidadCompra = parseFloat(inputCantidadCompra.value);
        const nuevoPrecioCompra = parseFloat(inputPrecioCompra.value);
        const nuevaUnidad = selectUnidad.value;

        let tieneError = false;

        if (!nuevoNombre) {
            inputNombre.style.borderColor = "var(--error)";
            inputNombre.focus();
            tieneError = true;
        } else {
            inputNombre.style.borderColor = "";
        }

        if (isNaN(nuevaCantidadCompra) || nuevaCantidadCompra <= 0) {
            inputCantidadCompra.style.borderColor = "var(--error)";
            if (!tieneError) {
                inputCantidadCompra.focus();
            }
            tieneError = true;
        } else {
            inputCantidadCompra.style.borderColor = "";
        }

        if (isNaN(nuevoPrecioCompra) || nuevoPrecioCompra < 0) {
            inputPrecioCompra.style.borderColor = "var(--error)";
            if (!tieneError) {
                inputPrecioCompra.focus();
            }
            tieneError = true;
        } else {
            inputPrecioCompra.style.borderColor = "";
        }

        if (tieneError) return;

        try {
            const { error } = await window.supabase
                .from('ingredientes')
                .update({
                    nombre: nuevoNombre,
                    cantidad_paquete: nuevaCantidadCompra,
                    precio_paquete: nuevoPrecioCompra,
                    unidad_medida: nuevaUnidad
                })
                .eq('id', id);

            if (error) throw error;

            const ingIndex = window.sweetcostIngredientes.findIndex(i => i.id === id);
            if (ingIndex !== -1) {
                window.sweetcostIngredientes[ingIndex].nombre = nuevoNombre;
                window.sweetcostIngredientes[ingIndex].cantidadCompra = nuevaCantidadCompra;
                window.sweetcostIngredientes[ingIndex].precioCompra = nuevoPrecioCompra;
                window.sweetcostIngredientes[ingIndex].unidad = nuevaUnidad;
                window.sweetcostIngredientes[ingIndex].precio = nuevoPrecioCompra / nuevaCantidadCompra;
                
                window.editandoIngredienteId = null;
                window.renderizarTablaIngredientes();

                if (typeof window.poblarSelectIngredientes === 'function') {
                    window.poblarSelectIngredientes();
                }

                // Recalcular costos
                if (typeof window.renderizarGridRecetas === 'function') {
                    window.renderizarGridRecetas();
                }

                if (typeof window.renderizarTablaReceta === 'function') {
                    window.renderizarTablaReceta();
                    window.calcularCostos();
                }
            }
        } catch (err) {
            console.error("Error al actualizar ingrediente:", err);
            alert("Error al actualizar ingrediente: " + (err.message || err));
        }
    };

    // Borrado físico de ingrediente
    window.eliminarIngrediente = (id) => {
        const ingrediente = window.sweetcostIngredientes.find(i => i.id === id);
        if (!ingrediente) return;

        window.mostrarConfirmacion(
            "Eliminar Ingrediente",
            `¿Deseas eliminar el siguiente ingrediente: ${ingrediente.nombre}?`,
            () => {
                // Verificar si el ingrediente está en uso en alguna receta cargada en memoria
                const recetasConIngrediente = (window.sweetcostRecetas || []).filter(receta => 
                    receta.ingredientes.some(ing => ing.id === id)
                );

                if (recetasConIngrediente.length > 0) {
                    const nombresRecetas = recetasConIngrediente.map(r => r.nombre).join(", ");
                    window.mostrarConfirmacion(
                        "Ingrediente en Uso",
                        `El ingrediente "${ingrediente.nombre}" está en uso en las siguientes recetas: ${nombresRecetas}.\n¿Estás seguro de que deseas eliminarlo? Esto afectará los cálculos de costos y se eliminará en cascada en Supabase.`,
                        () => {
                            procederAEliminarIngrediente(id);
                        }
                    );
                } else {
                    procederAEliminarIngrediente(id);
                }
            }
        );
    };

    async function procederAEliminarIngrediente(id) {
        try {
            const { error } = await window.supabase
                .from('ingredientes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            window.sweetcostIngredientes = window.sweetcostIngredientes.filter(ing => ing.id !== id);
            window.renderizarTablaIngredientes();

            if (typeof window.poblarSelectIngredientes === 'function') {
                window.poblarSelectIngredientes();
            }

            if (typeof window.renderizarGridRecetas === 'function') {
                window.renderizarGridRecetas();
            }
        } catch (err) {
            console.error("Error al eliminar ingrediente:", err);
            alert("Error al eliminar ingrediente: " + (err.message || err));
        }
    }

    // Gatillar la carga inicial si la sesión de Supabase ya está lista
    if (window.supabase) {
        window.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                window.cargarIngredientesDesdeSupabase();
            }
        });
    }
});
