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
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Decodificar token simple (en producción usar JWT real)
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Verificar expiración
      if (decoded.exp < Date.now()) {
        return res.status(401).json({
          error: true,
          message: 'Token expirado'
        });
      }

      // TODO: Obtener datos del usuario desde base de datos
      // Simulación de datos de usuario
      const userData = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.email === 'ignaciodalesio1995@gmail.com' ? 'Ignacio Dalesio' : 'Usuario de Prueba',
        role: decoded.email === 'ignaciodalesio1995@gmail.com' ? 'admin' : 'user',
        avatar: null,
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      return res.status(200).json({
        success: true,
        user: userData
      });

    } catch (decodeError) {
      return res.status(401).json({
        error: true,
        message: 'Token inválido'
      });
    }

  } catch (error) {
    console.error('Error en obtener perfil:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor'
    });
  }
}; 