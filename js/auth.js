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

    // Funcionalidad de Mostrar/Ocultar Contraseña (Iconos SVG en lugar de Emotes)
    const btnTogglePassword = document.getElementById("btn-toggle-password-visibility");
    if (btnTogglePassword && passwordInput) {
        const eyeOpenSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 text-black select-none pointer-events-none">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
        `;
        const eyeClosedSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 text-black select-none pointer-events-none">
                <path stroke-linecap="round" d="M4 10a10.13 10.13 0 0 0 16 0" />
                <path stroke-linecap="round" d="M12 15v3" />
                <path stroke-linecap="round" d="M7 13l-1.5 2.5" />
                <path stroke-linecap="round" d="M17 13l1.5 2.5" />
                <path stroke-linecap="round" d="M4.5 10.5L3 12.5" />
                <path stroke-linecap="round" d="M19.5 10.5l1.5 2" />
            </svg>
        `;

        btnTogglePassword.addEventListener("click", (e) => {
            e.preventDefault(); // Evitar propagaciones secundarias
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            btnTogglePassword.innerHTML = isPassword ? eyeClosedSVG : eyeOpenSVG;
        });
    }
});
