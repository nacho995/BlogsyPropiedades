export default async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Datos simulados de blogs para testing
    const blogs = [
      {
        id: 1,
        title: 'Guía completa para comprar tu primera casa',
        description: 'Todo lo que necesitas saber antes de comprar tu primera propiedad',
        content: 'Contenido completo del blog sobre compra de casas...',
        author: 'Ignacio Dalesio',
        publishDate: '2024-01-15',
        imageUrl: 'https://placekitten.com/800/400',
        tags: ['inmobiliaria', 'compra', 'casa']
      },
      {
        id: 2,
        title: 'Tendencias del mercado inmobiliario 2024',
        description: 'Análisis de las principales tendencias del sector inmobiliario',
        content: 'Análisis detallado de las tendencias...',
        author: 'Equipo Inmobiliario',
        publishDate: '2024-01-10',
        imageUrl: 'https://placekitten.com/800/401',
        tags: ['mercado', 'tendencias', '2024']
      }
    ];

    switch (req.method) {
      case 'GET':
        // Devolver lista de blogs directamente
        return res.status(200).json(blogs);

      case 'POST':
        // Verificar autorización para crear blog
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            error: true,
            message: 'Token de autorización requerido'
          });
        }

        const { title, description, content } = req.body;

        if (!title || !description || !content) {
          return res.status(400).json({
            error: true,
            message: 'Título, descripción y contenido son requeridos'
          });
        }

        // Simular creación de blog
        const newBlog = {
          id: Date.now(),
          title,
          description,
          content,
          author: 'Usuario',
          publishDate: new Date().toISOString().split('T')[0],
          imageUrl: 'https://placekitten.com/800/402',
          tags: []
        };

        return res.status(201).json({
          success: true,
          blog: newBlog
        });

      default:
        return res.status(405).json({
          error: true,
          message: 'Método no permitido'
        });
    }

  } catch (error) {
    console.error('Error en API blogs:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor'
    });
  }
} 