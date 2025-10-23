// Variable global para la URL de tu API
// Así, si la cambias (ej. al desplegarla), solo la cambias aquí.
const API_URL = 'http://localhost:3000/api/users';

document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    
    const registerForm = document.getElementById('register-form');
    const registerMessage = document.getElementById('register-message');
    const userTypeSelect = document.getElementById('user-type');
    
    // Contenedores de campos dinámicos
    const fieldsContainer = document.getElementById('form-fields-container');
    const commonFields = document.getElementById('form-fields-common');
    const empresaFields = document.getElementById('form-fields-empresa');
    const gobiernoFields = document.getElementById('form-fields-gobierno');
    const organizacionFields = document.getElementById('form-fields-organizacion');
    const personaFields = document.getElementById('form-fields-persona');
    const rolFields = document.getElementById('form-fields-rol');
    const passwordFields = document.getElementById('form-fields-password');
    const registerSubmitBtn = document.getElementById('register-submit-btn');

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

    // --- Lógica de Formulario de Registro Dinámico ---
    // (Esta lógica tuya estaba perfecta, se queda igual)
    userTypeSelect.addEventListener('change', () => {
        const type = userTypeSelect.value;
        
        [commonFields, empresaFields, gobiernoFields, organizacionFields, personaFields, rolFields, passwordFields, registerSubmitBtn].forEach(el => {
            el.classList.add('hidden');
        });
        
        document.querySelectorAll('#form-fields-container input').forEach(input => input.value = '');
        document.querySelectorAll('#form-fields-container input[type="radio"]').forEach(radio => radio.checked = false);
        userTypeSelect.value = type;

        if (!type) return; 

        commonFields.classList.remove('hidden');
        passwordFields.classList.remove('hidden');
        registerSubmitBtn.classList.remove('hidden');
        
        // ¡OJO! Tu HTML debe tener los campos que la API espera:
        // 'empresa' -> 'empresa-rfc'
        // 'organizacion' -> 'org-cluni'
        // 'persona' -> 'persona-curp'
        // 'gobierno' -> 'gob-nombre' (además de 'gob-dependencia')

        switch (type) {
            case 'empresa':
                empresaFields.classList.remove('hidden');
                // Nota: El rol 'donador' se asigna en el backend para empresa
                break;
            case 'gobierno':
                gobiernoFields.classList.remove('hidden');
                // rolFields.classList.remove('hidden'); // El backend ya no usa esto
                break;
            case 'organizacion':
                organizacionFields.classList.remove('hidden');
                // rolFields.classList.remove('hidden'); // El backend ya no usa esto
                break;
            case 'persona':
                personaFields.classList.remove('hidden');
                // rolFields.classList.remove('hidden'); // El backend ya no usa esto
                break;
        }
    });
    
    // --- Lógica de Envío de Formularios (CONECTADA AL BACKEND) ---

    // Envío de Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginMessage.textContent = 'Verificando...';
        loginMessage.className = 'text-center text-blue-500 mb-4';
        
        // 1. Obtenemos datos del form
        // (Tu HTML usa 'login-telefono', la API espera 'contacto'. Los mapeamos)
        const contacto = document.getElementById('login-telefono').value;
        const contrasena = document.getElementById('login-password').value;

        try {
            // 2. Llamamos a la API de Login
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contacto, contrasena }) // ¡Mapeo listo!
            });

            const data = await response.json();

            // 3. Procesamos la respuesta
            if (data.status === "success") {
                // ¡ÉXITO!
                showLoginMessage('¡Inicio de sesión exitoso! Redirigiendo...');
                localStorage.setItem('donenme_token', data.token); // Guardamos la llave
                
                // Opcional: Redirigir al dashboard
                // setTimeout(() => {
                //    window.location.href = '/dashboard.html';
                // }, 1500);

            } else {
                // Error de credenciales (manejado por el backend)
                showLoginMessage(data.message, true);
            }
        } catch (error) {
            // Error de red (servidor caído, etc.)
            console.error('Error de red en Login:', error);
            showLoginMessage('Error de conexión con el servidor.', true);
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

        // --- Construir el payload que SÍ COINCIDE con tu API ---
        const tipo = userTypeSelect.value;
        let endpoint = '';
        let payload = {
            // Datos comunes que todas las rutas de registro esperan
            contacto: document.getElementById('reg-telefono').value,
            direccion: document.getElementById('reg-direccion').value,
            contrasena: password
        };

        // Preparamos el endpoint y los datos específicos
        switch (tipo) {
            case 'empresa':
                endpoint = `${API_URL}/register/empresa`;
                payload.nombre = document.getElementById('empresa-nombre').value;
                payload.rfc = document.getElementById('empresa-rfc').value; // AVISO: Tu HTML debe tener este input
                break;
            case 'gobierno':
                endpoint = `${API_URL}/register/gobierno`;
                payload.nombre = document.getElementById('gob-nombre').value; // AVISO: Tu HTML debe tener este input
                payload.dependencia = document.getElementById('gob-dependencia').value;
                break;
            case 'organizacion': // Tu HTML dice 'organizacion', la API espera 'ong'
                endpoint = `${API_URL}/register/ong`;
                payload.nombre = document.getElementById('org-nombre').value;
                payload.cluni = document.getElementById('org-cluni').value; // AVISO: Tu HTML debe tener 'org-cluni', no 'org-clave'
                break;
            case 'persona': // Tu HTML dice 'persona', la API 'persona_fisica'
                endpoint = `${API_URL}/register/persona_fisica`;
                payload.nombre = document.getElementById('persona-nombre').value;
                payload.curp = document.getElementById('persona-curp').value; // AVISO: Tu HTML debe tener 'persona-curp', no 'persona-rfc'
                break;
            default:
                showRegisterMessage('Por favor, selecciona un tipo de usuario válido.', true);
                return;
        }

        console.log('Datos a enviar:', endpoint, payload);

        try {
            // 2. Llamamos a la API de Registro correspondiente
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            // 3. Procesamos la respuesta
            if (data.status === "success") {
                showRegisterMessage('¡Cuenta creada exitosamente! Redirigiendo a login...');
                
                // Cambiar a la vista de login
                setTimeout(() => {
                    showView('login-view');
                    showLoginMessage('¡Cuenta creada! Por favor, inicia sesión.');
                    loginForm.reset();
                    registerForm.reset();
                    userTypeSelect.dispatchEvent(new Event('change'));
                }, 2000);

            } else {
                // Error (ej. usuario ya existe, datos inválidos)
                showRegisterMessage(data.message, true);
            }
        } catch (error) {
            // Error de red
            console.error('Error de red en Registro:', error);
            showRegisterMessage('Error de conexión con el servidor.', true);
        }
    });

});