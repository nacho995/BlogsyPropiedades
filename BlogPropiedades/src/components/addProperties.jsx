import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPropertyPost, uploadImageProperty, getPropertyById, updatePropertyPost, getCloudinarySignature } from '../services/api';
import { useUser } from '../context/UserContext';
import { motion } from 'framer-motion';
import { FiUpload, FiHome, FiDollarSign, FiMapPin, FiUser, FiDroplet, FiSquare, FiTag, FiList, FiX, FiPlus, FiEdit, FiVideo, FiCamera } from 'react-icons/fi';
import { BiBed, BiBath } from 'react-icons/bi';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { parsePrice, formatPricePreview } from '../utils';

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

/* Estilos adicionales para drag & drop */
.dragging-over {
  background-color: #e0f2fe; /* Light blue background when dragging over */
}
.image-preview-item {
  transition: background-color 0.2s ease;
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
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const video360InputRef = useRef(null);
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
    featured: false,
    videos: [],
    videos360: []
  });
  
  const [uploadedImages, setUploadedImages] = useState([]);
  const [previewVideos, setPreviewVideos] = useState([]);
  const [previewVideos360, setPreviewVideos360] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [uploadingVideos360, setUploadingVideos360] = useState(false);
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
      
      // Procesar videos (si existen en la API)
      const propertyVideos = Array.isArray(propertyData.videos) ? propertyData.videos : [];
      const propertyVideos360 = Array.isArray(propertyData.videos360) ? propertyData.videos360 : [];
      
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
        featured: propertyData.featured || false,
        videos: propertyVideos,
        videos360: propertyVideos360
      });
      
      // Actualizar previewImages
      setUploadedImages(propertyImages);
      setPreviewVideos(propertyVideos.map(v => ({ name: v.name || v.url || 'Video', url: v.url })));
      setPreviewVideos360(propertyVideos360.map(v => ({ name: v.name || v.url || 'Video 360', url: v.url })));
      
      toast.success('Datos de la propiedad cargados correctamente');
    } catch (error) {
      console.error('Error al cargar los datos de la propiedad:', error);
      toast.error('Error al cargar los datos de la propiedad');
    }
  };
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Manejar el precio de forma especial para permitir separadores de miles
    if (name === 'price') {
      const processedValue = parsePrice(value);
      setFormData({
        ...formData,
        [name]: processedValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Función para formatear el precio visualmente
  const formatPriceDisplay = (price) => {
    return formatPricePreview(price);
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
    setFormData(prevData => ({
      ...prevData,
      features: prevData.features.filter((_, i) => i !== index)
    }));
  };
  
  // Eliminar una imagen específica
  const removeImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prevData => ({
      ...prevData,
      images: prevData.images.filter((_, i) => i !== index)
    }));
  };
  
  // Crear la función para manejar la subida de videos
  const handleVideoUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (type === 'standard') {
      setUploadingVideos(true);
      setPreviewVideos(prev => [...prev, ...files.map(f => ({ name: f.name, loading: true }))]);
    } else {
      setUploadingVideos360(true);
      setPreviewVideos360(prev => [...prev, ...files.map(f => ({ name: f.name, loading: true }))]);
    }

    // Aquí iría la lógica para subir los videos a Cloudinary o similar
    // Por ahora, simularemos la subida y actualizaremos la preview
    console.log(`Simulando subida de ${files.length} video(s) de tipo ${type}`);
    
    // Placeholder: Simular subida y obtener URLs (esto debe reemplazarse con la subida real)
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simular espera
    
    const uploadedVideoUrls = files.map(file => ({ 
        src: URL.createObjectURL(file), // URL temporal local para preview
        alt: file.name, 
        type: type // 'standard' o '360'
    }));

    // Actualizar formData y previews
    setFormData(prevData => ({
      ...prevData,
      videos: [...(prevData.videos || []), ...uploadedVideoUrls]
    }));

    if (type === 'standard') {
      setPreviewVideos(prev => prev.map(p => p.loading ? { ...p, loading: false } : p));
      setUploadingVideos(false);
    } else {
      setPreviewVideos360(prev => prev.map(p => p.loading ? { ...p, loading: false } : p));
      setUploadingVideos360(false);
    }

    toast.success(`${files.length} video(s) ${type === 'standard' ? 'estándar' : '360'} cargado(s) para previsualización.`);
    // Limpiar el input para permitir subir el mismo archivo de nuevo si se elimina
    if (type === 'standard' && videoInputRef.current) videoInputRef.current.value = null;
    if (type === '360' && video360InputRef.current) video360InputRef.current.value = null;
  };

  // Añadir función para eliminar videos
  const removeVideo = (index, type) => {
    if (type === 'standard') {
      setPreviewVideos(prev => prev.filter((_, i) => i !== index));
      setFormData(prevData => ({
        ...prevData,
        videos: (prevData.videos || []).filter(v => v.type !== 'standard' || v !== (prevData.videos || []).filter(vid => vid.type === 'standard')[index])
      }));
    } else {
      setPreviewVideos360(prev => prev.filter((_, i) => i !== index));
      setFormData(prevData => ({
        ...prevData,
        videos: (prevData.videos || []).filter(v => v.type !== '360' || v !== (prevData.videos || []).filter(vid => vid.type === '360')[index])
      }));
    }
  };
  
  // Modificado para procesar imágenes secuencialmente
  const handleImageUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) {
        toast.info("No se seleccionaron archivos."); // Informar si no hay archivos
        return;
    }

    setUploadingImages(true);
    setError(null); // Limpiar errores previos al iniciar nueva subida

    const files = Array.from(e.target.files);
    const maxFileSize = 5 * 1024 * 1024; // 5MB (ajustar si es necesario)

    try {
        const uploadedUrls = []; // Array para guardar las URLs subidas exitosamente

        // *** Mover la obtención de la configuración FUERA del bucle ***
        console.log("Obteniendo configuración de Cloudinary UNA VEZ para todo el lote...");
        let signatureData = null;
        try {
            signatureData = await getCloudinarySignature();
            if (!signatureData || !signatureData.success) {
                 // Usar el mensaje de error de la API si está disponible
                const errorMessage = signatureData?.message || "No se pudo obtener la configuración necesaria para la subida.";
                throw new Error(errorMessage);
            }
            console.log("Configuración obtenida con éxito para el lote.");
        } catch (signatureError) {
            console.error("Error crítico al obtener la configuración de Cloudinary:", signatureError);
            toast.error(`Error al obtener configuración para subir: ${signatureError.message}. No se subirán imágenes.`);
            // Detener el proceso si no podemos obtener la configuración
            throw new Error("Falla al obtener configuración, subida cancelada."); 
        }
        // *** Fin de la obtención de la configuración única ***

        // Ahora iterar y subir cada archivo usando la configuración obtenida
        for (const file of files) {
            // Validar archivo individualmente dentro del bucle
            if (file.size > maxFileSize) {
                toast.warning(`El archivo ${file.name} excede el tamaño máximo de 5MB y será omitido.`);
                continue; // Saltar este archivo y continuar con el siguiente
            }
            if (!file.type.startsWith('image/')) {
                toast.warning(`El archivo ${file.name} no es una imagen válida y será omitido.`);
                continue; // Saltar este archivo
            }

            // Procesar un archivo a la vez
            try {
                // 2. Preparar FormData para Cloudinary (usando unsigned upload)
                let uploadSuccessful = false;
                let result = null;
                const presetsToTry = [signatureData.uploadPreset, ...(signatureData.fallbackPresets || [])];
                
                for (const preset of presetsToTry) {
                    try {
                        const formDataCloudinary = new FormData();
                        formDataCloudinary.append('file', file);
                        if (preset) {
                            formDataCloudinary.append('upload_preset', preset);
                            console.log(`Subiendo a Cloudinary (unsigned) con preset "${preset}": ${file.name}`);
                        } else {
                            // Sin preset - upload directo 
                            console.log(`Subiendo a Cloudinary (unsigned) SIN PRESET: ${file.name}`);
                        }
                        formDataCloudinary.append('folder', signatureData.folder);

                        // 3. Subir a Cloudinary usando unsigned upload
                        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;

                        const response = await fetch(cloudinaryUrl, {
                            method: 'POST',
                            body: formDataCloudinary,
                        });

                        result = await response.json();

                        if (response.ok && !result.error) {
                            uploadSuccessful = true;
                            console.log(`Upload exitoso ${preset ? `con preset "${preset}"` : 'sin preset'}`);
                            break;
                        } else {
                            console.warn(`${preset ? `Preset "${preset}"` : 'Upload sin preset'} falló:`, result.error?.message || 'Error desconocido');
                        }
                    } catch (presetError) {
                        console.warn(`Error ${preset ? `con preset "${preset}"` : 'sin preset'}:`, presetError.message);
                        continue;
                    }
                }

                if (!uploadSuccessful || !result) {
                    console.warn(`⚠️ Todos los presets de Cloudinary fallaron para ${file.name}`);
                    
                    // Intentar fallback con el backend
                    try {
                        console.log(`🔄 Intentando fallback del backend para ${file.name}`);
                        const { uploadImageFallback } = await import('../services/api');
                        const fallbackResult = await uploadImageFallback(file, 'property');
                        
                        if (fallbackResult && fallbackResult.src) {
                            uploadedUrls.push(fallbackResult);
                            console.log(`✅ ${file.name} subido usando backend`);
                            continue;
                        }
                    } catch (fallbackError) {
                        console.error(`Error en fallback del backend para ${file.name}:`, fallbackError);
                    }
                    
                    throw new Error(`Error al subir ${file.name} - todos los métodos fallaron`);
                }

                console.log(`Cloudinary upload success for ${file.name}:`, { url: result.secure_url, public_id: result.public_id });

                // Guardar el resultado válido
                 uploadedUrls.push({
                    src: result.secure_url, // Usar secure_url que es HTTPS
                    alt: file.name || 'Imagen de propiedad',
                    publicId: result.public_id // Guardamos el publicId para tener una key estable
                 });
                 toast.success(`${file.name} subido correctamente.`); // Feedback positivo por cada imagen

            } catch (uploadError) {
                console.error(`Error procesando imagen ${file.name}:`, uploadError);
                toast.error(`Error al subir ${file.name}: ${uploadError.message}`);
                // Continuar con las siguientes imágenes aunque una falle
                continue;
            }
        } // Fin del bucle for...of

        // Si después del bucle, hemos subido alguna imagen nueva
        const initialFileCount = files.length;
        const validFileCount = files.filter(f => f.size <= maxFileSize && f.type.startsWith('image/')).length;
        if (initialFileCount > 0 && validFileCount === 0) {
            toast.error("Ninguno de los archivos seleccionados era válido para subir.");
        } else if (initialFileCount > 0 && uploadedUrls.length === 0) {
            toast.warning("No se pudo subir ninguna de las imágenes seleccionadas debido a errores.");
        }
        console.warn("No se añadieron imágenes nuevas en este lote.");
        
        // Introducir un pequeño delay antes de actualizar el estado
        // Esto puede ayudar a evitar conflictos con react-beautiful-dnd
        setTimeout(() => {
            if (uploadedUrls.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, ...uploadedUrls] // Añadimos las nuevas imágenes a formData
                }));
            }
        }, 0); // Un delay de 0ms es suficiente para aplazar la ejecución al siguiente ciclo de eventos

    } catch (error) { // Error general (ej. error al leer e.target.files)
        console.error('Error general en el proceso de subida de imágenes:', error);
        setError(`Error general al procesar imágenes: ${error.message}`);
        toast.error(error.message || 'Ocurrió un error inesperado al procesar las imágenes.');
    } finally {
        setUploadingImages(false);
        if (imageInputRef.current) {
            imageInputRef.current.value = ''; // Limpiar el input para permitir seleccionar mismos archivos
        }
    }
  };
  
  // Nueva función para manejar el drop
  const handleDrop = (e, inputType) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      if (inputType === 'image') {
        handleImageUpload({ target: { files: files } });
      } else if (inputType === 'video') {
        handleVideoUpload({ target: { files: files } }, 'standard');
      } else if (inputType === 'video360') {
         handleVideoUpload({ target: { files: files } }, '360');
      }
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
  
  // --- REINSERTAR FUNCION PARA REORDENAR IMAGENES ---
  const onDragEnd = (result) => {
    const { source, destination } = result;

    // Si no hay destino o es el mismo sitio, no hacer nada
    if (!destination || 
        (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Reordenar el array de formData.images
    const items = Array.from(formData.images);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);

    // Actualizar el estado de forma asíncrona
    setTimeout(() => {
      setFormData(prev => ({
          ...prev,
          images: items
      }));
    }, 0); // Delay de 0ms para pasar al siguiente ciclo de eventos
  };
  // --- FIN FUNCION REORDENAR ---
  
  // Modificado para incluir videos y orden de imágenes
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
              <div className="relative">
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition pr-4"
                  placeholder="Ej: 2000000 o 2.000.000"
                  required
                />
                {formData.price && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                    <span className="font-medium">Vista previa: </span>
                    <span className="text-blue-600 font-semibold">
                      {formatPriceDisplay(formData.price)} €
                    </span>
                  </div>
                )}
              </div>
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
        
      case 3: // Paso de Medios (Imágenes y Videos)
        return (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8" // Aumentar espacio
          >
             {/* --- Sección Imágenes --- */}
            <motion.div variants={fadeIn}>
              <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                <FiCamera className="mr-2"/>Imágenes (Arrastra para reordenar)
              </h3>
              <div
                className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition mb-4"
                onClick={() => imageInputRef.current.click()}
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={(e) => handleDrop(e, 'image')}
              >
                <FiUpload className="mx-auto text-blue-500 mb-3" size={40} />
                <p className="text-md text-blue-800 font-medium">Arrastra imágenes o haz clic</p>
                <input type="file" multiple ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>

              {uploadingImages && (
                <div className="text-center text-blue-600">Subiendo imágenes...</div>
              )}

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="imageList">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4 p-2 rounded-lg ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                    >
                      {formData.images.map((preview, index) => (
                        <Draggable key={preview.publicId || preview.src + index} draggableId={preview.publicId || preview.src + index} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`relative group rounded-lg overflow-hidden shadow border ${snapshot.isDragging ? 'shadow-lg scale-105' : ''} image-preview-item`}
                              style={{...provided.draggableProps.style}}
                            >
                              {index === 0 && (
                                <span className="absolute top-1 left-1 bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs z-10">
                                  Principal
                                </span>
                              )}
                              <img
                                src={preview.src}
                                alt={preview.alt || `Imagen ${index + 1}`}
                                className="w-full h-32 object-cover"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=Error"; }}
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-700"
                                title="Eliminar imagen"
                              >
                                <FiX size={14} />
                              </button>
                              {snapshot.isDragging && (
                                <div className="absolute inset-0 bg-blue-100 opacity-50"></div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              
              {formData.images.length === 0 && !uploadingImages && (
                <p className="text-center text-gray-500 mt-4">No hay imágenes añadidas.</p>
              )}
            </motion.div>

            {/* --- Sección Videos Estándar --- */}
            <motion.div variants={fadeIn}>
              <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                <FiVideo className="mr-2"/>Videos Estándar
              </h3>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-500 transition mb-4"
                onClick={() => videoInputRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'video')}
              >
                <FiUpload className="mx-auto text-gray-500 mb-3" size={40} />
                <p className="text-md text-gray-800 font-medium">Arrastra videos estándar o haz clic</p>
                <input type="file" multiple ref={videoInputRef} onChange={(e) => handleVideoUpload(e, 'standard')} className="hidden" accept="video/*" />
              </div>
              {uploadingVideos && (
                <div className="text-center text-blue-600">Subiendo videos...</div>
              )}
              {previewVideos.length > 0 && (
                <div className="mt-4 space-y-2">
                   <h4 className="text-md font-semibold mb-2">Videos subidos:</h4>
                   {previewVideos.map((video, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                      <span className="text-sm text-gray-700 truncate">{video.name}</span>
                      <button type="button" onClick={() => removeVideo(index, 'standard')} className="text-red-500 hover:text-red-700 ml-2">
                        <FiX size={16}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* --- Sección Videos 360 --- */}
            <motion.div variants={fadeIn}>
              <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                <FiVideo className="mr-2"/>Videos 360º (Para Tour Virtual)
              </h3>
               <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-500 transition mb-4"
                onClick={() => video360InputRef.current.click()}
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={(e) => handleDrop(e, 'video360')}
              >
                <FiUpload className="mx-auto text-gray-500 mb-3" size={40} />
                <p className="text-md text-gray-800 font-medium">Arrastra videos 360º o haz clic</p>
                <input type="file" multiple ref={video360InputRef} onChange={(e) => handleVideoUpload(e, '360')} className="hidden" accept="video/*" />
              </div>
               {uploadingVideos360 && (
                <div className="text-center text-blue-600">Subiendo videos 360...</div>
              )}
               {previewVideos360.length > 0 && (
                 <div className="mt-4 space-y-2">
                  <h4 className="text-md font-semibold mb-2">Videos 360 subidos:</h4>
                  {previewVideos360.map((video, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                      <span className="text-sm text-gray-700 truncate">{video.name}</span>
                      <button type="button" onClick={() => removeVideo(index, '360')} className="text-red-500 hover:text-red-700 ml-2">
                         <FiX size={16}/>
                      </button>
                    </div>
                  ))}
                 </div>
               )}
            </motion.div>

            {/* Botones de Navegación/Envío */}
            <motion.div variants={fadeIn} className="flex justify-between pt-4">
              <button
                type="button"
                onClick={prevStep} // Usa la función prevStep definida fuera del switch
                className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-bold hover:bg-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Anterior
              </button>

              <button
                type="submit" // Cambiado a submit para que funcione el form
                disabled={loading || uploadingImages || uploadingVideos || uploadingVideos360}
                className={`px-6 py-3 rounded-lg font-bold transform transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                  loading || uploadingImages || uploadingVideos || uploadingVideos360
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                {loading ? (isEditMode ? 'Actualizando...' : 'Publicando...') : (isEditMode ? 'Actualizar Propiedad' : 'Publicar Propiedad')}
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
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
      >
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
        
        <div className="px-8 pt-6">
          <div className="flex items-center justify-between mb-8 relative">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep === step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step ? '✓' : step}
                </div>
                <span className={`text-sm mt-2 ${currentStep >= step ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  {step === 1 ? 'Información' : step === 2 ? 'Características' : 'Medios'}
                </span>
              </div>
            ))}
            
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200 -z-10">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="px-8 pb-8">
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