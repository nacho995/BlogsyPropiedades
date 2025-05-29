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
    // Array de propiedades (inicialmente vacío - se llenará con propiedades reales)
    const properties = [
      // Las propiedades se añadirán dinámicamente cuando se creen
    ];

    switch (req.method) {
      case 'GET':
        // Devolver lista de propiedades
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

        const { title, description, price, location, bedrooms, bathrooms, area, images, features, type, status } = req.body;

        if (!title || !description || !price || !location) {
          return res.status(400).json({
            error: true,
            message: 'Título, descripción, precio y ubicación son requeridos'
          });
        }

        // Crear nueva propiedad con datos reales
        const newProperty = {
          id: Date.now(),
          _id: Date.now(), // Para compatibilidad
          title,
          description,
          price: Number(price),
          location,
          address: location, // Alias para compatibilidad
          bedrooms: Number(bedrooms) || 1,
          bathrooms: Number(bathrooms) || 1,
          area: Number(area) || 50,
          m2: Number(area) || 50, // Alias para compatibilidad
          rooms: Number(bedrooms) || 1, // Alias para compatibilidad
          wc: Number(bathrooms) || 1, // Alias para compatibilidad
          typeProperty: type || 'Propiedad',
          propertyType: status || 'Venta',
          images: images || [],
          features: features || [],
          publishDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          status: 'Disponible'
        };

        // NOTA: En un sistema real, aquí se guardaría en base de datos
        // Por ahora solo retornamos la propiedad creada
        console.log('Nueva propiedad creada:', newProperty);

        return res.status(201).json({
          success: true,
          property: newProperty,
          message: 'Propiedad creada exitosamente'
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