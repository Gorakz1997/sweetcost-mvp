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
        btnToggleMode.addEventListener("click", (e) => {
            e.preventDefault();
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
            // e.preventDefault() inmediatamente al inicio del evento
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                alert("Error: Por favor, completa todos los campos.");
                return;
            }

            // Deshabilitar botón temporalmente para evitar peticiones duplicadas
            btnSubmit.disabled = true;
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = isLoginMode ? "Ingresando..." : "Registrando...";

            try {
                if (isLoginMode) {
                    // Flujo de Inicio de Sesión
                    const { data, error } = await window.supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    
                    if (error) {
                        console.error("Error capturado:", error);
                        alert("Error: " + error.message);
                        return;
                    }

                    // Limpiar campos del formulario al tener éxito
                    emailInput.value = "";
                    passwordInput.value = "";
                } else {
                    // Flujo de Registro Estándar Obligatorio
                    const { data, error } = await window.supabase.auth.signUp({
                        email: email,
                        password: password
                    });
                    
                    if (error) {
                        console.error("Error capturado:", error);
                        alert("Error: " + error.message);
                        return;
                    }
                    
                    // Limpiar campos del formulario al tener éxito
                    emailInput.value = "";
                    passwordInput.value = "";
                }
            } catch (err) {
                console.error("Error inesperado:", err);
                alert("Error: " + (err.message || err));
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
                    console.error("Error capturado:", error);
                    alert("Error: " + error.message);
                }
            } catch (err) {
                console.error("Error inesperado al cerrar sesión:", err);
                alert("Error: " + (err.message || err));
            }
        });
    }

    // Funcionalidad de Mostrar/Ocultar Contraseña
    const btnTogglePassword = document.getElementById("btn-toggle-password-visibility");
    if (btnTogglePassword && passwordInput) {
        btnTogglePassword.addEventListener("click", (e) => {
            e.preventDefault(); // Evitar propagaciones secundarias
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            btnTogglePassword.textContent = isPassword ? "🙈" : "👁️";
        });
    }
});
