/**
 * =========================
 * SEGUIMIENTO DE PEDIDOS
 * =========================
 */


async function consultarEstadoPedido() {
    const id = document.getElementById('input-busqueda-tracking').value.trim();

    const resultado = document.getElementById('resultado-busqueda');
    const estado = document.getElementById('estado-pedido');

    if (!id) {
        alert("Ingresá un código.");
        return;
    }

    try {
        const res = await fetch(`${URL_WEB_APP_EXCEL}?id=${id}`);
        const data = await res.json();

        resultado.classList.remove('oculto');

        estado.className = 'status';

        if (data.error) {
            estado.innerText = "Código no encontrado";
            estado.classList.add('error'); // Opcional: una clase para errores
        } else {
            const textoStatus = data.estado; 
            estado.innerText = textoStatus;

            
            if (textoStatus === 'Pendiente') {
                estado.classList.add('pendiente');
            } else if (textoStatus === 'En proceso') {
                estado.classList.add('enproceso');
            } else if (textoStatus === 'Terminado'){
                estado.classList.add('terminado')
            } else if (textoStatus === 'Enviado') {
                estado.classList.add('enviado');
            } else if (textoStatus === 'Entregado') {
                estado.classList.add('entregado');
            }
        }

    } catch (error) {
        console.error(error);
        alert("Error al consultar.");
    }
}