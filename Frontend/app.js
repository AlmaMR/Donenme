// Variable global para la URL de tu API
const API_URL = 'http://localhost:3000/api/users';

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

    // --- NUEVA FUNCIÓN ---
    // Esta función agrega o quita 'required' de los inputs dentro de un contenedor
    function setFieldsRequired(container, isRequired) {
        if (!container) return; // Verificación de seguridad
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
    function showLoginMessage(message, isError = false) {
        loginMessage.textContent = message;
        loginMessage.className = `text-center mb-4 ${isError ? 'text-red-500' : 'text-green-500'}`;
    }

    function showRegisterMessage(message, isError = false) {
        registerMessage.textContent = message;
        registerMessage.className = `text-center my-4 ${isError ? 'text-red-500' : 'text-green-500'}`;
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

    // --- Lógica de Formulario de Registro Dinámico (ACTUALIZADA) ---
    userTypeSelect.addEventListener('change', () => {
        const type = userTypeSelect.value;

        // 1. Ocultar todos los contenedores y quitar 'required'
        const allFieldContainers = [commonFields, empresaFields, gobiernoFields, organizacionFields, personaFields, passwordFields];

        allFieldContainers.forEach(container => {
            container.classList.add('hidden');
            setFieldsRequired(container, false); // <--- Lógica actualizada
        });
        registerSubmitBtn.classList.add('hidden');

        // Limpiar inputs
        document.querySelectorAll('#form-fields-container input').forEach(input => input.value = '');
        userTypeSelect.value = type;

        if (!type) return; // Si seleccionan "-- Selecciona --", no hacer nada

        // 2. Mostrar campos comunes y hacerlos 'required'
        commonFields.classList.remove('hidden');
        setFieldsRequired(commonFields, true); // <--- Lógica actualizada
        passwordFields.classList.remove('hidden');
        setFieldsRequired(passwordFields, true); // <--- Lógica actualizada
        registerSubmitBtn.classList.remove('hidden');

        // 3. Mostrar campos específicos y hacerlos 'required'
        switch (type) {
            case 'empresa':
                empresaFields.classList.remove('hidden');
                setFieldsRequired(empresaFields, true); // <--- Lógica actualizada
                break;
            case 'gobierno':
                gobiernoFields.classList.remove('hidden');
                setFieldsRequired(gobiernoFields, true); // <--- Lógica actualizada
                break;
            case 'organizacion':
                organizacionFields.classList.remove('hidden');
                setFieldsRequired(organizacionFields, true); // <--- Lógica actualizada
                break;
            case 'persona':
                personaFields.classList.remove('hidden');
                setFieldsRequired(personaFields, true); // <--- Lógica actualizada
                break;
        }
    });

    // Envío de Registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerMessage.textContent = '';

        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;

        if (password !== confirmPassword) {
            showRegisterMessage('Las contraseñas no coinciden.', true);
            return;
        }

        registerMessage.textContent = 'Creando cuenta...';
        registerMessage.className = 'text-center text-blue-500 my-4';

        const tipo = userTypeSelect.value;
        const tipoRol = document.getElementById('reg-tipo-rol').value;
        let endpoint = '';
        let payload = {
            tipo_rol: tipoRol, // <-- Nuevo campo añadido
            contacto: document.getElementById('reg-telefono').value,
            direccion: document.getElementById('reg-direccion').value,
            contrasena: password
        };

        try {
            switch (tipo) {
                case 'empresa':
                    endpoint = `${API_URL}/register/empresa`;
                    payload.nombre = document.getElementById('empresa-nombre').value;
                    payload.rfc = document.getElementById('empresa-rfc').value;
                    break;
                case 'gobierno':
                    endpoint = `${API_URL}/register/gobierno`;
                    payload.nombre = document.getElementById('gob-nombre').value;
                    payload.dependencia = document.getElementById('gob-dependencia').value;
                    break;
                case 'organizacion':
                    endpoint = `${API_URL}/register/ong`;
                    payload.nombre = document.getElementById('org-nombre').value;
                    payload.cluni = document.getElementById('org-cluni').value;
                    break;
                case 'persona':
                    endpoint = `${API_URL}/register/persona_fisica`;
                    payload.nombre = document.getElementById('persona-nombre').value;
                    payload.curp = document.getElementById('persona-curp').value;
                    break;
                default:
                    showRegisterMessage('Por favor, selecciona un tipo de usuario válido.', true);
                    return;
            }
        } catch (error) {
            console.error('Error al construir el payload:', error);
            showRegisterMessage('Error interno del formulario. Revisa la consola.', true);
            return;
        }

        console.log('Datos a enviar:', endpoint, payload);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.status === "success") {

                const contacto = document.getElementById('reg-telefono').value;
                const contrasena = document.getElementById('reg-password').value;

                try {
                    const response = await fetch(`${API_URL}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contacto, contrasena })
                    });

                    const data = await response.json();

                    if (data.status === "success") {
                        localStorage.setItem('donenme_token', data.token);
                        window.location.href = 'dashboard.html'; // Descomentar para redirigir
                        //window.location.href = 'dash.html'; // Descomentar para redirigir
                    } else {
                        showLoginMessage(data.message, true);
                    }
                } catch (error) {
                    console.error('Error de red en Login:', error);
                    showLoginMessage('Error de conexión con el servidor.', true);
                }
                setTimeout(() => {
                    showView('login-view');
                    showLoginMessage('¡Cuenta creada! Por favor, inicia sesión.');
                    loginForm.reset();
                    registerForm.reset();
                    userTypeSelect.dispatchEvent(new Event('change'));
                }, 2000);

            } else {
                showRegisterMessage(data.message, true);
            }
        } catch (error) {
            console.error('Error de red en Registro:', error);
            showRegisterMessage('Error de conexión con el servidor.', true);
        }
    });

    // --- Lógica de Envío de Formularios (CONECTADA AL BACKEND) ---
    // (Esta parte se queda igual, ya era correcta)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginMessage.textContent = 'Verificando...';
        loginMessage.className = 'text-center text-blue-500 mb-4';

        const contacto = document.getElementById('login-telefono').value;
        const contrasena = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contacto, contrasena })
            });

            const data = await response.json();

            if (data.status === "success") {
                showLoginMessage('¡Inicio de sesión exitoso! Redirigiendo...');
                localStorage.setItem('donenme_token', data.token);
                window.location.href = 'dashboard.html'; // Descomentar para redirigir
                //window.location.href = 'dash.html'; // Descomentar para redirigir
            } else {
                showLoginMessage(data.message, true);
            }
        } catch (error) {
            console.error('Error de red en Login:', error);
            showLoginMessage('Error de conexión con el servidor.', true);
        }
    });

});

