/**
 * =========================
 * TELAS
 * =========================
 */

const opcionesPersonalizacion = [

    {
        id: 'sin-nada',
        nombre: 'Sin nada',
        precio: 0,
        img: 'assets/opciones/Basico.webp'
    },

    {
        id: 'lazo-tela',
        nombre: 'Agregar Lazo de Tela',
        precio: 1000,
        img: 'assets/opciones/Lazo-tela.webp'
    },

    {
        id: 'lazo-cintas',
        nombre: 'Agregar Lazo de Cintas',
        precio: 1000,
        img: 'assets/opciones/Lazo-cintas.webp'
    },

    {
        id: 'volado',
        nombre: 'Agregar Volado',
        precio: 1500,
        img: 'assets/opciones/Volado.webp'
    },

    {
        id: 'bordado',
        nombre: 'Agregar Bordado',
        precio: 0,
        img: 'assets/opciones/Bordado.webp'
    },

    {
        id: 'mosaico',
        nombre: 'Efecto Mosaico',
        precio: 3000,
        img: 'assets/opciones/Mosaico.jpg'
    }

];


/* =========================
   STOCK
========================= */

function obtenerStockGuardado() {

    return (
        JSON.parse(
            localStorage.getItem(
                'stockTelas'
            )
        ) || {}
    );

}


function guardarStock(stock) {

    localStorage.setItem(
        'stockTelas',
        JSON.stringify(stock)
    );

}


/* =========================
   CARGAR TELAS
========================= */

async function cargarTelasDinamicas() {

    try {

        const respuesta =
            await fetch(
                `${URL_WEB_APP_EXCEL}?action=getTelas`
            );

        const telas = await respuesta.json();

        const contenedor =
            document.getElementById(
                'contenedor-telas'
            );

        const stockGuardado =
            obtenerStockGuardado();

        contenedor.innerHTML = '';

        telas.forEach(tela => {

            const {
                nombre,
                costo,
                imagen: rutaImagen,
                id,
                stock
            } = tela;


            const imagenDirecta =
                formatearLinkDrive(
                    rutaImagen
                );


            const card =
                document.createElement(
                    'div'
                );


            card.className =
                'card-opcion';

            card.dataset.valor = id;
            card.dataset.precio = costo;
            card.dataset.stock = stock;

            const stockOriginal =
                parseInt(stock);

            const stockNumero =
                stockGuardado[id] ??
                stockOriginal;


            let textoStock = '';


            /* =========================
               TEXTO STOCK
            ========================= */

            if (stockNumero === -1) {

                textoStock = `
                    <small class="stock-ilimitado">
                        Disponible
                    </small>
                `;

            } else if (stockNumero > 0) {

                if (stockNumero === 1) {

                    textoStock = `
                        <small class="stock-limitado">
                            Ultima Unidad Disponible🔥
                        </small>
                    `;

                } else {

                    textoStock = `
                        <small class="stock-limitado">
                            Quedan ${stockNumero}
                        </small>
                    `;

                }

            } else {

                textoStock = `
                    <small class="stock-agotado">
                        Agotada
                    </small>
                `;

            }


            /* =========================
               HTML CARD
            ========================= */

            card.innerHTML = `
                <img
                    src="${imagenDirecta}"
                    alt="${nombre}"
                    onerror="this.src='assets/Logo.jpg';"
                >

                <span>${nombre}</span>

                <small>$${costo}</small>

                ${textoStock}
            `;


            if (stockNumero === 0) {

                card.classList.add(
                    'agotada'
                );

            }


            const img =
                card.querySelector('img');

            let timer;

            /* =========================
               SELECCIONAR TELA
            ========================= */

            card.addEventListener(
                'click',
                () => {

                    if (stockNumero === 0) {
                        return;
                    }

                    document
                        .querySelectorAll(
                            '#contenedor-telas .card-opcion'
                        )
                        .forEach(t =>
                            t.classList.remove(
                                'seleccionada'
                            )
                        );


                    card.classList.add(
                        'seleccionada'
                    );


                    document.getElementById(
                        'tela-seleccionada'
                    ).value = id;

                }
            );


            contenedor.appendChild(card);

            img.addEventListener("click", (e) => {

                e.stopPropagation();

                const overlay =
                    document.getElementById("zoom-overlay");

                const zoomImg =
                    document.getElementById("zoom-img");

                zoomImg.src = img.src;

                overlay.classList.add("active");

            });

        });

    } catch (error) {

        console.error(
            'Error al cargar telas:',
            error
        );

    }

}

const overlay =
    document.getElementById("zoom-overlay");

overlay.addEventListener("click", () => {

    overlay.classList.remove("active");

});


/* =========================
   PERSONALIZACIÓN
========================= */

