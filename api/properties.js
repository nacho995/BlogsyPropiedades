// Conexión a MongoDB y modelo de Property
let mongoose;
let Property;

// Inicializar conexión y modelo
async function initializeMongoDB() {
  if (!mongoose) {
    mongoose = require('mongoose');
    
    // URI de conexión
    const MONGODB_URI = 'mongodb+srv://nacho995:eminem50cent@cluster0.o6i9n.mongodb.net/GozaMadrid?retryWrites=true&w=majority&appName=Cluster0';
    
    // Conectar si no está conectado
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado a MongoDB');
      } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        throw error;
      }
    }
    
    // Definir schema de Property si no existe
    if (!Property) {
      const propertySchema = new mongoose.Schema({
        title: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        location: { type: String, required: true },
        address: { type: String },
        bedrooms: { type: Number, default: 1 },
        bathrooms: { type: Number, default: 1 },
        area: { type: Number, default: 50 },
        m2: { type: Number },
        rooms: { type: Number },
        wc: { type: Number },
        typeProperty: { type: String, default: 'Propiedad' },
        propertyType: { type: String, default: 'Venta' },
        images: [{ 
          src: String, 
          alt: String 
        }],
        features: [String],
        status: { type: String, default: 'Disponible' },
        publishDate: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now }
      }, { 
        timestamps: true,
        collection: 'properties' // Nombre específico de la colección
      });
      
      Property = mongoose.models.Property || mongoose.model('Property', propertySchema);
    }
  }
  
  return Property;
}

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
    // Inicializar MongoDB
    const PropertyModel = await initializeMongoDB();

    switch (req.method) {
      case 'GET':
        // Obtener propiedades desde MongoDB
        const properties = await PropertyModel.find({}).sort({ createdAt: -1 });
        console.log(`Propiedades encontradas en DB: ${properties.length}`);
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

        // Crear nueva propiedad en MongoDB
        const newPropertyData = {
          title,
          description,
          price: Number(price),
          location,
          address: location,
          bedrooms: Number(bedrooms) || 1,
          bathrooms: Number(bathrooms) || 1,
          area: Number(area) || 50,
          m2: Number(area) || 50,
          rooms: Number(bedrooms) || 1,
          wc: Number(bathrooms) || 1,
          typeProperty: type || 'Propiedad',
          propertyType: status || 'Venta',
          images: images || [],
          features: features || [],
          status: 'Disponible'
        };

        const newProperty = new PropertyModel(newPropertyData);
        const savedProperty = await newProperty.save();
        
        console.log('Nueva propiedad guardada en MongoDB:', savedProperty._id);

        return res.status(201).json({
          success: true,
          property: savedProperty,
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
      message: 'Error interno del servidor',
      details: error.message
    });
  }
}; 