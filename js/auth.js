// js/auth.js
// Controlador de Autenticación para SweetCost Cloud (Manejo de Errores Ultra-Explícito)

document.addEventListener("DOMContentLoaded", () => {
    // Referencias del DOM de Autenticación
    const authTitle = document.getElementById("auth-title");
    const authSubtitle = document.getElementById("auth-subtitle");
    const formAuth = document.getElementById("form-auth");
    const emailInput = document.getElementById("auth-email");
    const passwordInput = document.getElementById("auth-password");
    const btnSubmit = document.getElementById("btn-auth-submit");
    const btnToggleMode = document.getElementById("btn-toggle-auth-mode");
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");

    // Estado local de la vista de autenticación (por defecto Iniciar Sesión)
    let isLoginMode = true; 

    // Intercambio dinámico de modo (Login <-> Registro)
    if (btnToggleMode) {
        btnToggleMode.addEventListener("click", (e) => {
            e.preventDefault(); // Evitar cualquier comportamiento no deseado
            isLoginMode = !isLoginMode;
            if (isLoginMode) {
                authTitle.textContent = "Iniciar Sesión";
                authSubtitle.textContent = "Introduce tus credenciales para acceder a SweetCost";
                btnSubmit.textContent = "Ingresar";
                btnToggleMode.textContent = "¿No tienes cuenta? Regístrate";
            } else {
                authTitle.textContent = "Registrarse";
                authSubtitle.textContent = "Crea una cuenta nueva para guardar tus recetas";
                btnSubmit.textContent = "Crear Cuenta";
                btnToggleMode.textContent = "¿Ya tienes cuenta? Inicia Sesión";
            }
            // Limpiar inputs al cambiar de modo
            if (emailInput) emailInput.value = "";
            if (passwordInput) passwordInput.value = "";
        });
    }

    // Manejo de Envío de Formulario (SignUp y SignIn)
    if (formAuth) {
        formAuth.addEventListener("submit", async (e) => {
            // REQUERIMIENTO: Evitar la recarga de página al inicio de todo
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // Validación de campos vacíos
            if (!email || !password) {
                alert("Por favor, completa todos los campos requeridos.");
                return;
            }

            // REQUERIMIENTO: Validación de contraseña de al menos 6 caracteres antes del envío
            if (password.length < 6) {
                alert("La contraseña debe tener al menos 6 caracteres");
                return;
            }

            // Deshabilitar botón para feedback visual
            btnSubmit.disabled = true;
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = isLoginMode ? "Ingresando..." : "Creando cuenta...";

            try {
                if (isLoginMode) {
                    // Flujo de Inicio de Sesión
                    const { data, error } = await window.supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    
                    if (error) {
                        console.error("ERROR DETALLADO DE SUPABASE (INICIO DE SESIÓN):", error);
                        alert("Error al iniciar sesión: " + error.message);
                        return;
                    }
                } else {
                    // Flujo de Registro de Usuario
                    // REQUERIMIENTO: Utilizar supabase.auth.signUp() para registro nativo en Supabase v2
                    const { data, error } = await window.supabase.auth.signUp({
                        email: email,
                        password: password
                    });
                    
                    if (error) {
                        // REQUERIMIENTO: Imprimir error detallado en consola y lanzar alert explícito
                        console.error("ERROR DETALLADO DE SUPABASE:", error);
                        alert("Error al registrarse: " + error.message);
                        return;
                    }
                    
                    alert("¡Registro exitoso! Ya puedes iniciar sesión.");
                    // Cambiar automáticamente a modo login para ingresar
                    isLoginMode = true;
                    authTitle.textContent = "Iniciar Sesión";
                    authSubtitle.textContent = "Introduce tus credenciales para acceder a SweetCost";
                    btnSubmit.textContent = "Ingresar";
                    btnToggleMode.textContent = "¿No tienes cuenta? Regístrate";
                    
                    // Limpiar contraseñas
                    passwordInput.value = "";
                }
            } catch (err) {
                console.error("ERROR INESPERADO EN EL PROCESO:", err);
                alert("Ocurrió un error inesperado: " + (err.message || err));
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = originalText;
            }
        });
    }

    // Manejo del Cierre de Sesión (SignOut)
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                const { error } = await window.supabase.auth.signOut();
                if (error) {
                    console.error("ERROR DETALLADO DE SUPABASE (CERRAR SESIÓN):", error);
                    alert("Error al cerrar sesión: " + error.message);
                    return;
                }
            } catch (err) {
                console.error("ERROR INESPERADO AL CERRAR SESIÓN:", err);
                alert("Ocurrió un error inesperado al salir: " + (err.message || err));
            }
        });
    }
});
