/**
 * =========================
 * DESCARGAR ARCHIVO
 * =========================
 */

function descargarArchivo(contenido, nombre, tipo) {

    const blob = new Blob(
        [contenido],
        { type: tipo }
    );

    const url =
        window.URL.createObjectURL(blob);

    const a =
        document.createElement('a');

    a.href = url;
    a.download = nombre;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    window.URL.revokeObjectURL(url);

}

function convertirACSV(datos) {

    if (!datos || datos.length === 0) {
        return '';
    }

    const headers =
        Object.keys(datos[0]);

    const filas = datos.map(obj =>
        headers.map(header => {

            const valor =
                obj[header] ?? '';

            return `"${String(valor)
                .replace(/"/g, '""')}"`;

        }).join(',')
    );

    return [
        headers.join(','),
        ...filas
    ].join('\n');

}

/**
 * =========================
 * EVENTOS
 * =========================
 */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        document
            .getElementById(
                'btn-export-pedidos'
            )
            ?.addEventListener(
                'click',
                exportarPedidosCSV
            );

        document
            .getElementById(
                'btn-export-catalogo'
            )
            ?.addEventListener(
                'click',
                exportarCatalogoCSV
            );

        document
            .getElementById(
                'btn-export-telas'
            )
            ?.addEventListener(
                'click',
                exportarTelasCSV
            );

        document
            .getElementById(
                'btn-backup-completo'
            )
            ?.addEventListener(
                'click',
                crearBackupCompleto
            );

    }
);

async function exportarPedidosCSV() {

    const token =
        sessionStorage.getItem('admin_token');

    try {

        const res =
            await fetch(
                `${URL_WEB_APP_EXCEL}?action=getExportOrders&token=${encodeURIComponent(token)}`
            );

        const data =
            await res.json();

        if (data.error) {

            mostrarToast(
                data.error,
                'error'
            );

            return;
        }

        const csv =
            convertirACSV(data);

        descargarArchivo(
            csv,
            `pedidos-${new Date().toISOString().slice(0,10)}.csv`,
            'text/csv'
        );

        mostrarToast(
            'Pedidos exportados ✓',
            'success'
        );

    } catch (e) {

        console.error(e);

        mostrarToast(
            'Error al exportar pedidos',
            'error'
        );

    }

}

async function exportarCatalogoCSV() {

    const token =
        sessionStorage.getItem('admin_token');

    try {

        const res =
            await fetch(
                `${URL_WEB_APP_EXCEL}?action=getExportCatalog&token=${encodeURIComponent(token)}`
            );

        const data =
            await res.json();

        if (data.error) {

            mostrarToast(
                data.error,
                'error'
            );

            return;
        }

        const csv =
            convertirACSV(data);

        descargarArchivo(
            csv,
            `catalogo-${new Date().toISOString().slice(0,10)}.csv`,
            'text/csv'
        );

        mostrarToast(
            'Catálogo exportado ✓',
            'success'
        );

    } catch (e) {

        console.error(e);

        mostrarToast(
            'Error al exportar catálogo',
            'error'
        );

    }

}

async function exportarTelasCSV() {

    const token =
        sessionStorage.getItem('admin_token');

    try {

        const res =
            await fetch(
                `${URL_WEB_APP_EXCEL}?action=getExportTelas&token=${encodeURIComponent(token)}`
            );

        const data =
            await res.json();

        if (data.error) {

            mostrarToast(
                data.error,
                'error'
            );

            return;
        }

        const csv =
            convertirACSV(data);

        descargarArchivo(
            csv,
            `telas-${new Date().toISOString().slice(0,10)}.csv`,
            'text/csv'
        );

        mostrarToast(
            'Telas exportadas ✓',
            'success'
        );

    } catch (e) {

        console.error(e);

        mostrarToast(
            'Error al exportar telas',
            'error'
        );

    }

}

async function crearBackupCompleto() {

    const token =
        sessionStorage.getItem('admin_token');

    try {

        const res =
            await fetch(
                `${URL_WEB_APP_EXCEL}?action=getBackupCompleto&token=${encodeURIComponent(token)}`
            );

        const data =
            await res.json();

        if (data.error) {

            mostrarToast(
                data.error,
                'error'
            );

            return;
        }

        descargarArchivo(
            JSON.stringify(
                data,
                null,
                2
            ),
            `hema-backup-${new Date().toISOString().slice(0,10)}.json`,
            'application/json'
        );

        mostrarToast(
            'Backup creado ✓',
            'success'
        );

    } catch (e) {

        console.error(e);

        mostrarToast(
            'Error al crear backup',
            'error'
        );

    }

}