// js/recetas.js

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

    // Variable temporal para almacenar la imagen en Base64
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

    // Referencias Modal
    const modal = document.getElementById("modal-ingrediente");
    const btnCloseModal = document.getElementById("btn-close-modal");
    const formModal = document.getElementById("form-modal-ingrediente");
    const modalInputNombre = document.getElementById("modal-input-nombre");
    const modalInputPrecio = document.getElementById("modal-input-precio");
    const modalSelectUnidad = document.getElementById("modal-select-unidad");
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

    // --- Funcionalidad de la Ventana Modal ---
    btnOpenModal.addEventListener("click", (e) => {
        e.preventDefault();
        modal.classList.remove("hidden");
    });

    btnCloseModal.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    formModal.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
            const nombre = modalInputNombre.value.trim();
            const precio = parseFloat(modalInputPrecio.value);
            const unidad = modalSelectUnidad.value;

            if (nombre && !isNaN(precio)) {
                // Añadir al array global
                const nuevoIngrediente = {
                    id: 'ing_' + Date.now(),
                    nombre: nombre,
                    precio: precio,
                    unidad: unidad
                };
                window.sweetcostIngredientes.push(nuevoIngrediente);
                localStorage.setItem('sweetcost_ingredientes', JSON.stringify(window.sweetcostIngredientes));

                // Actualizar tabla global de ingredientes y selector de la receta
                if (typeof window.renderizarTablaIngredientes === 'function') {
                    window.renderizarTablaIngredientes();
                }
                window.poblarSelectIngredientes();

                // Seleccionar automáticamente en el form de la receta
                selectIngrediente.value = nuevoIngrediente.id;

                // Limpiar y cerrar modal
                formModal.reset();
                modal.classList.add("hidden");

                // Refrescar vistas
                if (typeof window.renderizarTablaIngredientes === 'function') {
                    window.renderizarTablaIngredientes();
                }
                window.poblarSelectIngredientes();
            }
        } catch (err) {
            console.error("Error al guardar desde modal:", err);
        }
    });

    // --- Lógica del Selector y Adición de Ingredientes a la Receta ---
    window.poblarSelectIngredientes = () => {
        selectIngrediente.innerHTML = '<option value="">-- Selecciona un Ingrediente --</option>';
        window.sweetcostIngredientes.forEach(ing => {
            const option = document.createElement("option");
            option.value = ing.id;
            option.textContent = `${ing.nombre} ($${ing.precio}/${ing.unidad})`;
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

            // Limpiar input y re-calcular
            inputCantidad.value = "";
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
            // Actualizar el subtotal con el precio más reciente del estado global (por si fue modificado)
            const ingredienteGlobal = window.sweetcostIngredientes.find(i => i.id === ing.id);
            const precioActual = ingredienteGlobal ? ingredienteGlobal.precio : ing.precio;
            const unidadBase = ingredienteGlobal ? ingredienteGlobal.unidad : ing.unidad;

            // Convertir la cantidad al formato de la unidad base para calcular el subtotal correcto
            const cantidadBase = convertirUnidad(ing.cantidadReceta, ing.unidadReceta, unidadBase);
            const subtotal = precioActual * cantidadBase;

            const tr = document.createElement("tr");
            tr.className = "border-b-4 border-[var(--border-color)] bg-white";
            tr.innerHTML = `
                <td class="p-2 border-r-4 border-[var(--border-color)] font-bold">${ing.nombre}</td>
                <td class="p-2 border-r-4 border-[var(--border-color)]">
                    <input type="number" inputmode="decimal" class="brutal-input w-24 p-1 text-sm inline-block" step="0.01" value="${ing.cantidadReceta}" onchange="actualizarCantidadIngrediente(${index}, this.value)"> ${ing.unidadReceta}
                </td>
                <td class="p-2 border-r-4 border-[var(--border-color)]">$${subtotal.toFixed(2)}</td>
                <td class="p-2 text-center">
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
            // Revertir a visual si es inválido
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
        // Costo Total = Suma de (Cantidad * Precio Unitario Actualizado)
        const costoTotal = window.ingredientesRecetaActual.reduce((total, ing) => {
            const ingredienteGlobal = window.sweetcostIngredientes.find(i => i.id === ing.id);
            const precio = ingredienteGlobal ? ingredienteGlobal.precio : ing.precio;
            const unidadBase = ingredienteGlobal ? ingredienteGlobal.unidad : ing.unidad;

            const cantidadBase = convertirUnidad(ing.cantidadReceta, ing.unidadReceta, unidadBase);
            return total + (precio * cantidadBase);
        }, 0);
        spanCostoTotal.textContent = costoTotal.toFixed(2);

        // Precio Final Sugerido
        const margen = parseFloat(inputMargen.value) || 0;
        const precioSugerido = costoTotal * (1 + (margen / 100));
        spanPrecioSugerido.textContent = precioSugerido.toFixed(2);

        return { costoTotal, precioSugerido };
    };

    // Recalcular instantáneamente si se modifica el margen
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
        window.ingredientesRecetaActual = [];
        window.renderizarTablaReceta();
        window.calcularCostos();
    };

    // --- Guardar y Renderizar Recetas ---
    btnGuardarReceta.addEventListener("click", () => {
        const nombre = inputNombreReceta.value.trim();
        const margen = parseFloat(inputMargen.value) || 0;
        const imagen = window.recetaImagenBase64 || 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=500&auto=format&fit=crop'; // Imagen por defecto

        if (!nombre) {
            alert("El nombre de la receta es obligatorio.");
            return;
        }

        const { costoTotal, precioSugerido } = window.calcularCostos();

        const recetaData = {
            id: window.recetaEnEdicionId || 'rec_' + Date.now(),
            nombre: nombre,
            imagen: imagen,
            margen: margen,
            ingredientes: [...window.ingredientesRecetaActual],
            costoTotal: costoTotal,
            precioSugerido: precioSugerido
        };

        if (window.recetaEnEdicionId) {
            // Actualizar existente
            const index = window.sweetcostRecetas.findIndex(r => r.id === window.recetaEnEdicionId);
            if (index !== -1) window.sweetcostRecetas[index] = recetaData;
        } else {
            // Nueva receta
            window.sweetcostRecetas.push(recetaData);
        }
        localStorage.setItem('sweetcost_recetas', JSON.stringify(window.sweetcostRecetas));

        window.renderizarGridRecetas();
        vistaForm.classList.add("hidden");
        vistaLista.classList.remove("hidden");
    });

    window.renderizarGridRecetas = () => {
        gridRecetas.innerHTML = "";

        if (window.sweetcostRecetas.length === 0) {
            gridRecetas.innerHTML = `<div class="col-span-full p-6 text-center font-bold text-gray-500 bg-white brutal-border">No tienes recetas creadas todavía.</div>`;
            return;
        }

        window.sweetcostRecetas.forEach(receta => {
            // Recalcular el costo basado en los precios actuales (por si cambiaron desde Ingredientes)
            let costoReal = 0;

            // Armar una pequeña lista de ingredientes para mostrar en la tarjeta (UX)
            let nombresIngredientes = [];

            receta.ingredientes.forEach(ing => {
                const ingredienteGlobal = window.sweetcostIngredientes.find(i => i.id === ing.id);
                const precio = ingredienteGlobal ? ingredienteGlobal.precio : ing.precio;
                const unidadBase = ingredienteGlobal ? ingredienteGlobal.unidad : ing.unidad;

                const cantReceta = ing.cantidadReceta !== undefined ? ing.cantidadReceta : ing.cantidad;
                const unReceta = ing.unidadReceta !== undefined ? ing.unidadReceta : ing.unidad;

                const cantidadBase = convertirUnidad(cantReceta, unReceta, unidadBase);
                costoReal += (precio * cantidadBase);
                nombresIngredientes.push(`${cantReceta}${unReceta} ${ing.nombre}`);
            });

            const precioSugeridoReal = costoReal * (1 + (receta.margen / 100));

            // Actualizar receta en memoria con los nuevos valores calculados
            receta.costoTotal = costoReal;
            receta.precioSugerido = precioSugeridoReal;

            const listaPreview = nombresIngredientes.length > 0
                ? `<div class="text-sm text-gray-600 mb-4 h-12 overflow-hidden truncate whitespace-normal">${nombresIngredientes.join(', ')}</div>`
                : `<div class="text-sm text-gray-400 mb-4 h-12 italic">Sin ingredientes.</div>`;

            const article = document.createElement("article");
            article.className = "brutal-card flex flex-col bg-white";
            article.innerHTML = `
                <div class="h-48 bg-gray-300 border-b-4 border-[var(--border-color)] relative">
                    <img src="${receta.imagen}" alt="${receta.nombre}" class="w-full h-full object-cover">
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
                    <button class="brutal-btn w-full py-2 hover:bg-gray-200 hover:text-[var(--on-background)] bg-white text-[var(--on-background)] transition-colors" onclick="editarReceta('${receta.id}')">Editar</button>
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

        // Copia profunda de ingredientes para no mutar el estado antes de guardar, normalizando al nuevo formato
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

    // Render inicial
    window.renderizarGridRecetas();
});
