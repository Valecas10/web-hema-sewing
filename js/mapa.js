/**
 * =========================
 * MAPA
 * =========================
 */

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
            if (prov === "CABA") {
                // Autocompletamos y bloqueamos ciudad
                inputCiudad.value = "CABA";
                inputCiudad.disabled = true;
                estadoUbicacion.ciudad = "CABA"; 
                inputCiudad.placeholder = "Aplica para todo CABA";
                
                // Habilitamos la calle para que sigan de largo
                inputCalle.disabled = false;
            } else {
                // Comportamiento normal para el resto de provincias
                inputCiudad.disabled = false;
                inputCiudad.placeholder = "Ej: Tandil"; // Restauramos tu placeholder original
                // inputCalle ya fue deshabilitado por limpiarCiudadYCalle()
            }
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
    let provincia = selectProvincia.value;
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
        if(provincia === "CABA"){provincia = "Buenos Aires"}
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


function renderizarSugerenciasCiudad(features) {
    const sugerenciasCiudad = document.getElementById('sugerencias-ciudad');
    const inputCiudad = document.getElementById('input-ciudad');
    const selectProvincia = document.getElementById('select-provincia');

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