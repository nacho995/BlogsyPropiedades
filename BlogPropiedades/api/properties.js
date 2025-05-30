// api/properties.js - Proxy para propiedades
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, body, query } = req;
  const backendUrl = 'http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';

  try {
    console.log(`Proxy properties: ${method} ${req.url}`);
    
    // Preparar headers para el backend
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
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
    const response = await fetch(`${backendUrl}${targetPath}`, {
      method,
      headers,
      body: method !== 'GET' && body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();

    // Retornar la respuesta del backend
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Error en proxy de properties:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Error del servidor proxy',
      details: error.message 
    });
  }
} 