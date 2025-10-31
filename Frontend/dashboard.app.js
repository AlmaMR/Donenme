// Define la URL base de tu API. 
// ¡Asegúrate de que coincida con tu backend!
const API_BASE_URL = 'http://localhost:3000/api'; // Asumiendo que esta es la base

document.addEventListener('DOMContentLoaded', () => {
    
    // Elementos principales
    const userGreeting = document.getElementById('user-greeting');
    const userRole = document.getElementById('user-role');
    const logoutButton = document.getElementById('logout-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    // Vistas
    const donorView = document.getElementById('donor-view');
    const recipientView = document.getElementById('recipient-view');

    // Listas de contenido
    const donorDonationsList = document.getElementById('donor-donations-list');
    const recipientDonationsList = document.getElementById('recipient-donations-list');

    // Elementos del Modal (Donador)
    const modal = document.getElementById('add-donation-modal');
    const openModalButton = document.getElementById('open-modal-button');
    const closeModalButton = document.getElementById('close-modal-button');
    const cancelModalButton = document.getElementById('cancel-modal-button');
    const addProductButton = document.getElementById('add-product-button');
    const productFieldsContainer = document.getElementById('product-fields-container');
    const addDonationForm = document.getElementById('add-donation-form');
    const modalMessage = document.getElementById('modal-message');

    let userToken = null; // Almacenará el token del usuario

    // --- 1. INICIALIZACIÓN Y AUTENTICACIÓN ---

    function initializeApp() {
        userToken = localStorage.getItem('donenme_token');
        
        // Si no hay token, no debe estar aquí. Redirigir a login.
        if (!userToken) {
            window.location.href = 'donenme.html';
            return;
        }

        // Agregar listener de logout
        logoutButton.addEventListener('click', logout);

        // Buscar los datos del usuario
        fetchUserProfile();
    }

    async function fetchUserProfile() {
        try {
            // Este endpoint debe devolver los datos del usuario (incluyendo el rol)
            // usando el token.
            const response = await fetchWithAuth(`/users/me`); // Ejemplo: /api/users/me

            if (!response.ok) {
                throw new Error('Sesión inválida o expirada.');
            }

            const userData = await response.json();
            
            // Renderizar la información del header
            userGreeting.textContent = `Hola, ${userData.nombre || 'Usuario'}`;
            userRole.textContent = `Rol: ${userData.rol}`; // Asumo que el rol viene como 'donador' o 'receptor'

            // Configurar la UI según el rol
            setupUIForRole(userData.rol);

        } catch (error) {
            console.error('Error al verificar sesión:', error);
            // Si el token es inválido, limpiar y redirigir
            logout();
        }
    }

    function logout() {
        localStorage.removeItem('donenme_token');
        window.location.href = 'donenme.html';
    }

    // --- 2. CONFIGURACIÓN DE UI POR ROL ---

    function setupUIForRole(role) {
        loadingSpinner.classList.add('hidden');

        if (role === 'donador') {
            donorView.classList.remove('hidden');
            setupDonorListeners();
            fetchDonorDonations();
        } else if (role === 'receptor') {
            recipientView.classList.remove('hidden');
            fetchAllDonations();
        } else {
            // Rol desconocido
            userGreeting.textContent = 'Error: Rol de usuario no reconocido.';
        }
    }

    // --- 3. LÓGICA DEL ROL: DONADOR ---

    function setupDonorListeners() {
        // Abrir y cerrar modal
        openModalButton.addEventListener('click', () => modal.classList.remove('hidden'));
        closeModalButton.addEventListener('click', () => modal.classList.add('hidden'));
        cancelModalButton.addEventListener('click', () => modal.classList.add('hidden'));
        
        // Agregar más campos de producto
        addProductButton.addEventListener('click', addProductField);

        // Enviar formulario de donación
        addDonationForm.addEventListener('submit', handleDonationSubmit);
    }

    function addProductField() {
        // Clonar el primer item de producto para usarlo como plantilla
        const firstProductItem = productFieldsContainer.querySelector('.product-item');
        const newProductItem = firstProductItem.cloneNode(true);

        // Limpiar los valores del nuevo item
        newProductItem.querySelectorAll('input').forEach(input => input.value = '');

        // (Opcional) Agregar un botón de eliminar al nuevo item
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = 'Eliminar';
        removeButton.className = 'text-red-500 text-sm md:col-span-4 text-right';
        removeButton.onclick = () => newProductItem.remove();
        newProductItem.appendChild(removeButton);

        productFieldsContainer.appendChild(newProductItem);
    }

    async function handleDonationSubmit(e) {
        e.preventDefault();
        modalMessage.textContent = '';

        const punto_reunion = document.getElementById('punto_reunion').value;
        const productItems = productFieldsContainer.querySelectorAll('.product-item');
        
        const productos = [];
        let formIsValid = true;

        productItems.forEach(item => {
            const tipo = item.querySelector('.product-tipo').value;
            const cantidad = item.querySelector('.product-cantidad').value;
            const fecha_caducidad = item.querySelector('.product-caducidad').value;
            const descripcion = item.querySelector('.product-descripcion').value;

            if (!tipo || !cantidad || !fecha_caducidad) {
                formIsValid = false;
            }

            productos.push({
                tipo,
                cantidad: parseInt(cantidad, 10),
                fecha_caducidad,
                descripcion,
                entregado: false // Por defecto al crear
            });
        });

        if (!formIsValid || !punto_reunion) {
            modalMessage.textContent = 'Completa todos los campos (Tipo, Cantidad, Caducidad y Punto de Reunión).';
            return;
        }

        if (productos.length === 0) {
            modalMessage.textContent = 'Debes agregar al menos un producto.';
            return;
        }

        // Crear el objeto 'donativo' según tu BD
        const newDonativo = {
            // 'donador' se debería asignar en el backend usando el token
            punto_reunion,
            productos
            // 'fecha_ingreso' también debería asignarla el backend
        };

        try {
            const response = await fetchWithAuth('/donativos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDonativo),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear la donación.');
            }

            // Éxito
            modal.classList.add('hidden'); // Ocultar modal
            addDonationForm.reset(); // Limpiar formulario
            productFieldsContainer.innerHTML = ''; // Limpiar productos
            addProductField(); // Dejar un campo de producto listo
            
            fetchDonorDonations(); // Recargar la lista de donaciones

        } catch (error) {
            modalMessage.textContent = error.message;
        }
    }

    async function fetchDonorDonations() {
        try {
            // Endpoint que devuelve solo las donaciones del usuario autenticado
            const response = await fetchWithAuth('/donativos/mis-donativos'); 
            const donations = await response.json();
            renderDonorDonations(donations);
        } catch (error) {
            donorDonationsList.innerHTML = `<p class="text-red-500">Error al cargar tus donaciones.</p>`;
        }
    }

    function renderDonorDonations(donations) {
        donorDonationsList.innerHTML = ''; // Limpiar lista

        if (donations.length === 0) {
            donorDonationsList.innerHTML = `<p class="text-gray-600">Aún no has registrado ninguna donación.</p>`;
            return;
        }

        donations.forEach(donativo => {
            const card = document.createElement('div');
            card.className = 'border rounded-lg p-4 shadow-sm bg-gray-50';
            
            const productosHtml = donativo.productos.map(p => `
                <li class="flex justify-between items-center text-sm py-1">
                    <span>${p.cantidad} x ${p.tipo} (${p.descripcion || 'N/D'}) - Cad: ${p.fecha_caducidad}</span>
                    <span class="font-medium ${p.entregado ? 'text-green-600' : 'text-yellow-600'}">
                        ${p.entregado ? 'Entregado' : 'Pendiente'}
                    </span>
                </li>
            `).join('');

            card.innerHTML = `
                <p class="text-sm text-gray-500">ID Donación: ${donativo.id}</p>
                <p class="font-semibold text-gray-800">Punto de Reunión: ${donativo.punto_reunion}</p>
                <p class="text-sm text-gray-600">Fecha de Ingreso: ${new Date(donativo.fecha_ingreso).toLocaleDateString()}</p>
                <ul class="mt-2 list-disc list-inside bg-white p-2 rounded">${productosHtml}</ul>
            `;
            donorDonationsList.appendChild(card);
        });
    }


    // --- 4. LÓGICA DEL ROL: RECEPTOR ---

    async function fetchAllDonations() {
        try {
            // Endpoint que devuelve TODAS las donaciones
            const response = await fetchWithAuth('/donativos'); 
            const donations = await response.json();
            renderRecipientDonations(donations);
        } catch (error) {
            recipientDonationsList.innerHTML = `<p class="text-red-500">Error al cargar las donaciones disponibles.</p>`;
        }
    }

    function renderRecipientDonations(donations) {
        recipientDonationsList.innerHTML = '';

        if (donations.length === 0) {
            recipientDonationsList.innerHTML = `<p class="text-gray-600">No hay donaciones disponibles por el momento.</p>`;
            return;
        }

        // Agrupar donaciones por donador (según tu requisito)
        const groupedByDonor = donations.reduce((acc, donativo) => {
            const donorName = donativo.donador.nombre || donativo.donador; // Asumiendo que 'donador' es un objeto o un string
            if (!acc[donorName]) {
                acc[donorName] = [];
            }
            acc[donorName].push(donativo);
            return acc;
        }, {});


        // Renderizar por cada grupo de donador
        for (const donorName in groupedByDonor) {
            const groupContainer = document.createElement('div');
            groupContainer.className = 'mb-6';
            
            // Título del grupo de donador
            const title = document.createElement('h2');
            title.className = 'text-xl font-semibold text-emerald-700 mb-2 border-b pb-1';
            title.textContent = `Donaciones de: ${donorName}`;
            groupContainer.appendChild(title);
            
            const donationCardsContainer = document.createElement('div');
            donationCardsContainer.className = 'space-y-4';

            // Renderizar cada donación de ese donador
            groupedByDonor[donorName].forEach(donativo => {
                const card = document.createElement('div');
                card.className = 'border rounded-lg p-4 shadow-sm bg-gray-50';

                const productosHtml = donativo.productos.map(p => {
                    // Botón de solicitar (solo si no está entregado)
                    const buttonHtml = p.entregado
                        ? `<button class="text-sm font-medium text-gray-500" disabled>Solicitado</button>`
                        : `<button class="solicitar-btn text-sm font-medium text-emerald-600 hover:text-emerald-800" 
                                    data-donativo-id="${donativo.id}" 
                                    data-producto-id="${p.id}">
                                Solicitar
                          </button>`;

                    return `
                        <li class="flex justify-between items-center py-1">
                            <div>
                                <span class="text-sm">${p.cantidad} x ${p.tipo} (${p.descripcion || 'N/D'})</span>
                                <br>
                                <span class="text-xs text-gray-500">Cad: ${p.fecha_caducidad}</span>
                            </div>
                            ${buttonHtml}
                        </li>
                    `;
                }).join('');

                card.innerHTML = `
                    <p class="font-semibold text-gray-800">Punto de Reunión: ${donativo.punto_reunion}</p>
                    <p class="text-sm text-gray-600">Fecha de Ingreso: ${new Date(donativo.fecha_ingreso).toLocaleDateString()}</p>
                    <ul class="mt-2 bg-white p-2 rounded divide-y divide-gray-200">${productosHtml}</ul>
                `;
                donationCardsContainer.appendChild(card);
            });

            groupContainer.appendChild(donationCardsContainer);
            recipientDonationsList.appendChild(groupContainer);
        }

        // Agregar Event Listeners a todos los botones de "Solicitar"
        recipientDonationsList.querySelectorAll('.solicitar-btn').forEach(button => {
            button.addEventListener('click', handleProductRequest);
        });
    }

    async function handleProductRequest(e) {
        const button = e.target;
        const { donativoId, productoId } = button.dataset;

        if (!confirm('¿Estás seguro de que deseas solicitar este producto? Esta acción no se puede deshacer.')) {
            return;
        }

        button.disabled = true;
        button.textContent = 'Procesando...';

        try {
            // Este endpoint en el backend debe cambiar 'entregado' a 'true'
            const response = await fetchWithAuth(`/donativos/${donativoId}/productos/${productoId}/solicitar`, {
                method: 'PATCH', // Usamos PATCH para actualizar parcialmente
            });

            if (!response.ok) {
                throw new Error('No se pudo procesar la solicitud.');
            }

            // Éxito: Cambiar el botón a "Solicitado"
            button.textContent = 'Solicitado';
            button.classList.remove('text-emerald-600', 'hover:text-emerald-800');
            button.classList.add('text-gray-500');
            // No es necesario recargar todo, solo actualizamos el botón.
            
        } catch (error) {
            console.error('Error al solicitar producto:', error);
            alert('Error: ' + error.message);
            button.disabled = false;
            button.textContent = 'Solicitar'; // Revertir si falla
        }
    }


    // --- 5. FUNCIÓN UTILITARIA PARA FETCH ---

    // Wrapper para fetch que incluye automáticamente el token de autorización
    async function fetchWithAuth(endpoint, options = {}) {
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${userToken}`,
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        return response;
    }

    // --- Iniciar la aplicación ---
    initializeApp();
});
