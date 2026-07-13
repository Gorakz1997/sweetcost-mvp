# SweetCost Cloud MVP 🍰 - Sistema de Costeo Pastelero

SweetCost Cloud es un software frontend de costeo para pastelerías, migrado desde un almacenamiento local estático (`LocalStorage`) a una arquitectura robusta y persistente basada en la nube con **Supabase** y maquetación de estética **Neo-Brutalista**.

---

## 🏛️ Arquitectura del Sistema

El sistema opera enteramente en el lado del cliente (Single Page PWA) para una máxima fluidez en dispositivos móviles y de escritorio, conectándose mediante API asíncronas directas al SDK global de Supabase.

### Diagrama de la Base de Datos (Tablas Relacionales)

```mermaid
erDiagram
    auth_users ||--o{ ingredientes : "crea"
    auth_users ||--o{ recetas : "crea"
    recetas ||--o{ ingredientes_receta : "contiene"
    ingredientes ||--o{ ingredientes_receta : "es parte de"

    ingredientes {
        uuid id PK
        uuid user_id FK
        varchar nombre
        numeric cantidad_compra
        numeric precio_compra
        varchar unidad
        numeric precio
        timestamp created_at
    }

    recetas {
        uuid id PK
        uuid user_id FK
        varchar nombre
        varchar categoria
        text pasos
        text descripcion
        varchar imagen
        numeric margen
        numeric costo_total
        numeric precio_sugerido
        timestamp created_at
    }

    ingredientes_receta {
        uuid receta_id PK, FK
        uuid ingrediente_id PK, FK
        numeric cantidad_receta
        varchar unidad_receta
    }
```

---

## 🛠️ Historial de Actualizaciones y Mejoras Realizadas

A lo largo del proceso de migración y estabilización para producción, se implementaron las siguientes mejoras críticas y correctivas de base de datos:

### 1. Robustecimiento de Autenticación (`js/auth.js` e `index.html`)
* **Visualización de Contraseña (Eye Toggle)**: Se reemplazaron los emoticones clásicos por botones flotantes absolutos con iconos SVG dinámicos (ojo abierto/ojo cerrado) dentro del input de la contraseña para mejorar la accesibilidad móvil.
* **Prevenir Recargas Inesperadas en Chrome Mobile**: Se añadió control estricto de eventos (`e.preventDefault()`) en los submits de formularios para detener la recarga asíncrona nativa de las páginas y la caída de las promesas de red en conexiones móviles.
* **Validación de Claves**: Se añadió validación preventiva antes del viaje al servidor, exigiendo claves mayores o iguales a 6 caracteres (requisito de Supabase Auth).
* **Diagnóstico de Registro**: Se implementaron bloques de captura detallada de errores que imprimen el objeto de error de red directamente en consola, resolviendo el problema de registros deshabilitados.

### 2. Sincronización del Inventario de Ingredientes (`js/ingredientes.js`)
* **Alineación con el Esquema Físico**: Se renombraron las variables internas de inserción de `cantidad_paquete` y `precio_paquete` a `cantidad_compra` y `precio_compra` para alinearse 1:1 con las columnas reales creadas en Supabase, erradicando los errores de esquema en caché.
* **Cálculo Unitario en Caliente**: El precio unitario de cada ingrediente se calcula dividiendo el precio de compra entre la cantidad de compra antes de guardarse asíncronamente.
* **Eliminación con Cascade Guard**: Se implementó una verificación preventiva al eliminar ingredientes. Si el ingrediente está en uso por alguna receta del usuario, se lanza una advertencia de confirmación antes de impactar la base de datos.

### 3. Transacción y Costeo de Recetas (`js/recetas.js`)
* **Guardado Transaccional en Dos Etapas**:
  1. **Etapa A (Cabecera)**: Inserta o actualiza la receta en la tabla `recetas`, recuperando el UUID autogenerado mediante `.select().single()`.
  2. **Etapa B (Relación Intermedia)**: Se borran las relaciones previas en la tabla intermedia y se insertan en lote (batch) las nuevas cantidades e identificadores de ingredientes.
* **Alineación con Restricciones `NOT NULL`**:
  * Se configuró el valor `"Pastelería"` para satisfacer el constraint obligatorio de la columna `categoria` en la tabla `recetas`.
  * Se removió el parámetro obsoleto `visibilidad` (eliminado del esquema de la tabla de Supabase).
* **Consistencia en la Tabla Intermedia (`ingredientes_receta`)**:
  * Se mapearon las columnas físicas exactas de Supabase: `cantidad_receta` y `unidad_receta` en lugar de variables genéricas.
  * Se estandarizó la conversión de unidades utilizando la función `convertirUnidad` para que todas las relaciones se almacenen en su equivalente en la unidad base de compra.

### 4. Sembrador de Datos (Seeder Automatizado)
* Se programó e integró la función `window.ejecutarSeederSiEsNecesario`. Al iniciar sesión, si el sistema detecta que el usuario no tiene ninguna receta creada en la nube, descarga y crea automáticamente 2 recetas de muestra completas (**Bizcochuelo de Vainilla** y **Crema Chantilly**) y da de alta de forma transparente sus respectivos ingredientes necesarios alineados con el esquema de Supabase.

---

## ⚡ Guía de Desarrollo Local

### Requisitos Previos
* Servidor web estático local (puedes usar la extensión "Live Server" en VS Code, o python `python -m http.server 8000`).
* Navegador moderno (se recomienda Chrome Developer Tools para inspeccionar RLS).

### Inicialización de Supabase
El cliente de Supabase se carga de manera global a través de CDN en el navegador. Las credenciales de acceso están configuradas en [js/app.js](file:///d:/Proyectos/sweetcost-mvp/js/app.js):
```javascript
const supabaseUrl = 'https://bywdlwnsziivnbhbfcpm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5d2Rsd25zemlpdm5iaGJmY3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4ODA0ODQsImV4cCI6MjA5OTQ1NjQ4NH0.MIPmdlOnrcNJn8YT92za4qHS-NYDIyFEP6_sSNuhBPE';
```
> [!WARNING]
> La clave anon provista cuenta con permisos limitados y está sujeta a políticas RLS configuradas en Supabase. Cada usuario solo puede ver y editar sus propios datos creados.
