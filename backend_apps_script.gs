/**
 * HEMA SEWING - Google Apps Script Backend (API REST)
 * 
 * Instrucciones:
 * 1. Abre tu planilla de Google Sheets.
 * 2. Ve a Extensiones -> Apps Script.
 * 3. Reemplaza el código existente por este.
 * 4. Crea las siguientes pestañas en tu planilla si no existen:
 *    - "Pedidos": Columnas (Tracking ID, Fecha, Cliente, Email, Teléfono, Productos, Total, Provincia, Ciudad, Calle, Mapa, Extra, Estado)
 *    - "Usuarios": Columnas (Usuario, Contraseña) -> Agrega una fila con tu usuario (Nai) y contraseña
 *    - "Historial": Columnas (Fecha, Usuario, Accion, Detalle)
 * 5. Haz clic en "Implementar" -> "Nueva implementación" -> Selecciona tipo "Aplicación web" -> Ejecutar como: "Tú" -> Quién tiene acceso: "Cualquiera".
 * 6. Copia la URL de la aplicación web y actualízala en app.js (URL_WEB_APP_EXCEL).
 */

const TOKEN_EXPIRATION_HOURS = 24;

// Manejo de peticiones GET
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const id = e.parameter.id;
  const action = e.parameter.action;
  const token = e.parameter.token;

  // Habilitar CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  // 1. RUTA DE SEGUIMIENTO (PÚBLICA PARA CLIENTES)
  if (id && !action) {
    const pedidosSheet = sheet.getSheetByName("Pedidos");
    const data = pedidosSheet.getDataRange().getValues();
    
    // Buscar en la columna A (Tracking ID)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        return ContentService.createTextOutput(JSON.stringify({
          tracking_id: data[i][0],
          cliente: data[i][2],
          estado: data[i][12] || "Pendiente"
        }))
        .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ error: "Pedido no encontrado" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. CONTROL DE SEGURIDAD PARA ACCIONES DE ADMINISTRADOR
  if (action) {
    if (!validarToken(token)) {
      return ContentService.createTextOutput(JSON.stringify({ error: "No autorizado o sesión expirada" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const pedidosSheet = sheet.getSheetByName("Pedidos");
    const dataPedidos = pedidosSheet.getDataRange().getValues();

    // OBTENER TODOS LOS PEDIDOS
    if (action === "getOrders") {
      const listaPedidos = [];
      for (let i = 1; i < dataPedidos.length; i++) {
        if (!dataPedidos[i][0]) continue;
        listaPedidos.push({
          tracking_id: dataPedidos[i][0],
          fecha: dataPedidos[i][1],
          cliente: dataPedidos[i][2],
          email: dataPedidos[i][3],
          telefono: dataPedidos[i][4],
          productos: parsearProductosSeguro(dataPedidos[i][5]),
          total: parseFloat(dataPedidos[i][6] || 0),
          provincia: dataPedidos[i][7],
          ciudad: dataPedidos[i][8],
          calle: dataPedidos[i][9],
          link_mapa: dataPedidos[i][10],
          dato_extra: dataPedidos[i][11],
          estado: dataPedidos[i][12] || "Pendiente"
        });
      }
      return ContentService.createTextOutput(JSON.stringify(listaPedidos))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // OBTENER ESTADÍSTICAS Y RESUMEN (DASHBOARD)
    if (action === "getStats") {
      let pendientes = 0, enProceso = 0, terminados = 0, enviados = 0, entregados = 0;
      let totalVentas = 0;
      let ventasSemana = 0;
      let ventasMes = 0;

      const hoy = new Date();
      const haceUnaSemana = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
      const haceUnMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      const conteoProductos = {};

      for (let i = 1; i < dataPedidos.length; i++) {
        if (!dataPedidos[i][0]) continue;
        
        const estado = dataPedidos[i][12] || "Pendiente";
        const total = parseFloat(dataPedidos[i][6] || 0);
        const fechaVal = new Date(dataPedidos[i][1]);

        // Contar por estados
        if (estado === "Pendiente") pendientes++;
        else if (estado === "En proceso" || estado === "En Proceso") enProceso++;
        else if (estado === "Terminado") terminados++;
        else if (estado === "Enviado") enviados++;
        else if (estado === "Entregado") entregados++;

        totalVentas += total;

        // Filtrar ventas por fecha
        if (!isNaN(fechaVal.getTime())) {
          if (fechaVal >= haceUnaSemana) ventasSemana += total;
          if (fechaVal >= haceUnMes) ventasMes += total;
        }

        // Analizar productos más vendidos
        const productos = parsearProductosSeguro(dataPedidos[i][5]);
        productos.forEach(p => {
          const nombre = p.nombre || "Producto Desconocido";
          conteoProductos[nombre] = (conteoProductos[nombre] || 0) + (p.cantidad || 1);
        });
      }

      // Ordenar productos más vendidos
      const masVendidos = Object.keys(conteoProductos)
        .map(key => ({ nombre: key, cantidad: conteoProductos[key] }))
        .sort((a, b) => b.cantidad - a.cantidad);

      return ContentService.createTextOutput(JSON.stringify({
        resumenEstados: { pendientes, enProceso, terminados, enviados, entregados },
        ventas: {
          total: totalVentas,
          semana: ventasSemana,
          mes: ventasMes,
          cantidadPedidos: dataPedidos.length - 1
        },
        productosMasVendidos: masVendidos.slice(0, 5)
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ error: "Acción no reconocida o parámetros incorrectos" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Manejo de peticiones POST
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Habilitar CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    // 1. ACCIÓN DE LOGIN
    if (action === "login") {
      const userSheet = sheet.getSheetByName("Usuarios");
      const dataUser = userSheet.getDataRange().getValues();
      const usernameInput = postData.username;
      const passwordInput = postData.password;

      for (let i = 1; i < dataUser.length; i++) {
        if (dataUser[i][0] === usernameInput && String(dataUser[i][1]) === String(passwordInput)) {
          const token = generarTokenUnico(usernameInput);
          registrarActividad(usernameInput, "Login", "Inicio de sesión correcto en el panel");
          return ContentService.createTextOutput(JSON.stringify({ success: true, token: token }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Usuario o contraseña incorrectos" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. ACCIÓN DE CAMBIAR ESTADO DE PEDIDO
    if (action === "updateOrderStatus") {
      if (!validarToken(postData.token)) {
        return ContentService.createTextOutput(JSON.stringify({ error: "No autorizado o sesión expirada" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const trackingId = postData.tracking_id;
      const nuevoEstado = postData.nuevo_estado;
      const usuarioActividad = decodificarTokenUsuario(postData.token);

      const pedidosSheet = sheet.getSheetByName("Pedidos");
      const range = pedidosSheet.getDataRange();
      const values = range.getValues();

      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === trackingId) {
          // Cambiar celda en la columna M (Estado, índice 12)
          pedidosSheet.getRange(i + 1, 13).setValue(nuevoEstado);
          registrarActividad(usuarioActividad, "Cambio Estado", "Pedido: " + trackingId + " cambiado a " + nuevoEstado);
          return ContentService.createTextOutput(JSON.stringify({ success: true, tracking_id: trackingId, estado: nuevoEstado }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "ID de tracking no encontrado" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. ENVÍO DE PEDIDO (FLUJO CHECKOUT CLIENTE)
    // El objeto enviado en el Checkout no tiene un "action", es el pedido completo.
    if (!action && postData.tracking_id) {
      const pedidosSheet = sheet.getSheetByName("Pedidos");
      
      const fecha = new Date();
      const productosStr = JSON.stringify(postData.productos);
      
      // Agregar fila
      pedidosSheet.appendRow([
        postData.tracking_id,
        fecha,
        postData.cliente,
        postData.email,
        postData.telefono,
        productosStr,
        postData.total,
        postData.provincia,
        postData.ciudad,
        postData.calle,
        postData.link_mapa,
        postData.dato_extra || "",
        "Pendiente" // Estado inicial por defecto
      ]);

      return ContentService.createTextOutput(JSON.stringify({ success: true, tracking_id: postData.tracking_id }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: "Solicitud no procesada" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

// Parsear seguro de productos (manejar cadenas JSON y objetos)
function parsearProductosSeguro(columnaValor) {
  try {
    if (!columnaValor) return [];
    return JSON.parse(columnaValor);
  } catch (e) {
    return [{ nombre: String(columnaValor), cantidad: 1, precio: 0 }];
  }
}

// Registro en la hoja Historial
function registrarActividad(usuario, accion, detalle) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const histSheet = sheet.getSheetByName("Historial");
    if (histSheet) {
      histSheet.appendRow([new Date(), usuario, accion, detalle]);
    }
  } catch (e) {
    Logger.log("Error al registrar actividad: " + e.toString());
  }
}

// Generación básica de tokens de sesión
function generarTokenUnico(usuario) {
  const expira = new Date().getTime() + (TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);
  const rawToken = usuario + "||" + expira;
  const base64 = Utilities.base64Encode(rawToken);
  // Hacerlo seguro para URLs reemplazando caracteres conflictivos
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Validar si el token de sesión es correcto y no ha expirado
function validarToken(token) {
  if (!token) return false;
  try {
    // Reconstruir Base64 estándar (revertir el formato URL-safe)
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    // CORRECTO: base64Decode devuelve bytes, convertir con newBlob
    const bytes = Utilities.base64Decode(base64);
    const decoded = Utilities.newBlob(bytes).getDataAsString();
    const partes = decoded.split("||");
    if (partes.length !== 2) return false;
    
    const expira = parseInt(partes[1]);
    const ahora = new Date().getTime();
    Logger.log("Token válido hasta: " + new Date(expira).toString() + " | Ahora: " + new Date(ahora).toString());
    return ahora < expira;
  } catch (e) {
    Logger.log("Error en validarToken: " + e.toString());
    return false;
  }
}

// Obtener nombre del usuario desde el token
function decodificarTokenUsuario(token) {
  try {
    // Reconstruir Base64 estándar (revertir el formato URL-safe)
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    // CORRECTO: base64Decode devuelve bytes, convertir con newBlob
    const bytes = Utilities.base64Decode(base64);
    const decoded = Utilities.newBlob(bytes).getDataAsString();
    return decoded.split("||")[0];
  } catch (e) {
    Logger.log("Error en decodificarTokenUsuario: " + e.toString());
    return "Desconocido";
  }
}
