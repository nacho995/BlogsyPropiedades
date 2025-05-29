module.exports = async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== SYNC PROFILE IMAGE ===');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers.authorization ? 'Authorization provided' : 'No authorization');

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

    // Simular datos de perfil con imagen
    const mockProfileImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiM0Yjc2ODgiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0id2hpdGUiPkZvdG88L3RleHQ+PC9zdmc+';

    if (req.method === 'GET') {
      // GET: Obtener imagen de perfil actual
      console.log('Obteniendo imagen de perfil del servidor (simulado)');
      
      return res.status(200).json({
        success: true,
        profilePic: mockProfileImage,
        message: 'Imagen de perfil obtenida correctamente'
      });
    }

    if (req.method === 'POST') {
      // POST: Subir/actualizar imagen de perfil
      console.log('Actualizando imagen de perfil en el servidor (simulado)');
      console.log('Body received:', req.body ? 'YES' : 'NO');

      if (!req.body) {
        return res.status(400).json({
          error: true,
          message: 'Datos de imagen requeridos'
        });
      }

      const { profilePic, profilePicUrl } = req.body;

      if (!profilePic && !profilePicUrl) {
        return res.status(400).json({
          error: true,
          message: 'Se requiere profilePic o profilePicUrl'
        });
      }

      // Simular guardado exitoso
      return res.status(200).json({
        success: true,
        message: 'Imagen de perfil actualizada correctamente',
        profilePic: profilePic || profilePicUrl,
        syncedAt: new Date().toISOString()
      });
    }

    // Método no permitido
    return res.status(405).json({
      error: true,
      message: 'Método no permitido'
    });

  } catch (error) {
    console.error('Error en sync-profile-image:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor',
      debug: error.message
    });
  }
}; 