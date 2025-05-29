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
    console.log('Headers:', Object.keys(req.headers));

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

    // Decodificar token para obtener el userId
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

      const userId = decoded.userId;
      console.log('User ID from token:', userId);

      // Simular la subida exitosa de imagen con Cloudinary
      // En un futuro, aquí procesarías el FormData y subirías a Cloudinary
      const imageUrl = `https://res.cloudinary.com/dv31mt6pd/image/upload/v${Date.now()}/blogsy-uploads/profile_${userId}_${Date.now()}.jpg`;
      
      console.log('Imagen de perfil simulada generada:', imageUrl);

      // Simular actualización del usuario con nueva imagen
      const updatedUser = {
        id: userId,
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