import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPropertyPost, uploadImageProperty } from '../services/api';
import { useUser } from '../context/UserContext';
import { motion } from 'framer-motion';
import { FiUpload, FiHome, FiDollarSign, FiMapPin, FiUser, FiDroplet, FiSquare, FiTag, FiList, FiX, FiPlus } from 'react-icons/fi';
import { BiBed, BiBath } from 'react-icons/bi';
import { toast } from 'react-hot-toast';

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
`;

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
  // Inyectar el CSS de la animación en el head (sólo en navegador)
  if (typeof window !== "undefined") {
    const style = document.createElement("style");
    style.innerHTML = globalStyles;
    document.head.appendChild(style);
  }

  const navigate = useNavigate();
  const { user } = useUser();
  const fileInputRef = useRef(null);
  
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
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
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
        
        console.log('Enviando datos de la propiedad:', propertyData);
        
        const response = await createPropertyPost(propertyData);
        console.log('Respuesta del servidor:', response);
        
        toast.success('¡Propiedad creada exitosamente!');
        navigate('/propiedades');
    } catch (err) {
        console.error('Error detallado al crear la propiedad:', err);
        setError(`Error al crear la propiedad: ${err.message}`);
        toast.error(`Error al crear la propiedad: ${err.message}`);
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
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                rows="4"
                placeholder="Describe la propiedad con detalle..."
                required
              ></textarea>
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
            
            <motion.div variants={fadeIn} className="grid grid-cols-3 gap-4">
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
                Características
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
          <h1 className="text-3xl font-bold text-white">Añadir Nueva Propiedad</h1>
          <p className="text-blue-100 mt-2">Completa el formulario para publicar tu propiedad</p>
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