/**
 * =========================
 * CARRITO
 * =========================
 */

let carrito = [];

const cartButton = document.getElementById('cart-button');
const cartWindow = document.getElementById('cart-window');
const closeCart = document.getElementById('close-cart');

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

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
            <div class="cart-item-content">

                <img 
                    src="${item.imagen}" 
                    alt="${item.nombre}"
                    class="cart-item-image"
                >

                <div class="cart-item-info">
                    <strong>${item.nombre}</strong>
                    <small>${item.detalle || ""}</small>
                    <small>$${item.precio * item.cantidad}</small>
                </div>

            </div>
            <button class="btn-remove" onclick="eliminarDelCarrito('${item.id}')">Quitar</button>
        `;

        lista.appendChild(div);
    });

    totalTxt.innerText = total;
    contador.innerText = unidades;

    const requiereCotizacion = carrito.some(producto => 
        typeof producto.personalizacion === 'string' &&
        producto.personalizacion.toLowerCase().includes('bordado')
    );

    if (requiereCotizacion) {
        // Cambiamos el diseño/texto para cotización
        btnCheckout.innerText = 'Cotizar por WhatsApp';
        
        // Le asignamos la función que manda el mensaje a Nai
        btnCheckout.onclick = enviarCotizacionWhatsApp; 
    } else {
        // Comportamiento normal de e-commerce
        btnCheckout.innerText = 'Ir a Pagar';
        
        // Le asignamos tu función normal que los lleva a cargar los datos
        btnCheckout.onclick = () => {
            mostrarVista('datos-comprador'); 
        };
    }
    
}

function eliminarDelCarrito(id) {
    // Buscamos el producto antes de eliminarlo
    const producto = carrito.find(item => item.id === id);
    if (producto) {

        // Buscamos la card de la tela correspondiente
        const telaCard = document.querySelector(
            `#contenedor-telas .card-opcion[data-valor="${producto.telaId}"]`
        );

        if (telaCard) {
            const stockGuardado = obtenerStockGuardado();

            const stockActual =
                stockGuardado[producto.telaId] ?? 0;

            // Solo devolvemos stock si NO es infinita
            if (stockActual !== -1) {

                let nuevoStock = stockActual + 1;

                // Guardamos el nuevo stock REAL
                stockGuardado[producto.telaId] = nuevoStock;

                guardarStock(stockGuardado);

                // Actualizamos visualmente
                telaCard.dataset.stock = nuevoStock;

                const stockTexto = telaCard.querySelector(
                    '.stock-limitado, .stock-ilimitado, .stock-agotado'
                );

                // Si estaba agotada la rehabilitamos
                telaCard.classList.remove('agotada');

                if (nuevoStock > 0) {

                    stockTexto.className = 'stock-limitado';
                    stockTexto.innerText = `Quedan ${nuevoStock}`;

                }
            }
        }
    }

    
    carrito = carrito.filter(item => item.id !== id);
    guardarCarrito();
    renderizarCarrito();
}

function agregarAlCarritoPersonalizado(producto) {
    carrito.push(producto);
    guardarCarrito();
    renderizarCarrito();

    const cartBtn = document.getElementById('cart-button');
    if (cartBtn) {
        cartBtn.classList.add('pulse-animation');
        setTimeout(() => cartBtn.classList.remove('pulse-animation'), 500);
    }

    
    
}

function inicializarCarrito() {

    const cartWindow = document.getElementById('cart-window');

    if (cartWindow) {
        cartWindow.classList.add('oculto');
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

    const carritoGuardado = localStorage.getItem('carrito');

    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
    }

    renderizarCarrito();
    
}