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
    console.log('=== USER ME ===');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers.authorization ? 'Authorization provided' : 'No authorization');

    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 50) + '...');

    try {
      // Verificar que el token tenga formato JWT (3 segmentos)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return res.status(401).json({
          error: true,
          message: 'Token formato inválido'
        });
      }

      // Decodificar payload del JWT (usar base64 en lugar de base64url)
      const payload = tokenParts[1];
      
      // Añadir padding si es necesario para base64
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decoded = JSON.parse(Buffer.from(paddedPayload, 'base64').toString());
      
      console.log('Token decoded:', decoded);

      // Verificar expiración
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({
          error: true,
          message: 'Token expirado'
        });
      }

      // Simular datos de usuario - DEVOLVER DIRECTAMENTE SIN WRAPPER
      const userData = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.email === 'ignaciodalesio1995@gmail.com' ? 'Ignacio Dalesio' : 'Usuario de Prueba',
        role: decoded.email === 'ignaciodalesio1995@gmail.com' ? 'admin' : 'user',
        avatar: null,
        profileImage: null, // Agregar campo profileImage
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      console.log('Returning user data directly:', userData);

      // DEVOLVER DIRECTAMENTE LOS DATOS DEL USUARIO, NO COMO WRAPPER
      return res.status(200).json(userData);

    } catch (decodeError) {
      console.error('Error decoding token:', decodeError);
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