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
    const { id } = req.query;
    
    console.log('=== DEBUG DELETE REQUEST ===');
    console.log('Method:', req.method);
    console.log('Property ID:', id);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Authorization header:', req.headers.authorization);
    
    // Verificar token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Token de autorización requerido',
        debug: 'No Authorization header or incorrect format'
      });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token extracted:', token.substring(0, 20) + '...');
    
    // Intentar hacer DELETE al backend real
    const API_BASE = 'http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
    const backendUrl = `${API_BASE}/api/properties/${id}`;
    
    console.log('Making DELETE request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const responseText = await response.text();
    
    console.log('Backend response status:', response.status);
    console.log('Backend response text:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }
    
    return res.status(200).json({
      debug: true,
      tokenReceived: token.substring(0, 20) + '...',
      backendStatus: response.status,
      backendResponse: responseData,
      success: response.ok
    });
    
  } catch (error) {
    console.error('[DEBUG-DELETE] Error:', error);
    return res.status(500).json({
      error: true,
      message: 'Error en debug de DELETE',
      details: error.message
    });
  }
}; 