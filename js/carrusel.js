/**
 * =========================
 * CARRUSEL
 * =========================
 */

function inicializarCarruselTelas() {

    const scrollCantidad = 320;

    // Carrusel de Telas
    const contenedorTelas = document.getElementById('contenedor-telas');
    const btnPrevTelas = document.getElementById('btn-prev-telas');
    const btnNextTelas = document.getElementById('btn-next-telas');

    if (contenedorTelas && btnPrevTelas && btnNextTelas) {
        btnNextTelas.addEventListener('click', () => {
            contenedorTelas.scrollBy({
                left: scrollCantidad,
                behavior: 'smooth'
            });
        });

        btnPrevTelas.addEventListener('click', () => {
            contenedorTelas.scrollBy({
                left: -scrollCantidad,
                behavior: 'smooth'
            });
        });
    }

    // Carrusel de Personalización
    const contenedorPers = document.getElementById('contenedor-personalizacion');
    const btnPrevPers = document.getElementById('btn-prev-personalizacion');
    const btnNextPers = document.getElementById('btn-next-personalizacion');

    if (contenedorPers && btnPrevPers && btnNextPers) {
        btnNextPers.addEventListener('click', () => {
            contenedorPers.scrollBy({
                left: scrollCantidad,
                behavior: 'smooth'
            });
        });

        btnPrevPers.addEventListener('click', () => {
            contenedorPers.scrollBy({
                left: -scrollCantidad,
                behavior: 'smooth'
            });
        });
    }

}