// js/recetas.js
// Gestión de Recetas con Persistencia Relacional en Supabase (Usando Tabla Intermedia ingredientes_receta)

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

    // Referencias para Descripción, Pasos y Vista Detalle
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

        return cantidad;
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

    // --- Control del Modal de Ingrediente ---
    btnOpenModal.addEventListener("click", () => {
        modal.classList.remove("hidden");
    });

    btnCloseModal.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    formModal.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nombre = modalInputNombre.value.trim();
        const precio = parseFloat(modalInputPrecio.value);
        const unidad = modalSelectUnidad.value;
        const cantidadCompra = parseFloat(modalInputCantidadCompra.value);

        if (nombre && !isNaN(precio) && !isNaN(cantidadCompra) && cantidadCompra > 0) {
            try {
                const { data: { user }, error: userError } = await window.supabase.auth.getUser();
                if (userError || !user) throw new Error("Usuario no autenticado en Supabase.");

                // Guardado físico en la tabla 'ingredientes' (usando columnas reales del esquema)
                const { data, error } = await window.supabase
                    .from('ingredientes')
                    .insert([{
                        user_id: user.id,
                        nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase(),
                        precio_compra: precio,
                        cantidad_compra: cantidadCompra,
                        unidad: unidad,
                        precio: precio / cantidadCompra
                    }])
                    .select();

                if (error) throw error;

                const item = data[0];
                const nuevoIng = {
                    id: item.id,
                    nombre: item.nombre,
                    cantidadCompra: parseFloat(item.cantidad_compra),
                    precioCompra: parseFloat(item.precio_compra),
                    unidad: item.unidad,
                    precio: parseFloat(item.precio)
                };

                window.sweetcostIngredientes.push(nuevoIng);
                window.renderizarTablaIngredientes();
                window.poblarSelectIngredientes();

                // Seleccionar el ingrediente creado automáticamente en el selector
                selectIngrediente.value = nuevoIng.id;
                inputUnidadReceta.value = nuevoIng.unidad;

                formModal.reset();
                modal.classList.add("hidden");
            } catch (err) {
                console.error("Error al registrar ingrediente por modal:", err);
                alert("Error al registrar ingrediente: " + (err.message || err));
            }
        }
    });

    // --- Carga de Ingredientes al Selector de la Receta ---
    window.poblarSelectIngredientes = () => {
        selectIngrediente.innerHTML = '<option value="" disabled selected>Selecciona un ingrediente</option>';
        window.sweetcostIngredientes.forEach((ing) => {
            const option = document.createElement("option");
            option.value = ing.id;
            option.textContent = ing.nombre;
            selectIngrediente.appendChild(option);
        });
    };

    selectIngrediente.addEventListener("change", (e) => {
        const id = e.target.value;
        const ing = window.sweetcostIngredientes.find(i => i.id === id);
        if (ing) {
            inputUnidadReceta.value = ing.unidad;
        }
    });

    // --- Agregar Ingrediente al Formulario de Receta ---
    btnAddIngredienteReceta.addEventListener("click", () => {
        const id = selectIngrediente.value;
        const cantidadVal = parseFloat(inputCantidad.value);
        const unidadRecetaVal = inputUnidadReceta.value;

        if (!id || isNaN(cantidadVal) || cantidadVal <= 0) {
            alert("Selecciona un ingrediente y escribe una cantidad válida.");
            return;
        }

        const ingredienteGlobal = window.sweetcostIngredientes.find(i => i.id === id);
        if (!ingredienteGlobal) return;

        // Comprobar si ya está agregado en la lista temporal de la receta actual
        const indexExistente = window.ingredientesRecetaActual.findIndex(item => item.id === id);
        if (indexExistente !== -1) {
            // Sumar la cantidad nueva
            window.ingredientesRecetaActual[indexExistente].cantidadReceta += cantidadVal;
        } else {
            // Agregar nuevo objeto de relación
            window.ingredientesRecetaActual.push({
                id: ingredienteGlobal.id,
                nombre: ingredienteGlobal.nombre,
                precio: ingredienteGlobal.precio,
                unidad: ingredienteGlobal.unidad, // unidad base
                cantidadReceta: cantidadVal, // cantidad agregada en el input
                unidadReceta: unidadRecetaVal // unidad del input
            });
        }

        // Limpiar inputs de selección
        inputCantidad.value = "";
        selectIngrediente.value = "";
        inputUnidadReceta.value = "";

        window.renderizarTablaReceta();
        window.calcularCostos();
    });

    // --- Renderizar Tabla de Ingredientes de la Receta en Edición ---
    window.renderizarTablaReceta = () => {
        tablaRecetaBody.innerHTML = "";

        if (window.ingredientesRecetaActual.length === 0) {
            tablaRecetaBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-500 font-bold italic">No has agregado ingredientes todavía</td></tr>`;
            return;
        }

        window.ingredientesRecetaActual.forEach((ing, index) => {
            const tr = document.createElement("tr");
            tr.className = "border-b-4 border-black hover:bg-gray-100 transition-colors";
            
            // Buscar precio unitario fresco en el inventario global
            const ingredienteGlobal = window.sweetcostIngredientes.find(i => i.id === ing.id);
            const precioRef = ingredienteGlobal ? ingredienteGlobal.precio : ing.precio;
            const unidadBase = ingredienteGlobal ? ingredienteGlobal.unidad : ing.unidad;
            
            // Convertir para calcular el subtotal en base a su precio unitario
            const cantidadBase = convertirUnidad(ing.cantidadReceta, ing.unidadReceta, unidadBase);
            const subtotal = precioRef * cantidadBase;

            tr.innerHTML = `
                <td class="p-3 border-r-4 border-black font-bold">${ing.nombre}</td>
                <td class="p-3 border-r-4 border-black">${ing.cantidadReceta} ${ing.unidadReceta}</td>
                <td class="p-3 border-r-4 border-black font-bold">$ ${subtotal.toFixed(2)}</td>
                <td class="p-3 text-center">
                    <button class="brutal-btn px-3 py-1 bg-[var(--error)] text-white text-xs font-bold" onclick="eliminarIngredienteDeReceta(${index})">Quitar</button>
                </td>
            `;
            tablaRecetaBody.appendChild(tr);
        });
    };

    window.eliminarIngredienteDeReceta = (index) => {
        window.ingredientesRecetaActual.splice(index, 1);
        window.renderizarTablaReceta();
        window.calcularCostos();
    };

    // --- Calcular Costos Totales en Caliente (Cliente) ---
    window.calcularCostos = () => {
        let costoTotal = 0;
        window.ingredientesRecetaActual.forEach(ing => {
            const ingredienteGlobal = window.sweetcostIngredientes.find(i => i.id === ing.id);
            const precioRef = ingredienteGlobal ? ingredienteGlobal.precio : ing.precio;
            const unidadBase = ingredienteGlobal ? ingredienteGlobal.unidad : ing.unidad;
            
            const cantidadBase = convertirUnidad(ing.cantidadReceta, ing.unidadReceta, unidadBase);
            costoTotal += (precioRef * cantidadBase);
        });

        const margenVal = parseFloat(inputMargen.value) || 0;
        const precioSugerido = costoTotal * (1 + (margenVal / 100));

        spanCostoTotal.textContent = costoTotal.toFixed(2);
        spanPrecioSugerido.textContent = precioSugerido.toFixed(2);
    };

    inputMargen.addEventListener("input", window.calcularCostos);

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

    // --- Sincronización con Supabase (SELECT Join de ingredientes_receta) ---
    window.cargarRecetasDesdeSupabase = async () => {
        try {
            if (!window.supabase) return;

            // Mapeo uniendo relaciones en Supabase de forma directa
            const { data, error } = await window.supabase
                .from('recetas')
                .select('*, ingredientes_receta(*, ingredientes(*))')
                .order('created_at', { ascending: false });

            if (error) throw error;

            window.sweetcostRecetas = (data || []).map(item => {
                const mappedIngredientes = (item.ingredientes_receta || []).map(ri => {
                    const ing = ri.ingredientes;
                    if (!ing) return null;
                    const precioUnitario = parseFloat(ing.precio);
                    return {
                        id: ing.id,
                        nombre: ing.nombre,
                        precio: precioUnitario,
                        unidad: ing.unidad, // unidad base
                        cantidadReceta: parseFloat(ri.cantidad_receta), // cantidad convertida en base
                        unidadReceta: ing.unidad // desplegado en unidad base
                    };
                }).filter(Boolean);

                return {
                    id: item.id,
                    nombre: item.nombre,
                    imagen: item.imagen || 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=500&auto=format&fit=crop',
                    margen: parseFloat(item.margen || 0),
                    ingredientes: mappedIngredientes,
                    descripcion: item.descripcion || "",
                    pasos: item.pasos || "",
                    costoTotal: parseFloat(item.costo_total || 0),
                    precioSugerido: parseFloat(item.precio_sugerido || 0)
                };
            });

            window.renderizarGridRecetas();
        } catch (err) {
            console.error("Error al cargar recetas desde Supabase:", err);
        }
    };

    // --- Guardar Receta (Transacción lógica de 2 pasos en ingredientes_receta) ---
    btnGuardarReceta.addEventListener("click", async () => {
        const nombreFormateado = window.capitalizarTexto(inputNombreReceta.value.trim());
        const margenValor = parseFloat(inputMargen.value) || 0;

        if (!nombreFormateado) {
            alert("El nombre de la receta es obligatorio.");
            return;
        }

        const pasosProcedimiento = inputPasos.value.trim();
        const descripcionTexto = inputDescripcion.value.trim();
        const categoriaSeleccionada = "Pastelería"; // Categoría por defecto para satisfacer restricción NOT NULL
        const imagenPorDefecto = 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=500&auto=format&fit=crop';
        const imagenFinal = window.recetaImagenBase64 || imagenPorDefecto;

        // Calcular costo_total y precio_sugerido antes de enviar
        let costoTotal = 0;
        window.ingredientesRecetaActual.forEach(ing => {
            const ingredienteGlobal = window.sweetcostIngredientes.find(i => i.id === ing.id);
            const precioRef = ingredienteGlobal ? ingredienteGlobal.precio : ing.precio;
            const de = ing.cantidadReceta !== undefined ? ing.cantidadReceta : ing.cantidad;
            const deUnidad = ing.unidadReceta !== undefined ? ing.unidadReceta : ing.unidad;
            const aUnidad = ingredienteGlobal ? ingredienteGlobal.unidad : ing.unidad;
            const cantidadBase = convertirUnidad(de, deUnidad, aUnidad);
            costoTotal += (precioRef * cantidadBase);
        });
        const precioSugerido = costoTotal * (1 + (margenValor / 100));

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
                        nombre: nombreFormateado,
                        categoria: categoriaSeleccionada,
                        imagen: imagenFinal,
                        descripcion: descripcionTexto,
                        pasos: pasosProcedimiento,
                        margen: margenValor,       // Corregido
                        costo_total: costoTotal,
                        precio_sugerido: precioSugerido
                    })
                    .eq('id', recetaId);

                if (updateError) throw updateError;

                // Limpiar relaciones anteriores de ingredientes en 'ingredientes_receta'
                const { error: deleteRelationsError } = await window.supabase
                    .from('ingredientes_receta')
                    .delete()
                    .eq('receta_id', recetaId);

                if (deleteRelationsError) throw deleteRelationsError;
            } else {
                const { data: recetaCreada, error: insertError } = await window.supabase
                    .from('recetas')
                    .insert([{
                        user_id: user.id,
                        nombre: nombreFormateado,
                        categoria: categoriaSeleccionada,
                        imagen: imagenFinal,
                        descripcion: descripcionTexto,
                        pasos: pasosProcedimiento,
                        margen: margenValor,       // Corregido
                        costo_total: costoTotal,
                        precio_sugerido: precioSugerido
                    }])
                    .select()
                    .single();

                if (insertError) throw insertError;
                recetaId = recetaCreada.id;
            }

            // PASO B: Insertar relaciones de ingredientes en la tabla intermedia 'ingredientes_receta'
            if (window.ingredientesRecetaActual.length > 0) {
                const rowsToInsert = window.ingredientesRecetaActual.map(ing => {
                    const ingredienteGlobal = window.sweetcostIngredientes.find(i => i.id === ing.id);
                    const unidadBase = ingredienteGlobal ? ingredienteGlobal.unidad : ing.unidad;
                    
                    // LÓGICA DE ALMACENAMIENTO: Convertir la cantidad a la unidad base antes de guardar en DB
                    const cantidadBase = convertirUnidad(ing.cantidadReceta, ing.unidadReceta, unidadBase);

                    return {
                        receta_id: recetaId,
                        ingrediente_id: ing.id,
                        cantidad_receta: cantidadBase
                    };
                });

                const { error: insertRelationsError } = await window.supabase
                    .from('ingredientes_receta')
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

    // --- Renderizar Grid de Recetas (Tablero Neo-Brutalista) ---
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
                nombresIngredientes.push(`${cantReceta} ${pluralizarUnidad(cantReceta, unReceta)} de ${ing.nombre}`);
            });

            const precioSugeridoReal = costoReal * (1 + (receta.margen / 100));

            const listaPreview = nombresIngredientes.length > 0
                ? `<div class="text-sm text-gray-600 mb-4 h-12 overflow-hidden truncate whitespace-normal">${nombresIngredientes.join(', ')}</div>`
                : `<div class="text-sm text-gray-400 mb-4 h-12 italic">Sin ingredientes agregados.</div>`;

            const article = document.createElement("article");
            article.className = "brutal-card flex flex-col bg-white";
            article.innerHTML = `
                <div class="h-48 bg-gray-300 border-b-4 border-black relative">
                    <img src="${receta.imagen}" alt="${receta.nombre}" class="w-full h-full object-cover">
                </div>
                <div class="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 class="text-2xl font-black mb-1 tracking-tight cursor-pointer hover:underline" onclick="verRecetaDetalle('${receta.id}')">${receta.nombre}</h3>
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
                    <div class="flex gap-2">
                        <button class="brutal-btn flex-1 py-2 hover:bg-gray-200 bg-white text-[var(--on-background)] transition-colors" onclick="editarReceta('${receta.id}')">Editar</button>
                        <button class="brutal-btn px-4 py-2 bg-[var(--error)] text-white hover:bg-red-600" onclick="eliminarReceta('${receta.id}')">Borrar</button>
                    </div>
                </div>
            `;
            gridRecetas.appendChild(article);
        });
    };

    // --- Detalle Ampliado de una Receta ---
    window.verRecetaDetalle = (id) => {
        const receta = window.sweetcostRecetas.find(r => r.id === id);
        if (!receta) return;

        let costoReal = 0;
        detalleIngredientes.innerHTML = "";

        receta.ingredientes.forEach(ing => {
            const ingredienteGlobal = window.sweetcostIngredientes.find(i => i.id === ing.id);
            const precio = ingredienteGlobal ? ingredienteGlobal.precio : ing.precio;
            const de = ing.cantidadReceta !== undefined ? ing.cantidadReceta : ing.cantidad;
            const deUnidad = ing.unidadReceta !== undefined ? ing.unidadReceta : ing.unidad;
            const aUnidad = ingredienteGlobal ? ingredienteGlobal.unidad : ing.unidad;

            const cantidadBase = convertirUnidad(de, deUnidad, aUnidad);
            const subtotal = precio * cantidadBase;
            costoReal += subtotal;

            const li = document.createElement("li");
            li.className = "flex justify-between font-bold border-b border-gray-200 py-1.5";
            li.innerHTML = `
                <span>${ing.nombre} (${de} ${deUnidad})</span>
                <span>$ ${subtotal.toFixed(2)}</span>
            `;
            detalleIngredientes.appendChild(li);
        });

        const ventaSugerida = costoReal * (1 + (receta.margen / 100));

        detalleImagen.src = receta.imagen;
        detalleNombre.textContent = receta.nombre;
        
        detalleDescripcion.innerHTML = `
            <div class="flex justify-between border-t-2 border-black pt-2 mt-2">
                <span>Costo Total:</span>
                <span>$ ${costoReal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between font-bold text-xl text-[var(--primary)] mt-1">
                <span>Margen aplicado:</span>
                <span>${receta.margen}%</span>
            </div>
            <div class="flex justify-between font-black text-2xl text-[var(--primary)] border-b-2 border-black pb-2 mt-1">
                <span>Precio Venta Sugerido:</span>
                <span>$ ${ventaSugerida.toFixed(2)}</span>
            </div>
        `;

        detallePasos.textContent = receta.pasos || "No se cargaron instrucciones de elaboración para esta receta.";

        vistaLista.classList.add("hidden");
        vistaDetalle.classList.remove("hidden");
    };

    btnVolverDetalle.addEventListener("click", () => {
        vistaDetalle.classList.add("hidden");
        vistaLista.classList.remove("hidden");
    });

    // --- Editar Receta ---
    window.editarReceta = (id) => {
        const receta = window.sweetcostRecetas.find(r => r.id === id);
        if (!receta) return;

        window.recetaEnEdicionId = id;
        inputNombreReceta.value = receta.nombre;
        
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
        
        inputMargen.value = receta.margen;
        inputPasos.value = receta.pasos || "";

        // Copia profunda de ingredientes para no mutar el estado antes de guardar
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

        vistaLista.classList.add("hidden");
        vistaForm.classList.remove("hidden");
        window.poblarSelectIngredientes();
        window.renderizarTablaReceta();
        window.calcularCostos();
    };

    // --- Eliminar Receta ---
    window.eliminarReceta = async (id) => {
        const receta = window.sweetcostRecetas.find(r => r.id === id);
        if (!receta) return;

        if (confirm(`¿Estás seguro de que deseas eliminar la receta "${receta.nombre}"? Esto eliminará también sus ingredientes vinculados en la tabla intermedia.`)) {
            try {
                // El delete cascade en Supabase limpiará automáticamente ingredientes_receta
                const { error } = await window.supabase
                    .from('recetas')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                window.sweetcostRecetas = window.sweetcostRecetas.filter(r => r.id !== id);
                window.renderizarGridRecetas();
            } catch (err) {
                console.error("Error al eliminar la receta:", err);
                alert("Error al eliminar la receta: " + (err.message || err));
            }
        }
    };

    // ==========================================
    // SEEDER AUTOMÁTICO DE DATOS (MOCK RECIPES)
    // ==========================================
    window.ejecutarSeederSiEsNecesario = async (userId) => {
        try {
            // Validar si el usuario ya tiene recetas creadas
            const { data: recetasExistentes, error: errorBusqueda } = await window.supabase
                .from('recetas')
                .select('id')
                .eq('user_id', userId)
                .limit(1);

            if (errorBusqueda) throw errorBusqueda;

            // Si ya hay recetas creadas por este usuario, abortamos el seeder
            if (recetasExistentes && recetasExistentes.length > 0) {
                return false;
            }

            console.log("Detectadas 0 recetas para el usuario. Sembrando recetas iniciales de ejemplo...");

            const defaultSeedData = [
                {
                    nombre: "Bizcochuelo de Vainilla",
                    pasos: "1. Batir huevos con azúcar hasta punto letra.\n2. Incorporar la harina tamizada de forma envolvente.\n3. Hornear a 180°C durante 40 minutos.",
                    margen_ganancia: 100,
                    visibilidad: "privada",
                    ingredientes: [
                        { nombre: "Harina 0000", cantidad_paquete: 1, precio_paquete: 1200, unidad_medida: "kg", cantidad_utilizada: 0.5 },
                        { nombre: "Azúcar", cantidad_paquete: 1, precio_paquete: 1500, unidad_medida: "kg", cantidad_utilizada: 0.3 },
                        { nombre: "Huevo", cantidad_paquete: 12, precio_paquete: 2400, unidad_medida: "unidad", cantidad_utilizada: 4 }
                    ]
                },
                {
                    nombre: "Crema Chantilly",
                    pasos: "1. Batir la crema de leche fría a velocidad media.\n2. Agregar azúcar impalpable tamizada poco a poco.\n3. Añadir esencia de vainilla y batir a punto firme.",
                    margen_ganancia: 80,
                    visibilidad: "privada",
                    ingredientes: [
                        { nombre: "Crema de Leche", cantidad_paquete: 0.5, precio_paquete: 2800, unidad_medida: "litro", cantidad_utilizada: 0.5 },
                        { nombre: "Azúcar Impalpable", cantidad_paquete: 1, precio_paquete: 2000, unidad_medida: "kg", cantidad_utilizada: 0.1 }
                    ]
                }
            ];

            for (const recetaInfo of defaultSeedData) {
                // A. Insertar cabecera de la receta
                const { data: recetaCreada, error: errorReceta } = await window.supabase
                    .from('recetas')
                    .insert([{
                        user_id: userId,
                        nombre: recetaInfo.nombre,
                        pasos: recetaInfo.pasos,
                        margen: recetaInfo.margen_ganancia, // Corregido
                        categoria: "Pastelería" // Categoría por defecto
                    }])
                    .select()
                    .single();

                if (errorReceta) throw errorReceta;

                const recetaId = recetaCreada.id;
                const recetaIngredientesRows = [];

                for (const ingInfo of recetaInfo.ingredientes) {
                    let ingredienteId;

                    // Comprobar si el ingrediente ya existe para el usuario
                    const { data: ingredienteExistente, error: errorBuscarIng } = await window.supabase
                        .from('ingredientes')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('nombre', ingInfo.nombre)
                        .limit(1);

                    if (errorBuscarIng) throw errorBuscarIng;

                    if (ingredienteExistente && ingredienteExistente.length > 0) {
                        ingredienteId = ingredienteExistente[0].id;
                    } else {
                        // Crear el ingrediente de muestra (usando las columnas reales del esquema)
                        const { data: nuevoIngrediente, error: errorCrearIng } = await window.supabase
                            .from('ingredientes')
                            .insert([{
                                user_id: userId,
                                nombre: ingInfo.nombre,
                                precio_compra: ingInfo.precio_paquete,
                                cantidad_compra: ingInfo.cantidad_paquete,
                                unidad: ingInfo.unidad_medida,
                                precio: ingInfo.precio_paquete / ingInfo.cantidad_paquete
                            }])
                            .select()
                            .single();

                        if (errorCrearIng) throw errorCrearIng;
                        ingredienteId = nuevoIngrediente.id;
                    }

                    // Guardar relación
                    recetaIngredientesRows.push({
                        receta_id: recetaId,
                        ingrediente_id: ingredienteId,
                        cantidad_receta: ingInfo.cantidad_utilizada
                    });
                }

                // B. Insertar relaciones en la tabla intermedia ingredientes_receta
                if (recetaIngredientesRows.length > 0) {
                    const { error: errorRelaciones } = await window.supabase
                        .from('ingredientes_receta')
                        .insert(recetaIngredientesRows);

                    if (errorRelaciones) throw errorRelaciones;
                }
            }

            console.log("Seeder finalizado con éxito. Recetas iniciales ingresadas.");
            return true;
        } catch (err) {
            console.error("Error al sembrar recetas iniciales:", err);
            return false;
        }
    };

    // Gatillar carga inicial si la sesión de Supabase ya está lista
    if (window.supabase) {
        window.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                window.cargarRecetasDesdeSupabase();
            }
        });
    }
});
