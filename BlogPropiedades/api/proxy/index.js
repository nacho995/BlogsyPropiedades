// Función API de Vercel para proxear las solicitudes a la API externa
// y evitar problemas de CORS
export default async function handler(req, res) {
  // Configuración de la URL de la API
  const apiUrl = process.env.API_BASE_URL || 'https://nextjs-gozamadrid-qrfk.onrender.com';
  
  // Obtener la ruta específica desde la URL
  const path = req.url.split('/api/proxy')[1] || '';
  
  // Construir la URL completa de la API
  const targetUrl = `${apiUrl}${path}`;
  
  console.log(`🔄 Proxy redirigiendo a: ${targetUrl}`);
  
  try {
    // Configuración de la solicitud a la API externa
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Copiar cualquier header de autorización si existe
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
      }
    };

    // Si hay un body, lo incluimos en la solicitud
    if (req.method !== 'GET' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    // Realizar la solicitud a la API externa
    const response = await fetch(targetUrl, options);
    
    // Obtener el body de la respuesta como texto
    const data = await response.text();
    
    // Intentar parsear la respuesta como JSON
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      // Si no es JSON, usar el texto tal cual
      jsonData = data;
    }
    
    // Configurar los encabezados de la respuesta
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Devolver el código de estado y los datos
    res.status(response.status).json(jsonData);
  } catch (error) {
    // Manejar errores
    console.error('Error en el proxy:', error);
    res.status(500).json({ error: 'Error al comunicarse con la API externa' });
  }
}
