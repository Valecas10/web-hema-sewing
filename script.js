/** * HEMA SEWING - Lógica de Pedidos
 */
const URL_EXCEL_TELAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1TGS0fsPl0LDGIW7GgB9GwgilhT-Swc6_ivAxF_O11-pv8E_3qjeEg4IG9KPAKdq74qTAwrrhRe4F/pub?output=csv'; // Link Dueña
//const URL_EXCEL_TELAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-JOFsNSltYfHh2WKpTu2Hif5VOgAYpr_vRxblZlqUThS5cjRb3Cc4KrQTRbeLAuxTLsXmnjMNLiZM/pub?output=csv'; // Link Test
const URL_WEB_APP_EXCEL = 'https://script.google.com/macros/s/AKfycbw6TXsATigHwzDERHmEzojiQqA1fJzXzCGlHImIgftE8aUVUIsx2V9Z48ov8xkjjDAi/exec';

// 1. VARIABLES GLOBALES
let mapa;
let marcador;
let direccionValidada = ""; 
let latitudFinal = "";
let longitudFinal = "";
let timer

const coordenadasProvincias = {
    "Buenos Aires": [-37.15, -58.48],
    "CABA": [-34.6037, -58.3816]
};

// 2. INICIALIZACIÓN Y CARGA
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-comenzar').onclick = () => mostrarVista('armar');
    document.getElementById('btn-ir-seguimiento').onclick = () => mostrarVista('seguimiento');
    inicializarMapa();
    cargarTelasDinamicas();
    configurarEventosBordado();
});

// A. Mapa Leaflet
function inicializarMapa() {
    mapa = L.map('mapa-libre').setView([-38.4161, -63.6167], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapa);
    marcador = L.marker([-38.4161, -63.6167],{
        draggable: true
    }).addTo(mapa);

    marcador.on('dragend', async function(event) {
    const posicion = marcador.getLatLng();
    latitudFinal = posicion.lat;
    longitudFinal = posicion.lng;
    try {
        // Consultamos a Photon por la dirección de esas coordenadas
        const res = await fetch(`https://photon.komoot.io/reverse?lon=${longitudFinal}&lat=${latitudFinal}`);
        const data = await res.json();

        if (data.features && data.features.length > 0) {
            const info = data.features[0].properties;
            
            // Armamos la dirección: Calle + Altura (si existe)
            let calle = info.street || info.name || "";
            let altura = info.housenumber || "";

            if (calle === altura) {
                calle = info.district || info.city || "Dirección marcada";
            }

            const direccionTexto = `${calle} ${altura}`.trim();

            // Actualizamos el input de calle para que el usuario vea el cambio
            if (direccionTexto) {
                document.getElementById('input-calle').value = direccionTexto;
                direccionValidada = direccionTexto; // Actualizamos la variable global
            }
        }
    } catch (error) {
        console.error("Error en reverse geocoding:", error);
    }
    });

    console.log("Nueva ubicación:", latitudFinal, longitudFinal);
    
    configurarEventosDireccion();
}

// B. Carga de Telas desde Google Sheets
async function cargarTelasDinamicas() {
    try {
        const respuesta = await fetch(URL_EXCEL_TELAS);
        const texto = await respuesta.text();
        const filas = texto.split('\n').slice(1);
        const contenedor = document.getElementById('contenedor-telas');
        contenedor.innerHTML = ""; 

        filas.forEach(fila => {
            const columnas = fila.split(',');
            if (columnas.length < 3) return; 

            const [nombre, costo, rutaImagen, id, bordable] = columnas.map(c => c.trim());
            const imagenDirecta = formatearLinkDrive(rutaImagen);

            const card = document.createElement('div');
            card.className = 'card-opcion';
            card.dataset.valor = id;
            card.dataset.precio = costo;
            card.dataset.bordable = bordable ? bordable.toUpperCase() : "NO";

            card.innerHTML = `
                <img src="${imagenDirecta}" alt="${nombre}" onerror="this.src='assets/Logo.jpg';">
                <span>${nombre}</span>
                <small>$${costo}</small>
            `;

            const img = card.querySelector('img');
            let timer;

            const activarZoom = (e) => {
                // Previene el menú contextual del celu al mantener apretado
                if (e.type === 'touchstart') e.preventDefault(); 
                timer = setTimeout(() => {
                    img.classList.add('zoom-active');
                }, 500); // 500ms para activar
            };

            const desactivarZoom = () => {
                clearTimeout(timer);
                img.classList.remove('zoom-active');
            };

            // Eventos para Mouse
            img.addEventListener('mousedown', activarZoom);
            img.addEventListener('mouseup', desactivarZoom);
            img.addEventListener('mouseleave', desactivarZoom);

            // Eventos para Celular
            img.addEventListener('touchstart', activarZoom, {passive: false});
            img.addEventListener('touchend', desactivarZoom);
            img.addEventListener('touchmove', desactivarZoom);

            card.addEventListener('click', () => {
                document.querySelectorAll('#contenedor-telas .card-opcion').forEach(t => t.classList.remove('seleccionada'));
                card.classList.add('seleccionada');
                document.getElementById('tela-seleccionada').value = id;
                gestionarSeccionBordado(card.dataset.bordable);
            });

            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error("Error al cargar telas:", error);
    }
}

// 3. LÓGICA DE PRODUCTO (BORDADOS)
function configurarEventosBordado() {
    const opcionesBordado = document.querySelectorAll('input[name="tipo-bordado"]');
    const contenedorFrase = document.getElementById('personalizacion-extra');

    opcionesBordado.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                document.getElementById('bordado-seleccionado').value = radio.value;
            }
        });
    });
}

