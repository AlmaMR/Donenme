// Define la URL base de tu API. 
// ¡Asegúrate de que coincida con tu backend!
const API_BASE_URL = 'http://localhost:3000/api'; // Asumiendo que esta es la base

document.addEventListener('DOMContentLoaded', () => {
    
    // Elementos principales
    const userName = document.getElementById('user-name');
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

    // Elementos del menú de usuario
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenu = document.getElementById('user-menu');
    const editProfileButton = document.getElementById('edit-profile-button');

    // Elementos del Modal de Edición de Perfil
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeEditModalButton = document.getElementById('close-edit-modal-button');
    const cancelEditModalButton = document.getElementById('cancel-edit-modal-button');
    const editProfileForm = document.getElementById('edit-profile-form');
    const editModalMessage = document.getElementById('edit-modal-message');

    // Elementos del Modal de Solicitud (Receptor)
    const solicitudModal = document.getElementById('solicitud-modal');
    const closeSolicitudModalButton = document.getElementById('close-solicitud-modal-button');
    const cancelSolicitudModalButton = document.getElementById('cancel-solicitud-modal-button');
    const solicitudForm = document.getElementById('solicitud-form');
    const solicitudModalMessage = document.getElementById('solicitud-modal-message');
    const solicitudProductosContainer = document.getElementById('solicitud-productos-container');
    const solicitudDonacionIdInput = document.getElementById('solicitud-donacionId');

    // --- NOTIFICATION ELEMENTS ---
    const notificationButton = document.getElementById('notification-button');
    const notificationBadge = document.getElementById('notification-badge');
    const notificationPanel = document.getElementById('notification-panel');
    const notificationList = document.getElementById('notification-list');


    let userToken = null; // Almacenará el token del usuario
    let currentUserData = null; // Almacenará los datos del usuario actual

    // --- 1. INICIALIZACIÓN Y AUTENTICACIÓN ---

    function initializeApp() {
        userToken = localStorage.getItem('donenme_token');
        
        // Si no hay token, no debe estar aquí. Redirigir a login.
        if (!userToken) {
            window.location.href = 'Login.html'; // Corregido para apuntar a Login.html
            return;
        }

        // --- Lógica del Menú de Usuario ---
        userMenuButton.addEventListener('click', () => {
            userMenu.classList.toggle('hidden');
        });

        editProfileButton.addEventListener('click', (e) => {
            e.preventDefault();
            userMenu.classList.add('hidden');
            openEditProfileModal(); // Nueva función para abrir el modal de edición
        });

        // Listeners para el modal de edición
        closeEditModalButton.addEventListener('click', () => editProfileModal.classList.add('hidden'));
        cancelEditModalButton.addEventListener('click', () => editProfileModal.classList.add('hidden'));
        editProfileForm.addEventListener('submit', handleProfileUpdate);

        // Listeners para el modal de solicitud
        closeSolicitudModalButton.addEventListener('click', () => solicitudModal.classList.add('hidden'));
        cancelSolicitudModalButton.addEventListener('click', () => solicitudModal.classList.add('hidden'));
        solicitudForm.addEventListener('submit', handleSolicitudSubmit);

        // --- NOTIFICATION LISTENERS ---
        notificationButton.addEventListener('click', () => {
            notificationPanel.classList.toggle('hidden');
            if (!notificationPanel.classList.contains('hidden')) {
                fetchNotifications();
            }
        });

        // Cerrar el menú si se hace clic fuera de él
        window.addEventListener('click', (e) => {
            if (!userMenuButton.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.classList.add('hidden');
            }
            if (!notificationButton.contains(e.target) && !notificationPanel.contains(e.target)) {
                notificationPanel.classList.add('hidden');
            }
        });

        // Agregar listener de logout
        logoutButton.addEventListener('click', logout);

        // Buscar los datos del usuario
        fetchUserProfile();

        // --- NOTIFICATION POLLING ---
        fetchUnreadCount();
        setInterval(fetchUnreadCount, 30000); // Actualiza cada 30 segundos
    }

    async function fetchUserProfile() {
        try {
            // Este endpoint debe devolver los datos del usuario (incluyendo el rol)
            // usando el token.
            const response = await fetchWithAuth(`/users/me`); // Ejemplo: /api/users/me

            if (!response.ok) {
                // Intentamos obtener más detalles del error desde el cuerpo de la respuesta
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`Error del servidor: ${response.status}. ${errorData.message || 'No se pudo obtener el perfil.'}`);
            }

            const userData = await response.json();
            currentUserData = userData; // Guardar los datos del usuario
            
            // Renderizar la información del header
            userName.textContent = `Hola, ${userData.nombre || 'Usuario'}`;

            if (userData.rol && (userData.rol === 'donador' || userData.rol === 'receptor')) {
                userRole.textContent = userData.rol;
                // Configurar la UI según el rol
                setupUIForRole(userData.rol);
            } else {
                const mainContent = document.getElementById('main-content');
                mainContent.innerHTML = `
                    <div class="text-center">
                        <h1 class="text-2xl font-bold text-red-600">Error: Rol de Usuario No Válido</h1>
                        <p class="text-gray-700 mt-2">
                            Tu rol actual es "${userData.rol || 'No definido'}". 
                            Para usar el dashboard, tu rol debe ser 'donador' o 'receptor'.
                        </p>
                        <p class="mt-4">Por favor, contacta a soporte para corregir tu perfil.</p>
                    </div>
                `;
                loadingSpinner.classList.add('hidden');
            }

        } catch (error) {
            console.error('Error al verificar sesión:', error);
            // Mostramos el error al usuario en una alerta para diagnóstico
            alert(`Error de autenticación: ${error.message}`);
            // Si el token es inválido, limpiar y redirigir
            logout();
        }
    }

    // --- MODAL DE EDICIÓN DE PERFIL ---

    function openEditProfileModal() {
        if (!currentUserData) {
            alert("No se han podido cargar los datos del usuario.");
            return;
        }

        // Rellenar el formulario con los datos actuales
        document.getElementById('edit-nombre').value = currentUserData.nombre || '';
        document.getElementById('edit-contacto').value = currentUserData.contacto || '';
        document.getElementById('edit-direccion').value = currentUserData.direccion || '';

        // Limpiar campos de contraseña y mensajes de error
        document.getElementById('edit-password').value = '';
        document.getElementById('edit-password-confirm').value = '';
        editModalMessage.textContent = '';

        // Mostrar el modal
        editProfileModal.classList.remove('hidden');
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();
        editModalMessage.textContent = '';

        const nombre = document.getElementById('edit-nombre').value;
        const contacto = document.getElementById('edit-contacto').value;
        const direccion = document.getElementById('edit-direccion').value;
        const password = document.getElementById('edit-password').value;
        const passwordConfirm = document.getElementById('edit-password-confirm').value;

        if (password !== passwordConfirm) {
            editModalMessage.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        const updateData = {
            nombre,
            contacto,
            direccion,
        };

        if (password) {
            updateData.contrasena = password;
        }

        try {
            const response = await fetchWithAuth('/users/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar el perfil.');
            }

            // Éxito - Actualizar UI y cerrar modal
            editProfileModal.classList.add('hidden');
            await fetchUserProfile(); // Recargar los datos para que se reflejen en el header
            alert('¡Perfil actualizado con éxito!');

        } catch (error) {
            editModalMessage.textContent = error.message;
        }
    }

    // --- NOTIFICATION FUNCTIONS ---

    async function fetchUnreadCount() {
        try {
            const response = await fetchWithAuth('/notificaciones/no-leidas');
            if (!response.ok) return;
            const data = await response.json();
            if (data.count > 0) {
                notificationBadge.textContent = data.count;
                notificationBadge.classList.remove('hidden');
            } else {
                notificationBadge.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }

    async function fetchNotifications() {
        notificationList.innerHTML = '<p class="p-4 text-gray-600">Cargando...</p>';
        try {
            const response = await fetchWithAuth('/notificaciones');
            if (!response.ok) throw new Error('No se pudieron cargar las notificaciones.');
            const notifications = await response.json();
            renderNotifications(notifications);
        } catch (error) {
            notificationList.innerHTML = `<p class="p-4 text-red-500">${error.message}</p>`;
        }
    }

    function renderNotifications(notifications) {
        notificationList.innerHTML = '';
        if (notifications.length === 0) {
            notificationList.innerHTML = '<p class="p-4 text-gray-600">No tienes notificaciones.</p>';
            return;
        }
        notifications.forEach(notif => {
            const div = document.createElement('div');
            div.className = `p-4 border-b cursor-pointer hover:bg-gray-100 ${notif.leida ? 'bg-gray-50 text-gray-500' : 'bg-white'}`;
            div.innerHTML = `
                <p class="font-semibold">${notif.titulo}</p>
                <p class="text-sm">${notif.mensaje}</p>
                <p class="text-xs text-gray-400 mt-1">${new Date(notif.fecha_creacion).toLocaleString()}</p>
            `;
            div.addEventListener('click', () => markNotificationAsRead(notif._id, div));
            notificationList.appendChild(div);
        });
    }

    async function markNotificationAsRead(notificationId, element) {
        try {
            await fetchWithAuth(`/notificaciones/${notificationId}/leer`, { method: 'PUT' });
            element.classList.remove('bg-white');
            element.classList.add('bg-gray-50', 'text-gray-500');
            fetchUnreadCount(); // Actualizar el contador
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    function logout() {
        localStorage.removeItem('donenme_token');
        window.location.href = 'Login.html'; // Corregido para apuntar a Login.html
    }

    // --- 2. CONFIGURACIÓN DE UI POR ROL ---

    async function setupUIForRole(role) {
        loadingSpinner.classList.add('hidden');

        if (role === 'donador') {
            donorView.classList.remove('hidden');
            setupDonorListeners();
            await loadAndRenderDonations(role);
        } else if (role === 'receptor') {
            recipientView.classList.remove('hidden');
            await loadAndRenderDonations(role);
        } else {
            // Rol desconocido
            userName.textContent = 'Error: Rol de usuario no reconocido.';
        }
    }

    // --- 3. LÓGICA DE DONACIONES (CARGA Y RENDERIZADO) ---

    async function loadAndRenderDonations(role) {
        const listElement = role === 'donador' ? donorDonationsList : recipientDonationsList;
        listElement.innerHTML = '<p class="text-gray-600">Cargando donaciones...</p>';
    
        try {
            const endpoint = role === 'donador' ? '/donaciones/mis-donaciones' : '/donaciones';
            const response = await fetchWithAuth(endpoint);
    
            console.log(response); // Log the response
            if (!response.ok) {
                throw new Error('No se pudieron cargar las donaciones.');
            }
            
            const donations = await response.json();
    
            if (role === 'donador') {
                renderDonorDonations(donations);
            } else {
                let misSolicitudes = [];
                try {
                    const solResponse = await fetchWithAuth('/solicitudes/mis-solicitudes');
                    if (solResponse.ok) {
                        misSolicitudes = await solResponse.json();
                    }
                } catch (error) {
                    console.error('Error al cargar mis solicitudes:', error);
                }
                renderRecipientDonations(donations, misSolicitudes);
            }
    
        } catch (error) {
            listElement.innerHTML = `<p class="text-red-500">Error al cargar las donaciones.</p>`;
            console.error('Error en loadAndRenderDonations:', error);
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
        newProductItem.removeAttribute('data-id'); // <-- ¡FIX! Eliminar el ID clonado

        // (Opcional) Agregar un botón de eliminar al nuevo item
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = 'Eliminar';
        removeButton.className = 'text-red-500 text-sm md:col-span-5 text-right';
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
            const id = item.dataset.id; // <-- Leer el ID del producto

            if (!tipo || !cantidad || !fecha_caducidad) {
                formIsValid = false;
            }

            const producto = {
                tipo,
                cantidad: parseInt(cantidad, 10),
                fecha_caducidad,
                descripcion,
            };

            if (id) {
                producto.id = id; // <-- Incluir el ID si existe
            }

            productos.push(producto);
        });

        if (!formIsValid || !punto_reunion) {
            modalMessage.textContent = 'Completa todos los campos (Tipo, Cantidad, Caducidad y Punto de Reunión).';
            return;
        }

        if (productos.length === 0) {
            modalMessage.textContent = 'Debes agregar al menos un producto.';
            return;
        }

        const donationData = { punto_reunion, productos };
        const editId = document.getElementById('edit-donation-id').value;
        const method = editId ? 'PUT' : 'POST';
        const endpoint = editId ? `/donaciones/${editId}` : '/donaciones';

        try {
            const response = await fetchWithAuth(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(donationData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al ${editId ? 'actualizar' : 'crear'} la donación.`);
            }

            // Éxito
            modal.classList.add('hidden'); // Ocultar modal
            addDonationForm.reset(); // Limpiar formulario
            document.getElementById('edit-donation-id').value = ''; // Limpiar ID de edición

            // Restaurar los campos de producto a su estado inicial
            productFieldsContainer.innerHTML = `
                <div class="product-item grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg items-center">
                    <input type="text" class="product-tipo w-full px-3 py-2 border rounded-lg" placeholder="Tipo (Ej: Arroz, Frijol)" required>
                    <div>
                        <label class="text-sm text-gray-600">Cant. Total</label>
                        <input type="number" class="product-cantidad w-full px-3 py-2 border rounded-lg" placeholder="Total" min="1" required>
                    </div>
                    <div>
                        <label class="text-sm text-gray-500">Restantes</label>
                        <p class="w-full px-3 py-2 bg-gray-100 rounded-lg"></p>
                    </div>
                    <input type="date" class="product-caducidad w-full px-3 py-2 border rounded-lg" required>
                    <input type="text" class="product-descripcion w-full px-3 py-2 border rounded-lg" placeholder="Descripción (Ej: Bolsa 1kg)">
                </div>
            `;
            
            await loadAndRenderDonations('donador'); // Recargar la lista de donaciones
            alert(`¡Donación ${editId ? 'actualizada' : 'creada'} con éxito!`);

        } catch (error) {
            modalMessage.textContent = error.message;
        }
    }

    async function renderDonorDonations(donations) {
        donorDonationsList.innerHTML = ''; // Limpiar lista

        if (donations.length === 0) {
            donorDonationsList.innerHTML = `<p class="text-gray-600">Aún no has registrado ninguna donación.</p>`;
            return;
        }

        for (const donacion of donations) {
            const card = document.createElement('div');
            card.id = `donacion-${donacion._id}`; // ID para poder eliminarlo de la UI
            card.className = 'border rounded-lg p-4 shadow-sm bg-gray-50';
            
            const productosHtml = donacion.productos.map(p => `
                <li class="text-sm py-1"> ${p.restantes} x ${p.tipo} (${p.descripcion || 'N/D'})</li>
            `).join('');

            let solicitudesHtml = '<p class="text-sm text-gray-500">No hay solicitudes pendientes.</p>';
            try {
                const response = await fetchWithAuth(`/donaciones/${donacion._id}/solicitudes`);
                if (response.ok) {
                    const solicitudes = await response.json();
                    if (solicitudes.length > 0) {
                        solicitudesHtml = solicitudes.map(s => `
                            <div class="border-t mt-2 pt-2">
                                <p class="text-sm font-semibold">Solicitud de: ${s.receptorNombre}</p>
                                <ul class="list-disc list-inside pl-4">
                                    ${s.productos.map(p => {
                                        const productoOriginal = donacion.productos.find(dp => dp.id === p.id);
                                        const descripcion = productoOriginal ? `(${productoOriginal.descripcion || 'N/D'})` : '';
                                        return `<li>${p.cantidad} x ${productoOriginal.tipo} ${descripcion}</li>`;
                                    }).join('')}
                                </ul>
                                <div class="text-right mt-2">
                                    <button class="text-sm font-medium text-green-600 hover:text-green-800 mr-2" onclick="aprobarSolicitud('${s._id}')">Aprobar</button>
                                    <button class="text-sm font-medium text-red-600 hover:text-red-800" onclick="rechazarSolicitud('${s._id}')">Rechazar</button>
                                </div>
                            </div>
                        `).join('');
                    }
                }
            } catch (error) {
                console.error('Error al cargar solicitudes:', error);
            }

            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-gray-800">Punto de Reunión: ${donacion.punto_reunion}</p>
                        <p class="text-sm text-gray-500">ID: ${donacion._id}</p>
                        <p class="text-sm text-gray-600">Fecha: ${new Date(donacion.fecha_ingreso).toLocaleDateString()}</p>
                    </div>
                </div>
                <ul class="mt-2 list-disc list-inside bg-white p-2 rounded">${productosHtml}</ul>
                <div class="mt-4">
                    <h4 class="font-semibold text-gray-700">Solicitudes Pendientes</h4>
                    <div class="mt-2 space-y-2">${solicitudesHtml}</div>
                </div>
                <div class="mt-2 text-right"> 
                    <button class="text-sm font-medium text-blue-600 hover:text-blue-800 mr-4" onclick="editDonation('${donacion._id}')">Modificar</button>
                    <button class="text-sm font-medium text-red-600 hover:text-red-800" onclick="deleteDonation('${donacion._id}')">Eliminar</button>
                </div>
            `;
            donorDonationsList.appendChild(card);
        }
    }


    // --- 4. LÓGICA DEL ROL: RECEPTOR ---

    function renderRecipientDonations(donations, misSolicitudes) {
        recipientDonationsList.innerHTML = '';
    
        if (donations.length === 0) {
            recipientDonationsList.innerHTML = `<p class="text-gray-600">No hay donaciones disponibles por el momento.</p>`;
            return;
        }
    
        const groupedByDonor = donations.reduce((acc, donacion) => {
            const donorName = donacion.donador ? donacion.donador.nombre : 'Donador Anónimo';
            if (!acc[donorName]) {
                acc[donorName] = [];
            }
            acc[donorName].push(donacion);
            return acc;
        }, {});
    
        for (const donorName in groupedByDonor) {
            const groupContainer = document.createElement('div');
            groupContainer.className = 'mb-6';
            
            const title = document.createElement('h2');
            title.className = 'text-xl font-semibold text-emerald-700 mb-2 border-b pb-1';
            title.textContent = `Donaciones de: ${donorName}`;
            groupContainer.appendChild(title);
            
            const donationCardsContainer = document.createElement('div');
            donationCardsContainer.className = 'space-y-4';
    
            groupedByDonor[donorName].forEach(donacion => {
                const card = document.createElement('div');
                card.id = `donacion-${donacion._id}`;
                card.className = 'border rounded-lg p-4 shadow-sm bg-gray-50';
    
                const productosHtml = donacion.productos.map(p => `
                    <li class="text-sm py-1"> ${p.restantes} x ${p.tipo} (${p.descripcion || 'N/D'})</li>
                `).join('');
    
                const solicitudExistente = misSolicitudes.find(s => s.donacionId === donacion._id);
                let buttonHtml = '';
                if (solicitudExistente) {
                    if (solicitudExistente.estado === 'rechazada') {
                        buttonHtml = `<span class="bg-red-500 text-white px-4 py-2 rounded-md font-semibold cursor-default select-none">Solicitud Rechazada: ${solicitudExistente.comentario}</span>`;
                    } else {
                        buttonHtml = `<span class="bg-yellow-500 text-white px-4 py-2 rounded-md font-semibold cursor-default select-none">Solicitud ${solicitudExistente.estado}</span>`;
                    }
                } else {
                    buttonHtml = `
                        <button onclick="openSolicitudModal('${donacion._id}')" class="reclamar-btn bg-emerald-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition duration-300">
                            Reclamar Donación
                        </button>
                    `;
                }            
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-semibold text-gray-800">Punto de Reunión: ${donacion.punto_reunion}</p>
                            <p class="text-sm text-gray-600">Fecha: ${new Date(donacion.fecha_ingreso).toLocaleDateString()}</p>
                        </div>
                        <div class="text-right">
                            ${buttonHtml}
                        </div>
                    </div>
                    <ul class="mt-2 list-disc list-inside bg-white p-2 rounded">${productosHtml}</ul>
                `;
                donationCardsContainer.appendChild(card);
            });
    
            groupContainer.appendChild(donationCardsContainer);
            recipientDonationsList.appendChild(groupContainer);
        }
    }

    // --- 5. LÓGICA DEL MODAL DE SOLICITUD (RECEPTOR) ---

    window.openSolicitudModal = async function(donacionId) {
        solicitudModal.classList.remove('hidden');
        solicitudDonacionIdInput.value = donacionId;
        solicitudProductosContainer.innerHTML = '<p class="text-gray-600">Cargando productos...</p>';

        try {
            const response = await fetchWithAuth(`/donaciones/${donacionId}`);
            if (!response.ok) {
                throw new Error('No se pudieron cargar los detalles de la donación.');
            }
            const donacion = await response.json();
            renderSolicitudProductos(donacion.productos);
        } catch (error) {
            solicitudProductosContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }

    function renderSolicitudProductos(productos) {
        solicitudProductosContainer.innerHTML = '';
        productos.forEach(producto => {
            if (producto.restantes > 0) {
                const productoDiv = document.createElement('div');
                productoDiv.className = 'flex items-center justify-between p-2 border rounded-lg';
                productoDiv.innerHTML = `
                    <div>
                        <p class="font-semibold">${producto.tipo}</p>
                        <p class="text-sm text-gray-600">Disponibles: ${producto.restantes}</p>
                    </div>
                    <input type="number" name="producto_${producto.id}" class="w-24 px-2 py-1 border rounded-lg" min="1" max="${producto.restantes}" placeholder="0">
                `;
                solicitudProductosContainer.appendChild(productoDiv);
            }
        });
    }

    async function handleSolicitudSubmit(e) {
        e.preventDefault();
        solicitudModalMessage.textContent = '';

        const formData = new FormData(solicitudForm);
        const donacionId = formData.get('donacionId');
        const fecha_encuentro = formData.get('fecha_encuentro');
        const hora_encuentro = formData.get('hora_encuentro');
        const contacto = formData.get('contacto');
        const comentario = formData.get('comentario');

        const productos = [];
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('producto_') && value > 0) {
                productos.push({
                    id: key.replace('producto_', ''),
                    cantidad: parseInt(value, 10),
                });
            }
        }

        if (productos.length === 0) {
            solicitudModalMessage.textContent = 'Debes solicitar al menos un producto.';
            return;
        }

        const solicitudData = {
            donacionId,
            productos,
            fecha_encuentro,
            hora_encuentro,
            contacto,
            comentario,
        };

        try {
            const response = await fetchWithAuth('/solicitudes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(solicitudData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al enviar la solicitud.');
            }

            solicitudModalMessage.textContent = '¡Solicitud enviada con éxito!';
            solicitudModalMessage.classList.remove('text-red-500');
            solicitudModalMessage.classList.add('text-green-500');


            setTimeout(() => {
                solicitudModal.classList.add('hidden');
                solicitudForm.reset();
                loadAndRenderDonations('receptor');
            }, 2000);

        } catch (error) {
            solicitudModalMessage.textContent = error.message;
        }
    }

    // --- FUNCIONES DE MODIFICACIÓN Y ELIMINACIÓN DE DONACIONES ---

    window.editDonation = async function(donacionId) {
        try {
            const response = await fetchWithAuth(`/donaciones/${donacionId}`);
            if (!response.ok) {
                alert("Error al cargar los datos de la donación para editar.");
                return;
            }
            const donacion = await response.json();

            if (!donacion) {
                alert("Error: No se encontraron los datos de la donación.");
                return;
            }

            const totalRestante = donacion.productos.reduce((total, p) => total + (p.restantes || 0), 0);

            if (totalRestante === 0) {
                alert('Esta donación ya no tiene stock disponible y no puede ser modificada.');
                return;
            }

            // Cambiar título y botón del modal
            modal.querySelector('h3').textContent = 'Modificar Donación';
            modal.querySelector('button[type="submit"]').textContent = 'Guardar Cambios';

            // Rellenar los campos
            document.getElementById('edit-donation-id').value = donacion._id;
            document.getElementById('punto_reunion').value = donacion.punto_reunion;

            // Limpiar y rellenar productos
            let productsHtml = '';
            if (donacion.productos && donacion.productos.length > 0) {
                donacion.productos.forEach(p => {
                    // Asegurarse de que la fecha de caducidad existe antes de hacer split
                    const fechaCaducidad = p.fecha_caducidad ? p.fecha_caducidad.split('T')[0] : '';
                    
                    // --- INICIO DE LA LÓGICA DE MODIFICACIÓN (CORREGIDA) ---
                    const cantidadReclamada = p.cantidad - p.restantes;
                    // El nuevo total no puede ser menor a lo ya reclamado.
                    const minPermitido = cantidadReclamada;
                    // El nuevo total no puede ser mayor al total original (regla: no aumentar).
                    const maxPermitido = p.cantidad;

                    productsHtml += `
                        <div class="product-item grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg items-center" data-id="${p.id}">
                            <input type="text" class="product-tipo w-full px-3 py-2 border rounded-lg" placeholder="Tipo (Ej: Arroz, Frijol)" value="${p.tipo || ''}" required>
                            <div>
                                <label class="text-sm text-gray-600">Cant. Total</label>
                                <input type="number" class="product-cantidad w-full px-3 py-2 border rounded-lg" placeholder="Total" min="${minPermitido}" max="${p.restantes}" value="${p.restantes}" required>
                            </div>
                            <div>
                                <label class="text-sm text-gray-500">Restantes</label>
                                <p class="w-full px-3 py-2 bg-gray-100 rounded-lg">${p.restantes}</p>
                            </div>
                            <input type="date" class="product-caducidad w-full px-3 py-2 border rounded-lg" value="${fechaCaducidad}" required>
                            <input type="text" class="product-descripcion w-full px-3 py-2 border rounded-lg" placeholder="Descripción (Ej: Bolsa 1kg)" value="${p.descripcion || ''}">
                            <button type="button" class="text-red-500 text-sm md:col-span-5 text-right" onclick="this.parentElement.remove()">Eliminar</button>
                        </div>
                    `;
                });
            }
            
            // Si después del bucle no hay HTML (porque no había productos), agregar un campo vacío
            if (productsHtml === '') {
                productsHtml = `
                    <div class="product-item grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg items-center">
                        <input type="text" class="product-tipo w-full px-3 py-2 border rounded-lg" placeholder="Tipo (Ej: Arroz, Frijol)" required>
                        <div>
                            <label class="text-sm text-gray-600">Cant. Total</label>
                            <input type="number" class="product-cantidad w-full px-3 py-2 border rounded-lg" placeholder="Total" min="1" required>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">Restantes</label>
                            <p class="w-full px-3 py-2 bg-gray-100 rounded-lg"></p>
                        </div>
                        <input type="date" class="product-caducidad w-full px-3 py-2 border rounded-lg" required>
                        <input type="text" class="product-descripcion w-full px-3 py-2 border rounded-lg" placeholder="Descripción (Ej: Bolsa 1kg)">
                    </div>
                `;
            }
            productFieldsContainer.innerHTML = productsHtml;

            modal.classList.remove('hidden');
        } catch (error) {
            console.error("Error en la función editDonation:", error);
            alert("Ocurrió un error inesperado al intentar modificar la donación. Revisa la consola para más detalles.");
        }
    }

    window.deleteDonation = async function(donacionId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta donación? Esta acción es permanente.')) {
            return;
        }

        try {
            const response = await fetchWithAuth(`/donaciones/${donacionId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo eliminar la donación.');
            }

            // Recargar la lista de donaciones para reflejar la eliminación
            await loadAndRenderDonations('donador');

            alert('¡Donación eliminada con éxito!');

        } catch (error) {
            console.error('Error al eliminar donación:', error);
            alert('Error: ' + error.message);
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
            cache: 'no-cache', // Prevenir el cacheo de las respuestas
        });

        return response;
    }

    window.aprobarSolicitud = async function(solicitudId) {
        if (!confirm('¿Estás seguro de que quieres aprobar esta solicitud?')) {
            return;
        }
    
        try {
            const response = await fetchWithAuth(`/solicitudes/${solicitudId}/aprobar`, {
                method: 'PUT',
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo aprobar la solicitud.');
            }
    
            alert('¡Solicitud aprobada con éxito!');
    
            // Esperar un momento para que la base de datos se actualice antes de volver a cargar
            setTimeout(() => {
                loadAndRenderDonations('donador');
            }, 500); // 500ms de retraso
    
        } catch (error) {
            console.error('Error al aprobar solicitud:', error);
            alert('Error: ' + error.message);
        }
    }
    
    window.rechazarSolicitud = async function(solicitudId) {
        const comentario = prompt('Por favor, introduce un comentario para el rechazo:');
        if (comentario === null) { // El usuario canceló el prompt
            return;
        }
    
        try {
            const response = await fetchWithAuth(`/solicitudes/${solicitudId}/rechazar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comentario }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo rechazar la solicitud.');
            }
    
            alert('¡Solicitud rechazada con éxito!');
    
            // Esperar un momento para que la base de datos se actualice
            setTimeout(() => {
                loadAndRenderDonations('donador');
            }, 500); // 500ms de retraso
    
        } catch (error) {
            console.error('Error al rechazar solicitud:', error);
            alert('Error: ' + error.message);
        }
    }

    // --- Iniciar la aplicación ---
    initializeApp();
});