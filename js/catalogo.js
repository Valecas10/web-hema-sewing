/**
 * =========================
 * CATÁLOGO
 * =========================
 */

/* =========================
   CARGAR CATÁLOGO
========================= */

async function cargarCatalogo(
    categoriaSeleccionada,
    idContenedor
) {

    try {

        const respuesta =
            await fetch(
                `${URL_WEB_APP_EXCEL}?action=getPublicCatalog`
            );

        const productos =
            await respuesta.json();

        const productosAgrupados = {};

        const contenedor =
            document.getElementById(
                idContenedor
            );

        contenedor.innerHTML = '';

        productos.forEach(producto => {

            const {
                id,
                nombre,
                categoria,
                precio,
                stock,
                imagen,
                descripcion,
                color,
                activo
            } = producto;

            if (!productosAgrupados[nombre]) {

                productosAgrupados[nombre] = {
                    nombre,
                    categoria,
                    descripcion,
                    variantes: []
                };

            }

            productosAgrupados[nombre].variantes.push({
                id,
                precio,
                stock,
                imagen,
                color,
                activo
            });

        });

        Object.values(productosAgrupados).forEach(producto => {

            const varianteInicial =
                producto.variantes[0];

            let varianteSeleccionada =
                varianteInicial;

            const {
                id,
                precio,
                stock,
                imagen,
                color,
                activo
            } = varianteInicial;

            const nombre =
                producto.nombre;

            const categoria =
                producto.categoria;

            const descripcion =
                producto.descripcion;
        
            /* =========================
               PRODUCTO INACTIVO
            ========================= */

            if (!activo) {
                return;
            }

            if (
                categoria !== categoriaSeleccionada
            ) {
                return;
            }


            /* =========================
               STOCK
            ========================= */

            const stockNumero =
                parseInt(stock);

            const stockGuardado =
                obtenerStockGuardado();

            const stockFinal =
                stockGuardado[id] ??
                stockNumero;

            let textoStock = '';


            if (stockFinal === -1) {

                textoStock = `
                    <small class="stock-ilimitado">
                        Disponible
                    </small>
                `;

            } else if (stockFinal > 0) {

                if (stockFinal === 1) {

                    textoStock = `
                        <small class="stock-limitado">
                            Ultima Unidad Disponible🔥
                        </small>
                    `;

                } else {

                    textoStock = `
                        <small class="stock-limitado">
                            Quedan ${stockFinal}
                        </small>
                    `;

                }

            } else {

                textoStock = `
                    <small class="stock-agotado">
                        Agotado
                    </small>
                `;

            }


            /* =========================
               CARD
            ========================= */

            const card =
                document.createElement('div');

            card.className =
                'card-catalogo';
            card.dataset.producto =
                nombre;

            card.dataset.id = id;
            card.dataset.stock = stockFinal;
            card.dataset.precio = precio;

            let coloresHTML = '';

            if (varianteInicial.color !== 'UNICO') {

                coloresHTML = `
                    <div class="selector-colores">

                        ${producto.variantes.map((variante, index) => `
                            <button
                                class="color-option ${index === 0 ? 'activo' : ''}"
                                data-id="${variante.id}"
                                data-color="${variante.color}"
                                style="background:${variante.color}">
                            </button>
                        `).join('')}

                    </div>
                `;
            }

            card.innerHTML = `
                <img
                    src="assets/catalogo/${categoria}/${imagen}"
                    alt="${nombre}"
                    class="catalogo-img"
                >

                <div class="catalogo-info">

                    <h3>${nombre}</h3>

                    ${coloresHTML}

                    <p>${descripcion}</p>

                    <strong class="precio-catalogo">
                        $${precio}
                    </strong>

                    ${textoStock}

                    <button class="btn-catalogo">
                        Agregar al carrito
                    </button>

                </div>
            `;


            const botonAgregar =
                card.querySelector(
                    '.btn-catalogo'
                );

            const imagenCard =
                card.querySelector(
                    '.catalogo-img'
                );

            const precioCard =
                card.querySelector(
                    '.precio-catalogo'
                );

            const stockTexto =
                card.querySelector(
                    '.stock-limitado, .stock-ilimitado, .stock-agotado'
                );

            const colores =
                card.querySelectorAll(
                    '.color-option'
                );

                colores.forEach(colorBtn => {

                    colorBtn.addEventListener(
                        'click',
                        () => {

                            colores.forEach(btn =>
                                btn.classList.remove(
                                    'activo'
                                )
                            );

                            colorBtn.classList.add(
                                'activo'
                            );

                            const variante =
                                producto.variantes.find(
                                    v =>
                                        v.id ===
                                        colorBtn.dataset.id
                                );

                            if (!variante) return;

                            varianteSeleccionada =
                                variante;

                            imagenCard.src =
                                `assets/catalogo/${categoria}/${variante.imagen}`;

                            precioCard.innerText =
                                `$${variante.precio}`;

                            const stockGuardado =
                                obtenerStockGuardado();

                            const stockActual =
                                stockGuardado[variante.id]
                                ??
                                parseInt(
                                    variante.stock
                                );

                            card.dataset.stock =
                                stockActual;

                            card.dataset.id =
                                variante.id;

                            card.dataset.precio =
                                variante.precio;

                            if (stockTexto) {

                                if (stockActual === -1) {

                                    stockTexto.className =
                                        'stock-ilimitado';

                                    stockTexto.innerText =
                                        'Disponible';

                                } else if (
                                    stockActual > 0
                                ) {

                                    stockTexto.className =
                                        'stock-limitado';

                                    stockTexto.innerText =
                                        stockActual === 1
                                        ?
                                        'Ultima Unidad Disponible🔥'
                                        :
                                        `Quedan ${stockActual}`;

                                } else {

                                    stockTexto.className =
                                        'stock-agotado';

                                    stockTexto.innerText =
                                        'Agotado';
                                }
                            }

                             botonAgregar.disabled =
                                 stockActual === 0;

                             if (stockActual === 0) {
                                 card.classList.add('agotado');
                             } else {
                                 card.classList.remove('agotado');
                             }
                         }
                     );

                });


            /* =========================
               AGOTADO
            ========================= */

            if (stockFinal === 0) {

                card.classList.add(
                    'agotado'
                );

                botonAgregar.disabled = true;

            }


            contenedor.appendChild(card);


            /* =========================
               AGREGAR PRODUCTO
            ========================= */

            botonAgregar.addEventListener(
                'click',
                () => {

                    const stockGuardadoActual = obtenerStockGuardado();
                    const stockActual = stockGuardadoActual[varianteSeleccionada.id] ?? parseInt(card.dataset.stock);

                    if (stockActual === 0) {
                        return;
                    }


                    const productoCarrito = {

                        id:
                            `${varianteSeleccionada.id}-${Date.now()}`,

                        nombre,

                        precio:
                            parseFloat(varianteSeleccionada.precio),

                        cantidad: 1,

                        imagen:
                            `assets/catalogo/${categoria}/${varianteSeleccionada.imagen}`,

                        telaId: varianteSeleccionada.id,

                        personalizacion:
                            'catalogo'

                    };


                    agregarAlCarritoPersonalizado(
                        productoCarrito
                    );


                    /* =========================
                       DESCONTAR STOCK
                    ========================= */

                    if (stockActual !== -1) {

                        const nuevoStock =
                            stockActual - 1;

                        card.dataset.stock =
                            nuevoStock;


                        /* =========================
                           GUARDAR STOCK
                        ========================= */

                        stockGuardadoActual[varianteSeleccionada.id] =
                            nuevoStock;

                        guardarStock(
                            stockGuardadoActual
                        );


                        /* =========================
                           ACTUALIZAR TEXTO
                        ========================= */

                        const stockTexto =
                            card.querySelector(
                                '.stock-limitado, .stock-ilimitado, .stock-agotado'
                            );


                        if (nuevoStock > 0) {

                            stockTexto.className =
                                'stock-limitado';

                            stockTexto.innerText =
                                nuevoStock === 1
                                ? 'Ultima Unidad Disponible🔥'
                                : `Quedan ${nuevoStock}`;

                        } else {

                            stockTexto.className =
                                'stock-agotado';

                            stockTexto.innerText =
                                'Agotado';

                            card.classList.add(
                                'agotado'
                            );

                            botonAgregar.disabled =
                                true;

                        }

                    }

                }
            );

        });

        
    } catch (error) {

        console.error(
            'Error al cargar catálogo:',
            error
        );

    }

}


/* =========================
   INICIALIZAR
========================= */

function inicializarCatalogo() {

    cargarCatalogo(
        'totes',
        'contenedor-totes'
    );

    cargarCatalogo(
        'colitas',
        'contenedor-colitas'
    );

    cargarCatalogo(
        'fundas-bidon',
        'contenedor-bidon'
    );

    cargarCatalogo(
        'fundas-agenda',
        'contenedor-agendas'
    );

    cargarCatalogo(
        'individuales',
        'contenedor-individuales'
    );

    cargarCatalogo(
        'posavasos',
        'contenedor-posavasos'
    );

}