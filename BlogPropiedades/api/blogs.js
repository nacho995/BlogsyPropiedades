// api/blogs.js - Proxy para blogs
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
    console.log(`Proxy blogs: ${method} ${req.url}`);
    console.log('Query params:', query);
    
    // Preparar headers para el backend
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Incluir token de autorización si existe
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
      console.log('Authorization header forwarded');
    }

    // Construir la ruta del backend
    let targetPath = '/api/blogs';
    
    // Manejar rutas específicas
    if (query.id) {
      targetPath = `/api/blogs/${query.id}`;
      console.log(`Routing to specific blog: ${targetPath}`);
    } else if (req.url.includes('/upload')) {
      targetPath = '/api/blogs/upload';
    }

    const fullUrl = `${backendUrl}${targetPath}`;
    console.log(`Making request to: ${fullUrl}`);

    // Hacer la petición al backend HTTP
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: method !== 'GET' && body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    
    console.log(`Backend response status: ${response.status}`);
    console.log('Backend response data:', data);

    // Retornar la respuesta del backend
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Error en proxy de blogs:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Error del servidor proxy',
      details: error.message 
    });
  }
} 