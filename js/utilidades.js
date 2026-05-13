/**
 * =========================
 * UTILIDADES
 * =========================
 */

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function formatearLinkDrive(url) {
    if (url.includes('drive.google.com')) {
        const idMatch =
            url.match(/\/d\/(.+?)\//) ||
            url.match(/id=(.+?)(&|$)/);

        if (idMatch && idMatch[1]) {
            return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
        }
    }

    return url;
}

function generarCodigoSeguimiento() {
    const fecha = new Date();

    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');

    return `HEMA-${mes}${dia}-${random}`;
}
