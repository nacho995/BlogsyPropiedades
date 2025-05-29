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

    // Para testing/desarrollo, simular respuesta de Cloudinary
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Simular parámetros de Cloudinary
    const cloudinaryParams = {
      timestamp: timestamp,
      upload_preset: 'blogsy_preset', // Preset simulado
      api_key: 'your_api_key', // API key simulada
    };

    // Simular firma (en producción real usarías crypto y tu API secret)
    const fakeSignature = Buffer.from(
      `timestamp=${timestamp}&upload_preset=blogsy_preset`
    ).toString('base64').substring(0, 40);

    console.log('Cloudinary signature generada exitosamente');

    return res.status(200).json({
      success: true,
      signature: fakeSignature,
      timestamp: timestamp,
      api_key: cloudinaryParams.api_key,
      upload_preset: cloudinaryParams.upload_preset,
      cloud_name: 'blogsy-cloud', // Cloud name simulado
      message: 'Firma de Cloudinary generada correctamente'
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