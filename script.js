/**
 * HEMA SEWING - Lógica de Pedidos
 */

// ================== CONFIG ==================
const PROXY_CORS = "https://api.allorigins.win/raw?url=";

const URL_EXCEL_TELAS =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1TGS0fsPl0LDGIW7GgB9GwgilhT-Swc6_ivAxF_O11-pv8E_3qjeEg4IG9KPAKdq74qTAwrrhRe4F/pub?output=csv';

const URL_WEB_APP_EXCEL =
    'https://script.google.com/macros/s/AKfycbxvHl4RgAuQ_Y3I8r9xMJFWCn2nf7hysAB0zwoRnSMhR8TEtVD3k0OU1s7-wnw1VhrV/exec';

// ================== VARIABLES GLOBALES ==================

const Tote ={}


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

    inicializarCheckout();
    inicializarCarrito();
    inicializarUI();
    inicializarMapa();
    cargarTelasDinamicas();
    cargarOpcionesPersonalizacion();
});
