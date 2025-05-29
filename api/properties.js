module.exports = async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const API_BASE = 'https://api.realestategozamadrid.com';
    
    // Construir URL del backend real
    let backendUrl = `${API_BASE}/api/properties`;
    
    // Pasar query parameters si existen
    if (req.url.includes('?')) {
      const queryString = req.url.split('?')[1];
      backendUrl += `?${queryString}`;
    }
    
    console.log(`Proxy request to: ${backendUrl}`);
    console.log(`Method: ${req.method}`);
    
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
    console.error('Error en proxy a backend:', error);
    return res.status(500).json({
      error: true,
      message: 'Error al conectar con el backend',
      details: error.message
    });
  }
}; 