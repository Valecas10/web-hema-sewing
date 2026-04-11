// 1. VARIABLES GLOBALES (Al principio de todo)
let mapa;
let marcador;
let direccionValidada = ""; 
const contenedorFrase = document.getElementById('personalizacion-extra');

// 2. LÓGICA DE SELECCIÓN DE TELAS
const tarjetasTelas = document.querySelectorAll('#contenedor-telas .card-opcion');
tarjetasTelas.forEach(tarjeta => {
    tarjeta.addEventListener('click', () => {
        tarjetasTelas.forEach(t => t.classList.remove('seleccionada'));
        tarjeta.classList.add('seleccionada');
        document.getElementById('tela-seleccionada').value = tarjeta.dataset.valor;
        console.log("Tela: " + tarjeta.dataset.valor);
    });
});

// 3. LÓGICA DE SELECCIÓN DE BORDADOS (Unificada)
const tarjetasBordado = document.querySelectorAll('#contenedor-bordados .card-opcion');
tarjetasBordado.forEach(tarjeta => {
    tarjeta.addEventListener('click', () => {
        tarjetasBordado.forEach(t => t.classList.remove('seleccionada'));
        tarjeta.classList.add('seleccionada');
        
        const valorElegido = tarjeta.dataset.valor;
        document.getElementById('bordado-seleccionado').value = valorElegido;

        // Visibilidad de la frase
        if (valorElegido === 'Letras') {
            contenedorFrase.classList.remove('oculto');
        } else {
            contenedorFrase.classList.add('oculto');
            document.getElementById('letras-bordado').value = ""; 
        }
    });
});

// 4. LÓGICA DEL MAPA (Todo dentro del DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Mapa
    mapa = L.map('mapa-libre').setView([-38.4161, -63.6167], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapa);
    marcador = L.marker([-38.4161, -63.6167]).addTo(mapa);

    const selectProvincia = document.getElementById('select-provincia');
    const inputCiudad = document.getElementById('input-ciudad');
    const inputCalle = document.getElementById('input-calle');
    const contenedorSug = document.getElementById('contenedor-sugerencias');

    inputCalle.addEventListener('input', async () => {
        const calle = inputCalle.value.trim();
        const ciudad = inputCiudad.value.trim();
        const provincia = selectProvincia.value.trim(); 

        // EVITAR ERROR 400: No buscar si falta ciudad/provincia o si la calle es muy corta
        if (!provincia || !ciudad || calle.length < 4) {
            contenedorSug.innerHTML = "";
            return; 
        }

        const queryLimpia = `${calle} ${ciudad} ${provincia} Argentina`;
        const params = new URLSearchParams({ q: queryLimpia, limit: 5, lang: 'en' });
        const url = `https://photon.komoot.io/api/?${params.toString()}`;

        try {
            const respuesta = await fetch(url);
            if (!respuesta.ok) return;
            const datos = await respuesta.json();
            
            // Mostrar sugerencias
            contenedorSug.innerHTML = "";
            const resultadosAr = datos.features.filter(f => f.properties.countrycode === 'AR');

            resultadosAr.forEach(lugar => {
                const p = lugar.properties;
                const direccionCorta = `${p.street || p.name || ''} ${p.housenumber || ''}`;
                const ubicacionExtra = `${p.city || ''}, ${p.state || ''}`;
                const nombreCompleto = `${direccionCorta}, ${ubicacionExtra}`;
                
                const div = document.createElement('div');
                div.className = 'sugerencia-item';
                div.innerHTML = `<strong>${direccionCorta}</strong><br><small>${ubicacionExtra}</small>`;
                
                div.onclick = () => {
                    const [lon, lat] = lugar.geometry.coordinates;
                    mapa.setView([lat, lon], 17);
                    marcador.setLatLng([lat, lon]);
                    inputCalle.value = direccionCorta;
                    direccionValidada = nombreCompleto; // Actualiza la variable global
                    contenedorSug.innerHTML = "";
                };
                contenedorSug.appendChild(div);
            });
        } catch (error) {
            console.error("Error en mapa:", error);
        }
    });
});

// 5. ENVÍO DE PEDIDO
document.getElementById('boton-enviar-pedido').addEventListener('click', () => {
    const pedido = {
        cliente: document.getElementById('nombre-cliente').value,
        email: document.getElementById('email-cliente').value,
        telefono: document.getElementById('telefono-cliente').value,
        tela: document.getElementById('tela-seleccionada').value,
        bordado: document.getElementById('bordado-seleccionado').value,
        frase: document.getElementById('letras-bordado').value,
        provincia: document.getElementById('select-provincia').value,
        ciudad: document.getElementById('input-ciudad').value,
        calle: document.getElementById('input-calle').value,
        direccionMapa: direccionValidada
    };

    if (!pedido.cliente || !pedido.tela || !direccionValidada) {
        alert("Faltan datos o no seleccionaste una dirección del mapa.");
        return;
    }

    emailjs.send('service_gnblx8l', 'template_76chn1e', pedido)
        .then(() => {
            alert('¡Pedido enviado con éxito!');
            if (pedido.bordado === 'Emojis' || pedido.bordado === 'Retrato'){
                enviarAWhatsApp(pedido);
            }
        }, (err) => {
            alert('Error: ' + JSON.stringify(err));
        });
});

function enviarAWhatsApp(pedido) {
    const telefonoDueña = "5493512511146";
    const mensaje = `Hola! Soy ${pedido.cliente}. Acabo de realizar un pedido de un bordado tipo ${pedido.bordado}. Aquí te mando las fotos.`;
    window.open(`https://wa.me/${telefonoDueña}?text=${encodeURIComponent(mensaje)}`, '_blank');
}