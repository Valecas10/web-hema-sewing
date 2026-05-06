/**
 * HEMA SEWING - Lógica de Pedidos
 */

// ================== CONFIG ==================
const PROXY_CORS = "https://api.allorigins.win/raw?url=";

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

const BBOX_ARG = "-73,-55,-53,-21";

const estadoUbicacion = {
    provincia: null,
    ciudad: null,
    coords: {
        lat: -38.4161,
        lon: -63.6167
    }
};

const coordenadasProvincias = {
    "Buenos Aires": [-36.6769, -60.5588],
  "CABA": [-34.6037, -58.3816],
  "Catamarca": [-27.3350, -66.9477],
  "Chaco": [-26.3864, -60.7653],
  "Chubut": [-43.3000, -65.1000],
  "Córdoba": [-31.4201, -64.1888],
  "Corrientes": [-28.4696, -57.8500],
  "Entre Ríos": [-31.7333, -60.5333],
  "Formosa": [-24.8958, -60.2750],
  "Jujuy": [-23.3167, -65.3000],
  "La Pampa": [-36.6167, -64.2833],
  "La Rioja": [-29.4131, -66.8558],
  "Mendoza": [-34.0000, -69.0000],
  "Misiones": [-26.8754, -54.6517],
  "Neuquén": [-38.9516, -68.0591],
  "Río Negro": [-40.8135, -63.0000],
  "Salta": [-24.7859, -65.4117],
  "San Juan": [-31.5375, -68.5364],
  "San Luis": [-33.3017, -66.3378],
  "Santa Cruz": [-48.7500, -69.0000],
  "Santa Fe": [-30.0000, -61.0000],
  "Santiago del Estero": [-27.7951, -64.2615],
  "Tierra del Fuego": [-54.5000, -67.2000],
  "Tucumán": [-26.8241, -65.2226]
};

const zoomPorProvincia = {
  "Buenos Aires": 6,
  "CABA": 12,
  "Catamarca": 7,
  "Chaco": 7,
  "Chubut": 6,
  "Córdoba": 7,
  "Corrientes": 7,
  "Entre Ríos": 7,
  "Formosa": 7,
  "Jujuy": 7,
  "La Pampa": 7,
  "La Rioja": 7,
  "Mendoza": 6,
  "Misiones": 8,
  "Neuquén": 7,
  "Río Negro": 6,
  "Salta": 6,
  "San Juan": 7,
  "San Luis": 7,
  "Santa Cruz": 5,
  "Santa Fe": 7,
  "Santiago del Estero": 7,
  "Tierra del Fuego": 7,
  "Tucumán": 8
};

