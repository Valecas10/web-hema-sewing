console.log("JS cargado correctamente");

const boton = document.getElementById('boton-test');

boton.addEventListener('click', () => {
    // Imagina que esto es una función en C++
    let precioBase = 100;
    alert("El presupuesto base para tu bordado es: $" + precioBase);
});

// Seleccionamos todas las tarjetas de tela
const tarjetasTelas = document.querySelectorAll('#contenedor-telas .card-opcion');

tarjetasTelas.forEach(tarjeta => {
    tarjeta.addEventListener('click', () => {
        // 1. Limpieza: Quitamos la clase 'seleccionada' de TODAS las tarjetas de tela
        // (Esto evita que queden varias telas marcadas al mismo tiempo)
        tarjetasTelas.forEach(t => t.classList.remove('seleccionada'));
        
        // 2. Acción: Le agregamos la clase solo a la tarjeta que tocamos
        tarjeta.classList.add('seleccionada');
        
        // 3. Persistencia: Guardamos el valor en nuestro input invisible
        const valorElegido = tarjeta.dataset.valor;
        document.getElementById('tela-seleccionada').value = valorElegido;

        console.log("Confirmado: Seleccionaste " + valorElegido);
    });
});

const tarjetasBordado = document.querySelectorAll('#contenedor-bordados .card-opcion');

tarjetasBordado.forEach(tarjeta => {
    tarjeta.addEventListener('click', () => {
        tarjetasBordado.forEach(t => t.classList.remove('seleccionada'));
        
        tarjeta.classList.add('seleccionada');
        
        const valorElegido = tarjeta.dataset.valor;
        document.getElementById('bordado-seleccionado').value = valorElegido;

        console.log("Confirmado: Seleccionaste " + valorElegido);
    });
});

// Función de prueba para ingenieros
function verificarSeleccion() {
    const tela = document.getElementById('tela-seleccionada').value;
    const bordado = document.getElementById('bordado-seleccionado').value;

    if (tela && bordado) {
        console.log(`Estado actual: El cliente quiere ${bordado} sobre ${tela}.`);
    } else {
        console.log("Estado actual: Selección incompleta.");
    }
}

// Llamamos a la verificación cada vez que se haga un clic en el cuerpo de la página
document.body.addEventListener('click', () => {
    verificarSeleccion();
});