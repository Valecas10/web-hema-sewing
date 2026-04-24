/**
 * HEMA SEWING - Lógica de Pedidos
 */

// ================== CONFIG ==================
const URL_EXCEL_TELAS =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1TGS0fsPl0LDGIW7GgB9GwgilhT-Swc6_ivAxF_O11-pv8E_3qjeEg4IG9KPAKdq74qTAwrrhRe4F/pub?output=csv';

const URL_WEB_APP_EXCEL =
    'https://script.google.com/macros/s/AKfycbw6TXsATigHwzDERHmEzojiQqA1fJzXzCGlHImIgftE8aUVUIsx2V9Z48ov8xkjjDAi/exec';

// ================== VARIABLES GLOBALES ==================
let mapa;
let marcador;

let direccionValidada = "";
let latitudFinal = "";
let longitudFinal = "";


const coordenadasProvincias = {
    "Buenos Aires": [-37.15, -58.48],
    "CABA": [-34.6037, -58.3816]
};

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', () => {
    const btnPedido = document.querySelector('.cta-container .btn-main-action');

    if (btnPedido) {
        btnPedido.onclick = () => mostrarVista('armar');
    }

    const btnSeguimiento = document.querySelector('.nav-menu .btn-main-action');
    if(btnSeguimiento){ 
        btnSeguimiento.onclick = () => {
            mostrarVista('seguimiento');
            document.querySelector('.nav-menu').classList.remove('mostrar'); // Cierra el menú al hacer clic
        };
    }

    const menuBtn = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (menuBtn && navMenu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el clic se propague
            navMenu.classList.toggle('mostrar');
        });
    }

    inicializarMapa();
    cargarTelasDinamicas();
    configurarEventosBordado();
});

// ================== MAPA ==================
function inicializarMapa() {
    mapa = L.map('mapa-libre').setView([-38.4161, -63.6167], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapa);

    marcador = L.marker([-38.4161, -63.6167], {
        draggable: true
    }).addTo(mapa);

    marcador.on('dragend', async () => {
        const posicion = marcador.getLatLng();

        latitudFinal = posicion.lat;
        longitudFinal = posicion.lng;

        try {
            const res = await fetch(
                `https://photon.komoot.io/reverse?lon=${longitudFinal}&lat=${latitudFinal}`
            );

            const data = await res.json();

            if (data.features && data.features.length > 0) {
                const info = data.features[0].properties;

                let calle = info.street || info.name || "";
                let altura = info.housenumber || "";

                if (calle === altura) {
                    calle = info.district || info.city || "Dirección marcada";
                }

                const direccionTexto = `${calle} ${altura}`.trim();

                if (direccionTexto) {
                    document.getElementById('input-calle').value = direccionTexto;
                    direccionValidada = direccionTexto;
                }
            }
        } catch (error) {
            console.error("Error en reverse geocoding:", error);
        }
    });

    configurarEventosDireccion();
}

// ================== TELAS ==================
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

            const [nombre, costo, rutaImagen, id, bordable] =
                columnas.map(c => c.trim());

            const imagenDirecta = formatearLinkDrive(rutaImagen);

            const card = document.createElement('div');

            card.className = 'card-opcion';
            card.dataset.valor = id;
            card.dataset.precio = costo;
            card.dataset.bordable = bordable
                ? bordable.toUpperCase()
                : "NO";

            card.innerHTML = `
                <img src="${imagenDirecta}" alt="${nombre}" onerror="this.src='assets/Logo.jpg';">
                <span>${nombre}</span>
                <small>$${costo}</small>
            `;

            const img = card.querySelector('img');

            let timer;

            const activarZoom = (e) => {
                if (e.type === 'touchstart') e.preventDefault();

                timer = setTimeout(() => {
                    img.classList.add('zoom-active');
                }, 500);
            };

            const desactivarZoom = () => {
                clearTimeout(timer);
                img.classList.remove('zoom-active');
            };

            // Mouse
            img.addEventListener('mousedown', activarZoom);
            img.addEventListener('mouseup', desactivarZoom);
            img.addEventListener('mouseleave', desactivarZoom);

            // Mobile
            img.addEventListener('touchstart', activarZoom, { passive: false });
            img.addEventListener('touchend', desactivarZoom);
            img.addEventListener('touchmove', desactivarZoom);

            card.addEventListener('click', () => {
                document
                    .querySelectorAll('#contenedor-telas .card-opcion')
                    .forEach(t => t.classList.remove('seleccionada'));

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

// ================== BORDADO ==================
function configurarEventosBordado() {
    const opciones = document.querySelectorAll('input[name="tipo-bordado"]');

    opciones.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                document.getElementById('bordado-seleccionado').value =
                    radio.value;
            }
        });
    });
}

function gestionarSeccionBordado(esBordable) {
    const seccion = document.getElementById('seccion-bordado');
    const input = document.getElementById('bordado-seleccionado');

    if (esBordable === 'SI') {
        seccion.style.display = 'block';
        input.value = "sin_bordar";
    } else {
        seccion.style.display = 'none';
        input.value = "No permite bordado";
    }
}