function gestionarSeccionBordado(esBordable) {
    const seccionBordado = document.getElementById('seccion-bordado');
    const inputBordadoOculto = document.getElementById('bordado-seleccionado');

    if (esBordable === 'SI') {
        seccionBordado.style.display = 'block';
        // Si el usuario no elige nada aún, por defecto es sin bordar
        inputBordadoOculto.value = "sin_bordar"; 
    } else {
        seccionBordado.style.display = 'none';
        inputBordadoOculto.value = "No permite bordado";
    }
}

// 4. LÓGICA DE DIRECCIONES (PHOTON API)
function configurarEventosDireccion() {
    const selectProvincia = document.getElementById('select-provincia');
    const inputCiudad = document.getElementById('input-ciudad');
    const sugerenciasCiudad = document.getElementById('sugerencias-ciudad');
    const inputCalle = document.getElementById('input-calle');
    const sugerenciasCalle = document.getElementById('contenedor-sugerencias')

    selectProvincia.addEventListener('change', (e) => {
        const prov = e.target.value;
        if (prov && coordenadasProvincias[prov]) {
            mapa.setView(coordenadasProvincias[prov], prov === "CABA" ? 12 : 6);
        }
    })

    inputCiudad.addEventListener('input', async () => {
        const query = inputCiudad.value.trim();
        const prov = selectProvincia.value;
        if (query.length < 3 || !prov) return;

        try {
            const urlCiudad = `https://photon.komoot.io/api/?q=${encodeURIComponent(query + " " + prov)}&limit=5&osm_tag=place:city&osm_tag=place:town`;
            const res = await fetch(urlCiudad); // Photon no requiere 'mode: cors' explícito si la URL es simple
            const data = await res.json();
            sugerenciasCiudad.innerHTML = "";

            data.features.forEach(lugar => {
                const p = lugar.properties;
                const nombre = p.name || p.city;
                const div = document.createElement('div');
                div.className = 'sugerencia-item';
                div.innerHTML = `<strong>${nombre}</strong> <small>(${p.state || ''})</small>`;
                div.onclick = () => {
                    const [lon, lat] = lugar.geometry.coordinates;
                    inputCiudad.value = nombre;
                    mapa.setView([lat, lon], 13);
                    sugerenciasCiudad.innerHTML = "";
                };
                sugerenciasCiudad.appendChild(div);
            });
        } catch (e) { console.error(e); }
    });

    inputCalle.addEventListener('input', async () => {
        const calle = inputCalle.value.trim();
        const ciudad = inputCiudad.value.trim();
        if (calle.length < 4 || !ciudad) return;

        try {
            const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(calle + " " + ciudad)}&limit=10`);
            const data = await res.json();
            sugerenciasCalle.innerHTML = "";

            data.features.forEach(lugar => {
                const p = lugar.properties;
                const dirCorta = `${p.street || p.name || ''} ${p.housenumber || ''}`;
                const div = document.createElement('div');
                div.className = 'sugerencia-item';
                div.innerHTML = `<strong>${dirCorta}</strong><br><small>${p.city || ''}</small>`;
                div.onclick = () => {
                    const [lon, lat] = lugar.geometry.coordinates;
                    mapa.setView([lat, lon], 17);
                    marcador.setLatLng([lat, lon]);
                    inputCalle.value = dirCorta;
                    direccionValidada = `${dirCorta}, ${p.city || ''}`;
                    latitudFinal = lat;
                    longitudFinal = lon;
                    sugerenciasCalle.innerHTML = "";
                };
                sugerenciasCalle.appendChild(div);
            });
        } catch (e) { console.error(e); }
    });
}

// 5. ENVÍO DE PEDIDO (EMAILJS)
document.getElementById('boton-enviar-pedido').addEventListener('click', () => {
    const trackingID = generarCodigoSeguimiento();
    const bordadoValor = document.getElementById('bordado-seleccionado').value || "Sin Bordado";
    const pedido = {
        cliente: document.getElementById('nombre-cliente').value,
        tracking_id: trackingID,
        email: document.getElementById('email-cliente').value,
        telefono: document.getElementById('telefono-cliente').value,
        tela: document.getElementById('tela-seleccionada').value,
        bordado: bordadoValor,
        provincia: document.getElementById('select-provincia').value,
        ciudad: document.getElementById('input-ciudad').value,
        calle: document.getElementById('input-calle').value,
        link_mapa: `https://www.google.com/maps?q=${latitudFinal},${longitudFinal}`,
        dato_extra: document.getElementById('dato-extra').value,
        direccionMapa: direccionValidada
    };

    if (!pedido.cliente || !pedido.tela || !latitudFinal) {
        alert("Por favor, completa los datos y selecciona una dirección válida en el mapa.");
        return;
    }

    document.getElementById('boton-enviar-pedido').addEventListener('click', async () => {
    const boton = document.getElementById('boton-enviar-pedido');
    
    // 1. Bloqueamos el botón y cambiamos el texto
    boton.disabled = true;
    const textoOriginal = boton.innerText;
    boton.innerText = "Procesando pedido...";

    console.log("--- CHEQUEO DE DATOS ---");
    console.log("Nombre:", pedido.cliente);
    console.log("ID Tela:", pedido.tela);
    console.log("ID Bordado:", pedido.bordado); 
    console.log("------------------------");
    
    try {
        // 1. Envío al Excel
        await fetch(URL_WEB_APP_EXCEL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(pedido)
        });

        // 2. Envío de Mail
        await emailjs.send('service_gnblx8l', 'template_76chn1e', pedido);

        alert(`¡Pedido enviado con éxito!\nTu código es: ${trackingID}`);
        
        if(pedido.bordado !== 'sin_bordar' && pedido.bordado !== 'No permite bordado') {
            enviarAWhatsApp(pedido);
        }
        
        boton.innerText = 'Confirmado';
    } catch (error) {
        console.error(error);
        alert("Error al enviar. Intentá de nuevo.");
        boton.disabled = false;
        boton.innerText = "Confirmar Pedido";
    }
});


});

