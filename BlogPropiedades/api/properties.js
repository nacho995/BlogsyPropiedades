module.exports = async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Datos simulados de propiedades para testing
    const properties = [
      {
        id: 1,
        title: 'Casa moderna en Goza Madrid',
        description: 'Hermosa casa de 3 habitaciones con jardín',
        price: 350000,
        location: 'Goza Madrid',
        bedrooms: 3,
        bathrooms: 2,
        area: 150,
        type: 'casa',
        status: 'venta',
        imageUrl: 'https://placekitten.com/800/500',
        images: [
          'https://placekitten.com/800/500',
          'https://placekitten.com/800/501',
          'https://placekitten.com/800/502'
        ],
        features: ['jardín', 'garaje', 'terraza'],
        publishDate: '2024-01-15'
      },
      {
        id: 2,
        title: 'Apartamento céntrico',
        description: 'Apartamento de 2 habitaciones en el centro',
        price: 250000,
        location: 'Centro Goza Madrid',
        bedrooms: 2,
        bathrooms: 1,
        area: 80,
        type: 'apartamento',
        status: 'venta',
        imageUrl: 'https://placekitten.com/800/503',
        images: [
          'https://placekitten.com/800/503',
          'https://placekitten.com/800/504'
        ],
        features: ['ascensor', 'aire acondicionado'],
        publishDate: '2024-01-12'
      }
    ];

    switch (req.method) {
      case 'GET':
        // Devolver lista de propiedades directamente
        return res.status(200).json(properties);

      case 'POST':
        // Verificar autorización para crear propiedad
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            error: true,
            message: 'Token de autorización requerido'
          });
        }

        const { title, description, price, location, bedrooms, bathrooms, area, type, status } = req.body;

        if (!title || !description || !price || !location) {
          return res.status(400).json({
            error: true,
            message: 'Título, descripción, precio y ubicación son requeridos'
          });
        }

        // Simular creación de propiedad
        const newProperty = {
          id: Date.now(),
          title,
          description,
          price: Number(price),
          location,
          bedrooms: Number(bedrooms) || 1,
          bathrooms: Number(bathrooms) || 1,
          area: Number(area) || 50,
          type: type || 'apartamento',
          status: status || 'venta',
          imageUrl: 'https://placekitten.com/800/505',
          images: ['https://placekitten.com/800/505'],
          features: [],
          publishDate: new Date().toISOString().split('T')[0]
        };

        return res.status(201).json({
          success: true,
          property: newProperty
        });

      default:
        return res.status(405).json({
          error: true,
          message: 'Método no permitido'
        });
    }

  } catch (error) {
    console.error('Error en API properties:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor'
    });
  }
} 