// ================== DIRECCIONES ==================
function configurarEventosDireccion() {
    const selectProvincia = document.getElementById('select-provincia');
    const inputCiudad = document.getElementById('input-ciudad');
    const sugerenciasCiudad = document.getElementById('sugerencias-ciudad');

    const inputCalle = document.getElementById('input-calle');
    const sugerenciasCalle = document.getElementById('contenedor-sugerencias');

    selectProvincia.addEventListener('change', (e) => {
        const prov = e.target.value;

        if (prov && coordenadasProvincias[prov]) {
            mapa.setView(
                coordenadasProvincias[prov],
                prov === "CABA" ? 12 : 6
            );
        }
    });

    inputCiudad.addEventListener('input', async () => {
        const query = inputCiudad.value.trim();
        const prov = selectProvincia.value;

        if (query.length < 3 || !prov) return;

        try {
            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query + " " + prov)}&limit=5&osm_tag=place:city&osm_tag=place:town`;

            const res = await fetch(url);
            const data = await res.json();

            sugerenciasCiudad.innerHTML = "";

            data.features.forEach(lugar => {
                const p = lugar.properties;
                const nombre = p.name || p.city;

                const div = document.createElement('div');
                div.className = 'sugerencia-item';

                div.innerHTML = `
                    <strong>${nombre}</strong>
                    <small>(${p.state || ''})</small>
                `;

                div.onclick = () => {
                    const [lon, lat] = lugar.geometry.coordinates;

                    inputCiudad.value = nombre;
                    mapa.setView([lat, lon], 13);

                    sugerenciasCiudad.innerHTML = "";
                };

                sugerenciasCiudad.appendChild(div);
            });

        } catch (e) {
            console.error(e);
        }
    });

    inputCalle.addEventListener('input', async () => {
        const calle = inputCalle.value.trim();
        const ciudad = inputCiudad.value.trim();

        if (calle.length < 4 || !ciudad) return;

        try {
            const res = await fetch(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(calle + " " + ciudad)}&limit=10`
            );

            const data = await res.json();

            sugerenciasCalle.innerHTML = "";

            data.features.forEach(lugar => {
                const p = lugar.properties;

                const dir = `${p.street || p.name || ''} ${p.housenumber || ''}`;

                const div = document.createElement('div');
                div.className = 'sugerencia-item';

                div.innerHTML = `
                    <strong>${dir}</strong>
                    <br>
                    <small>${p.city || ''}</small>
                `;

                div.onclick = () => {
                    const [lon, lat] = lugar.geometry.coordinates;

                    mapa.setView([lat, lon], 17);
                    marcador.setLatLng([lat, lon]);

                    inputCalle.value = dir;
                    direccionValidada = `${dir}, ${p.city || ''}`;

                    latitudFinal = lat;
                    longitudFinal = lon;

                    sugerenciasCalle.innerHTML = "";
                };

                sugerenciasCalle.appendChild(div);
            });

        } catch (e) {
            console.error(e);
        }
    });
}

// ================== PEDIDO ==================
document.getElementById('boton-enviar-pedido').addEventListener('click', async () => {

    const boton = document.getElementById('boton-enviar-pedido');

    const trackingID = generarCodigoSeguimiento();

    const bordado =
        document.getElementById('bordado-seleccionado').value ||
        "Sin Bordado";

    const pedido = {
        cliente: document.getElementById('nombre-cliente').value,
        tracking_id: trackingID,
        email: document.getElementById('email-cliente').value,
        telefono: document.getElementById('telefono-cliente').value,
        tela: document.getElementById('tela-seleccionada').value,
        bordado,
        provincia: document.getElementById('select-provincia').value,
        ciudad: document.getElementById('input-ciudad').value,
        calle: document.getElementById('input-calle').value,
        link_mapa: `https://www.google.com/maps?q=${latitudFinal},${longitudFinal}`,
        dato_extra: document.getElementById('dato-extra').value,
        direccionMapa: direccionValidada
    };

    if (!pedido.cliente || !pedido.tela || !latitudFinal) {
        alert("Completa los datos y selecciona una dirección válida.");
        return;
    }

    boton.disabled = true;
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

        alert(`¡Pedido enviado! Código: ${trackingID}`);

        if (
            pedido.bordado !== 'sin_bordar' &&
            pedido.bordado !== 'No permite bordado'
        ) {
            enviarAWhatsApp(pedido);
        }

        boton.innerText = 'Confirmado';

    } catch (error) {
        console.error(error);
        alert("Error al enviar.");
        boton.disabled = false;
        boton.innerText = textoOriginal;
    }
});

