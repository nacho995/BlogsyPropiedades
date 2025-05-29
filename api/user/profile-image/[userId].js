module.exports = async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir métodos POST para subir imagen
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: true, 
      message: 'Método no permitido' 
    });
  }

  try {
    console.log('=== UPLOAD PROFILE IMAGE ===');
    console.log('Method:', req.method);
    console.log('Query params:', req.query);

    // Verificar autorización
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Token de autorización requerido'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar token válido (JWT format)
    if (token.split('.').length !== 3) {
      return res.status(401).json({
        error: true,
        message: 'Token inválido'
      });
    }

    // Obtener userId de la URL
    const { userId } = req.query;
    console.log('User ID from URL:', userId);

    if (!userId) {
      return res.status(400).json({
        error: true,
        message: 'ID de usuario requerido'
      });
    }

    // Decodificar token para verificar autorización
    try {
      const payload = token.split('.')[1];
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decoded = JSON.parse(Buffer.from(paddedPayload, 'base64').toString());
      
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({
          error: true,
          message: 'Token expirado'
        });
      }

      // Verificar que el usuario tiene permiso para actualizar este perfil
      if (decoded.userId != userId) {
        return res.status(403).json({
          error: true,
          message: 'No tienes permiso para actualizar este perfil'
        });
      }

      // Simular la subida exitosa de imagen (en producción real se subiría a Cloudinary o similar)
      const imageUrl = `https://picsum.photos/200/200?random=${Date.now()}`;
      
      console.log('Imagen de perfil simulada generada:', imageUrl);

      // Simular actualización del usuario con nueva imagen
      const updatedUser = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.email === 'ignaciodalesio1995@gmail.com' ? 'Ignacio Dalesio' : 'Usuario de Prueba',
        role: decoded.email === 'ignaciodalesio1995@gmail.com' ? 'admin' : 'user',
        profileImage: {
          url: imageUrl,
          publicId: `profile_${userId}_${Date.now()}`
        },
        updatedAt: new Date().toISOString()
      };

      console.log('Usuario actualizado con nueva imagen:', updatedUser);

      return res.status(200).json({
        success: true,
        message: 'Imagen de perfil actualizada correctamente',
        user: updatedUser
      });

    } catch (decodeError) {
      console.error('Error decoding token:', decodeError);
      return res.status(401).json({
        error: true,
        message: 'Token inválido'
      });
    }

  } catch (error) {
    console.error('Error en upload profile image:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor',
      debug: error.message
    });
  }
}; 