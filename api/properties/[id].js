module.exports = async function handler(req, res) {
  // Configurar headers CORS
  // Obtener el origen de la petición
  const origin = req.headers.origin;
  
  // Permitir todos los orígenes (puedes restringirlo si lo prefieres)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const API_BASE = 'http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
    
    // Obtener el ID de la propiedad desde la query
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        error: true,
        message: 'ID de propiedad requerido'
      });
    }
    
    // Construir URL del backend real
    let backendUrl = `${API_BASE}/api/properties/${id}`;
    
    // Pasar query parameters adicionales si existen
    const queryParams = Object.keys(req.query)
      .filter(key => key !== 'id')
      .map(key => `${key}=${req.query[key]}`)
      .join('&');
    
    if (queryParams) {
      backendUrl += `?${queryParams}`;
    }
    
    console.log(`Proxy request to: ${backendUrl}`);
    console.log(`Method: ${req.method}`);
    console.log(`Property ID: ${id}`);
    
    // Preparar headers para el backend
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Pasar token de autorización si existe
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
      console.log('Authorization header forwarded');
    }
    
    // Configurar opciones de fetch
    const fetchOptions = {
      method: req.method,
      headers: headers
    };
    
    // Añadir body para POST/PUT/PATCH
    if (req.method !== 'GET' && req.method !== 'DELETE' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    
    // Hacer petición al backend real
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.json();
    
    console.log(`Backend response status: ${response.status}`);
    console.log(`Backend response data:`, JSON.stringify(data, null, 2));
    
    // Retornar la respuesta del backend con el mismo status
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Error en proxy a backend para propiedad individual:', error);
    return res.status(500).json({
      error: true,
      message: 'Error al conectar con el backend',
      details: error.message
    });
  }
}; 