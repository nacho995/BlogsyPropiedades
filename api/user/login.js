module.exports = async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir métodos POST para login
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: true, 
      message: 'Método no permitido' 
    });
  }

  try {
    const API_BASE = 'http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
    
    console.log('=== PROXY LOGIN REQUEST ===');
    console.log('Method:', req.method);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    if (!req.body || !req.body.email || !req.body.password) {
      return res.status(400).json({
        error: true,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Construir URL del backend real - RUTA CORREGIDA
    const backendUrl = `${API_BASE}/user/login`;
    
    console.log(`Proxy login request to: ${backendUrl}`);
    
    // Preparar headers para el backend
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Configurar opciones de fetch
    const fetchOptions = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(req.body)
    };
    
    console.log('Request body to backend:', JSON.stringify(req.body, null, 2));
    
    // Hacer petición al backend real
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.json();
    
    console.log(`Backend response status: ${response.status}`);
    console.log(`Backend response data:`, JSON.stringify(data, null, 2));
    
    // Retornar la respuesta del backend con el mismo status
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Error en proxy login:', error);
    return res.status(500).json({
      error: true,
      message: 'Error al conectar con el backend',
      details: error.message
    });
  }
}; 