// Utilidades
function formatearLinkDrive(url) {
    if (url.includes('drive.google.com')) {
        const idMatch = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
        if (idMatch && idMatch[1]) return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
    return url;
}

function enviarAWhatsApp(pedido) {
    const mensaje = `¡Hola! Soy ${pedido.cliente}. Acabo de realizar un pedido de una Tote Bag con bordado tipo: ${pedido.bordado}. Me contacto para coordinar el diseño del bordado.`;
    const urlWa = `https://wa.me/5493512511146?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWa, '_blank');
}

function generarCodigoSeguimiento() {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `HEMA-${año}${mes}-${random}`;
}

// Función para cambiar de "página"
function mostrarVista(vista) {
    // Ocultamos todas
    document.getElementById('vista-inicio').classList.add('oculto');
    document.getElementById('vista-configurador').classList.add('oculto');
    document.getElementById('vista-seguimiento').classList.add('oculto');

    // Mostramos la que queremos
    if (vista === 'inicio') {
        document.getElementById('vista-inicio').classList.remove('oculto');
    } else if (vista === 'armar') {
        document.getElementById('vista-configurador').classList.remove('oculto');
        setTimeout(() => {
            mapa.invalidateSize(); 
        }, 300);
    } else if (vista === 'seguimiento') {
        document.getElementById('vista-seguimiento').classList.remove('oculto');
    }
}

async function consultarEstadoPedido() {
    const idInput = document.getElementById('input-busqueda-tracking').value.trim();
    const resultadoDiv = document.getElementById('resultado-busqueda');
    const estadoTexto = document.getElementById('estado-pedido');

    if (!idInput) {
        alert("Por favor, ingresa un código de seguimiento.");
        return;
    }

    try {
        // Hacemos una petición GET al script pasando el ID como parámetro
        const respuesta = await fetch(`${URL_WEB_APP_EXCEL}?id=${idInput}`);
        const data = await respuesta.json();

        resultadoDiv.classList.remove('oculto');

        if (data.error) {
            estadoTexto.innerText = "Código no encontrado. Revisa si está bien escrito.";
            estadoTexto.style.color = "red";
        } else {
            estadoTexto.innerText = data.estado;
            estadoTexto.style.color = "#a0816c"; // El color de tu marca
        }
    } catch (error) {
        console.error("Error al consultar:", error);
        alert("Hubo un error al conectar con el servidor.");
    }
}
