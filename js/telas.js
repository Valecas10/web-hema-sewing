/**
 * =========================
 * TELAS
 * =========================
 */

const opcionesPersonalizacion = [
    { id: 'sin-nada', nombre: 'Sin nada', precio: 0, img: '../assets/opciones/basico.webp' },
    { id: 'lazo-tela', nombre: 'Agregar Lazo de Tela', precio: 1000, img: '../assets/opciones/lazo-tela.webp' },
    { id: 'lazo-cintas', nombre: 'Agregar Lazo de Cintas', precio: 1000, img: '../assets/opciones/lazo-cintas.webp' },
    { id: 'volado', nombre: 'Agregar Volado', precio: 1500, img: '../assets/opciones/volado.webp' },
    { id: 'bordado', nombre: 'Agregar Bordado', precio: 2500, img: '../assets/opciones/bordado.webp' },
    { id: 'mosaico', nombre: 'Efecto Mosaico', precio: 3000, img: '../assets/opciones/mosaico.jpg' }
];

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

            const [nombre, costo, rutaImagen, id, stock] =
                columnas.map(c => c.trim());

            const imagenDirecta = formatearLinkDrive(rutaImagen);

            const card = document.createElement('div');

            card.className = 'card-opcion';
            card.dataset.valor = id;
            card.dataset.precio = costo;
            card.dataset.stock = stock;

            const stockNumero = parseInt(stock);

            let textoStock = "";

            if (stockNumero === -1) {
                textoStock = `<small class="stock-ilimitado">Disponible</small>`;
            } else if (stockNumero > 0) {
                textoStock = `<small class="stock-limitado">Quedan ${stockNumero}</small>`;
            } else {
                textoStock = `<small class="stock-agotado">Agotada</small>`;
            }

            card.innerHTML = `
                <img src="${imagenDirecta}" alt="${nombre}" onerror="this.src='assets/Logo.jpg';">
                <span>${nombre}</span>
                <small>$${costo}</small>
                ${textoStock}
            `;
            
            if (stockNumero === 0) {
                card.classList.add('agotada');
            }

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
                
                const stock = parseInt(card.dataset.stock);

                if (stockNumero === 0) {
                    return;
                }

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

function cargarOpcionesPersonalizacion() {
    const contenedor = document.getElementById('contenedor-personalizacion');
    contenedor.innerHTML = "";

    opcionesPersonalizacion.forEach(opc => {
        const card = document.createElement('div');
        card.className = 'card-opcion';
        
        // Guardamos los datos en la card para usarlos después
        card.dataset.id = opc.id;
        card.dataset.precio = opc.precio;
        card.dataset.nombre = opc.nombre;

        if(opc.id === 'sin-nada') card.classList.add('seleccionada');

        card.innerHTML = `
            <img src="${opc.img}" alt="${opc.nombre}" onerror="this.src='assets/Logo.jpg';">
            <span>${opc.nombre}</span>
            <small>${opc.precio > 0 ? '+$' + opc.precio : ''}</small>
        `;

        card.onclick = () => {
            const inputPersonalizacion = document.getElementById('personalizacion-seleccionada');

            if (opc.id === 'sin-nada') {
                // Si hace clic en "Sin nada", borramos todas las demás selecciones
                document.querySelectorAll('#contenedor-personalizacion .card-opcion')
                        .forEach(c => c.classList.remove('seleccionada'));
                card.classList.add('seleccionada');
            } else {
                // Si hace clic en cualquier otra, le sacamos la selección a "Sin nada"
                const sinNadaCard = document.querySelector('#contenedor-personalizacion .card-opcion[data-id="sin-nada"]');
                if (sinNadaCard) sinNadaCard.classList.remove('seleccionada');

                // Activamos/Desactivamos la card que tocó
                card.classList.toggle('seleccionada');

                // Si deseleccionó todo y no quedó ninguna marcada, volvemos a marcar "Sin nada"
                const seleccionadas = document.querySelectorAll('#contenedor-personalizacion .card-opcion.seleccionada');
                if (seleccionadas.length === 0 && sinNadaCard) {
                    sinNadaCard.classList.add('seleccionada');
                }
            }

            // Guardamos todos los IDs seleccionados en el input oculto (ej: "bordado, volado")
            const seleccionadasFinal = document.querySelectorAll('#contenedor-personalizacion .card-opcion.seleccionada');
            const idsSeleccionados = Array.from(seleccionadasFinal).map(c => c.dataset.id).join(', ');
            inputPersonalizacion.value = idsSeleccionados;
        };
        
        contenedor.appendChild(card);
    });
}

const btnAgregarFinal = document.getElementById('btn-agregar-final');

if (btnAgregarFinal) {
    btnAgregarFinal.addEventListener('click', () => {

        const telaId = document.getElementById('tela-seleccionada').value;
        const telaCard = document.querySelector('#contenedor-telas .card-opcion.seleccionada');
        const stockActual = parseInt(telaCard.dataset.stock);
        const personalizacionInput = document.getElementById('personalizacion-seleccionada').value;
        const imagenTela = telaCard.querySelector('img').src;
        
        if (!telaId || !telaCard) {
            alert("Por favor, selecciona primero una tela.");
            return;
        }

        const nombreTela = telaCard.querySelector('span').innerText;
        let precioTotal = parseFloat(telaCard.dataset.precio); // Precio base de la tela

        // Buscamos todas las cards de personalización que estén seleccionadas
        const cardsPersonalizacion = document.querySelectorAll('#contenedor-personalizacion .card-opcion.seleccionada');
        let nombresPersonalizacion = [];

        // Sumamos los precios y guardamos los nombres
        cardsPersonalizacion.forEach(card => {
            if (card.dataset.id !== 'sin-nada') {
                precioTotal += parseFloat(card.dataset.precio || 0);
                nombresPersonalizacion.push(card.dataset.nombre);
            }
        });

        // Armamos el texto para el carrito
        const textoDetalle = nombresPersonalizacion.length > 0 
            ? `Personalización: ${nombresPersonalizacion.join(' + ')}` 
            : 'Sin personalización';

        // Evita agregar si no hay stock
        if (stockActual === 0) {
            alert("Esta tela ya no tiene stock.");
            return;
        }

        const productoParaCarrito = {
            id: `${telaId}-${personalizacionInput.replace(/, /g, '-')}-${Date.now()}`,
            nombre: `Tote de ${nombreTela}`,
            detalle: textoDetalle,
            precio: precioTotal,
            cantidad: 1,
            personalizacion: personalizacionInput,
            imagen: imagenTela,
            telaId: telaId
        };

        agregarAlCarritoPersonalizado(productoParaCarrito);

        // ================== DESCONTAR STOCK ==================

        

        if (stockActual !== -1) {

            let nuevoStock = stockActual - 1;

            telaCard.dataset.stock = nuevoStock;

            const stockTexto = telaCard.querySelector('.stock-limitado, .stock-ilimitado, .stock-agotado');

            if (nuevoStock > 0) {

                stockTexto.className = 'stock-limitado';
                stockTexto.innerText = `Quedan ${nuevoStock}`;

            } else {

                stockTexto.className = 'stock-agotado';
                stockTexto.innerText = 'Agotada';

                telaCard.classList.remove('seleccionada');
                telaCard.classList.add('agotada');

                document.getElementById('tela-seleccionada').value = "";
            }
        }
    });
}