// ================== UTILIDADES ==================
function formatearLinkDrive(url) {
    if (url.includes('drive.google.com')) {
        const idMatch =
            url.match(/\/d\/(.+?)\//) ||
            url.match(/id=(.+?)(&|$)/);

        if (idMatch && idMatch[1]) {
            return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
        }
    }

    return url;
}

function enviarAWhatsApp(pedido) {
    const mensaje =
        `¡Hola! Soy ${pedido.cliente}. Hice un pedido con bordado tipo ${pedido.bordado}.`;

    const url =
        `https://wa.me/5493512511146?text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank');
}

function generarCodigoSeguimiento() {
    const fecha = new Date();

    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');

    return `HEMA-${año}${mes}-${random}`;
}

// ================== VISTAS ==================
function mostrarVista(vista) {
    document.getElementById('inicio').classList.add('oculto');
    document.getElementById('compra').classList.add('oculto');
    document.getElementById('seguimiento').classList.add('oculto');
    localStorage.setItem('vistaActual', vista);
    window.location.hash = vista;

    if (vista === 'inicio') {
        document.getElementById('inicio').classList.remove('oculto');

    } else if (vista === 'armar') {
        document.getElementById('compra').classList.remove('oculto');

        setTimeout(() => mapa.invalidateSize(), 300);

    } else if (vista === 'seguimiento') {
        document.getElementById('seguimiento').classList.remove('oculto');
    }
}

// ================== SEGUIMIENTO ==================
async function consultarEstadoPedido() {
    const id = document.getElementById('input-busqueda-tracking').value.trim();

    const resultado = document.getElementById('resultado-busqueda');
    const estado = document.getElementById('estado-pedido');

    if (!id) {
        alert("Ingresá un código.");
        return;
    }

    try {
        const res = await fetch(`${URL_WEB_APP_EXCEL}?id=${id}`);
        const data = await res.json();

        resultado.classList.remove('oculto');

        if (data.error) {
            estado.innerText = "Código no encontrado";
            estado.style.color = "red";
        } else {
            estado.innerText = data.estado;
            estado.style.color = "#a0816c";
        }

    } catch (error) {
        console.error(error);
        alert("Error al consultar.");
    }
}

// ================== SLIDESHOW CROSSFADE ==================

const todasLasFotos = [
    "assets/fotos-inicio/Modelo-1.jpg",
    "assets/fotos-inicio/Modelo-2.jpg",
    "assets/fotos-inicio/Modelo-3.png",
    "assets/fotos-inicio/Modelo-4.jpeg",
    "assets/fotos-inicio/Modelo-5.jpeg",
    "assets/fotos-inicio/Modelo-6.jpeg",
    "assets/fotos-inicio/Modelo-7.jpeg",
    "assets/fotos-inicio/Modelo-8.jpeg",
    "assets/fotos-inicio/Modelo-9.jpeg",
    "assets/fotos-inicio/Modelo-10.jpeg"
];

// Variables de estado
let fotosLibres = todasLasFotos.slice(3);
let frameActual = 0;

function rotarSecuencial() {
    // Seleccionamos los marcos actualizados cada vez
    const framesContenedores = document.querySelectorAll('.photo-frame');
    const imagenesPrincipales = document.querySelectorAll('.photo-frame img:not(.temp-fade)');
    
    const contenedor = framesContenedores[frameActual];
    const imgPrincipal = imagenesPrincipales[frameActual];

    if (!contenedor || !imgPrincipal) return;

    const fotoSaliendo = imgPrincipal.getAttribute('src');
    const fotoEntrante = fotosLibres.shift();

    if (!fotoEntrante) return;

    // 1. Pre-carga de la imagen
    const cargador = new Image();
    cargador.src = fotoEntrante;

    cargador.onload = () => {
        // 2. Crear el elemento temporal para el efecto
        const clon = document.createElement('img');
        clon.src = fotoEntrante;
        clon.classList.add('temp-fade');
        contenedor.appendChild(clon);
        clon.offsetWidth;
        imgPrincipal.style.transition = 'opacity 1.5s ease-in-out';
        imgPrincipal.style.setProperty('--opacidad','0')

        // 4. Finalizar transición
        setTimeout(() => {
            imgPrincipal.style.transition = 'none';
            // Actualizar la imagen de fondo y limpiar el clon
            imgPrincipal.src = fotoEntrante;
            imgPrincipal.style.setProperty('--opacidad','1');
            clon.remove();

            // Devolver la foto vieja al banco
            fotosLibres.push(fotoSaliendo);
        }, 1600); // Un poco más que el transition del CSS (1.5s)
    };

    // Mover al siguiente marco
    frameActual = (frameActual + 1) % framesContenedores.length;
}

// Iniciar el intervalo (ej: cada 4 segundos para que dé tiempo al efecto de 1.5s)
setInterval(rotarSecuencial, 4000);


window.onload = function() {
    const ultimaVista = localStorage.getItem('vistaActual');
    
    if (ultimaVista) {
        mostrarVista(ultimaVista);
    } else {
        mostrarVista('inicio'); // Si es la primera vez que entra, va al inicio
    }
};

window.addEventListener('hashchange', function() {
    // Obtenemos el hash actual (quitándole el símbolo #)
    const vistaDeseada = window.location.hash.replace('#', '');
    
    if (vistaDeseada) {
        mostrarVista(vistaDeseada);
    }
});