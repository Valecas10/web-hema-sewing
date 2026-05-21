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

let fotosLibres = todasLasFotos.slice(3);
let frameActual = 0;

todasLasFotos.forEach(src => {
    const img = new Image();
    img.src = src;
});

function rotarSecuencial() {

    const framesContenedores = document.querySelectorAll('.photo-frame');
    const imagenesPrincipales = document.querySelectorAll('.photo-frame img:not(.temp-fade)');
    
    const contenedor = framesContenedores[frameActual];
    const imgPrincipal = imagenesPrincipales[frameActual];

    if (!contenedor || !imgPrincipal) return;

    const fotoSaliendo = imgPrincipal.getAttribute('src');
    const fotoEntrante = fotosLibres.shift();

    if (!fotoEntrante) return;

    const cargador = new Image();
    cargador.src = fotoEntrante;

    cargador.onload = () => {

        const clon = document.createElement('img');
        clon.src = fotoEntrante;
        clon.classList.add('temp-fade');
        contenedor.appendChild(clon);
        clon.offsetWidth;
        imgPrincipal.style.transition = 'opacity 1.5s ease-in-out';
        imgPrincipal.style.setProperty('--opacidad','0')

        setTimeout(() => {
            imgPrincipal.style.transition = 'none';
            imgPrincipal.src = fotoEntrante;
            imgPrincipal.style.setProperty('--opacidad','1');
            clon.remove();

            fotosLibres.push(fotoSaliendo);
        }, 1600); 
    };

    frameActual = (frameActual + 1) % framesContenedores.length;
}

setInterval(rotarSecuencial, 4000);