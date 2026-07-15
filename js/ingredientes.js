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

        // Filtrar según la pestaña activa (ingredientes vs insumos)
        const tipoEsperado = window.activeTab === "insumos" ? "insumo" : "ingrediente";
        ingredientesAMostrar = ingredientesAMostrar.filter(ing => {
            const t = ing.tipo || "ingrediente";
            return t === tipoEsperado;
        });

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

            // Normalizar urls a array
            const urls = Array.isArray(ing.urlProveedor) ? ing.urlProveedor : (ing.urlProveedor ? [ing.urlProveedor] : []);
            
            const tieneUrlSoportada = urls.some(url => 
                url.includes('cocinaconvalentino.com.ar') || 
                url.includes('boticadelpastelero.com.ar') ||
                url.includes('diaonline.supermercadosdia.com.ar')
            );

            // Generar HTML de enlaces legibles
            let linksHtml = "";
            if (urls.length > 0) {
                linksHtml = `
                    <div class="mt-2 text-xs font-bold text-gray-500 border-t border-dashed border-gray-200 pt-1">
                        Enlaces:
                        <div class="flex flex-wrap gap-1.5 mt-0.5">
                            ${urls.map((url, i) => {
                                let domainName = "Enlace " + (i + 1);
                                try {
                                    const parsed = new URL(url);
                                    if (parsed.hostname.includes('diaonline.supermercadosdia.com.ar')) domainName = "Dia";
                                    else if (parsed.hostname.includes('cocinaconvalentino.com.ar')) domainName = "Valentino";
                                    else if (parsed.hostname.includes('boticadelpastelero.com.ar')) domainName = "Botica";
                                    else domainName = parsed.hostname.replace('www.', '');
                                } catch (e) {}
                                return `<a href="${url}" target="_blank" class="underline text-blue-600 hover:text-blue-800 break-all font-semibold">${domainName}</a>`;
                            }).join(' | ')}
                        </div>
                    </div>
                `;
            }

            // Indicador de proveedor activo
            let proveedorActivoHtml = "";
            if (ing.proveedorActivo) {
                let domainName = ing.proveedorActivo;
                try {
                    const parsed = new URL(ing.proveedorActivo);
                    if (parsed.hostname.includes('diaonline.supermercadosdia.com.ar')) domainName = "Supermercados Dia";
                    else if (parsed.hostname.includes('cocinaconvalentino.com.ar')) domainName = "Cocina con Valentino";
                    else if (parsed.hostname.includes('boticadelpastelero.com.ar')) domainName = "Botica del Pastelero";
                    else domainName = parsed.hostname;
                } catch(e){}
                proveedorActivoHtml = `
                    <div class="mt-1.5 text-[10px] bg-[#d6f6d5] text-[#1b431a] border border-[#a2e7a1] font-bold px-2 py-0.5 rounded-sm inline-block uppercase tracking-wider">
                        Precio de: ${domainName}
                    </div>
                `;
            }

            if (grid) {
                const card = document.createElement("div");
                card.className = "brutal-card bg-white p-3 md:p-5 flex flex-col h-full justify-between relative";

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
                            <div>
                                <label class="block text-xs font-bold uppercase mb-1">Enlaces Proveedores (separados por coma)</label>
                                <input type="text" id="input-edit-url-proveedor-${ing.id}" class="brutal-input py-1.5 px-3 w-full text-base font-bold" value="${urls.join(', ')}" placeholder="URL1, URL2...">
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
                            <h3 class="text-sm md:text-2xl font-black mb-1 truncate" title="${ing.nombre}">${ing.nombre}</h3>
                            <p class="text-xs md:text-xl font-bold text-[var(--primary)] truncate">$${ing.precio.toFixed(2)} <span class="text-[10px] md:text-sm text-[var(--on-surface-variant)] font-normal">por ${ing.unidad}</span></p>
                            <p class="text-[8px] md:text-xs font-bold text-gray-500 mt-1 truncate">Paquete: $${precioCompraVal.toFixed(2)} / ${cantidadCompraVal} ${ing.unidad}</p>
                            ${proveedorActivoHtml}
                            ${linksHtml}
                        </div>
                        <div class="flex gap-2 w-full mt-auto pt-2 border-t border-gray-100">
                            <button class="brutal-btn flex-1 py-1 px-2 md:py-2 md:px-3 text-[10px] tracking-tight md:text-xs font-black uppercase bg-[var(--primary)] text-white transition-all hover:bg-opacity-90" onclick="activarEdicionPrecioInline('${ing.id}')">Editar</button>
                            <button class="brutal-btn flex-1 py-1 px-2 md:py-2 md:px-3 text-[10px] tracking-tight md:text-xs font-black uppercase bg-[var(--error)] text-white transition-all hover:bg-opacity-90" onclick="eliminarIngrediente('${ing.id}')">Borrar</button>
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
                            <div class="mt-2 flex flex-col gap-1">
                                <label class="text-[10px] uppercase font-bold text-gray-500">Enlaces (separados por coma): </label>
                                <input type="text" id="input-edit-url-proveedor-${ing.id}" class="brutal-input py-0.5 px-1.5 w-full text-xs font-bold" value="${urls.join(', ')}" placeholder="URL1, URL2...">
                            </div>
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
                            ${proveedorActivoHtml}
                            ${linksHtml}
                        </td>
                        <td class="p-3 border-r-4 border-[var(--border-color)] font-bold">$${ing.precio.toFixed(2)}</td>
                        <td class="p-3 border-r-4 border-[var(--border-color)]">${ing.unidad}</td>
                        <td class="p-3">
                            <div class="flex justify-center items-center gap-3">
                                ${tieneUrlSoportada ? `<button id="btn-sync-${ing.id}" class="brutal-btn px-2.5 py-1.5 bg-[var(--secondary-container)] text-xs font-bold flex items-center justify-center" onclick="sincronizarPrecioIngrediente('${ing.id}')" title="Sincronizar precio">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" />
                                        <circle cx="12" cy="12" r="4.5" fill="currentColor" />
                                        <text x="12" y="15" font-family="system-ui, sans-serif" font-size="8.5" font-weight="900" text-anchor="middle" fill="white" stroke="none">$</text>
                                    </svg>
                                </button>` : ''}
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
                cantidadCompra: parseFloat(item.cantidad_compra),
                precioCompra: parseFloat(item.precio_compra),
                unidad: item.unidad,
                precio: parseFloat(item.precio),
                urlProveedor: Array.isArray(item.url_proveedor) ? item.url_proveedor : (item.url_proveedor ? [item.url_proveedor] : []),
                proveedorActivo: item.proveedor_activo,
                tipo: item.tipo || "ingrediente"
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
            
            // 1. CAPTURA CORRECTA DE INPUTS Y PARSEO EXPLÍCITO
            const inputNombre = document.getElementById("input-nombre-rapido");
            const inputPrecio = document.getElementById("input-precio-rapido");
            const selectUnidad = document.getElementById("select-unidad-rapida");
            const inputCantidadCompra = document.getElementById("input-cantidad-compra-rapida");

            if (!inputNombre || !inputPrecio || !selectUnidad || !inputCantidadCompra) return;

            const nombre = inputNombre.value.trim();
            const precioCompra = parseFloat(inputPrecio.value);
            const cantidadCompra = parseFloat(inputCantidadCompra.value);
            const unidad = selectUnidad.value;

            // Capturar múltiples enlaces
            const urlInputs = document.querySelectorAll("#container-urls-rapido .input-url-proveedor-item");
            const urls = Array.from(urlInputs).map(inp => inp.value.trim()).filter(Boolean);

            // 2. COMPROBACIÓN DE CAMPOS (Evitar enviar valores NaN)
            if (!nombre || isNaN(precioCompra) || isNaN(cantidadCompra) || cantidadCompra <= 0) {
                alert("Por favor, completa todos los campos con valores válidos.");
                return;
            }

            const originalText = document.getElementById("btn-guardar-rapido").textContent;
            try {
                document.getElementById("btn-guardar-rapido").disabled = true;
                document.getElementById("btn-guardar-rapido").textContent = "Guardando...";

                // Obtener sesión de usuario activa
                const userResponse = await window.supabase.auth.getUser();
                const user = window.currentUser || userResponse.data?.user;
                if (!user) throw new Error("Usuario no autenticado en Supabase.");

                const nombreFormateado = nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();

                const tipoValue = window.activeTab === "insumos" ? "insumo" : "ingrediente";
                const { data, error } = await window.supabase
                    .from('ingredientes')
                    .insert([{
                        user_id: user.id,
                        nombre: nombreFormateado,
                        cantidad_compra: cantidadCompra,
                        precio_compra: precioCompra,
                        unidad: unidad,
                        precio: precioCompra / cantidadCompra,
                        url_proveedor: urls,
                        tipo: tipoValue
                    }])
                    .select();

                if (error) throw error;

                const item = data[0];
                const nuevoIngrediente = {
                    id: item.id,
                    nombre: item.nombre,
                    cantidadCompra: parseFloat(item.cantidad_compra),
                    precioCompra: parseFloat(item.precio_compra),
                    unidad: item.unidad,
                    precio: parseFloat(item.precio),
                    urlProveedor: Array.isArray(item.url_proveedor) ? item.url_proveedor : (item.url_proveedor ? [item.url_proveedor] : []),
                    proveedorActivo: item.proveedor_activo,
                    tipo: item.tipo || "ingrediente"
                };

                window.sweetcostIngredientes.push(nuevoIngrediente);
                formCargaRapida.reset();
                if (window.manejadorUrlsRapido) window.manejadorUrlsRapido.reset();

                window.renderizarTablaIngredientes();
                if (typeof window.poblarSelectIngredientes === 'function') {
                    window.poblarSelectIngredientes();
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
        const inputUrlProveedor = document.getElementById(`input-edit-url-proveedor-${id}`);
        
        if (!inputNombre || !inputCantidadCompra || !inputPrecioCompra || !selectUnidad) return;

        const nuevoNombre = window.capitalizarTexto(inputNombre.value.trim());
        const nuevaCantidadCompra = parseFloat(inputCantidadCompra.value);
        const nuevoPrecioCompra = parseFloat(inputPrecioCompra.value);
        const nuevaUnidad = selectUnidad.value;
        const nuevoUrlProveedor = inputUrlProveedor ? inputUrlProveedor.value.split(',').map(u => u.trim()).filter(Boolean) : [];

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
            // MAPEO ESTRICTO CON LA BASE DE DATOS
            const { error } = await window.supabase
                .from('ingredientes')
                .update({
                    nombre: nuevoNombre,
                    cantidad_compra: nuevaCantidadCompra,
                    precio_compra: nuevoPrecioCompra,
                    unidad: nuevaUnidad,
                    precio: nuevoPrecioCompra / nuevaCantidadCompra,
                    url_proveedor: nuevoUrlProveedor
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
                window.sweetcostIngredientes[ingIndex].urlProveedor = nuevoUrlProveedor;
                
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

    // Registrar alias para guardarPrecioIngredienteInline
    window.guardarPrecioIngredienteInline = window.guardarEdicionIngredienteInline;

    // Borrado físico de ingrediente con confirmación nativa
    window.eliminarIngrediente = async (id) => {
        const ingrediente = window.sweetcostIngredientes.find(i => i.id === id);
        if (!ingrediente) return;

        // Verificar si el ingrediente está en uso en alguna receta cargada en memoria
        const recetasConIngrediente = (window.sweetcostRecetas || []).filter(receta => 
            receta.ingredientes.some(ing => ing.id === id)
        );

        let confirmarBorrado = false;

        if (recetasConIngrediente.length > 0) {
            const nombresRecetas = recetasConIngrediente.map(r => r.nombre).join(", ");
            confirmarBorrado = confirm(
                `El ingrediente "${ingrediente.nombre}" está en uso en las siguientes recetas: ${nombresRecetas}.\n¿Estás seguro de que deseas eliminarlo? Esto afectará los cálculos de costos y se borrará la relación en Supabase.`
            );
        } else {
            confirmarBorrado = confirm(`¿Deseas eliminar el ingrediente "${ingrediente.nombre}"?`);
        }

        if (confirmarBorrado) {
            await procederAEliminarIngrediente(id);
        }
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

    // Función global para sincronizar el precio de un ingrediente con la tienda de Valentino
    // Notificación brutalista emergente para UI/UX
    window.mostrarNotificacionBrutalista = (titulo, mensaje) => {
        const notif = document.createElement("div");
        notif.className = "fixed bottom-5 right-5 z-50 bg-white border-4 border-black p-5 shadow-[6px_6px_0px_#000000] max-w-sm brutal-card animate-bounce transition-all duration-300";
        notif.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="text-3xl">⚠️</span>
                <div>
                    <h4 class="font-black text-base uppercase border-b-2 border-black pb-1 mb-1.5 tracking-tight">${notifEscapeHtml(titulo)}</h4>
                    <p class="text-xs font-bold text-gray-700 leading-snug">${notifEscapeHtml(mensaje)}</p>
                </div>
            </div>
            <button class="brutal-btn mt-3 py-1 bg-gray-200 text-[10px] font-black uppercase tracking-wider w-full hover:bg-gray-300 transition-colors" onclick="this.parentElement.remove()">Cerrar</button>
        `;
        document.body.appendChild(notif);
        setTimeout(() => {
            notif.classList.remove("animate-bounce");
        }, 1000);
    };

    function notifEscapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    window.sincronizarPrecioIngrediente = async (id, isBatch = false) => {
        const ingrediente = window.sweetcostIngredientes.find(i => i.id === id);
        if (!ingrediente) return;

        const urls = Array.isArray(ingrediente.urlProveedor) ? ingrediente.urlProveedor : (ingrediente.urlProveedor ? [ingrediente.urlProveedor] : []);
        if (urls.length === 0) return;

        const tieneUrlSoportada = urls.some(url => 
            url.includes('cocinaconvalentino.com.ar') || 
            url.includes('boticadelpastelero.com.ar') ||
            url.includes('diaonline.supermercadosdia.com.ar')
        );

        if (!tieneUrlSoportada) {
            if (!isBatch) {
                alert("Ninguno de los enlaces de este ingrediente está soportado para sincronización automática.");
            }
            return;
        }

        const btnSync = document.getElementById(`btn-sync-${id}`);
        let originalHtml = "";
        if (btnSync) {
            originalHtml = btnSync.innerHTML;
            btnSync.disabled = true;
            btnSync.innerHTML = `<span class="animate-pulse text-[10px] font-black">Sincronizando...</span>`;
        }

        try {
            const { data: { session } } = await window.supabase.auth.getSession();
            if (!session) throw new Error("Usuario no autenticado");

            // Invocación a la Supabase Edge Function
            const supabaseUrl = 'https://bywdlwnsziivnbhbfcpm.supabase.co';
            const response = await fetch(`${supabaseUrl}/functions/v1/sincronizar-precio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ ingrediente_id: id })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Error en la sincronización (${response.status})`);
            }

            const result = await response.json();
            const precioCompraNuevo = parseFloat(result.precio_compra);
            const precioNuevo = parseFloat(result.precio);
            const proveedorActivoNuevo = result.proveedor_activo;
            const fallbackUsado = result.fallback_usado;

            // Actualizar localmente la memoria
            ingrediente.precioCompra = precioCompraNuevo;
            ingrediente.precio = precioNuevo;
            ingrediente.proveedorActivo = proveedorActivoNuevo;

            const idx = window.sweetcostIngredientes.findIndex(i => i.id === id);
            if (idx !== -1) {
                window.sweetcostIngredientes[idx].precioCompra = precioCompraNuevo;
                window.sweetcostIngredientes[idx].precio = precioNuevo;
                window.sweetcostIngredientes[idx].proveedorActivo = proveedorActivoNuevo;
            }

            // Re-renderizar la UI localmente (solo si no es lote para evitar parpadeos intermedios)
            if (!isBatch) {
                window.renderizarTablaIngredientes();

                // Refrescar selector de ingredientes
                if (typeof window.poblarSelectIngredientes === 'function') {
                    window.poblarSelectIngredientes();
                }

                // Recalcular recetas en caliente al instante
                if (typeof window.renderizarGridRecetas === 'function') {
                    window.renderizarGridRecetas();
                }
                if (typeof window.renderizarTablaReceta === 'function') {
                    window.renderizarTablaReceta();
                }
                if (typeof window.calcularCostos === 'function') {
                    window.calcularCostos();
                }
            }

            // Notificación de éxito / fallback usado
            if (fallbackUsado) {
                let siteName = proveedorActivoNuevo || "un enlace de respaldo";
                try {
                    const parsed = new URL(proveedorActivoNuevo);
                    if (parsed.hostname.includes('diaonline.supermercadosdia.com.ar')) siteName = "Supermercados Dia";
                    else if (parsed.hostname.includes('cocinaconvalentino.com.ar')) siteName = "Cocina con Valentino";
                    else if (parsed.hostname.includes('boticadelpastelero.com.ar')) siteName = "Botica del Pastelero";
                    else siteName = parsed.hostname;
                } catch (e) {}

                if (!isBatch) {
                    window.mostrarNotificacionBrutalista(
                        "Sincronización con Respaldo",
                        `El link principal no estaba disponible. Se actualizó el precio usando el enlace de respaldo: ${siteName}`
                    );
                }
            } else {
                if (!isBatch) {
                    alert(`¡Precio de "${ingrediente.nombre}" actualizado con éxito! Nuevo precio de compra: $${precioCompraNuevo.toFixed(2)}`);
                }
            }

        } catch (err) {
            console.error("Error al sincronizar precio:", err);
            if (!isBatch) {
                alert("Error al sincronizar precio del proveedor: " + err.message);
            } else {
                throw err;
            }
        } finally {
            if (btnSync) {
                btnSync.disabled = false;
                btnSync.innerHTML = originalHtml;
            }
        }
    };

    window.sincronizarTodosLosPrecios = async () => {
        const btnTodo = document.getElementById("btn-sincronizar-todo");
        const originalHtml = btnTodo ? btnTodo.innerHTML : "";

        // Filtrar ingredientes con al menos un enlace de proveedor no vacío
        const ingredientesAptos = (window.sweetcostIngredientes || []).filter(ing => {
            const urls = Array.isArray(ing.urlProveedor) ? ing.urlProveedor : (ing.urlProveedor ? [ing.urlProveedor] : []);
            return urls.length > 0;
        });

        const total = ingredientesAptos.length;
        if (total === 0) {
            alert("No hay ningún ingrediente con enlaces de proveedor configurados para sincronizar.");
            return;
        }

        if (btnTodo) {
            btnTodo.disabled = true;
            btnTodo.innerHTML = `⏳ Sincronizando (0/${total})...`;
        }

        let actualizados = 0;
        for (let i = 0; i < total; i++) {
            const ing = ingredientesAptos[i];
            if (btnTodo) {
                btnTodo.innerHTML = `⏳ Sincronizando (${i + 1}/${total})...`;
            }

            try {
                await window.sincronizarPrecioIngrediente(ing.id, true);
                actualizados++;
            } catch (err) {
                console.error(`Error al sincronizar ${ing.nombre} en lote:`, err);
            }
        }

        // Restablecer botón
        if (btnTodo) {
            btnTodo.disabled = false;
            btnTodo.innerHTML = originalHtml;
        }

        // Forzar renderizado y recalcular al final
        window.renderizarTablaIngredientes();

        if (typeof window.poblarSelectIngredientes === 'function') {
            window.poblarSelectIngredientes();
        }
        if (typeof window.calcularCostos === 'function') {
            window.calcularCostos();
        }
        if (typeof window.renderizarGridRecetas === 'function') {
            window.renderizarGridRecetas();
        }
        if (typeof window.renderizarTablaReceta === 'function') {
            window.renderizarTablaReceta();
        }

        // Mostrar notificación emergente brutalista final
        window.mostrarNotificacionBrutalista(
            "Sincronización Masiva",
            `Sincronización completada con éxito. Se procesaron ${total} ingredientes, y se actualizaron ${actualizados} con éxito.`
        );
    };

    // Helper para inicializar contenedores dinámicos de URLs en formularios
    window.crearManejadorUrls = (containerId, buttonId, inputClass) => {
        const container = document.getElementById(containerId);
        const button = document.getElementById(buttonId);
        if (!container || !button) return null;

        const reset = (valoresPredefinidos = []) => {
            container.innerHTML = "";
            const valores = valoresPredefinidos.length > 0 ? valoresPredefinidos : [""];
            valores.forEach((val) => {
                const row = document.createElement("div");
                row.className = "flex gap-2 url-row w-full";
                row.innerHTML = `
                    <input type="url" class="${inputClass} brutal-input brutal-border brutal-shadow flex-1 text-sm py-1.5 px-3" value="${val}" placeholder="https://...">
                    <button type="button" class="btn-remove-url brutal-btn bg-gray-200 px-3 py-1.5 font-bold text-sm hidden hover:bg-gray-300">X</button>
                `;
                row.querySelector(".btn-remove-url").addEventListener("click", () => {
                    row.remove();
                    actualizarVisibilidadBotonesEliminar();
                });
                container.appendChild(row);
            });
            actualizarVisibilidadBotonesEliminar();
        };

        const actualizarVisibilidadBotonesEliminar = () => {
            const rows = container.querySelectorAll(".url-row");
            rows.forEach(row => {
                const btnRemove = row.querySelector(".btn-remove-url");
                if (rows.length > 1) {
                    btnRemove.classList.remove("hidden");
                } else {
                    btnRemove.classList.add("hidden");
                }
            });
        };

        button.addEventListener("click", () => {
            const row = document.createElement("div");
            row.className = "flex gap-2 url-row w-full";
            row.innerHTML = `
                <input type="url" class="${inputClass} brutal-input brutal-border brutal-shadow flex-1 text-sm py-1.5 px-3" placeholder="https://...">
                <button type="button" class="btn-remove-url brutal-btn bg-gray-200 px-3 py-1.5 font-bold text-sm hover:bg-gray-300">X</button>
            `;
            row.querySelector(".btn-remove-url").addEventListener("click", () => {
                row.remove();
                actualizarVisibilidadBotonesEliminar();
            });
            container.appendChild(row);
            actualizarVisibilidadBotonesEliminar();
        });

        reset();
        return { reset };
    };

    // Inicializar y guardar referencias globales
    window.manejadorUrlsRapido = window.crearManejadorUrls("container-urls-rapido", "btn-add-url-rapido", "input-url-proveedor-item");
    window.manejadorUrlsModal = window.crearManejadorUrls("container-urls-modal", "btn-add-url-modal", "input-url-proveedor-item-modal");

    // Gatillar la carga inicial si la sesión de Supabase ya está lista
    if (window.supabase) {
        window.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                window.cargarIngredientesDesdeSupabase();
            }
        });
    }
});
