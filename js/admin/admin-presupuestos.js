/**
 * =========================
 * PRESUPUESTOS
 * =========================
 */

let todosLosPresupuestos = [];

async function cargarPresupuestos() {

    const token =
        sessionStorage.getItem(
            'admin_token'
        );

    try {

        const response =
            await fetch(
                `${URL_WEB_APP_EXCEL}?action=getPresupuestos&token=${token}`
            );

        const data =
            await response.json();

        todosLosPresupuestos =
            data.presupuestos || [];

        renderizarTablaPresupuestos(
            todosLosPresupuestos
        );

    } catch (error) {

        console.error(error);

        mostrarToast(
            'Error al cargar presupuestos',
            'error'
        );

    }

}

function renderizarTablaPresupuestos(
    presupuestos
) {

    const tbody =
        document.getElementById(
            'tabla-presupuestos'
        );

    if (!tbody) return;

    tbody.innerHTML = '';

    if (
        presupuestos.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    No hay presupuestos
                </td>
            </tr>
        `;

        return;
    }

    presupuestos.forEach(p => {

        const fecha =
            new Date(
                p.fecha
            ).toLocaleDateString(
                'es-AR'
            );

        tbody.innerHTML += `
            <tr>

                <td>
                    ${p.tracking}
                </td>

                <td>
                    ${fecha}
                </td>

                <td>
                    ${p.estado}
                </td>

                <td>
                    $${p.total}
                </td>

                <td>

                    <button
                        class="btn-detalle"
                        onclick="
                            mostrarDetallePresupuesto(
                                '${p.tracking}'
                            )
                        "
                    >
                        Ver Detalle
                    </button>

                </td>

                

            </tr>
        `;

    });

}

function mostrarDetallePresupuesto(
    tracking
) {
    const presupuesto =
        todosLosPresupuestos.find(
            p => p.tracking === tracking
        );

    if (!presupuesto) return;

    const totalBase =
    presupuesto.productos.reduce(
        (acc, producto) => {

            return acc +
                (Number(producto.precio || 0) *
                 Number(producto.cantidad || 1));

        },
        0
    );

    const tieneBordado =
    presupuesto.productos.some(
        producto =>
            producto.personalizacion
                ?.toLowerCase()
                .includes('bordado')
    );

    const modal =
        document.getElementById(
            'modal-detalle-presupuesto'
        );
   
    const content =
        document.getElementById(
            'modal-presupuesto-content'
        );

    let productosHTML = '';

    let bloqueBordado = '';

    if (tieneBordado) {

        bloqueBordado = `

            <div class="producto-header">

                <strong>
                    ${producto.nombre}
                </strong>

            </div>

            <div class="producto-bordado-row">

                <span>
                    $${producto.precio}
                </span>

                <span>+</span>

                <input
                    type="number"
                    class="input-bordado"
                    data-base="${producto.precio}"
                    value="0"
                    min="0"
                >

                <span>=</span>

                <span
                    class="precio-final-producto"
                >
                    $${producto.precio}
                </span>

            </div>

        `;
    }

    presupuesto.productos.forEach(
        producto => {

            productosHTML += `

                <div class="modal-product-item">

                    <strong>
                        ${producto.nombre}
                    </strong>

                    <span style="float:right;">
                        $${producto.precio || 0}
                    </span>

                </div>

            `;

        }
    );

    content.innerHTML = `

        <p>
            <strong>Código:</strong>
            ${presupuesto.tracking}
        </p>

        <div class="modal-status-update">

            <label>
                Estado
            </label>

            <select id="presupuesto-estado">

                <option
                    value="Pendiente Presupuesto"
                    ${
                        presupuesto.estado ===
                        'Pendiente Presupuesto'
                            ? 'selected'
                            : ''
                    }
                >
                    Pendiente Presupuesto
                </option>

                <option
                    value="Presupuestado"
                    ${
                        presupuesto.estado ===
                        'Presupuestado'
                            ? 'selected'
                            : ''
                    }
                >
                    Presupuestado
                </option>

            </select>

        </div>

        <hr>

        ${productosHTML}

        ${bloqueBordado}

        <hr>

        <div class="presupuesto-total-box">

            <div class="presupuesto-total-label">
                Total Presupuesto
            </div>

            <div
                class="presupuesto-total-valor"
                id="presupuesto-total-final"
            >
                $${totalBase}
            </div>

        </div>

        <div class="presupuesto-acciones">

            <button
                class="btn-primary"
                onclick="
                    guardarPresupuesto(
                        '${presupuesto.tracking}'
                    )
                "
            >
                Guardar Presupuesto
            </button>

        </div>

    `;

    modal.classList.remove('oculto');
}

function cerrarModalPresupuesto() {

    document
        .getElementById(
            'modal-detalle-presupuesto'
        )
        .classList.add(
            'oculto'
        );

}

document.addEventListener(
    'input',
    e => {

        if (
            e.target.id !==
            'presupuesto-bordado'
        ) return;

        const bordado =
            Number(
                e.target.value || 0
            );

        const totalBase =
            Number(
                e.target.dataset.base
            );

        document.getElementById(
            'presupuesto-total-final'
        ).innerText =
            `$${totalBase + bordado}`;

    }
);

async function guardarPresupuesto(
    tracking
) {

    const total =
        Number(
            document
                .getElementById(
                    'presupuesto-total-final'
                )
                .innerText
                .replace('$', '')
        );

    const estado =
        document.getElementById(
            'presupuesto-estado'
        ).value;

    try {

        const response =
            await fetch(
                URL_WEB_APP_EXCEL,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        action:
                            'guardarPresupuesto',

                        tracking,
                        total,
                        estado
                    })
                }
            );

        const data =
            await response.json();

        if (data.success) {

            mostrarToast(
                'Presupuesto guardado',
                'success'
            );

            cargarPresupuestos();

        }

    } catch (error) {

        mostrarToast(
            'Error al guardar',
            'error'
        );

    }

}