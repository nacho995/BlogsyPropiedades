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
    const cloudName = 'dv31mt6pd';
    const apiKey = '915443216824292';
    const apiSecret = 'FMDbe6eOaHniPHQnrn-qbd6EqW4';

    // Generar timestamp
    const timestamp = Math.round(Date.now() / 1000);

    // Parámetros para signed upload (SOLO los que se enviarán a Cloudinary)
    const uploadParams = {
      timestamp: timestamp,
      folder: 'blogsy-uploads'
    };

    // Generar la firma usando crypto
    const crypto = require('crypto');
    
    // Crear string para firmar (parámetros ordenados alfabéticamente)
    const sortedParams = Object.keys(uploadParams)
      .sort()
      .map(key => `${key}=${uploadParams[key]}`)
      .join('&');
    
    const stringToSign = `${sortedParams}${apiSecret}`;
    
    console.log('String to sign:', stringToSign);
    
    // Generar firma SHA-1
    const signature = crypto
      .createHash('sha1')
      .update(stringToSign)
      .digest('hex');

    console.log('Generated signature:', signature);

    return res.status(200).json({
      success: true,
      signature: signature,
      timestamp: timestamp,
      api_key: apiKey,
      cloud_name: cloudName,
      folder: uploadParams.folder,
      signed: true, // Indicar que es signed upload
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