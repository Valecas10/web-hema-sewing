/**
 * =========================
 * CATÁLOGO
 * =========================
 */

const URL_EXCEL_CATALOGO = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRqFqWZPXyUTBBXJAydfEeEcKcoDghf6accKDZT9ZA6dsRctXvGs1H1vBmWyhndt95fbRcLt6p30Cco/pub?gid=0&single=true&output=csv';

async function cargarCatalogo() {

    try {

        const respuesta = await fetch(URL_EXCEL_CATALOGO);

        const texto = await respuesta.text();

        const filas = texto
            .split('\n')
            .slice(1)
            .filter(fila => fila.trim() !== "");

        const contenedor = document.getElementById('contenedor-catalogo');

        contenedor.innerHTML = "";

        filas.forEach(fila => {
            //console.log(columnas);

            const columnas = fila.split(',');

            if (columnas.length < 8) return;

            const [
                id,
                nombre,
                categoria,
                precio,
                stock,
                imagen,
                descripcion,
                activo
            ] = columnas.map(c => c.trim());

            // =========================
            // PRODUCTO INACTIVO
            // =========================

            if (activo.toUpperCase() !== 'SI') return;

            // =========================
            // STOCK
            // =========================

            const stockNumero = parseInt(stock);

            let textoStock = "";

            if (stockNumero === -1) {

                textoStock =
                    `<small class="stock-ilimitado">Disponible</small>`;

            } else if (stockNumero > 0) {

                textoStock =
                    `<small class="stock-limitado">Quedan ${stockNumero}</small>`;

            } else {

                textoStock =
                    `<small class="stock-agotado">Agotado</small>`;
            }

            // =========================
            // CARD
            // =========================

            const card = document.createElement('div');

            card.className = 'card-catalogo';

            card.dataset.id = id;
            card.dataset.stock = stockNumero;
            card.dataset.precio = precio;

            card.innerHTML = `
                <img
                    src="assets/catalogo/${categoria}/${imagen}"
                    alt="${nombre}"
                    class="catalogo-img"
                >

                <div class="catalogo-info">

                    <h3>${nombre}</h3>

                    <p>${descripcion}</p>

                    <strong>$${precio}</strong>

                    ${textoStock}

                    <button class="btn-catalogo">
                        Agregar al carrito
                    </button>

                </div>
            `;

            const botonAgregar = card.querySelector('.btn-catalogo');

            // =========================
            // AGOTADO
            // =========================

            if (stockNumero === 0) {

                card.classList.add('agotado');

                card.querySelector('.btn-catalogo').disabled = true;
            }

            contenedor.appendChild(card);

            botonAgregar.addEventListener('click', () => {

                if (stockNumero === 0) return;

                const productoCarrito = {

                    id: `${id}-${Date.now()}`,

                    nombre: nombre,

                    detalle: descripcion,

                    precio: parseFloat(precio),

                    cantidad: 1,

                    imagen: `assets/catalogo/${categoria}/${imagen}`,

                    telaId: id,

                    personalizacion: 'catalogo'

                };

                agregarAlCarritoPersonalizado(productoCarrito);

            });

        });

    } catch (error) {

        console.error(
            'Error al cargar catálogo:',
            error
        );
    }
}

function inicializarCatalogo() {

    cargarCatalogo();

}