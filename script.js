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

document.getElementById('boton-enviar-pedido').addEventListener('click', () => {
    // 1. Recolectar TODA la información
    const pedido = {
        cliente: document.getElementById('nombre-cliente').value,
        email: document.getElementById('email-cliente').value,
        tela: document.getElementById('tela-seleccionada').value,
        bordado: document.getElementById('bordado-seleccionado').value,
        frase: document.getElementById('letras-bordado').value,
        telefono: document.getElementById('telefono-cliente').value,
    };

    // 2. Validación básica (Ingeniería de software: siempre validar entradas)
    if (!pedido.cliente || !pedido.tela) {
        alert("Por favor, completa tu nombre y elige una tela.");
        return;
    }

    // 3. Enviar vía EmailJS (Este código es el estándar de su librería)
    // Nota: Las imágenes requieren un manejo especial (Cloudinary o Base64), 
    // por ahora enviemos el texto para asegurar que la conexión funciona.
    
    console.log("Enviando pedido...", pedido);
    
     emailjs.send('service_gnblx8l', 'template_76chn1e', pedido)
        .then(() => {
            alert('¡Pedido enviado con éxito!');
            if (pedido.bordado  == ('Emojis' || 'Retrato')){
                enviarAWhatsApp(pedido);
                alert("¡Pedido registrado! Ahora se abrirá WhatsApp para que envíes las fotos.");
            }
            }, (err) => {
            alert('Fallo el envío: ' + JSON.stringify(err));
        });
    
});


function enviarAWhatsApp(pedido) {
    const telefonoDueña = "5493512511146"; // Reemplaza con el número real (sin el +)
    
    // Creamos el mensaje codificado para URL (encodeURIComponent maneja espacios y símbolos)
    const mensaje = `Hola! Soy ${pedido.cliente}. Acabo de realizar un pedido por la web:
Aquí te mando las fotos/emojis para el diseño.`;

    const url = `https://wa.me/${telefonoDueña}?text=${encodeURIComponent(mensaje)}`;
    
    // Abrimos en una pestaña nueva
    window.open(url, '_blank');
}

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

const contenedorFrase = document.getElementById('personalizacion-extra');

tarjetasBordado.forEach(tarjeta => {
    tarjeta.addEventListener('click', () => {
        // 1. Limpiar selección visual
        tarjetasBordado.forEach(t => t.classList.remove('seleccionada'));
        tarjeta.classList.add('seleccionada');
        
        // 2. Guardar el valor
        const valorElegido = tarjeta.dataset.valor;
        document.getElementById('bordado-seleccionado').value = valorElegido;

        // --- LÓGICA DE VISIBILIDAD ---
        // Supongamos que tu tarjeta de frase tiene data-valor="letras"
        if (valorElegido === 'Letras') {
            contenedorFrase.classList.remove('oculto');
        } else {
            contenedorFrase.classList.add('oculto');
            // Opcional: Limpiar el input si eligen otra cosa
            document.getElementById('letras-bordado').value = ""; 
        }
    });
});

console.log("--- TEST DE ELEMENTOS ---");
console.log("Contenedor Frase:", document.getElementById('contenedor-frase'));
console.log("Tarjetas Bordado:", document.querySelectorAll('.card-opcion').length);
console.log("Input Invisible:", document.getElementById('bordado-seleccionado'));
console.log("-------------------------");