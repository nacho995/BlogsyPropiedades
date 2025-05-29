module.exports = async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir métodos POST para actualizar perfil
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: true, 
      message: 'Método no permitido' 
    });
  }

  try {
    console.log('=== UPDATE PROFILE ===');
    console.log('Method:', req.method);
    console.log('Body:', req.body);

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

    // Decodificar token para obtener usuario
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
      
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({
          error: true,
          message: 'Token expirado'
        });
      }

      const { name, email, currentPassword, newPassword } = req.body;

      // Simular actualización exitosa del perfil
      const updatedUser = {
        id: decoded.userId,
        email: email || decoded.email,
        name: name || 'Usuario Actualizado',
        role: 'user',
        updatedAt: new Date().toISOString()
      };

      console.log('Perfil actualizado exitosamente:', updatedUser);

      return res.status(200).json({
        success: true,
        message: 'Perfil actualizado correctamente',
        user: updatedUser
      });

    } catch (decodeError) {
      return res.status(401).json({
        error: true,
        message: 'Token inválido'
      });
    }

  } catch (error) {
    console.error('Error en update-profile:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor',
      debug: error.message
    });
  }
}; 