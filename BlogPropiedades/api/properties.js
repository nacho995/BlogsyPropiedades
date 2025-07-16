// api/properties.js - Proxy para propiedades
export default async function handler(req, res) {
  // Configurar CORS - Esta parte es crítica
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  // Configurar el origen permitido
  const origin = req.headers.origin;
  // Permitir todos los orígenes o especificar los dominios permitidos
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Alternativa: permitir dominios específicos
  // if (origin && (origin.includes('blogs.realestategozamadrid.com') || origin.includes('realestategozamadrid.com'))) {
  //   res.setHeader('Access-Control-Allow-Origin', origin);
  // }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cache-Control, cache-control, Pragma, pragma'
  );

  // Asegurarnos de manejar correctamente los OPTIONS preflight
  if (req.method === 'OPTIONS') {
    console.log('[API] Recibida petición OPTIONS preflight');
    res.status(200).end();
    return;
  }

  const { method, body, query } = req;
  const backendUrl = 'http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';

  try {
    console.log(`[API] Proxy properties: ${method} ${req.url}`);
    console.log(`[API] Headers recibidos: ${JSON.stringify(req.headers)}`);
    
    // Preparar headers para el backend
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Incluir token de autorización si existe
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // Construir la ruta del backend
    let targetPath = '/api/properties';
    
    // Manejar rutas específicas
    if (query.id) {
      targetPath = `/api/properties/${query.id}`;
    }

    // Hacer la petición al backend HTTP
    console.log(`[API] Enviando petición a: ${backendUrl}${targetPath}`);
    const response = await fetch(`${backendUrl}${targetPath}`, {
      method,
      headers,
      body: method !== 'GET' && body ? JSON.stringify(body) : undefined
    });

    // Verificar que recibimos JSON y no HTML
    const contentType = response.headers.get('content-type') || '';
    console.log(`[API] Tipo de contenido recibido: ${contentType}`);
    
    if (!contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('[API] Error: Respuesta no es JSON:', textResponse.substring(0, 200) + '...');
      return res.status(500).json({ 
        error: true, 
        message: 'El backend no devolvió JSON válido',
        contentType,
        status: response.status,
        originalUrl: `${backendUrl}${targetPath}`
      });
    }

    const data = await response.json();
    console.log(`[API] Respuesta recibida de ${targetPath} con ${response.status}`);

    // Devolver la respuesta como JSON (importante para que el cliente reciba JSON)
    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).json(data);

  } catch (error) {
    console.error('[API] Error en proxy de properties:', error);
    // Asegurar que devolvemos JSON y no HTML
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: true, 
      message: 'Error del servidor proxy', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Función para verificar si una respuesta es HTML en lugar de JSON
function isHtmlResponse(text) {
  return text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html');
} 