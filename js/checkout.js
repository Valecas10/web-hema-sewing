/**
 * =========================
 * CHECKOUT
 * =========================
 */

function inicializarCheckout() {

    const btnEnviar = document.getElementById('boton-enviar-pedido');

    if (!btnEnviar) return;

    btnEnviar.addEventListener('click', async () => {

        /*if (boton.disabled) return;

        boton.disabled = true;*/
        
        const boton = document.getElementById('boton-enviar-pedido');

        // 1. LISTA DE INPUTS A VALIDAR
        const camposAValidar = [
            { id: 'nombre-cliente', nombre: 'Nombre' },
            { id: 'email-cliente', nombre: 'Email' },
            { id: 'telefono-cliente', nombre: 'Teléfono' },
            { id: 'input-ciudad', nombre: 'Ciudad' },
            { id: 'input-calle', nombre: 'Calle' }
        ];

        let hayError = false;

        // 2. LOGICA DE VALIDACIÓN VISUAL
        camposAValidar.forEach(campo => {
            const input = document.getElementById(campo.id);
            const contenedor = input.closest('.campo'); // El div con la clase .campo

            if (input.value.trim() === "") {
                contenedor.classList.add('error'); // Activa el CSS de la cruz y borde rojo
                hayError = true;
            } else {
                contenedor.classList.remove('error');
            }
            });

         // 3. VALIDACIÓN EXTRA (Mapa y Tela)
        if (hayError || !latitudFinal) {
            alert("Por favor, completa los campos marcados y selecciona una dirección válida en el mapa.");
            return;
        }

        const emailInput = document.getElementById('email-cliente');
        const email = emailInput.value.trim();

        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!regexEmail.test(email)) {

            alert('Ingresá un email válido.');

            emailInput.closest('.campo').classList.add('error');

            return;
        }

        const telefonoInput = document.getElementById('telefono-cliente');

        const telefonoLimpio = telefonoInput.value
            .replace(/\s/g, '')
            .replace(/-/g, '');

        if (!/^\d+$/.test(telefonoLimpio) || telefonoLimpio.length < 8) {

            alert('Ingresá un teléfono válido.');

            telefonoInput.closest('.campo').classList.add('error');

            return;
        }

        const trackingID = generarCodigoSeguimiento();

        const productosHTML = carrito.map((producto, index) => `
            <div style="margin-bottom:15px; padding:10px; border:1px solid #ddd; border-radius:8px;">
            <strong>Tote ${index + 1}</strong><br>
            👜 Producto: ${producto.nombre}<br>
            ✨ Personalización: ${producto.personalizacion || 'Sin personalización'}<br>
            💰 Precio: $${producto.precio}
            </div>
        `).join('');

        const pedido = {
            cliente: document.getElementById('nombre-cliente').value,
            tracking_id: trackingID,
            email: email,
            telefono: telefonoLimpio,
                
            productos: carrito,
            productos_html: productosHTML,

            provincia: document.getElementById('select-provincia').value,
            ciudad: document.getElementById('input-ciudad').value,
            calle: document.getElementById('input-calle').value,
            link_mapa: `https://www.google.com/maps?q=${latitudFinal},${longitudFinal}`,
            dato_extra: document.getElementById('dato-extra').value,
            direccionMapa: direccionValidada
        };  


        console.log(pedido);

        if (!pedido.cliente || !latitudFinal) {
            alert("Completa los datos y selecciona una dirección válida.");
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

            boton.innerText = 'Confirmado';
            boton.classList.remove('loading');

        } catch (error) {
            console.error(error);
            alert("Error al enviar.");
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
    
    // Recorremos el carrito para detallar cada producto
    carrito.forEach((producto, index) => {
        // Asegurate de usar los nombres de variables exactos que tenés en tu objeto del carrito
        mensaje += `${index + 1}- ${producto.nombre}\n`;
        mensaje += `   Personalización: ${producto.personalizacion}\n`;
        // Si tenés cantidad, podés agregarla: `Cantidad: ${producto.cantidad}`
        mensaje += `\n`; 
    });

    mensaje += "¡Quedo a la espera de la cotización y el link para cargar mis datos de envío!";

    // El número de Hema Sewing
    const numeroWhatsApp = "5493512511146"; 
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
}