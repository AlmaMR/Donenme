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
        
        // Ocultar todos los campos específicos
        [commonFields, empresaFields, gobiernoFields, organizacionFields, personaFields, rolFields, passwordFields, registerSubmitBtn].forEach(el => {
            el.classList.add('hidden');
        });
        
        // Limpiar inputs (opcional, pero buena práctica)
        // registerForm.reset(); // Esto resetea el select también, mejor no.
        document.querySelectorAll('#form-fields-container input').forEach(input => input.value = '');
        document.querySelectorAll('#form-fields-container input[type="radio"]').forEach(radio => radio.checked = false);

        // Restaurar el valor del select
        userTypeSelect.value = type;

        if (!type) return; // Si seleccionan "-- Selecciona --", no mostrar nada

        // Mostrar campos comunes y de contraseña para todos
        commonFields.classList.remove('hidden');
        passwordFields.classList.remove('hidden');
        registerSubmitBtn.classList.remove('hidden');
        
        // Mostrar campos específicos según el tipo
        switch (type) {
            case 'empresa':
                empresaFields.classList.remove('hidden');
                break;
            case 'gobierno':
                gobiernoFields.classList.remove('hidden');
                rolFields.classList.remove('hidden'); // Gobierno sí elige rol
                break;
            case 'organizacion':
                organizacionFields.classList.remove('hidden');
                rolFields.classList.remove('hidden'); // Organización sí elige rol
                break;
            case 'persona':
                personaFields.classList.remove('hidden');
                rolFields.classList.remove('hidden'); // Persona sí elige rol
                break;
        }
    });
    
    // --- Lógica de Envío de Formularios (Simulación) ---

    // Envío de Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginMessage.textContent = ''; // Limpiar mensajes
        const telefono = document.getElementById('login-telefono').value;
        const password = document.getElementById('login-password').value;

        // --- Simulación de Carga ---
        loginMessage.textContent = 'Verificando...';
        loginMessage.className = 'text-center text-blue-500 mb-4';
        
        console.log('Datos de Login:', { telefono, password });
        
        // --- AQUÍ VA TU LÓGICA DE LOGIN ---
        // 1. Enviar 'telefono' y 'password' a tu backend.
        // 2. Tu backend debe buscar en las 4 bases de datos de CouchDB
        //    (empresas, gobierno, org, personas) cuál coincide.
        // 3. Si encuentra y la contraseña es correcta, responde con éxito.
        // 4. Si no, responde con error.

        // Simulación de respuesta
        setTimeout(() => {
            if (telefono === "5512345678" && password === "pass123") {
                loginMessage.textContent = '¡Inicio de sesión exitoso! Redirigiendo...';
                loginMessage.className = 'text-center text-green-500 mb-4';
                // window.location.href = '/dashboard.html'; // Redirigir
            } else {
                loginMessage.textContent = 'Teléfono o contraseña incorrectos.';
                loginMessage.className = 'text-center text-red-500 mb-4';
            }
        }, 1000);
    });

    // Envío de Registro
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        registerMessage.textContent = ''; // Limpiar mensajes
        
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;

        if (password !== confirmPassword) {
            registerMessage.textContent = 'Las contraseñas no coinciden.';
            registerMessage.className = 'text-center text-red-500 my-4';
            return;
        }

        // --- Simulación de Carga ---
        registerMessage.textContent = 'Creando cuenta...';
        registerMessage.className = 'text-center text-blue-500 my-4';

        // --- Construir el objeto de datos según tu BD ---
        const tipo = userTypeSelect.value;
        const commonData = {
            id: 'id-generado-o-rfc-clave-' + Date.now(), // CouchDB genera _id, esto sería tu ID de app
            tipo: tipo,
            telefono: document.getElementById('reg-telefono').value,
            direccion: document.getElementById('reg-direccion').value,
            contraseña: password, // ¡Recuerda hashear esto en el backend!
        };
        
        let specificData = {};
        const rolSeleccionado = document.querySelector('input[name="rol"]:checked');

        switch (tipo) {
            case 'empresa':
                specificData = {
                    nombre: document.getElementById('empresa-nombre').value,
                    contacto: document.getElementById('empresa-contacto').value,
                    rol: 'donador' // Fijo según tu especificación
                };
                break;
            case 'gobierno':
                specificData = {
                    dependencia: document.getElementById('gob-dependencia').value,
                    contacto: document.getElementById('gob-contacto').value,
                    clave: document.getElementById('gob-clave').value,
                    rol: rolSeleccionado ? rolSeleccionado.value : null
                };
                break;
            case 'organizacion':
                specificData = {
                    nombre: document.getElementById('org-nombre').value,
                    contacto: document.getElementById('org-contacto').value,
                    clave: document.getElementById('org-clave').value,
                    rol: rolSeleccionado ? rolSeleccionado.value : null
                };
                break;
            case 'persona':
                const nombreCompleto = document.getElementById('persona-nombre').value;
                specificData = {
                    nombre: nombreCompleto,
                    contacto: nombreCompleto, // "igual a nombre"
                    rfc: document.getElementById('persona-rfc').value,
                    rol: rolSeleccionado ? rolSeleccionado.value : null
                };
                break;
        }
        
        // Objeto final a enviar a CouchDB
        const dataToSend = { ...commonData, ...specificData };
        
        console.log('Datos a enviar a CouchDB:', dataToSend);
        
        // --- AQUÍ VA TU LÓGICA DE REGISTRO ---
        // 1. Enviar 'dataToSend' a tu backend.
        // 2. Tu backend debe ver el campo 'dataToSend.tipo'.
        // 3. Según el tipo, guardar el documento en la base de datos
        //    de CouchDB correspondiente (ej: 'db_empresas', 'db_gobierno').
        // 4. Responder con éxito o error.

        // Simulación de respuesta
        setTimeout(() => {
            registerMessage.textContent = '¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.';
            registerMessage.className = 'text-center text-green-500 my-4';
            
            // Opcional: cambiar a la vista de login
            setTimeout(() => {
                showView('login-view');
                loginMessage.textContent = '¡Cuenta creada! Por favor, inicia sesión.';
                loginMessage.className = 'text-center text-green-500 mb-4';
                loginForm.reset();
                registerForm.reset();
                // Ocultar campos dinámicos de nuevo
                userTypeSelect.dispatchEvent(new Event('change'));
            }, 2000);
        }, 1500);
    });

});

const express = require("express");

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});