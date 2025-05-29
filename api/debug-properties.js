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
    console.log('=== DEBUG PROPERTIES REQUEST ===');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // Verificar token
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'No se encontró token de autorización',
        debug: {
          hasAuthHeader: !!authHeader,
          authHeaderValue: authHeader || 'null',
          startsWithBearer: authHeader ? authHeader.startsWith('Bearer ') : false
        }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extraído:', token.substring(0, 50) + '...');
    
    // Probar el token contra el backend real
    const API_BASE = 'http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
    
    // Test 1: Verificar endpoint de usuario con este token
    console.log('=== TESTING TOKEN VALIDITY ===');
    
    try {
      const userResponse = await fetch(`${API_BASE}/user/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const userData = await userResponse.json();
      console.log('User endpoint response:', userResponse.status, userData);
      
      if (userResponse.ok) {
        console.log('✅ Token es válido - usuario autenticado');
        
        // Test 2: Intentar crear propiedad con este token válido
        if (req.method === 'POST' && req.body) {
          console.log('=== TESTING PROPERTY CREATION ===');
          
          const propertyResponse = await fetch(`${API_BASE}/api/properties`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
          });
          
          const propertyData = await propertyResponse.json();
          console.log('Property creation response:', propertyResponse.status, propertyData);
          
          return res.status(propertyResponse.status).json({
            success: propertyResponse.ok,
            message: propertyResponse.ok ? 'Propiedad creada exitosamente' : 'Error al crear propiedad',
            data: propertyData,
            debug: {
              tokenValid: true,
              userInfo: userData,
              propertyCreationStatus: propertyResponse.status
            }
          });
        } else {
          // Solo verificación del token
          return res.status(200).json({
            success: true,
            message: 'Token válido y funcionando',
            debug: {
              tokenValid: true,
              userInfo: userData,
              method: req.method
            }
          });
        }
      } else {
        console.log('❌ Token inválido');
        return res.status(401).json({
          error: true,
          message: 'Token inválido o expirado',
          debug: {
            tokenValid: false,
            backendResponse: userData,
            tokenPreview: token.substring(0, 50) + '...'
          }
        });
      }
    } catch (tokenTestError) {
      console.error('Error al verificar token:', tokenTestError);
      return res.status(500).json({
        error: true,
        message: 'Error al verificar token con el backend',
        debug: {
          tokenTestError: tokenTestError.message,
          tokenPreview: token.substring(0, 50) + '...'
        }
      });
    }
    
  } catch (error) {
    console.error('Error en debug endpoint:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor',
      debug: {
        error: error.message,
        stack: error.stack
      }
    });
  }
}; 