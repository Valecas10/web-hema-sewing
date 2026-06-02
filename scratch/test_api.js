const URL_WEB_APP_EXCEL = 'https://script.google.com/macros/s/AKfycbyjlJFTNdSATW4m6HG5xkqN3OIK89NyWboaEOaNYOdmUOEyttZ6EI9ugZfjIRUjdtoq/exec';

async function test() {
    console.log("Iniciando prueba de login...");
    try {
        const loginRes = await fetch(URL_WEB_APP_EXCEL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'login',
                username: 'Nai',
                password: 'nai' // Let's try lowercase 'nai' or check what it returns
            })
        });
        const loginData = await loginRes.json();
        console.log("Respuesta de login:", loginData);
        
        if (loginData.success && loginData.token) {
            const token = loginData.token;
            console.log("Token recibido:", token);
            console.log("Intentando obtener pedidos...");
            
            const ordersRes = await fetch(`${URL_WEB_APP_EXCEL}?action=getOrders&token=${encodeURIComponent(token)}`);
            const ordersText = await ordersRes.text();
            console.log("Respuesta de pedidos (raw):", ordersText);
        }
    } catch (e) {
        console.error("Error en la prueba:", e);
    }
}

test();
