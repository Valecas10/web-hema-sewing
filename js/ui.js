/**
 * =========================
 * INTERFAZ DE USUARIO
 * =========================
 */

function mostrarVista(vista) {
    document.getElementById('inicio').classList.add('oculto');
    document.getElementById('compra').classList.add('oculto');
    document.getElementById('seguimiento').classList.add('oculto');
    document.getElementById('datos-comprador').classList.add('oculto');
    document.getElementById('pedido-exitoso').classList.add('oculto');
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
    } else if (vista === 'pedido-exitoso') {
        document.getElementById('pedido-exitoso').classList.remove('oculto');
    }
}

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

function inicializarUI() {

    const menuBtn = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (menuBtn && navMenu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('mostrar');
        });
    }

}