const opcionesPersonalizacion = [
    { id: 'sin-nada', nombre: 'Sin nada', precio: 0, img: 'assets/opciones/basico.jpg' },
    { id: 'lazo-tela', nombre: 'Agregar Lazo de Tela', precio: 1000, img: 'assets/opciones/lazo-tela.jpg' },
    { id: 'lazo-cintas', nombre: 'Agregar Lazo de Cintas', precio: 1000, img: 'assets/opciones/lazo-cintas.jpg' },
    { id: 'volado', nombre: 'Agregar Volado', precio: 1500, img: 'assets/opciones/volado.jpg' },
    { id: 'bordado', nombre: 'Agregar Bordado', precio: 2500, img: 'assets/opciones/bordado.jpg' },
    { id: 'mosaico', nombre: 'Efecto Mosaico', precio: 3000, img: 'assets/opciones/mosaico.jpg' }
];

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

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

    const btnDatosComprador = document.querySelector('.armar');
    if(btnDatosComprador){
        btnDatosComprador.onclick = () => mostrarVista('datos-comprador');
    }

    const btnEnviar = document.getElementById('boton-enviar-pedido')
    if(btnEnviar){

        btnEnviar.addEventListener('click', async () => {

        const boton = document.getElementById('boton-enviar-pedido');

        const trackingID = generarCodigoSeguimiento();

        const pedido = {
            cliente: document.getElementById('nombre-cliente').value,
            tracking_id: trackingID,
            email: document.getElementById('email-cliente').value,
            telefono: document.getElementById('telefono-cliente').value,
            tela: document.getElementById('tela-seleccionada').value,
            personalizacion : document.getElementById('personalizacion-seleccionada').value,
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

            if (pedido.personalizacion !== 'sin-nada') {
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
    cargarOpcionesPersonalizacion();
});

// ================== MAPA ==================
function inicializarMapa() {
    const inputCalle = document.getElementById('input-calle');
    mapa = L.map('mapa-libre').setView(
        [estadoUbicacion.coords.lat, estadoUbicacion.coords.lon],
        4
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapa);

    marcador = L.marker([-38.4161, -63.6167], {
        draggable: true
    }).addTo(mapa);

    marcador.on('dragend', async () => {
        const pos = marcador.getLatLng();

        latitudFinal = pos.lat;
        longitudFinal = pos.lng;

        try {
            const res = await fetch(
                `https://photon.komoot.io/reverse?lon=${pos.lng}&lat=${pos.lat}`
            );

            const data = await res.json();

            if (data.features && data.features.length > 0) {
                const p = data.features[0].properties;

                const direccion = `${p.street || p.name || 'Direccion Desconocida'} ${p.housenumber || ''}`;

                // Actualizamos el input y la variable de validación
                if (inputCalle) {
                    inputCalle.value = direccion;
                }
                direccionValidada = `${direccion}, ${p.city || ''}`;
            }

        } catch (e) {
        console.error(e);
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

            });

            contenedor.appendChild(card);
        });

    } catch (error) {
        console.error("Error al cargar telas:", error);
    }
}

// ================== PERSONALIZACION ==================

function cargarOpcionesPersonalizacion() {
    const contenedor = document.getElementById('contenedor-personalizacion');
    contenedor.innerHTML = "";

    opcionesPersonalizacion.forEach(opc => {
        const card = document.createElement('div');
        card.className = 'card-opcion';
        if(opc.id === 'sin-nada') card.classList.add('seleccionada');

        card.innerHTML = `
            <img src="${opc.img}" alt="${opc.nombre}" onerror="this.src='assets/Logo.jpg';">
            <span>${opc.nombre}</span>
            <small>${opc.precio > 0 ? '+$' + opc.precio : ''}</small>
        `;

        card.onclick = () => {
            document.querySelectorAll('#contenedor-personalizacion .card-opcion')
                    .forEach(c => c.classList.remove('seleccionada'));
            card.classList.add('seleccionada');
            document.getElementById('personalizacion-seleccionada').value = opc.id;
        };
        contenedor.appendChild(card);
    });
}

// ================== DIRECCIONES ==================
function configurarEventosDireccion() {
    const selectProvincia = document.getElementById('select-provincia');
    const inputCiudad = document.getElementById('input-ciudad');
    const sugerenciasCiudad = document.getElementById('sugerencias-ciudad');

    const inputCalle = document.getElementById('input-calle');
    const sugerenciasCalle = document.getElementById('contenedor-sugerencias');

    inputCiudad.disabled = true;
    inputCalle.disabled = true;

    if (!sugerenciasCiudad || !sugerenciasCalle) return;

    selectProvincia.addEventListener('change', (e) => {
        const prov = e.target.value;
        

        if (prov && coordenadasProvincias[prov]) {
            const [lat, lon] = coordenadasProvincias[prov];
            const zoom = zoomPorProvincia[prov];

            estadoUbicacion.provincia = prov;
            estadoUbicacion.coords = { lat, lon };
            actualizarMarcador(lat,lon,zoom);
            mapa.flyTo([lat, lon], zoom , {
            duration: 1.5
            });
            inputCiudad.disabled = false;
            limpiarCiudadYCalle();
        }else {
        inputCiudad.disabled = true;
        inputCalle.disabled = true;
        }
    });

    inputCiudad.addEventListener('input',debounce( async () => {
        const query = inputCiudad.value.trim();
        const prov = selectProvincia.value;

        if (query.length < 3 || !prov){
            sugerenciasCiudad.innerHTML = "";
            return;
        } 

        try {
            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query + " " + prov + " Argentina")}&limit=10&bbox=${BBOX_ARG}`;

            const res = await fetch(url);
            const data = await res.json();

            renderizarSugerenciasCiudad(data.features);
            
        } catch (e) {
            console.error(e);
        }

        if (inputCiudad.value.trim().length > 0) {
            inputCalle.disabled = false;
        } else {
            inputCalle.disabled = true;
        }

        limpiarCalle();
        
    },200));

    inputCalle.addEventListener('input',debounce( async () => {
    const ciudad = inputCiudad.value.trim();
    const provincia = selectProvincia.value;
    const calle = inputCalle.value.trim();

    // Bajamos a 3 caracteres para que sea más fluido
    if (calle.length < 3 || !ciudad) {
        sugerenciasCalle.innerHTML = "";   
        return;
    }
    try {
        // Obtenemos las coordenadas de la ciudad que ya guardamos en estadoUbicacion
        const { lat, lon } = estadoUbicacion.coords;

        // Construimos la URL con lat y lon para priorizar resultados locales
        // También incluimos la provincia y "Argentina" en el texto de búsqueda para mayor precisión
        const queryBusqueda = `${calle}, ${ciudad}, ${provincia}, Argentina`;
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(queryBusqueda)}&lat=${lat}&lon=${lon}&limit=10`;

        const res = await fetch(url);
        const data = await res.json();

        renderizarSugerenciasCalle(data.features);

    } catch (e) {
        console.error("Error buscando calle:", e);
    }
    }),300);

}

