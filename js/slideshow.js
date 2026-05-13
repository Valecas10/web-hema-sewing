/**
 * =========================
 * SLIDESHOW CROSSFADE
 * =========================
 */

const todasLasFotos = [
    "assets/fotos-inicio/Modelo-1.webp",
    "assets/fotos-inicio/Modelo-2.webp",
    "assets/fotos-inicio/Modelo-3.webp",
    "assets/fotos-inicio/Modelo-4.webp",
    "assets/fotos-inicio/Modelo-5.webp",
    "assets/fotos-inicio/Modelo-6.webp",
    "assets/fotos-inicio/Modelo-7.webp",
    "assets/fotos-inicio/Modelo-8.webp",
    "assets/fotos-inicio/Modelo-9.webp",
    "assets/fotos-inicio/Modelo-10.webp"
];

// Variables de estado
let fotosLibres = todasLasFotos.slice(3);
let frameActual = 0;

todasLasFotos.forEach(src => {
    const img = new Image();
    img.src = src;
});

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