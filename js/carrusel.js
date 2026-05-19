/**
 * =========================
 * CARRUSEL
 * =========================
 */


function inicializarCarruselTelas() {

    const contenedor =
        document.getElementById('contenedor-telas');

    const btnPrev =
        document.getElementById('btn-prev-telas');

    const btnNext =
        document.getElementById('btn-next-telas');

    if (!contenedor || !btnPrev || !btnNext) return;

    const scrollCantidad = 320;

    btnNext.addEventListener('click', () => {

        contenedor.scrollBy({
            left: scrollCantidad,
            behavior: 'smooth'
        });

    });

    btnPrev.addEventListener('click', () => {

        contenedor.scrollBy({
            left: -scrollCantidad,
            behavior: 'smooth'
        });

    });

}