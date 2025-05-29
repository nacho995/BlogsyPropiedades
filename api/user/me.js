module.exports = async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir métodos GET para obtener perfil
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: true, 
      message: 'Método no permitido' 
    });
  }

  try {
    const API_BASE = 'http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
    
    console.log('=== PROXY USER ME REQUEST ===');
    console.log('Method:', req.method);
    console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');

    // Verificar token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Token de autorización requerido'
      });
    }

    // Construir URL del backend real - RUTA CORREGIDA
    const backendUrl = `${API_BASE}/user/me`;
    
    console.log(`Proxy user/me request to: ${backendUrl}`);
    
    // Preparar headers para el backend
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader // Pasar el token al backend real
    };
    
    // Configurar opciones de fetch
    const fetchOptions = {
      method: 'GET',
      headers: headers
    };
    
    // Hacer petición al backend real
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.json();
    
    console.log(`Backend response status: ${response.status}`);
    console.log(`Backend response data:`, JSON.stringify(data, null, 2));
    
    // Retornar la respuesta del backend con el mismo status
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Error en proxy user/me:', error);
    return res.status(500).json({
      error: true,
      message: 'Error al conectar con el backend',
      details: error.message
    });
  }
}; 