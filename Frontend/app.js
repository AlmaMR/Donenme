import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Vistas
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');

    // Links de navegación
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');

    // Formulario de Login
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');

    // Formulario de Registro
    const registerForm = document.getElementById('register-form');
    const registerMessage = document.getElementById('register-message');
    const userTypeSelect = document.getElementById('user-type');

    // Contenedores de campos dinámicos
    const commonFields = document.getElementById('form-fields-common');
    const empresaFields = document.getElementById('form-fields-empresa');
    const gobiernoFields = document.getElementById('form-fields-gobierno');
    const organizacionFields = document.getElementById('form-fields-organizacion');
    const personaFields = document.getElementById('form-fields-persona');
    const passwordFields = document.getElementById('form-fields-password');
    const registerSubmitBtn = document.getElementById('register-submit-btn');

    // Esta función agrega o quita 'required' de los inputs dentro de un contenedor
    function setFieldsRequired(container, isRequired) {
        if (!container) return;
        const inputs = container.querySelectorAll('input');
        inputs.forEach(input => {
            input.required = isRequired;
        });
    }

    // Función para cambiar de vista
    function showView(viewId) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(viewId).classList.add('active');
    }

    // Función para mostrar mensajes
    function showMessage(element, message, isError = false) {
        element.textContent = message;
        element.className = `text-center my-4 ${isError ? 'text-red-500' : 'text-green-500'}`;
    }

    // --- Lógica de Navegación ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showView('register-view');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showView('login-view');
    });

    // --- Lógica de Formulario de Registro Dinámico ---
    userTypeSelect.addEventListener('change', () => {
        const type = userTypeSelect.value;
        const allFieldContainers = [commonFields, empresaFields, gobiernoFields, organizacionFields, personaFields, passwordFields];

        allFieldContainers.forEach(container => {
            container.classList.add('hidden');
            setFieldsRequired(container, false);
        });
        registerSubmitBtn.classList.add('hidden');

        if (!type) return;

        commonFields.classList.remove('hidden');
        setFieldsRequired(commonFields, true);
        passwordFields.classList.remove('hidden');
        setFieldsRequired(passwordFields, true);
        registerSubmitBtn.classList.remove('hidden');

        const fieldMap = {
            'empresa': empresaFields,
            'gobierno': gobiernoFields,
            'organizacion': organizacionFields,
            'persona': personaFields
        };

        const specificFields = fieldMap[type];
        if (specificFields) {
            specificFields.classList.remove('hidden');
            setFieldsRequired(specificFields, true);
        }
    });

    // --- Envío de Registro (Refactorizado) ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showMessage(registerMessage, 'Creando cuenta...', false);

        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;

        if (password !== confirmPassword) {
            showMessage(registerMessage, 'Las contraseñas no coinciden.', true);
            return;
        }

        const userType = userTypeSelect.value;
        const tipoRol = document.getElementById('reg-tipo-rol').value;

        // Mapeo de user-type del frontend al 'rol' del backend
        const rolMap = {
            'empresa': 'empresa',
            'gobierno': 'gobierno',
            'organizacion': 'ong',
            'persona': 'persona_fisica'
        };
        const backendRol = rolMap[userType];

        if (!backendRol) {
            showMessage(registerMessage, 'Por favor, selecciona un tipo de usuario válido.', true);
            return;
        }

        // Construcción del payload base
        let payload = {
            rol: backendRol,
            tipo_rol: tipoRol,
            contacto: document.getElementById('reg-telefono').value,
            direccion: document.getElementById('reg-direccion').value,
            contrasena: password
        };

        // Añadir campos específicos del rol al payload
        switch (userType) {
            case 'empresa':
                payload.nombre = document.getElementById('empresa-nombre').value;
                payload.rfc = document.getElementById('empresa-rfc').value;
                break;
            case 'gobierno':
                payload.nombre = document.getElementById('gob-nombre').value;
                payload.dependencia = document.getElementById('gob-dependencia').value;
                break;
            case 'organizacion':
                payload.nombre = document.getElementById('org-nombre').value;
                payload.cluni = document.getElementById('org-cluni').value;
                break;
            case 'persona':
                payload.nombre = document.getElementById('persona-nombre').value;
                payload.curp = document.getElementById('persona-curp').value;
                break;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.status === "success") {
                showMessage(registerMessage, '¡Cuenta creada! Redirigiendo...', false);
                sessionStorage.setItem('donenme_token', data.token); // Usar sessionStorage
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500); // Pequeña demora para que el usuario vea el mensaje
            } else {
                showMessage(registerMessage, data.message || 'Ocurrió un error.', true);
            }
        } catch (error) {
            console.error('Error de red en Registro:', error);
            showMessage(registerMessage, 'Error de conexión con el servidor.', true);
        }
    });

    // --- Envío de Login (Refactorizado) ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showMessage(loginMessage, 'Verificando...', false);

        const contacto = document.getElementById('login-telefono').value;
        const contrasena = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true' // Cabecera para evitar advertencia de ngrok
                },
                body: JSON.stringify({ contacto, contrasena })
            });

            const data = await response.json();

            if (data.status === "success") {
                showMessage(loginMessage, '¡Inicio de sesión exitoso! Redirigiendo...', false);
                sessionStorage.setItem('donenme_token', data.token); // Usar sessionStorage
                window.location.href = 'dashboard.html';
            } else {
                showMessage(loginMessage, data.message || 'Credenciales inválidas.', true);
            }
        } catch (error) {
            console.error('Error de red en Login:', error);
            showMessage(loginMessage, 'Error de conexión con el servidor.', true);
        }
    });
});
