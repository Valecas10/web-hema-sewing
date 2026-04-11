// 1. VARIABLES GLOBALES
let mapa;
let marcador;
let direccionValidada = ""; 
let latitudFinal = "";
let longitudFinal = "";
const contenedorFrase = document.getElementById('personalizacion-extra');

const coordenadasProvincias = {
    "Buenos Aires": [-37.15, -58.48],
    "CABA": [-34.6037, -58.3816],
    "Córdoba": [-31.42, -64.18],
    "Santa Fe": [-31.63, -60.70]
};

// 2. LÓGICA DE SELECCIÓN DE TELAS Y BORDADOS
const tarjetasTelas = document.querySelectorAll('#contenedor-telas .card-opcion');
tarjetasTelas.forEach(tarjeta => {
    tarjeta.addEventListener('click', () => {
        tarjetasTelas.forEach(t => t.classList.remove('seleccionada'));
        tarjeta.classList.add('seleccionada');
        document.getElementById('tela-seleccionada').value = tarjeta.dataset.valor;
    });
});

const tarjetasBordado = document.querySelectorAll('#contenedor-bordados .card-opcion');
tarjetasBordado.forEach(tarjeta => {
    tarjeta.addEventListener('click', () => {
        tarjetasBordado.forEach(t => t.classList.remove('seleccionada'));
        tarjeta.classList.add('seleccionada');
        const valorElegido = tarjeta.dataset.valor;
        document.getElementById('bordado-seleccionado').value = valorElegido;
        if (valorElegido === 'Letras') {
            contenedorFrase.classList.remove('oculto');
        } else {
            contenedorFrase.classList.add('oculto');
            document.getElementById('letras-bordado').value = ""; 
        }
    });
});

// 3. LÓGICA DEL MAPA Y DIRECCIONES
document.addEventListener('DOMContentLoaded', () => {
    mapa = L.map('mapa-libre').setView([-38.4161, -63.6167], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapa);
    marcador = L.marker([-38.4161, -63.6167]).addTo(mapa);

    const selectProvincia = document.getElementById('select-provincia');
    const inputCiudad = document.getElementById('input-ciudad');
    const contenedorCiudad = document.getElementById('sugerencias-ciudad'); // Asegurate que exista en el HTML
    const inputCalle = document.getElementById('input-calle');
    const contenedorCalle = document.getElementById('contenedor-sugerencias');

    // A. Selección de Provincia
    selectProvincia.addEventListener('change', (e) => {
        const prov = e.target.value;
        if (prov) {
            // Limpiar datos previos si cambia provincia
            inputCiudad.value = "";
            inputCalle.value = "";
            contenedorCiudad.innerHTML = "";
            contenedorCalle.innerHTML = "";
            
            if (coordenadasProvincias[prov]) {
                mapa.setView(coordenadasProvincias[prov], prov === "CABA" ? 12 : 6);
            }
        }
    });

    // B. Sugerencias de Ciudad (Solo por selección)
    inputCiudad.addEventListener('input', async () => {
        const query = inputCiudad.value.trim();
        const prov = selectProvincia.value;

        if (query.length < 3 || !prov) {
            contenedorCiudad.innerHTML = "";
            return;
        }

        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query + " " + prov)}&limit=5&lang=en&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            contenedorCiudad.innerHTML = "";

            // Filtro estricto: Solo ciudades dentro de la provincia seleccionada
            const filtrados = data.features.filter(f => 
                (f.properties.state || "").toLowerCase().includes(prov.toLowerCase())
            );

            filtrados.forEach(lugar => {
                const p = lugar.properties;
                const nombre = p.name || p.city || p.town;
                const div = document.createElement('div');
                div.className = 'sugerencia-item';
                div.innerHTML = `<strong>${nombre}</strong> <small>(${p.state})</small>`;
                
                div.onclick = () => {
                    const [lon, lat] = lugar.geometry.coordinates;
                    inputCiudad.value = nombre;
                    mapa.setView([lat, lon], 13);
                    contenedorCiudad.innerHTML = "";
                };
                contenedorCiudad.appendChild(div);
            });
        } catch (e) { console.error("Error ciudades:", e); }
    });

    // C. Sugerencias de Calle (Solo por selección)
    inputCalle.addEventListener('input', async () => {
        const calle = inputCalle.value.trim();
        const ciudad = inputCiudad.value.trim();
        const provincia = selectProvincia.value;

        if (calle.length < 4 || !ciudad || !provincia) {
            contenedorCalle.innerHTML = "";
            return; 
        }

        const queryLimpia = `${calle} ${ciudad} ${provincia} Argentina`;
        const params = new URLSearchParams({ q: queryLimpia, limit: 10, lang: 'en' });

        try {
            const respuesta = await fetch(`https://photon.komoot.io/api/?${params.toString()}`);
            const datos = await respuesta.json();
            contenedorCalle.innerHTML = "";

            // Filtro: Debe coincidir la ciudad ingresada
            const filtrados = datos.features.filter(f => {
                const p = f.properties;
                const ciudadAPI = (p.city || p.town || p.village || "").toLowerCase();
                return p.countrycode === 'AR' && ciudadAPI.includes(ciudad.toLowerCase());
            });

            filtrados.forEach(lugar => {
                const p = lugar.properties;
                const dirCorta = `${p.street || p.name || ''} ${p.housenumber || ''}`;
                const fullNom = `${dirCorta}, ${p.city || ''}`;
                
                const div = document.createElement('div');
                div.className = 'sugerencia-item';
                div.innerHTML = `<strong>${dirCorta}</strong><br><small>${p.city}, ${p.state}</small>`;
                
                div.onclick = () => {
                    const [lon, lat] = lugar.geometry.coordinates;
                    mapa.setView([lat, lon], 17);
                    marcador.setLatLng([lat, lon]);
                    inputCalle.value = dirCorta;
                    direccionValidada = fullNom;
                    latitudFinal = lat;
                    longitudFinal = lon;
                    contenedorCalle.innerHTML = "";
                };
                contenedorCalle.appendChild(div);
            });
        } catch (e) { console.error("Error calles:", e); }
    });
});

// 4. ENVÍO DE PEDIDO
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
        coordenadas: `${latitudFinal}, ${longitudFinal}`,
        link_mapa: `https://www.google.com/maps?q=${latitudFinal},${longitudFinal}`,
        dato_extra: document.getElementById('dato-extra').value,
        direccionMapa: direccionValidada
    };

    console.log(latitudFinal);
    console.log(longitudFinal);

    if (!pedido.cliente || !pedido.tela || !latitudFinal) {
        alert("Por favor, selecciona una dirección válida del mapa.");
        return;
    }
    
console.log("aca no lelgamos");

    emailjs.send('service_gnblx8l', 'template_76chn1e', pedido)
        .then(() => {
            alert('¡Pedido enviado!');
            if (pedido.bordado === 'Emojis' || pedido.bordado === 'Retrato') enviarAWhatsApp(pedido);
        }, (err) => alert('Error EmailJS'));
});

function enviarAWhatsApp(pedido) {
    const msj = `Hola! Soy ${pedido.cliente}. Hice un pedido de ${pedido.bordado}. Adjunto fotos.`;
    window.open(`https://wa.me/5493512511146?text=${encodeURIComponent(msj)}`, '_blank');
}