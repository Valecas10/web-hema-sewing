/**
 * =========================
 * INTERFAZ DE USUARIO
 * =========================
 */

function mostrarVista(vista) {

    /* =========================
       OCULTAR VISTAS
    ========================= */

    document.getElementById('inicio')
        .classList.add('oculto');

    document.getElementById('compra')
        .classList.add('oculto');

    document.getElementById('seguimiento')
        .classList.add('oculto');

    document.getElementById('datos-comprador')
        .classList.add('oculto');

    document.getElementById('pedido-exitoso')
        .classList.add('oculto');

    document.getElementById('catalogo')
        .classList.add('oculto');

    document.getElementById('catalogo-totes')
        .classList.add('oculto');

    document.getElementById('catalogo-colitas')
        .classList.add('oculto');

    document.getElementById('catalogo-bidon')
        .classList.add('oculto');

    document.getElementById('catalogo-agendas')
        .classList.add('oculto');

    document.getElementById('catalogo-individuales')
        .classList.add('oculto');

    document.getElementById('catalogo-posavasos')
        .classList.add('oculto');


    /* =========================
       CARRITO
    ========================= */

    const carrito =
        document.getElementById(
            'cart-container'
        );

    carrito.classList.add('oculto');


    /* =========================
       STORAGE + HASH
    ========================= */

    localStorage.setItem(
        'vistaActual',
        vista
    );

    window.location.hash = vista;


    /* =========================
       VISTAS
    ========================= */

    if (vista === 'inicio') {

        document.getElementById('inicio')
            .classList.remove('oculto');

        carrito.classList.remove('oculto');

    } else if (vista === 'armar') {

        document.getElementById('compra')
            .classList.remove('oculto');

        carrito.classList.remove('oculto');

    } else if (
        vista === 'datos-comprador'
    ) {

        document.getElementById(
            'datos-comprador'
        ).classList.remove('oculto');

        carrito.classList.add('oculto');


        setTimeout(() => {

            mapa.invalidateSize();

        }, 100);

    } else if (
        vista === 'seguimiento'
    ) {

        document.getElementById(
            'seguimiento'
        ).classList.remove('oculto');

        carrito.classList.add('oculto');

    } else if (
        vista === 'pedido-exitoso'
    ) {

        document.getElementById(
            'pedido-exitoso'
        ).classList.remove('oculto');

        carrito.classList.add('oculto');

    } else if (
        vista === 'catalogo'
    ) {

        document.getElementById(
            'catalogo'
        ).classList.remove('oculto');

        carrito.classList.remove('oculto');

    } else if (
        vista === 'catalogo-totes'
    ) {

        document.getElementById(
            'catalogo-totes'
        ).classList.remove('oculto');

        carrito.classList.remove('oculto');

    } else if (
        vista === 'catalogo-colitas'
    ) {

        document.getElementById(
            'catalogo-colitas'
        ).classList.remove('oculto');

        carrito.classList.remove('oculto');

    } else if (
        vista === 'catalogo-bidon'
    ) {

        document.getElementById(
            'catalogo-bidon'
        ).classList.remove('oculto');

        carrito.classList.remove('oculto');

    } else if (
        vista === 'catalogo-agendas'
    ) {

        document.getElementById(
            'catalogo-agendas'
        ).classList.remove('oculto');

        carrito.classList.remove('oculto');

    } else if (
        vista === 'catalogo-individuales'
    ) {

        document.getElementById(
            'catalogo-individuales'
        ).classList.remove('oculto');

        carrito.classList.remove('oculto');

    } else if (
        vista === 'catalogo-posavasos'
    ) {

        document.getElementById(
            'catalogo-posavasos'
        ).classList.remove('oculto');

        carrito.classList.remove('oculto');

    }

}


/* =========================
   WINDOW LOAD
========================= */

window.onload = function () {

    const ultimaVista =
        localStorage.getItem(
            'vistaActual'
        );


    if (ultimaVista) {

        mostrarVista(
            ultimaVista
        );

    } else {

        mostrarVista('inicio');

    }

};


/* =========================
   HASH CHANGE
========================= */

window.addEventListener(
    'hashchange',

    function () {

        const vistaDeseada =
            window.location.hash.replace(
                '#',
                ''
            );


        if (vistaDeseada) {

            mostrarVista(
                vistaDeseada
            );

        }

    }
);


/* =========================
   INICIALIZAR UI
========================= */

function inicializarUI() {

    const menuBtn =
        document.getElementById(
            'mobile-menu'
        );

    const navMenu =
        document.querySelector(
            '.nav-menu'
        );


    if (menuBtn && navMenu) {

        menuBtn.addEventListener(
        'click',

        (e) => {

            e.stopPropagation();

            navMenu.classList.toggle(
                'mostrar'
            );

            menuBtn.classList.toggle(
                'activo'
            );

        }
    );

    }

}