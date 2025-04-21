import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPropertyPost, uploadImageProperty, getPropertyById, updatePropertyPost } from '../services/api';
import { useUser } from '../context/UserContext';
import { motion } from 'framer-motion';
import { FiUpload, FiHome, FiDollarSign, FiMapPin, FiUser, FiDroplet, FiSquare, FiTag, FiList, FiX, FiPlus, FiEdit } from 'react-icons/fi';
import { BiBed, BiBath } from 'react-icons/bi';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Inyecta global CSS para la animación de shake (puedes moverlo a tu archivo global si lo prefieres)
const globalStyles = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}
.animate-shake {
  animation: shake 0.5s;
}

/* Estilos para el editor de descripción */
.property-description .ql-editor {
  font-family: 'Inter', system-ui, sans-serif;
  color: #374151;
  line-height: 1.8;
  font-size: 16px;
  min-height: 200px;
  padding: 16px;
}

.property-description .ql-editor p {
  margin-bottom: 1rem;
}

.property-description .ql-editor h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: #1F2937;
}

.property-description .ql-editor h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.75rem;
  color: #374151;
}

.property-description .ql-editor ul, 
.property-description .ql-editor ol {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

.property-description .ql-editor li {
  margin-bottom: 0.5rem;
}

.property-feature-block,
.feature-block {
  background-color: #f0f9ff;
  border-left: 3px solid #3b82f6;
  padding: 10px 15px;
  margin: 10px 0;
  border-radius: 4px;
}

.property-highlight-block,
.highlight-block {
  background-color: #fffbeb;
  border-left: 3px solid #f59e0b;
  padding: 10px 15px;
  margin: 10px 0;
  border-radius: 4px;
}
`;

// Configuración del editor
const quillModules = {
  toolbar: {
    container: [
      [{ 'header': [2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  }
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline',
  'list', 'bullet',
  'link',
  'color', 'background'
];

// Plantillas para bloques especiales
const propertyBlockTemplates = {
  feature: `
    <div class="property-feature-block">
      <p><strong>Características destacadas:</strong></p>
      <ul>
        <li>Característica 1</li>
        <li>Característica 2</li>
        <li>Característica 3</li>
      </ul>
    </div>
  `,
  highlight: `
    <div class="property-highlight-block">
      <p><strong>Beneficios de la propiedad:</strong></p>
      <p>Descripción de los beneficios y ventajas que ofrece esta propiedad, como la ubicación privilegiada, las vistas espectaculares o las amenidades cercanas.</p>
    </div>
  `,
  location: `
    <h3>Información de la zona</h3>
    <p>Esta propiedad se encuentra en una zona privilegiada con fácil acceso a:</p>
    <ul>
      <li>Centros comerciales a 5 minutos</li>
      <li>Transporte público a 2 minutos andando</li>
      <li>Parques y zonas verdes en los alrededores</li>
    </ul>
  `,
};

// Animaciones
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function PropertyCreation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const fileInputRef = useRef(null);
  const quillRef = useRef(null);
  
  // Estado para controlar si estamos en modo edición
  const [isEditMode, setIsEditMode] = useState(false);
  const [propertyId, setPropertyId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    price: '',
    images: [],
    bedrooms: '',
    bathrooms: '',
    area: '',
    typeProperty: 'Propiedad',
    m2: '',
    priceM2: '',
    rooms: '',
    wc: '',
    piso: '',
    tags: [],
    template: 'default',
    location: '',
    propertyType: 'Venta',
    features: [],
    status: 'Disponible',
    featured: false
  });
  
  const [uploadedImages, setUploadedImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [featureInput, setFeatureInput] = useState('');
  
  useEffect(() => {
    // Inyectar estilos
    if (typeof window !== "undefined") {
      const style = document.createElement("style");
      style.innerHTML = globalStyles;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);
  
  // Detectar si estamos en modo edición y cargar los datos de la propiedad
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const editPropertyId = queryParams.get('edit');
    
    if (editPropertyId) {
      setIsEditMode(true);
      setPropertyId(editPropertyId);
      loadPropertyData(editPropertyId);
    }
  }, [location]);
  
  // Función para cargar los datos de la propiedad a editar
  const loadPropertyData = async (id) => {
    try {
      const propertyData = await getPropertyById(id);
      
      if (!propertyData) {
        throw new Error('No se pudo obtener la información de la propiedad');
      }
      
      // Procesar las imágenes para que tengan el formato correcto
      let propertyImages = [];
      
      // Procesar la imagen principal
      if (propertyData.image && typeof propertyData.image === 'object' && propertyData.image.src) {
        propertyImages.push(propertyData.image);
      } else if (propertyData.image && typeof propertyData.image === 'string') {
        propertyImages.push({ src: propertyData.image, alt: "Imagen principal" });
      }
      
      // Procesar las imágenes adicionales
      if (propertyData.images && Array.isArray(propertyData.images)) {
        const additionalImages = propertyData.images.map(img => {
          if (typeof img === 'string') {
            return { src: img, alt: "Imagen de la propiedad" };
          } else if (typeof img === 'object' && img.src) {
            return img;
          }
          return null;
        }).filter(img => img !== null);
        
        propertyImages = [...propertyImages, ...additionalImages];
      }
      
      // Actualizar el estado del formulario con los datos de la propiedad
      setFormData({
        title: propertyData.title || '',
        description: propertyData.description || '',
        address: propertyData.address || propertyData.location || '',
        price: propertyData.price || '',
        images: propertyImages || [],
        bedrooms: propertyData.bedrooms || propertyData.rooms || '',
        bathrooms: propertyData.bathrooms || propertyData.wc || '',
        area: propertyData.area || propertyData.m2 || '',
        typeProperty: propertyData.typeProperty || 'Propiedad',
        m2: propertyData.m2 || propertyData.area || '',
        priceM2: propertyData.priceM2 || '',
        rooms: propertyData.rooms || propertyData.bedrooms || '',
        wc: propertyData.wc || propertyData.bathrooms || '',
        piso: propertyData.piso || '',
        tags: propertyData.tags || [],
        location: propertyData.location || propertyData.address || '',
        propertyType: propertyData.propertyType || 'Venta',
        features: propertyData.features || [],
        status: propertyData.status || 'Disponible',
        featured: propertyData.featured || false
      });
      
      // Actualizar previewImages
      setPreviewImages(propertyImages);
      setUploadedImages(propertyImages);
      
      toast.success('Datos de la propiedad cargados correctamente');
    } catch (error) {
      console.error('Error al cargar los datos de la propiedad:', error);
      toast.error('Error al cargar los datos de la propiedad');
    }
  };
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Manejar cambios en el editor de descripción
  const handleDescriptionChange = (content) => {
    setFormData({
      ...formData,
      description: content
    });
  };
  
  // Insertar bloque especial en la descripción
  const insertPropertyBlock = (blockType) => {
    const content = propertyBlockTemplates[blockType] || '';
    
    // Añadir el bloque al contenido existente
    setFormData({
      ...formData,
      description: (formData.description || '') + content
    });
  };
  
  // Añadir una característica
  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()]
      });
      setFeatureInput('');
    }
  };
  
  // Eliminar una característica
  const removeFeature = (index) => {
    const newFeatures = [...formData.features];
    newFeatures.splice(index, 1);
    setFormData({
      ...formData,
      features: newFeatures
    });
  };
  
  // Manejar la subida de imágenes
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setUploadingImages(true);
    setError(null);
    
    try {
        // Filtrar y validar archivos
        const validFiles = files.filter(file => {
            if (file.size > 10 * 1024 * 1024) {
                toast.warning(`La imagen ${file.name} es demasiado grande (máx. 10MB)`);
                return false;
            }
            if (!file.type.startsWith('image/')) {
                toast.warning(`El archivo ${file.name} no es una imagen válida`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) {
            throw new Error('No hay imágenes válidas para subir');
        }

        // Subir cada imagen individualmente
        const uploadPromises = validFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('image', file);
            
            // Agregar campos adicionales que pueda requerir el backend
            formData.append('title', 'Imagen de propiedad');
            formData.append('description', 'Imagen subida desde el formulario de propiedades');
            
            try {
                console.log(`Subiendo archivo: ${file.name}`);
                const result = await uploadImageProperty(formData);
                console.log('Resultado de subida de imagen:', result);
                return result;
            } catch (error) {
                console.error(`Error al subir imagen ${file.name}:`, error);
                toast.error(`Error al subir ${file.name}`);
                throw error;
            }
        });

        const results = await Promise.all(uploadPromises);
        console.log('Resultados de subida de imágenes:', results);
        
        // Filtrar resultados válidos
        const validResults = results.filter(result => result && result.src);
        
        if (validResults.length === 0) {
            throw new Error('No se pudo subir ninguna imagen correctamente');
        }
        
        // Actualizar el estado con las nuevas imágenes
        setUploadedImages(prev => [...prev, ...validResults]);
        setPreviewImages(prev => [...prev, ...validResults]);
        
        // Actualizar formData con las nuevas imágenes
        setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), ...validResults]
        }));

        toast.success(`${validResults.length} ${validResults.length === 1 ? 'imagen subida' : 'imágenes subidas'} correctamente`);
    } catch (error) {
        console.error('Error al subir imágenes:', error);
        setError(`Error al subir las imágenes: ${error.message}`);
        toast.error('Error al subir las imágenes');
    } finally {
        setUploadingImages(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };
  
  // Eliminar una imagen específica
  const removeImage = (index) => {
    try {
        // No permitir eliminar la última imagen si es la única
        if (formData.images.length <= 1) {
            toast.warning('No se puede eliminar la única imagen disponible');
            return;
        }

        setUploadedImages(prev => prev.filter((_, i) => i !== index));
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));

        toast.success('Imagen eliminada');
    } catch (error) {
        console.error('Error al eliminar la imagen:', error);
        toast.error('Error al eliminar la imagen');
    }
  };
  
  // Nueva función para manejar el drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      // Llamar a handleImageUpload con un objeto evento simulado
      handleImageUpload({ target: { files: files } });
    }
  };
  
  // Avanzar al siguiente paso
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  // Retroceder al paso anterior
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
        // Validar campos requeridos
        const requiredFields = [
            { name: 'title', label: 'Título' },
            { name: 'description', label: 'Descripción' },
            { name: 'price', label: 'Precio' },
            { name: 'location', label: 'Ubicación' },
            { name: 'bedrooms', label: 'Dormitorios' },
            { name: 'bathrooms', label: 'Baños' },
            { name: 'area', label: 'Área' }
        ];
        
        const missingFields = requiredFields.filter(field => !formData[field.name]);
        
        if (missingFields.length > 0) {
            throw new Error(`Por favor, completa los siguientes campos: ${missingFields.map(f => f.label).join(', ')}`);
        }

        if (!formData.images || formData.images.length === 0) {
            throw new Error('Por favor, sube al menos una imagen');
        }

        // Asegurarnos de que las imágenes estén en el formato correcto
        const validImages = Array.isArray(formData.images) 
            ? formData.images.map(img => {
                if (typeof img === 'string') {
                    return {
                        src: img,
                        alt: 'Imagen de la propiedad'
                    };
                }
                if (typeof img === 'object' && img !== null && typeof img.src === 'string') {
                    return {
                        src: img.src,
                        alt: img.alt || 'Imagen de la propiedad'
                    };
                }
                return null;
            }).filter(img => img !== null)
            : [];

        if (validImages.length === 0) {
            throw new Error('No hay imágenes válidas para la propiedad');
        }

        // Preparar los datos según el esquema
        const propertyData = {
            ...formData,
            m2: formData.area,
            rooms: formData.bedrooms,
            wc: formData.bathrooms,
            address: formData.location,
            // Asegurar que los campos numéricos sean números
            price: Number(formData.price),
            bedrooms: Number(formData.bedrooms),
            bathrooms: Number(formData.bathrooms),
            area: Number(formData.area),
            // Usar las imágenes validadas
            images: validImages
        };
        
        console.log(`${isEditMode ? 'Actualizando' : 'Creando'} propiedad:`, propertyData);
        
        let response;
        
        if (isEditMode && propertyId) {
            // Editar propiedad existente
            response = await updatePropertyPost(propertyId, propertyData);
            toast.success('¡Propiedad actualizada exitosamente!');
        } else {
            // Crear nueva propiedad
            response = await createPropertyPost(propertyData);
            toast.success('¡Propiedad creada exitosamente!');
        }
        
        console.log('Respuesta del servidor:', response);
        
        navigate('/propiedades');
    } catch (err) {
        console.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} la propiedad:`, err);
        setError(`Error al ${isEditMode ? 'actualizar' : 'crear'} la propiedad: ${err.message}`);
        toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} la propiedad: ${err.message}`);
    } finally {
        setLoading(false);
    }
};
  
  // Renderizar el paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.h2 variants={fadeIn} className="text-2xl font-bold text-blue-800">
              Información básica
            </motion.h2>
            
            <motion.div variants={fadeIn} className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                <FiHome className="inline mr-2" />
                Título
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                placeholder="Ej: Apartamento moderno en el centro"
                required
              />
            </motion.div>
            
            <motion.div variants={fadeIn} className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                <FiList className="inline mr-2" />
                Descripción
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden property-description">
                <ReactQuill
                  ref={quillRef}
                  value={formData.description || ''}
                  onChange={handleDescriptionChange}
                  modules={quillModules}
                  formats={quillFormats}
                  className="min-h-[250px]"
                  theme="snow"
                  placeholder="Describe la propiedad con detalle..."
                />
                
                {/* Bloques especiales */}
                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    <h3 className="w-full text-sm text-gray-600 font-medium mb-1">Añadir bloques especiales:</h3>
                    <button
                      type="button"
                      onClick={() => insertPropertyBlock('feature')}
                      className="text-sm px-3 py-2 rounded hover:bg-blue-50 border border-blue-100 flex items-center gap-1 text-left"
                    >
                      <div className="flex-1">
                        <span className="font-bold text-blue-800 block">Lista de características</span>
                        <span className="text-xs text-gray-500 block" style={{backgroundColor: '#f0f9ff', padding: '2px 6px', borderLeft: '2px solid #3b82f6'}}>Estructura con viñetas</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertPropertyBlock('highlight')}
                      className="text-sm px-3 py-2 rounded hover:bg-yellow-50 border border-yellow-100 flex items-center gap-1 text-left"
                    >
                      <div className="flex-1">
                        <span className="font-bold text-yellow-800 block">Bloque destacado</span>
                        <span className="text-xs text-gray-500 block" style={{backgroundColor: '#fffbeb', padding: '2px 6px', borderLeft: '2px solid #f59e0b'}}>Información importante</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertPropertyBlock('location')}
                      className="text-sm px-3 py-2 rounded hover:bg-green-50 border border-green-100 flex items-center gap-1 text-left"
                    >
                      <div className="flex-1">
                        <span className="font-bold text-green-800 block">Información de zona</span>
                        <span className="text-xs text-gray-500 block" style={{backgroundColor: '#ecfdf5', padding: '2px 6px', borderLeft: '2px solid #10b981'}}>Detalles de la ubicación</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Vista previa */}
              <div className="mt-4 border rounded-lg p-4 bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  Vista previa
                </h3>
                <div 
                  className="property-description p-4 border rounded bg-gray-50"
                  dangerouslySetInnerHTML={{ __html: formData.description }}
                ></div>
              </div>
            </motion.div>
            
            <motion.div variants={fadeIn} className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                <FiDollarSign className="inline mr-2" />
                Precio (€)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                placeholder="Ej: 250000"
                required
              />
            </motion.div>
            
            <motion.div variants={fadeIn} className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                <FiMapPin className="inline mr-2" />
                Ubicación
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                placeholder="Ej: Calle Mayor 123, Madrid"
                required
              />
            </motion.div>
            
            <motion.div variants={fadeIn} className="flex justify-end">
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Siguiente
              </button>
            </motion.div>
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.h2 variants={fadeIn} className="text-2xl font-bold text-blue-800">
              Características
            </motion.h2>
            
            <motion.div variants={fadeIn} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FiUser className="inline mr-2" />
                  Habitaciones
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <BiBath className="inline mr-2" />
                  Baños
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FiSquare className="inline mr-2" />
                  Área (m²)
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                  min="0"
                />
              </div>
            </motion.div>
            
            <motion.div variants={fadeIn} className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                <FiTag className="inline mr-2" />
                Tipo de Propiedad
              </label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
              >
                <option value="Venta">Venta</option>
                <option value="Alquiler">Alquiler</option>
                <option value="Vacacional">Vacacional</option>
              </select>
            </motion.div>
            
            <motion.div variants={fadeIn} className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                <FiList className="inline mr-2" />
                Características Adicionales
              </label>
              
              <div className="flex items-center mb-3">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  className="flex-1 border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                  placeholder="Ej: Piscina, Jardín, Garaje..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="ml-2 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
                >
                  <FiPlus size={20} />
                </button>
              </div>
              
              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.features.map((feature, index) => (
                    <div
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
                    >
                      <span>{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Añadir sugerencias de características comunes */}
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Características comunes:</p>
                <div className="flex flex-wrap gap-2">
                  {['Piscina', 'Garaje', 'Terraza', 'Aire acondicionado', 'Calefacción', 'Ascensor', 'Amueblado', 'Jardín'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        if (!formData.features.includes(suggestion)) {
                          setFormData({
                            ...formData,
                            features: [...formData.features, suggestion]
                          });
                        }
                      }}
                      disabled={formData.features.includes(suggestion)}
                      className={`text-xs px-3 py-1 rounded-full ${
                        formData.features.includes(suggestion)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={fadeIn} className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-bold hover:bg-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Anterior
              </button>
              
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Siguiente
              </button>
            </motion.div>
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.h2 variants={fadeIn} className="text-2xl font-bold text-blue-800">
              Imágenes
            </motion.h2>
            
            <motion.div variants={fadeIn} className="mb-6">
              <div
                className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
                onClick={() => fileInputRef.current.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={handleDrop}
              >
                <FiUpload className="mx-auto text-blue-500 mb-4" size={48} />
                <p className="text-lg text-blue-800 font-medium mb-2">
                  Arrastra y suelta tus imágenes aquí
                </p>
                <p className="text-gray-500">
                  o haz clic para seleccionar archivos
                </p>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              
              {uploadingImages && (
                <div className="mt-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-blue-600">Subiendo imágenes...</p>
                </div>
              )}
              
              {previewImages.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Imágenes subidas ({previewImages.length})</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {previewImages.map((preview, index) => (
                      <div key={index} className="relative group">
                        {index === 0 && (
                          <span className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-sm">
                            Principal
                          </span>
                        )}
                        <img
                          src={preview.src}
                          alt={preview.alt}
                          className="w-full h-40 object-cover rounded-lg shadow-md"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/400x300?text=Error+al+cargar+imagen";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
            
            <motion.div variants={fadeIn} className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-bold hover:bg-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Anterior
              </button>
              
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading || uploadingImages}
                className={`px-6 py-3 rounded-lg font-bold transform transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                  loading || uploadingImages
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                {loading ? 'Creando...' : 'Publicar propiedad'}
              </button>
            </motion.div>
          </motion.div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-6 px-8">
          <h1 className="text-3xl font-bold text-white">
            {isEditMode ? 'Editar Propiedad' : 'Añadir Nueva Propiedad'}
          </h1>
          <p className="text-blue-100 mt-2">
            {isEditMode 
              ? 'Actualiza los detalles de tu propiedad' 
              : 'Completa el formulario para publicar tu propiedad'}
          </p>
        </div>
        
        {/* Indicador de progreso */}
        <div className="px-8 pt-6">
          <div className="flex items-center justify-between mb-8 relative">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep === step
                      ? 'bg-blue-600 text-white'
                      : currentStep > step
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step ? '✓' : step}
                </div>
                <span className={`text-sm mt-2 ${currentStep >= step ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  {step === 1 ? 'Información' : step === 2 ? 'Características' : 'Imágenes'}
                </span>
              </div>
            ))}
            
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200 -z-10">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(currentStep - 1) * 50}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Contenido del formulario */}
        <form className="px-8 pb-8">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
          
          {renderStep()}
        </form>
      </motion.div>
    </div>
  );
}