function limpiarCiudadYCalle() {
    const inputCiudad = document.getElementById('input-ciudad');
    const inputCalle = document.getElementById('input-calle');
    const sugerenciasCiudad = document.getElementById('sugerencias-ciudad');
    const sugerenciasCalle = document.getElementById('contenedor-sugerencias');

    inputCiudad.value = "";
    inputCalle.value = "";

    sugerenciasCiudad.innerHTML = "";
    sugerenciasCalle.innerHTML = "";

    inputCalle.disabled = true;

    latitudFinal = null;
    longitudFinal = null;

    if (marcador) {
        marcador.setLatLng([-38.4161, -63.6167]);
    }
}

function limpiarCalle() {
    const inputCalle = document.getElementById('input-calle');
    const sugerenciasCalle = document.getElementById('contenedor-sugerencias');

    inputCalle.value = "";
    sugerenciasCalle.innerHTML = "";

    latitudFinal = null;
    longitudFinal = null;
}

function actualizarMarcador(lat, lon, zoom ) {
    if (!mapa || !marcador) return;

    marcador.setLatLng([lat, lon]);
    mapa.flyTo([lat, lon], zoom, { duration: 1.2 });

    latitudFinal = lat;
    longitudFinal = lon;
}

// ================== PEDIDO ==================
document.getElementById('boton-enviar-pedido').addEventListener('click', async () => {

    const boton = document.getElementById('boton-enviar-pedido');

    const trackingID = generarCodigoSeguimiento();

    const pedido = {
        cliente: document.getElementById('nombre-cliente').value,
        tracking_id: trackingID,
        email: document.getElementById('email-cliente').value,
        telefono: document.getElementById('telefono-cliente').value,
        tela: document.getElementById('tela-seleccionada').value,
        personalizacion : document.getElementById('personalizacion-seleccionada').value,
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

        if (pedido.personalizacion !== 'sin-nada') {
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
    document.getElementById('datos-comprador').classList.add('oculto');
    localStorage.setItem('vistaActual', vista);
    window.location.hash = vista;

    if (vista === 'inicio') {
        document.getElementById('inicio').classList.remove('oculto');
    } else if (vista === 'armar') {
        document.getElementById('compra').classList.remove('oculto');
    } else if (vista === 'datos-comprador'){
        document.getElementById('datos-comprador').classList.remove('oculto');
        setTimeout(() => {
            mapa.invalidateSize();
        }, 100);
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

        estado.className = 'status';

        if (data.error) {
            estado.innerText = "Código no encontrado";
            estado.classList.add('error'); // Opcional: una clase para errores
        } else {
            const textoStatus = data.estado; 
            estado.innerText = textoStatus;

            // 3. Lógica para asignar el color según el texto exacto
            if (textoStatus === 'Pendiente') {
                estado.classList.add('pendiente');
            } else if (textoStatus === 'En proceso') { // Asegúrate que coincida con tu Excel
                estado.classList.add('enproceso');
            } else if (textoStatus === 'Terminado'){
                estado.classList.add('terminado')
            } else if (textoStatus === 'Enviado') {
                estado.classList.add('enviado');
            } else if (textoStatus === 'Entregado') {
                estado.classList.add('entregado');
            }
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

// ================== CARRITO ==================

let carrito = [];

// ================== UI CARRITO ==================

const cartButton = document.getElementById('cart-button');
const cartWindow = document.getElementById('cart-window');
const closeCart = document.getElementById('close-cart');

/*if (cartButton && cartWindow) {
    cartButton.onclick = () => {
        cartWindow.classList.toggle('oculto');
    };
}

if (closeCart && cartWindow) {
    closeCart.onclick = () => {
        cartWindow.classList.add('oculto');
    };
}*/

// ================== RENDER ==================

function renderizarCarrito() {
    const lista = document.getElementById('cart-items');
    const totalTxt = document.getElementById('total-price');
    const contador = document.getElementById('cart-count');
    const cartBtn = document.getElementById('cart-button');
    const btnCheckout = document.getElementById('btn-checkout');
    

    if (!lista || !totalTxt || !contador) return;

    lista.innerHTML = "";
    let total = 0;
    let unidades = 0;

    if (carrito.length === 0) {
        lista.innerHTML = '<p class="empty-msg">El carrito está vacío</p>';
        if (btnCheckout) {
            btnCheckout.disabled = true;
            btnCheckout.classList.add('btn-deshabilitado');
        }
    } else {
        // --- Lógica de desbloqueo ---
        if (btnCheckout) {
            btnCheckout.disabled = false;
            btnCheckout.classList.remove('btn-deshabilitado');
        }
    }

    if (cartBtn) {
    cartBtn.style.transform = "scale(1.5) translateY(-5px)";
    setTimeout(() => {
        cartBtn.style.transform = "scale(1) translateY(0)";
    }, 200);
    }

    carrito.forEach(item => {
        total += item.precio * item.cantidad;
        unidades += item.cantidad;

        const div = document.createElement('div');
        div.className = 'cart-item';

        div.innerHTML = `
            <div>
                <strong>${item.nombre}</strong><br>
                <small>${item.detalle || ""}</small><br>
                <small>$${item.precio * item.cantidad}</small>
            </div>
            <button class="btn-remove" onclick="eliminarDelCarrito('${item.id}')">Quitar</button>
        `;

        lista.appendChild(div);
    });

    totalTxt.innerText = total;
    contador.innerText = unidades;
    
}

// ================== ACCIONES ==================

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    renderizarCarrito();
}

function agregarAlCarritoPersonalizado(producto) {
    carrito.push(producto);
    renderizarCarrito();

    const cartBtn = document.getElementById('cart-button');
    if (cartBtn) {
        cartBtn.classList.add('pulse-animation');
        setTimeout(() => cartBtn.classList.remove('pulse-animation'), 500);
    }
    
}

// ================== BOTÓN FINAL ==================

const btnAgregarFinal = document.getElementById('btn-agregar-final');

if (btnAgregarFinal) {
    btnAgregarFinal.addEventListener('click', () => {

        const telaId = document.getElementById('tela-seleccionada').value;
        const telaCard = document.querySelector('.card-opcion.seleccionada');
        const personalizacion = document.getElementById('personalizacion-seleccionada').value;
        
        

        if (!telaId || !telaCard) {
            alert("Por favor, selecciona primero una tela.");
            return;
        }

        const nombreTela = telaCard.querySelector('span').innerText;
        const precioBase = parseFloat(telaCard.dataset.precio);


        const productoParaCarrito = {
            id: `${telaId}-${personalizacion}-${Date.now()}`,
            nombre: `Tote ${nombreTela}`,
            detalle: `Personalificacion: `,
            precio: precioBase,
            cantidad: 1
        };

        agregarAlCarritoPersonalizado(productoParaCarrito);
    });
}

document.getElementById('cart-button').onclick = () => {
    cartWindow.classList.remove('oculto');
    cartWindow.classList.toggle('activo');
};

document.getElementById('close-cart').onclick = (e) => {
    e.stopPropagation();
    cartWindow.classList.remove('oculto');
    cartWindow.classList.toggle('activo');
};

window.addEventListener('load', () => {
    document.getElementById('cart-window').classList.add('oculto');
});

document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrito(); // Esto inicializa el estado del botón al cargar la web
});

function renderizarSugerenciasCiudad(features) {
    const sugerenciasCiudad = document.getElementById('sugerencias-ciudad');
    const inputCiudad = document.getElementById('input-ciudad');
    const selectProvincia = document.getElementById('select-provincia');

    //sugerenciasCiudad.innerHTML = ""; // Limpiamos lo anterior

    features
        .filter(lugar => {
            const tipo = lugar.properties.type;
            return tipo === 'city' || tipo === 'town' || tipo === 'village';
        })
        .slice(0, 5)
        .forEach(lugar => {
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
                
                // Actualizamos el estado global de ubicación
                estadoUbicacion.ciudad = nombre;
                estadoUbicacion.coords = { lat, lon };

                actualizarMarcador(lat, lon, 13);
                sugerenciasCiudad.innerHTML = "";
            };
            sugerenciasCiudad.appendChild(div);
        });
}

function renderizarSugerenciasCalle(features) {
    const sugerenciasCalle = document.getElementById('contenedor-sugerencias');
    const inputCalle = document.getElementById('input-calle');
    const ciudadActual = document.getElementById('input-ciudad').value;

    sugerenciasCalle.innerHTML = "";

    features.forEach(lugar => {
        const p = lugar.properties;
        const nombreVia = p.street || p.name || '';
        const altura = p.housenumber || '';
        const dirCompleta = `${nombreVia} ${altura}`.trim();

        if (!nombreVia) return;

        const div = document.createElement('div');
        div.className = 'sugerencia-item';
        div.innerHTML = `
            <strong>${dirCompleta}</strong>
            <br>
            <small>${p.city || ciudadActual}</small>
        `;

        div.onclick = () => {
            const [lon, lat] = lugar.geometry.coordinates;
            inputCalle.value = dirCompleta;

            // Guardamos las coordenadas finales para el pedido [source: 2]
            latitudFinal = lat;
            longitudFinal = lon;
            direccionValidada = `${dirCompleta}, ${p.city || ciudadActual}`;

            actualizarMarcador(lat, lon, 17); // Zoom más cerca para ver la casa
            sugerenciasCalle.innerHTML = "";
        };
        sugerenciasCalle.appendChild(div);
    });
}