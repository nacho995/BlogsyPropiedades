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

    // Credenciales reales de Cloudinary
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dv31mt6pd';
    const apiKey = process.env.CLOUDINARY_API_KEY || '915443216824292';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'FMDbe6eOaHniPHQnrn-qbd6EqW4';
    
    // Generar timestamp actual
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Parámetros para la subida
    const uploadParams = {
      timestamp: timestamp,
      upload_preset: 'blogsy_preset', // Puedes crear este preset en Cloudinary
      folder: 'blogsy-uploads'
    };

    // Crear string para firma (ordenado alfabéticamente)
    const paramsString = Object.keys(uploadParams)
      .sort()
      .map(key => `${key}=${uploadParams[key]}`)
      .join('&');

    // Generar firma real usando SHA-1
    const crypto = require('crypto');
    const signature = crypto
      .createHash('sha1')
      .update(paramsString + apiSecret)
      .digest('hex');

    console.log('Cloudinary signature generada exitosamente');
    console.log('Params string:', paramsString);
    console.log('Signature:', signature);

    return res.status(200).json({
      success: true,
      signature: signature,
      timestamp: timestamp,
      api_key: apiKey,
      cloud_name: cloudName,
      upload_preset: uploadParams.upload_preset,
      folder: uploadParams.folder,
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