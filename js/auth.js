// js/auth.js
// Controlador de Autenticación para SweetCost Cloud

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
        btnToggleMode.addEventListener("click", () => {
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
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                alert("Por favor, completa todos los campos requeridos.");
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
                    if (error) throw error;
                } else {
                    // Flujo de Registro de Usuario
                    const { data, error } = await window.supabase.auth.signUpWithPassword({
                        email: email,
                        password: password
                    });
                    if (error) throw error;
                    
                    alert("¡Registro exitoso! Si se requiere verificación por correo, revisa tu bandeja de entrada; si no, ya puedes iniciar sesión.");
                    // Cambiar automáticamente a modo login para ingresar
                    btnToggleMode.click();
                }
            } catch (err) {
                console.error("Error en el proceso de autenticación:", err);
                alert("Error de Supabase: " + (err.message || "Ocurrió un error inesperado al autenticar."));
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = originalText;
            }
        });
    }

    // Manejo del Cierre de Sesión (SignOut)
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", async () => {
            try {
                const { error } = await window.supabase.auth.signOut();
                if (error) throw error;
            } catch (err) {
                console.error("Error al cerrar sesión:", err);
                alert("Error al cerrar sesión: " + (err.message || "Ocurrió un error inesperado al salir."));
            }
        });
    }
});