function cargarOpcionesPersonalizacion() {

    const contenedor =
        document.getElementById(
            'contenedor-personalizacion'
        );

    contenedor.innerHTML = '';


    opcionesPersonalizacion.forEach(
        opc => {

            const card =
                document.createElement(
                    'div'
                );

            card.className =
                'card-opcion';


            card.dataset.id =
                opc.id;

            card.dataset.precio =
                opc.precio;

            card.dataset.nombre =
                opc.nombre;


            if (opc.id === 'sin-nada') {

                card.classList.add(
                    'seleccionada'
                );

            }


            card.innerHTML = `
                <img
                    src="${opc.img}"
                    alt="${opc.nombre}"
                    onerror="this.src='assets/Logo.jpg';"
                >

                <span>${opc.nombre}</span>

                <small>
                    ${opc.precio > 0 ? '+$' + opc.precio : ''}
                </small>

                ${
                    opc.id === 'bordado'
                        ? '<small class="texto-cotizacion">Cotiza por diseño</small>'
                        : ''
                }

            `;


            card.onclick = () => {

                const inputPersonalizacion =
                    document.getElementById(
                        'personalizacion-seleccionada'
                    );


                if (opc.id === 'sin-nada') {

                    document
                        .querySelectorAll(
                            '#contenedor-personalizacion .card-opcion'
                        )
                        .forEach(c =>
                            c.classList.remove(
                                'seleccionada'
                            )
                        );

                    card.classList.add(
                        'seleccionada'
                    );

                } else {

                    const sinNadaCard =
                        document.querySelector(
                            '#contenedor-personalizacion .card-opcion[data-id="sin-nada"]'
                        );


                    if (sinNadaCard) {

                        sinNadaCard.classList.remove(
                            'seleccionada'
                        );

                    }


                    card.classList.toggle(
                        'seleccionada'
                    );


                    const seleccionadas =
                        document.querySelectorAll(
                            '#contenedor-personalizacion .card-opcion.seleccionada'
                        );


                    if (
                        seleccionadas.length === 0 &&
                        sinNadaCard
                    ) {

                        sinNadaCard.classList.add(
                            'seleccionada'
                        );

                    }

                }


                const seleccionadasFinal =
                    document.querySelectorAll(
                        '#contenedor-personalizacion .card-opcion.seleccionada'
                    );


                const idsSeleccionados =
                    Array.from(
                        seleccionadasFinal
                    )
                    .map(
                        c => c.dataset.id
                    )
                    .join(', ');


                inputPersonalizacion.value =
                    idsSeleccionados;

            };


            contenedor.appendChild(card);

        }
    );

}


/* =========================
   AGREGAR AL CARRITO
========================= */

const btnAgregarFinal =
    document.getElementById(
        'btn-agregar-final'
    );


if (btnAgregarFinal) {

    btnAgregarFinal.addEventListener(
        'click',
        () => {

            const telaId =
                document.getElementById(
                    'tela-seleccionada'
                ).value;

            const telaCard =
                document.querySelector(
                    '#contenedor-telas .card-opcion.seleccionada'
                );

            const stockActual =
                parseInt(
                    telaCard.dataset.stock
                );

            const personalizacionInput =
                document.getElementById(
                    'personalizacion-seleccionada'
                ).value;

            const imagenTela =
                telaCard.querySelector(
                    'img'
                ).src;


            if (!telaId || !telaCard) {

                mostrarToast(
                    'Por favor, selecciona primero una tela.',
                    'error'
                );

                return;

            }


            const nombreTela =
                telaCard.querySelector(
                    'span'
                ).innerText;


            let precioTotal =
                parseFloat(
                    telaCard.dataset.precio
                );


            const cardsPersonalizacion =
                document.querySelectorAll(
                    '#contenedor-personalizacion .card-opcion.seleccionada'
                );


            let nombresPersonalizacion = [];


            cardsPersonalizacion.forEach(
                card => {

                    if (
                        card.dataset.id !==
                        'sin-nada'
                    ) {

                        precioTotal +=
                            parseFloat(
                                card.dataset.precio || 0
                            );

                        nombresPersonalizacion.push(
                            card.dataset.nombre
                        );

                    }

                }
            );


            const textoDetalle =
                nombresPersonalizacion.length > 0

                    ? `Personalización: ${nombresPersonalizacion.join(' + ')}`

                    : 'Sin personalización';


            if (stockActual === 0) {

                mostrarToast(
                    'Esta tela ya no tiene stock.',
                    'error'
                );

                return;

            }


            const productoParaCarrito = {

                id:
                    `${telaId}-${personalizacionInput.replace(/, /g, '-')}-${Date.now()}`,

                nombre:
                    `Tote de ${nombreTela}`,

                detalle:
                    textoDetalle,

                precio:
                    precioTotal,

                cantidad: 1,

                personalizacion:
                    personalizacionInput,

                imagen:
                    imagenTela,

                telaId:
                    telaId

            };


            agregarAlCarritoPersonalizado(
                productoParaCarrito
            );


            /* =========================
               DESCONTAR STOCK
            ========================= */

            if (stockActual !== -1) {

                let nuevoStock =
                    stockActual - 1;


                const stockGuardado =
                    obtenerStockGuardado();


                stockGuardado[telaId] =
                    nuevoStock;


                guardarStock(
                    stockGuardado
                );


                telaCard.dataset.stock =
                    nuevoStock;


                const stockTexto =
                    telaCard.querySelector(
                        '.stock-limitado, .stock-ilimitado, .stock-agotado'
                    );


                if (nuevoStock > 0) {

                    stockTexto.className =
                        'stock-limitado';

                    stockTexto.innerText =
                        `Quedan ${nuevoStock}`;

                } else {

                    stockTexto.className =
                        'stock-agotado';

                    stockTexto.innerText =
                        'Agotada';


                    telaCard.classList.remove(
                        'seleccionada'
                    );

                    telaCard.classList.add(
                        'agotada'
                    );


                    document.getElementById(
                        'tela-seleccionada'
                    ).value = '';

                }

            }

        }
    );

}


/* =========================
   RESETEAR STOCK
========================= */

window.resetearStock = () => {

    localStorage.removeItem(
        'stockTelas'
    );

    location.reload();

};
