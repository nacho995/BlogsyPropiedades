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
    const API_BASE = 'http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
    
    // Construir URL del backend real
    let backendUrl = `${API_BASE}/api/properties`;
    
    // Para DELETE y PUT, verificar si hay ID en query parameter
    const { id } = req.query;
    if ((req.method === 'DELETE' || req.method === 'PUT') && id) {
      backendUrl = `${API_BASE}/api/properties/${id}`;
      console.log(`[PROPERTIES] Operación ${req.method} para propiedad ID: ${id}`);
    }
    // Para GET y POST sin ID específico, usar la ruta base
    else {
      // Pasar query parameters si existen (para GET con filtros)
      if (req.url.includes('?')) {
        const queryString = req.url.split('?')[1];
        // Filtrar el parámetro 'id' para operaciones que no lo necesitan en la URL base
        const params = new URLSearchParams(queryString);
        params.delete('id'); // Eliminar ID de query params para GET/POST generales
        const filteredQuery = params.toString();
        if (filteredQuery) {
          backendUrl += `?${filteredQuery}`;
        }
      }
    }
    
    console.log(`[PROPERTIES] Proxy request to: ${backendUrl}`);
    console.log(`[PROPERTIES] Method: ${req.method}`);
    
    // Preparar headers para el backend
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Pasar token de autorización si existe
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
      console.log('[PROPERTIES] Authorization header forwarded');
    }
    
    // Configurar opciones de fetch
    const fetchOptions = {
      method: req.method,
      headers: headers
    };
    
    // Añadir body para POST/PUT/PATCH
    if (req.method !== 'GET' && req.method !== 'DELETE' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      console.log('[PROPERTIES] Request body:', JSON.stringify(req.body, null, 2));
    }
    
    // Hacer petición al backend real
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.json();
    
    console.log(`[PROPERTIES] Backend response status: ${response.status}`);
    
    // Log específico según la operación
    if (req.method === 'DELETE') {
      console.log(`[PROPERTIES] DELETE result:`, { status: response.status, success: response.ok });
    } else if (req.method === 'PUT') {
      console.log(`[PROPERTIES] PUT result:`, { 
        status: response.status, 
        title: data.title,
        id: data._id || data.id 
      });
    } else {
      console.log(`[PROPERTIES] ${req.method} response data:`, JSON.stringify(data, null, 2));
    }
    
    // Retornar la respuesta del backend con el mismo status
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('[PROPERTIES] Error en proxy a backend:', error);
    return res.status(500).json({
      error: true,
      message: 'Error al conectar con el backend',
      details: error.message
    });
  }
}; 