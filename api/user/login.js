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
    console.log('=== DEBUG LOGIN ===');
    console.log('Method:', req.method);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body type:', typeof req.body);
    console.log('Body:', req.body);
    
    // Si no hay body, devolver un mensaje de debug
    if (!req.body) {
      console.log('No body received');
      return res.status(400).json({
        error: true,
        message: 'No se recibieron datos',
        debug: {
          bodyReceived: false,
          contentType: req.headers['content-type'],
          method: req.method
        }
      });
    }

    const { email, password } = req.body;
    
    console.log('Email received:', email);
    console.log('Password received:', password ? 'YES' : 'NO');

    // Para testing temporal: aceptar cualquier credencial
    if (email && password) {
      // Crear un JWT válido manualmente (header.payload.signature)
      const header = {
        "alg": "HS256",
        "typ": "JWT"
      };
      
      const payload = {
        userId: 1,
        email: email,
        iat: Math.floor(Date.now() / 1000), // issued at
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // expira en 24 horas
      };
      
      // Codificar header y payload en base64 (no base64url)
      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      // Crear signature simple (en producción real usarías una librería como jsonwebtoken)
      const signature = Buffer.from('fake-signature-for-testing').toString('base64');
      
      // Construir JWT: header.payload.signature
      const token = `${encodedHeader}.${encodedPayload}.${signature}`;

      console.log('Login success (debug mode)');
      console.log('Generated JWT token:', token.substring(0, 50) + '...');
      
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: 1,
          email: email,
          name: 'Usuario Debug',
          role: 'user'
        }
      });
    }

    return res.status(400).json({
      error: true,
      message: 'Email y contraseña requeridos',
      debug: {
        emailReceived: !!email,
        passwordReceived: !!password,
        bodyData: req.body
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor',
      debug: error.message
    });
  }
}; 