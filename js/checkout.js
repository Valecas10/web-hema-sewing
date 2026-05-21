/**
 * =========================
 * CHECKOUT
 * =========================
 */

function inicializarCheckout() {

    const btnEnviar = document.getElementById('boton-enviar-pedido');

    if (!btnEnviar) return;

    btnEnviar.addEventListener('click', async () => {

        const boton = document.getElementById('boton-enviar-pedido');

        const camposAValidar = [
            { id: 'nombre-cliente', nombre: 'Nombre' },
            { id: 'email-cliente', nombre: 'Email' },
            { id: 'telefono-cliente', nombre: 'Teléfono' },
            { id: 'input-ciudad', nombre: 'Ciudad' },
            { id: 'input-calle', nombre: 'Calle' }
        ];

        let hayError = false;

        camposAValidar.forEach(campo => {
            const input = document.getElementById(campo.id);
            const contenedor = input.closest('.campo'); 

            if (input.value.trim() === "") {
                contenedor.classList.add('error');
                hayError = true;
            } else {
                contenedor.classList.remove('error');
            }
            });

        if (hayError || !latitudFinal) {
            mostrarToast("Por favor, completa los campos marcados y selecciona una dirección válida en el mapa.", 'success');
            return;
        }

        const emailInput = document.getElementById('email-cliente');
        const email = emailInput.value.trim();

        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!regexEmail.test(email)) {

            mostrarToast('Ingresá un email válido.', 'error');

            emailInput.closest('.campo').classList.add('error');

            return;
        }

        const telefonoInput = document.getElementById('telefono-cliente');

        const telefonoLimpio = telefonoInput.value
            .replace(/\s/g, '')
            .replace(/-/g, '');

        if (!/^\d+$/.test(telefonoLimpio) || telefonoLimpio.length < 8) {

            mostrarToast('Ingresá un teléfono válido.', 'error');

            telefonoInput.closest('.campo').classList.add('error');

            return;
        }

        const trackingID = generarCodigoSeguimiento();

        const productosHTML = carrito.map((producto, index) => {

            // =========================
            // PRODUCTO CATÁLOGO
            // =========================

            if (producto.personalizacion === 'catalogo') {

                return `
                    <div style="
                        margin-bottom:15px;
                        padding:10px;
                        border:1px solid #ddd;
                        border-radius:8px;
                    ">

                        <strong>Producto ${index + 1}</strong><br>

                        🛍️ Producto: ${producto.nombre}<br>

                        💰 Precio: $${producto.precio}

                    </div>
                `;
            }

            // =========================
            // TOTE PERSONALIZADA
            // =========================

            return `
                <div style="
                    margin-bottom:15px;
                    padding:10px;
                    border:1px solid #ddd;
                    border-radius:8px;
                ">

                    <strong>Tote Personalizada ${index + 1}</strong><br>

                    👜 Tela: ${producto.nombre}<br>

                    ✨ Personalización:
                    ${producto.personalizacion || 'Sin personalización'}<br>

                    💰 Precio: $${producto.precio}

                </div>
            `;

        }).join('');

        const pedido = {
            cliente: document.getElementById('nombre-cliente').value,
            tracking_id: trackingID,
            email: email,
            telefono: telefonoLimpio,
                
            productos: carrito,
            productos_html: productosHTML,
            total: calcularTotal(),

            provincia: document.getElementById('select-provincia').value,
            ciudad: document.getElementById('input-ciudad').value,
            calle: document.getElementById('input-calle').value,
            link_mapa: `https://www.google.com/maps?q=${latitudFinal},${longitudFinal}`,
            dato_extra: document.getElementById('dato-extra').value,
            direccionMapa: direccionValidada
        };  

        if (!pedido.cliente || !latitudFinal) {
            mostrarToast("Completa los datos y selecciona una dirección válida.", 'error');
            return;
        }

        boton.disabled = true;
        boton.classList.add('loading');
        const textoOriginal = boton.innerText;
        boton.innerText = "Procesando pedido...";

        try {
            await fetch(URL_WEB_APP_EXCEL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(pedido)
            });

            await emailjs.send(
                'service_gnblx8l',
                'template_76chn1e',
                pedido
            );

            await emailjs.send(
                'service_gnblx8l',
                'template_so9n0at',
                pedido
            );

            boton.innerText = 'Confirmado';
            boton.classList.remove('loading');

        } catch (error) {
            mostrarToast("Error al enviar.", 'error');
            boton.classList.remove('loading');
            boton.disabled = false;
            boton.innerText = textoOriginal;
        }

        document.getElementById('codigo-final').innerText = trackingID;

        mostrarVista('pedido-exitoso');

    });

}

function enviarCotizacionWhatsApp() {
    let mensaje = "¡Hola Nai! Quiero pedir un presupuesto para el siguiente pedido:\n\n";
    
    carrito.forEach((producto, index) => {
        mensaje += `${index + 1}- ${producto.nombre}\n`;
        mensaje += `   Personalización: ${producto.personalizacion}\n`;
        mensaje += `\n`; 
    });

    mensaje += "¡Quedo a la espera de la cotización y el link para cargar mis datos de envío!";

    const numeroWhatsApp = "5492234661146"; 
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
}