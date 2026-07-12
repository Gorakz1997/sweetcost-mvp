// js/recetas.js
// Gestión de Recetas con Persistencia Relacional en Supabase

document.addEventListener("DOMContentLoaded", () => {
    // Referencias del DOM para vistas de Recetas
    const vistaLista = document.getElementById("vista-lista-recetas");
    const vistaForm = document.getElementById("vista-form-receta");
    const btnNuevaReceta = document.getElementById("btn-nueva-receta");
    const btnVolver = document.getElementById("btn-volver-recetas");

    // Referencias del DOM para Formulario Receta
    const inputNombreReceta = document.getElementById("receta-nombre");
    const inputImagenFile = document.getElementById("receta-imagen-file");
    const btnSelectImagen = document.getElementById("btn-select-imagen");
    const previewPlaceholder = document.getElementById("preview-placeholder");
    const previewImagenImg = document.getElementById("preview-imagen-img");
    const btnClearImagen = document.getElementById("btn-clear-imagen");
    const inputMargen = document.getElementById("receta-margen");
    const selectIngrediente = document.getElementById("receta-select-ingrediente");
    const btnOpenModal = document.getElementById("btn-open-modal-ingrediente");
    const inputCantidad = document.getElementById("receta-cantidad-ingrediente");
    const btnAddIngredienteReceta = document.getElementById("btn-add-ingrediente-receta");
    const tablaRecetaBody = document.getElementById("receta-tabla-body");
    const spanCostoTotal = document.getElementById("receta-costo-total");
    const spanPrecioSugerido = document.getElementById("receta-precio-sugerido");
    const inputUnidadReceta = document.getElementById("receta-unidad-ingrediente");

    // Nuevas referencias para Descripción, Pasos y Vista Detalle
    const inputDescripcion = document.getElementById("receta-descripcion");
    const inputPasos = document.getElementById("receta-pasos");
    const vistaDetalle = document.getElementById("vista-detalle-receta");
    const btnVolverDetalle = document.getElementById("btn-volver-detalle-recetas");
    const detalleImagen = document.getElementById("detalle-receta-imagen");
    const detalleNombre = document.getElementById("detalle-receta-nombre");
    const detalleDescripcion = document.getElementById("detalle-receta-descripcion");
    const detalleIngredientes = document.getElementById("detalle-receta-ingredientes");
    const detallePasos = document.getElementById("detalle-receta-pasos");

    // Variable temporal para almacenar la imagen en Base64 (UI local)
    window.recetaImagenBase64 = null;

    // Función de conversión de unidades
    const convertirUnidad = (cantidad, de, a) => {
        if (de === a) return cantidad;
        const deNorm = de.toLowerCase();
        const aNorm = a.toLowerCase();

        // Masa: kg <-> gramos
        if (deNorm === 'kg' && aNorm === 'gramos') return cantidad * 1000;
        if (deNorm === 'gramos' && aNorm === 'kg') return cantidad / 1000;

        // Volumen: litro <-> ml
        if (deNorm === 'litro' && aNorm === 'ml') return cantidad * 1000;
        if (deNorm === 'ml' && aNorm === 'litro') return cantidad / 1000;

        return cantidad; // No convertible, retornar original
    };

    // Referencias Modal Ingrediente
    const modal = document.getElementById("modal-ingrediente");
    const btnCloseModal = document.getElementById("btn-close-modal");
    const formModal = document.getElementById("form-modal-ingrediente");
    const modalInputNombre = document.getElementById("modal-input-nombre");
    const modalInputPrecio = document.getElementById("modal-input-precio");
    const modalSelectUnidad = document.getElementById("modal-select-unidad");
    const modalInputCantidadCompra = document.getElementById("modal-input-cantidad-compra");
    const btnGuardarReceta = document.getElementById("btn-guardar-receta");
    const gridRecetas = document.getElementById("grid-recetas");

    // Memoria temporal para los ingredientes de la receta que se está creando
    window.ingredientesRecetaActual = [];
    window.recetaEnEdicionId = null;

    // --- Navegación del Formulario de Receta ---
    btnNuevaReceta.addEventListener("click", () => {
        window.recetaEnEdicionId = null; // Es una nueva receta
        vistaLista.classList.add("hidden");
        vistaForm.classList.remove("hidden");
        window.limpiarFormularioReceta();
        window.poblarSelectIngredientes(); // Refrescar lista al entrar
    });

    btnVolver.addEventListener("click", () => {
        vistaForm.classList.add("hidden");
        vistaLista.classList.remove("hidden");
    });

    // --- Manejo de Imagen de Receta en el Formulario ---
    btnSelectImagen.addEventListener("click", (e) => {
        if (e.target.closest("#btn-clear-imagen")) return;
        inputImagenFile.click();
    });

    inputImagenFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                window.recetaImagenBase64 = event.target.result;
                previewImagenImg.src = event.target.result;
                previewImagenImg.classList.remove("hidden");
                previewPlaceholder.classList.add("hidden");
                btnClearImagen.classList.remove("hidden");
            };
            reader.readAsDataURL(file);
        }
    });

    btnClearImagen.addEventListener("click", (e) => {
        e.stopPropagation();
        inputImagenFile.value = "";
        window.recetaImagenBase64 = null;
        previewImagenImg.src = "";
        previewImagenImg.classList.add("hidden");
        previewPlaceholder.classList.remove("hidden");
        btnClearImagen.classList.add("hidden");
    });

    // --- Funcionalidad de la Ventana Modal (Ingrediente rápido) ---
    btnOpenModal.addEventListener("click", (e) => {
        e.preventDefault();
        modal.classList.remove("hidden");
    });

    btnCloseModal.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    formModal.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            const nombre = window.capitalizarTexto(modalInputNombre.value.trim());
            const precioTotal = parseFloat(modalInputPrecio.value);
            const unidad = modalSelectUnidad.value;
            const cantidadCompra = parseFloat(modalInputCantidadCompra.value);

            if (nombre && !isNaN(precioTotal) && !isNaN(cantidadCompra) && cantidadCompra > 0) {
                const { data: { user }, error: userError } = await window.supabase.auth.getUser();
                if (userError || !user) throw new Error("Usuario no autenticado.");

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

                // Actualizar tablas y selectores
                if (typeof window.renderizarTablaIngredientes === 'function') {
                    window.renderizarTablaIngredientes();
                }
                window.poblarSelectIngredientes();

                // Seleccionar automáticamente en el form de la receta
                selectIngrediente.value = nuevoIngrediente.id;

                // Limpiar y cerrar modal
                formModal.reset();
                modal.classList.add("hidden");
            }
        } catch (err) {
            console.error("Error al guardar desde el modal:", err);
            alert("Error al guardar ingrediente: " + (err.message || err));
        }
    });

    // --- Lógica del Selector y Adición de Ingredientes a la Receta ---
    window.poblarSelectIngredientes = () => {
        selectIngrediente.innerHTML = '<option value="">-- Selecciona un Ingrediente --</option>';
        (window.sweetcostIngredientes || []).forEach(ing => {
            const option = document.createElement("option");
            option.value = ing.id;
            option.textContent = `${ing.nombre} ($${ing.precio.toFixed(2)}/${ing.unidad})`;
            selectIngrediente.appendChild(option);
        });
    };

    btnAddIngredienteReceta.addEventListener("click", (e) => {
        e.preventDefault();
        const idIngrediente = selectIngrediente.value;
        const cantidad = parseFloat(inputCantidad.value);
        const unidadReceta = inputUnidadReceta.value;

        if (idIngrediente && !isNaN(cantidad) && cantidad > 0) {
            const ingredienteBase = window.sweetcostIngredientes.find(i => i.id === idIngrediente);

            if (!ingredienteBase) {
                alert("Error al encontrar el ingrediente.");
                return;
            }

            // Si el ingrediente ya fue agregado con la misma unidad, sumamos la cantidad
            const indexExistente = window.ingredientesRecetaActual.findIndex(i => i.id === idIngrediente && i.unidadReceta === unidadReceta);
            if (indexExistente !== -1) {
                window.ingredientesRecetaActual[indexExistente].cantidadReceta += cantidad;
            } else {
                window.ingredientesRecetaActual.push({
                    id: ingredienteBase.id,
                    nombre: ingredienteBase.nombre,
                    precio: ingredienteBase.precio,
                    unidad: ingredienteBase.unidad, // unidad base
                    cantidadReceta: cantidad,       // cantidad en la receta
                    unidadReceta: unidadReceta      // unidad seleccionada en la receta
                });
            }

            // Limpiar input y selector, y re-calcular
            inputCantidad.value = "";
            selectIngrediente.value = "";
            window.renderizarTablaReceta();
            window.calcularCostos();
        } else {
            alert("Selecciona un ingrediente y establece una cantidad válida mayor a 0.");
        }
    });

    window.renderizarTablaReceta = () => {
        const tBody = document.getElementById("receta-tabla-body");
        if (!tBody) return;
        tBody.innerHTML = "";

        if (window.ingredientesRecetaActual.length === 0) {
            tBody.innerHTML = `
                <tr>
                    <td colspan="4" class="p-4 text-center font-bold text-gray-500">Agrega ingredientes a tu receta.</td>
                </tr>
            `;
            return;
        }

        window.ingredientesRecetaActual.forEach((ing, index) => {
            const ingredienteGlobal = window.sweetcostIngredientes.find(i => i.id === ing.id);
            const precioActual = ingredienteGlobal ? ingredienteGlobal.precio : ing.precio;
            const unidadBase = ingredienteGlobal ? ingredienteGlobal.unidad : ing.unidad;

            // Convertir la cantidad al formato de la unidad base para calcular el subtotal correcto
            const cantidadBase = convertirUnidad(ing.cantidadReceta, ing.unidadReceta, unidadBase);
            const subtotal = precioActual * cantidadBase;

            const tr = document.createElement("tr");
            tr.className = "border-b-4 border-[var(--border-color)] bg-white hover:bg-[var(--surface-container-low)] transition-colors";
            tr.innerHTML = `
                <td class="p-3 md:p-4 border-r-4 border-[var(--border-color)] font-bold">${ing.nombre}</td>
                <td class="p-3 md:p-4 border-r-4 border-[var(--border-color)]">
                    <div class="flex items-center gap-1">
                        <input type="number" inputmode="decimal" class="brutal-input w-20 p-1 text-sm text-center inline-block" step="0.01" value="${ing.cantidadReceta}" onchange="actualizarCantidadIngrediente(${index}, this.value)">
                        <span class="font-bold">${ing.unidadReceta}</span>
                    </div>
                </td>
                <td class="p-3 md:p-4 border-r-4 border-[var(--border-color)] font-bold text-lg">$${subtotal.toFixed(2)}</td>
                <td class="p-3 md:p-4 text-center">
                    <button class="brutal-btn w-11 h-11 flex items-center justify-center text-sm font-bold bg-[var(--error)] text-white mx-auto active:translate-y-0.5 transition-transform" onclick="quitarIngredienteReceta(${index})">X</button>
                </td>
            `;
            tBody.appendChild(tr);
        });
    };

    window.actualizarCantidadIngrediente = (index, nuevaCantidad) => {
        const cant = parseFloat(nuevaCantidad);
        if (!isNaN(cant) && cant > 0) {
            window.ingredientesRecetaActual[index].cantidadReceta = cant;
            window.renderizarTablaReceta();
            window.calcularCostos();
        } else {
            window.renderizarTablaReceta();
        }
    };

    window.quitarIngredienteReceta = (index) => {
        window.ingredientesRecetaActual.splice(index, 1);
        window.renderizarTablaReceta();
        window.calcularCostos();
    };

    // --- Cálculos Matemáticos ---
    window.calcularCostos = () => {
        const costoTotal = window.ingredientesRecetaActual.reduce((total, ing) => {
            const ingredienteGlobal = window.sweetcostIngredientes.find(i => i.id === ing.id);
            const precio = ingredienteGlobal ? ingredienteGlobal.precio : ing.precio;
            const unidadBase = ingredienteGlobal ? ingredienteGlobal.unidad : ing.unidad;

            const cantidadBase = convertirUnidad(ing.cantidadReceta, ing.unidadReceta, unidadBase);
            return total + (precio * cantidadBase);
        }, 0);
        spanCostoTotal.textContent = costoTotal.toFixed(2);

        const margen = parseFloat(inputMargen.value) || 0;
        const precioSugerido = costoTotal * (1 + (margen / 100));
        spanPrecioSugerido.textContent = precioSugerido.toFixed(2);

        return { costoTotal, precioSugerido };
    };

    // Recalcular instantáneamente al cambiar el margen
    inputMargen.addEventListener("change", window.calcularCostos);

    window.limpiarFormularioReceta = () => {
        inputNombreReceta.value = "";
        inputImagenFile.value = "";
        window.recetaImagenBase64 = null;
        previewImagenImg.src = "";
        previewImagenImg.classList.add("hidden");
        previewPlaceholder.classList.remove("hidden");
        btnClearImagen.classList.add("hidden");
        inputMargen.value = "100";
        inputCantidad.value = "";
        selectIngrediente.value = "";
        inputDescripcion.value = "";
        inputPasos.value = "";
        window.ingredientesRecetaActual = [];
        window.renderizarTablaReceta();
        window.calcularCostos();
    };
    // --- Sincronización con Supabase (SELECT Join) ---
    window.cargarRecetasDesdeSupabase = async () => {
        try {
            if (!window.supabase) return;

            // Mapeo uniendo relaciones en Supabase de forma directa
            const { data, error } = await window.supabase
                .from('recetas')
                .select('*, receta_ingredientes(*, ingredientes(*))')
                .order('created_at', { ascending: false });

            if (error) throw error;

            window.sweetcostRecetas = (data || []).map(item => {
                const mappedIngredientes = (item.receta_ingredientes || []).map(ri => {
                    const ing = ri.ingredientes;
                    if (!ing) return null;
                    const precioUnitario = parseFloat(ing.precio_paquete) / parseFloat(ing.cantidad_paquete);
                    return {
                        id: ing.id,
                        nombre: ing.nombre,
                        precio: precioUnitario,
                        unidad: ing.unidad_medida, // unidad base
                        cantidadReceta: parseFloat(ri.cantidad), // cantidad convertida en base
                        unidadReceta: ing.unidad_medida // desplegado en unidad base
                    };
                }).filter(Boolean);

                return {
                    id: item.id,
                    nombre: item.nombre,
                    imagen: 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=500&auto=format&fit=crop', // default fallback image
                    margen: parseFloat(item.margen_ganancia),
                    ingredientes: mappedIngredientes,
                    descripcion: "",
                    pasos: item.pasos || "",
                    visibilidad: item.visibilidad
                };
            });

            window.renderizarGridRecetas();
        } catch (err) {
            console.error("Error al cargar recetas desde Supabase:", err);
        }
    };

    // --- Guardar Receta (Transacción lógica de 2 pasos) ---
    btnGuardarReceta.addEventListener("click", async () => {
        const nombre = window.capitalizarTexto(inputNombreReceta.value.trim());
        const margen = parseFloat(inputMargen.value) || 0;

        if (!nombre) {
            alert("El nombre de la receta es obligatorio.");
            return;
        }

        const pasos = inputPasos.value.trim();

        btnGuardarReceta.disabled = true;
        btnGuardarReceta.textContent = "Guardando...";

        try {
            const { data: { user }, error: userError } = await window.supabase.auth.getUser();
            if (userError || !user) throw new Error("Usuario no autenticado en Supabase.");

            let recetaId = window.recetaEnEdicionId;

            // PASO A: Insertar o actualizar la cabecera en la tabla 'recetas'
            if (recetaId) {
                const { error: updateError } = await window.supabase
                    .from('recetas')
                    .update({
                        nombre: nombre,
                        pasos: pasos,
                        margen_ganancia: margen,
                        visibilidad: 'privada' // por defecto
                    })
                    .eq('id', recetaId);

                if (updateError) throw updateError;

                // Limpiar relaciones anteriores de ingredientes en 'receta_ingredientes'
                const { error: deleteRelationsError } = await window.supabase
                    .from('receta_ingredientes')
                    .delete()
                    .eq('receta_id', recetaId);

                if (deleteRelationsError) throw deleteRelationsError;
            } else {
                const { data: recetaCreada, error: insertError } = await window.supabase
                    .from('recetas')
                    .insert([{
                        user_id: user.id,
                        nombre: nombre,
                        pasos: pasos,
                        margen_ganancia: margen,
                        visibilidad: 'privada' // por defecto
                    }])
                    .select()
                    .single();

                if (insertError) throw insertError;
                recetaId = recetaCreada.id;
            }

            // PASO B: Insertar relaciones de ingredientes en la tabla intermedia 'receta_ingredientes'
            if (window.ingredientesRecetaActual.length > 0) {
                const rowsToInsert = window.ingredientesRecetaActual.map(ing => {
                    const ingredienteGlobal = window.sweetcostIngredientes.find(i => i.id === ing.id);
                    const unidadBase = ingredienteGlobal ? ingredienteGlobal.unidad : ing.unidad;
                    
                    // LÓGICA DE ALMACENAMIENTO: Convertir la cantidad a la unidad base antes de guardar en DB
                    const cantidadBase = convertirUnidad(ing.cantidadReceta, ing.unidadReceta, unidadBase);

                    return {
                        receta_id: recetaId,
                        ingrediente_id: ing.id,
                        cantidad: cantidadBase
                    };
                });

                const { error: insertRelationsError } = await window.supabase
                    .from('receta_ingredientes')
                    .insert(rowsToInsert);

                if (insertRelationsError) throw insertRelationsError;
            }

            // Recargar datos actualizados desde la BD y volver a renderizar
            await window.cargarRecetasDesdeSupabase();

            vistaForm.classList.add("hidden");
            vistaLista.classList.remove("hidden");
        } catch (err) {
            console.error("Error al procesar la receta:", err);
            alert("Error al guardar receta en Supabase: " + (err.message || err));
        } finally {
            btnGuardarReceta.disabled = false;
            btnGuardarReceta.textContent = "Guardar Receta";
        }
    });

    window.renderizarGridRecetas = (filtro = "") => {
        gridRecetas.innerHTML = "";

        if (filtro || !vistaDetalle.classList.contains("hidden")) {
            vistaDetalle.classList.add("hidden");
            vistaLista.classList.remove("hidden");
        }

        const pluralizarUnidad = (cantidad, unidad) => {
            const u = unidad.toLowerCase();
            if (cantidad === 1) {
                if (u === 'gramos') return 'gramo';
                if (u === 'unidades') return 'unidad';
                if (u === 'litros') return 'litro';
                return u;
            } else {
                if (u === 'gramo') return 'gramos';
                if (u === 'unidad') return 'unidades';
                if (u === 'litro') return 'litros';
                return u;
            }
        };

        let recetasAMostrar = window.sweetcostRecetas || [];
        if (filtro) {
            recetasAMostrar = recetasAMostrar.filter(receta => 
                receta.nombre.toLowerCase().includes(filtro)
            );
        }

        if (recetasAMostrar.length === 0) {
            const msj = filtro ? "No se encontraron recetas que coincidan con tu búsqueda." : "No tienes recetas creadas todavía.";
            gridRecetas.innerHTML = `<div class="col-span-full p-6 text-center font-bold text-gray-500 bg-white brutal-border">${msj}</div>`;
            return;
        }

        recetasAMostrar.forEach(receta => {
            let costoReal = 0;
            let nombresIngredientes = [];

            receta.ingredientes.forEach(ing => {
                const ingredienteGlobal = window.sweetcostIngredientes.find(i => i.id === ing.id);
                const precio = ingredienteGlobal ? ingredienteGlobal.precio : ing.precio;
                const unidadBase = ingredienteGlobal ? ingredienteGlobal.unidad : ing.unidad;

                const cantReceta = ing.cantidadReceta !== undefined ? ing.cantidadReceta : ing.cantidad;
                const unReceta = ing.unidadReceta !== undefined ? ing.unidadReceta : ing.unidad;

                const cantidadBase = convertirUnidad(cantReceta, unReceta, unidadBase);
                costoReal += (precio * cantidadBase);
                const unidadFormateada = pluralizarUnidad(cantReceta, unReceta);
                nombresIngredientes.push(`${ing.nombre}: ${cantReceta} ${unidadFormateada}`);
            });

            const precioSugeridoReal = costoReal * (1 + (receta.margen / 100));

            receta.costoTotal = costoReal;
            receta.precioSugerido = precioSugeridoReal;

            const listaPreview = nombresIngredientes.length > 0
                ? `<div class="text-xs md:text-sm text-gray-600 mb-4 h-16 max-h-16 overflow-y-auto pr-1 block scrollbar-thin">${nombresIngredientes.join(', ')}</div>`
                : `<div class="text-xs md:text-sm text-gray-400 mb-4 h-16 max-h-16 italic block">Sin ingredientes.</div>`;

            const article = document.createElement("article");
            article.className = "brutal-card flex flex-col bg-white relative";
            article.innerHTML = `
                <div class="h-48 bg-gray-300 border-b-4 border-[var(--border-color)] relative">
                    <img src="${receta.imagen}" alt="${receta.nombre}" class="w-full h-full object-cover">
                    <button class="absolute top-2 right-2 w-9 h-9 flex items-center justify-center brutal-border brutal-shadow bg-[var(--error)] text-white font-black hover:-translate-y-0.5 transition-transform" onclick="eliminarReceta('${receta.id}')" title="Eliminar receta">X</button>
                </div>
                <div class="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 class="text-2xl font-black mb-1 tracking-tight">${receta.nombre}</h3>
                        ${listaPreview}
                        
                        <div class="flex justify-between text-base mb-1 font-bold border-b-2 border-dashed border-gray-400 pb-1">
                            <span>Costo Total:</span>
                            <span>$ ${costoReal.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between text-base mb-6 font-bold text-[var(--primary)] pt-1">
                            <span class="text-[var(--on-background)]">Venta Sugerida:</span>
                            <span class="text-xl">$ ${precioSugeridoReal.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button class="brutal-btn flex-1 py-2 bg-[var(--secondary-container)] text-[var(--on-secondary-container)] font-bold hover:bg-gray-200 hover:text-[var(--on-background)] transition-colors active:translate-y-0.5" onclick="verReceta('${receta.id}')">Ver</button>
                        <button class="brutal-btn flex-1 py-2 hover:bg-gray-200 hover:text-[var(--on-background)] bg-white text-[var(--on-background)] transition-colors active:translate-y-0.5" onclick="editarReceta('${receta.id}')">Editar</button>
                    </div>
                </div>
            `;
            gridRecetas.appendChild(article);
        });
    };

    window.editarReceta = (id) => {
        const receta = window.sweetcostRecetas.find(r => r.id === id);
        if (!receta) return;

        window.recetaEnEdicionId = id;
        inputNombreReceta.value = receta.nombre;
        inputDescripcion.value = receta.descripcion || "";
        inputPasos.value = receta.pasos || "";
        
        window.recetaImagenBase64 = receta.imagen;
        if (receta.imagen && receta.imagen !== 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=500&auto=format&fit=crop') {
            previewImagenImg.src = receta.imagen;
            previewImagenImg.classList.remove("hidden");
            previewPlaceholder.classList.add("hidden");
            btnClearImagen.classList.remove("hidden");
        } else {
            previewImagenImg.src = "";
            previewImagenImg.classList.add("hidden");
            previewPlaceholder.classList.remove("hidden");
            btnClearImagen.classList.add("hidden");
        }
        const roundedMargen = Math.round((receta.margen || 0) / 5) * 5;
        inputMargen.value = Math.max(0, Math.min(100, roundedMargen));

        window.ingredientesRecetaActual = JSON.parse(JSON.stringify(receta.ingredientes)).map(ing => {
            return {
                id: ing.id,
                nombre: ing.nombre,
                precio: ing.precio,
                unidad: ing.unidad, // unidad base
                cantidadReceta: ing.cantidadReceta !== undefined ? ing.cantidadReceta : ing.cantidad,
                unidadReceta: ing.unidadReceta !== undefined ? ing.unidadReceta : ing.unidad
            };
        });

        vistaForm.classList.remove("hidden");
        vistaLista.classList.add("hidden");
        window.poblarSelectIngredientes();
        window.renderizarTablaReceta();
        window.calcularCostos();
    };

    // Borrado físico de recetas
    window.eliminarReceta = (id) => {
        const receta = window.sweetcostRecetas.find(r => r.id === id);
        if (!receta) return;

        window.mostrarConfirmacion(
            "Eliminar Receta",
            `¿Deseas eliminar la siguiente receta: ${receta.nombre}?`,
            async () => {
                try {
                    const { error } = await window.supabase
                        .from('recetas')
                        .delete()
                        .eq('id', id);

                    if (error) throw error;

                    window.sweetcostRecetas = window.sweetcostRecetas.filter(r => r.id !== id);
                    window.renderizarGridRecetas();
                } catch (err) {
                    console.error("Error al eliminar receta:", err);
                    alert("Error al eliminar la receta de Supabase: " + (err.message || err));
                }
            }
        );
    };

    window.verReceta = (id) => {
        const receta = window.sweetcostRecetas.find(r => r.id === id);
        if (!receta) return;

        vistaLista.classList.add("hidden");
        vistaForm.classList.add("hidden");
        vistaDetalle.classList.remove("hidden");

        detalleNombre.textContent = receta.nombre;
        detalleDescripcion.textContent = receta.descripcion || "Sin descripción disponible.";
        detalleImagen.src = receta.imagen || 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=500&auto=format&fit=crop';
        detalleImagen.alt = receta.nombre;

        detalleIngredientes.innerHTML = "";

        if (receta.ingredientes.length === 0) {
            detalleIngredientes.innerHTML = '<li class="text-gray-500 italic font-bold">Sin ingredientes agregados.</li>';
        } else {
            receta.ingredientes.forEach(ing => {
                const cantReceta = ing.cantidadReceta !== undefined ? ing.cantidadReceta : ing.cantidad;
                const unReceta = ing.unidadReceta !== undefined ? ing.unidadReceta : ing.unidad;
                const unidadFormateada = pluralizarUnidad(cantReceta, unReceta);
                
                const li = document.createElement("li");
                li.textContent = `${ing.nombre}: ${cantReceta} ${unidadFormateada}`;
                detalleIngredientes.appendChild(li);
            });
        }

        if (receta.pasos && receta.pasos.trim()) {
            detallePasos.textContent = receta.pasos;
        } else {
            detallePasos.innerHTML = '<p class="text-gray-500 italic font-bold">Sin instrucciones de preparación.</p>';
        }
    };

    btnVolverDetalle.addEventListener("click", () => {
        vistaDetalle.classList.add("hidden");
        vistaLista.classList.remove("hidden");
    });

    // Gatillar la carga inicial si la sesión de Supabase ya está lista
    if (window.supabase) {
        window.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                window.cargarRecetasDesdeSupabase();
            }
        });
    }
});
