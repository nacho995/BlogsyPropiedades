module.exports = async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetBlogs(req, res);
      case 'POST':
        return await handleCreateBlog(req, res);
      case 'PUT':
        return await handleUpdateBlog(req, res);
      case 'DELETE':
        return await handleDeleteBlog(req, res);
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
};

// Simulación de datos de blogs
const mockBlogs = [
  {
    id: 1,
    title: 'Guía completa para invertir en propiedades en Madrid',
    content: 'Madrid se ha consolidado como uno de los mercados inmobiliarios más atractivos...',
    excerpt: 'Descubre las mejores zonas y estrategias para invertir en el mercado inmobiliario madrileño.',
    author: 'Ignacio Dalesio',
    authorId: 1,
    publishedAt: '2024-01-15T10:00:00.000Z',
    category: 'Inversión',
    tags: ['inversión', 'madrid', 'propiedades'],
    image: 'https://placekitten.com/800/400',
    status: 'published'
  },
  {
    id: 2,
    title: 'Tendencias del mercado inmobiliario 2024',
    content: 'El mercado inmobiliario español presenta nuevas tendencias que todo inversor debe conocer...',
    excerpt: 'Análisis de las principales tendencias que marcarán el sector inmobiliario este año.',
    author: 'Usuario de Prueba',
    authorId: 2,
    publishedAt: '2024-01-10T15:30:00.000Z',
    category: 'Mercado',
    tags: ['tendencias', '2024', 'mercado'],
    image: 'https://placekitten.com/800/401',
    status: 'published'
  }
];

async function handleGetBlogs(req, res) {
  const { page = 1, limit = 10, category, author } = req.query;
  
  let filteredBlogs = [...mockBlogs];
  
  // Filtrar por categoría si se especifica
  if (category) {
    filteredBlogs = filteredBlogs.filter(blog => 
      blog.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  // Filtrar por autor si se especifica
  if (author) {
    filteredBlogs = filteredBlogs.filter(blog => 
      blog.author.toLowerCase().includes(author.toLowerCase())
    );
  }
  
  // Paginación
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex);
  
  return res.status(200).json({
    success: true,
    blogs: paginatedBlogs,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(filteredBlogs.length / limit),
      totalBlogs: filteredBlogs.length,
      hasNextPage: endIndex < filteredBlogs.length,
      hasPrevPage: page > 1
    }
  });
}

async function handleCreateBlog(req, res) {
  const { title, content, excerpt, category, tags, image } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({
      error: true,
      message: 'Título y contenido son requeridos'
    });
  }
  
  const newBlog = {
    id: Date.now(),
    title,
    content,
    excerpt: excerpt || content.substring(0, 150) + '...',
    author: 'Usuario Actual', // En producción obtener del token
    authorId: 1,
    publishedAt: new Date().toISOString(),
    category: category || 'General',
    tags: tags || [],
    image: image || 'https://placekitten.com/800/400',
    status: 'published'
  };
  
  mockBlogs.unshift(newBlog);
  
  return res.status(201).json({
    success: true,
    message: 'Blog creado exitosamente',
    blog: newBlog
  });
}

async function handleUpdateBlog(req, res) {
  const { id } = req.query;
  const updates = req.body;
  
  const blogIndex = mockBlogs.findIndex(blog => blog.id === parseInt(id));
  
  if (blogIndex === -1) {
    return res.status(404).json({
      error: true,
      message: 'Blog no encontrado'
    });
  }
  
  mockBlogs[blogIndex] = { ...mockBlogs[blogIndex], ...updates };
  
  return res.status(200).json({
    success: true,
    message: 'Blog actualizado exitosamente',
    blog: mockBlogs[blogIndex]
  });
}

async function handleDeleteBlog(req, res) {
  const { id } = req.query;
  
  const blogIndex = mockBlogs.findIndex(blog => blog.id === parseInt(id));
  
  if (blogIndex === -1) {
    return res.status(404).json({
      error: true,
      message: 'Blog no encontrado'
    });
  }
  
  mockBlogs.splice(blogIndex, 1);
  
  return res.status(200).json({
    success: true,
    message: 'Blog eliminado exitosamente'
  });
} 