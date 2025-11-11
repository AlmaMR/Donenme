// Frontend/solicitud.app.js

const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const donacionIdInput = document.getElementById('donacionId');
    const productosContainer = document.getElementById('productos-container');
    const solicitudForm = document.getElementById('solicitud-form');
    const solicitudMessage = document.getElementById('solicitud-message');
    let userToken = null;

    // 1. Inicialización y obtener el ID de la donación
    function initializeApp() {
        userToken = localStorage.getItem('donenme_token');
        if (!userToken) {
            window.location.href = 'Login.html';
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const donacionId = urlParams.get('donacionId');

        if (!donacionId) {
            solicitudMessage.textContent = 'Error: No se especificó un ID de donación.';
            solicitudMessage.className = 'text-red-500';
            return;
        }

        donacionIdInput.value = donacionId;
        fetchDonationDetails(donacionId);

        solicitudForm.addEventListener('submit', handleSolicitudSubmit);
    }

    // 2. Obtener los detalles de la donación
    async function fetchDonationDetails(donacionId) {
        try {
            const response = await fetchWithAuth(`/donaciones/${donacionId}`);
            if (!response.ok) {
                throw new Error('No se pudieron cargar los detalles de la donación.');
            }
            const donacion = await response.json();
            renderProductos(donacion.productos);
        } catch (error) {
            productosContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        }
    }

    // 3. Renderizar los productos en el formulario
    function renderProductos(productos) {
        productosContainer.innerHTML = '';
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
                productosContainer.appendChild(productoDiv);
            }
        });
    }

    // 4. Manejar el envío del formulario
    async function handleSolicitudSubmit(e) {
        e.preventDefault();
        solicitudMessage.textContent = '';

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
            solicitudMessage.textContent = 'Debes solicitar al menos un producto.';
            solicitudMessage.className = 'text-red-500';
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

            solicitudMessage.textContent = '¡Solicitud enviada con éxito! Redirigiendo...';
            solicitudMessage.className = 'text-green-500';

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            solicitudMessage.textContent = error.message;
            solicitudMessage.className = 'text-red-500';
        }
    }

    // Función utilitaria para fetch con autenticación
    async function fetchWithAuth(endpoint, options = {}) {
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${userToken}`,
        };
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
        return response;
    }

    initializeApp();
});
