module.exports = async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir métodos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: true, 
      message: 'Método no permitido' 
    });
  }

  try {
    console.log('=== CLOUDINARY SIGNATURE ===');
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

    // Credenciales reales de Cloudinary - usar directamente
    const cloudName = 'dv31mt6pd';
    const apiKey = '915443216824292';
    
    // Para unsigned upload, usamos un upload preset sin firma
    // Esto es más simple y evita problemas de generación de firma
    console.log('Usando unsigned upload - no se requiere firma');

    return res.status(200).json({
      success: true,
      api_key: apiKey,
      cloud_name: cloudName,
      upload_preset: 'blogsy_unsigned', // Preset para unsigned upload
      folder: 'blogsy-uploads',
      unsigned: true, // Indicar que es unsigned upload
      message: 'Configuración de Cloudinary para unsigned upload'
    });

  } catch (error) {
    console.error('Error en cloudinary signature:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor',
      debug: error.message
    });
  }
}; 