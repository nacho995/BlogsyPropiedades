"use client";
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { getPropertyById, updatePropertyPost, uploadFile } from "../services/api";
import { useUser } from "../context/UserContext";
import { FiMapPin, FiMaximize, FiDollarSign, FiHome, FiLayers, FiDroplet } from 'react-icons/fi';
import { toast } from 'sonner';
import { formatPrice } from '../utils';

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProperty, setEditedProperty] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await getPropertyById(id);
        console.log("Datos de la propiedad recibidos:", data);
        
        // Normalizar el formato de las imágenes
        let propertyImages = [];
        
        // Primero verificar si ya viene con imágenes en el formato correcto
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          console.log("Procesando imágenes del array principal:", data.images.length, "imágenes");
          
          propertyImages = data.images.map((img, index) => {
            // Si ya es un objeto con src
            if (typeof img === 'object' && img.src) {
              return {
                src: img.src,
                alt: img.alt || `Imagen ${index + 1} de ${data.title || 'la propiedad'}`
              };
            }
            // Si es solo una URL string
            else if (typeof img === 'string') {
              return {
                src: img,
                alt: `Imagen ${index + 1} de ${data.title || 'la propiedad'}`
              };
            }
            return null;
          }).filter(img => img !== null && img.src);
        }
        
        // Si no hay imágenes aún, intentar con imagen principal
        if (propertyImages.length === 0 && data.image) {
          console.log("No hay imágenes en array, intentando con imagen principal");
          if (typeof data.image === 'object' && data.image.src) {
            propertyImages.push({
              src: data.image.src,
              alt: data.image.alt || `Imagen principal de ${data.title || 'la propiedad'}`
            });
          } else if (typeof data.image === 'string') {
            propertyImages.push({
              src: data.image,
              alt: `Imagen principal de ${data.title || 'la propiedad'}`
            });
          }
        }
        
        const formattedData = {
          ...data,
          images: propertyImages,
          // Asegurar que los campos numéricos se muestren correctamente
          price: data.price || 0,
          bedrooms: data.bedrooms || data.rooms || 0,
          bathrooms: data.bathrooms || data.wc || 0,
          area: data.area || data.m2 || 0,
          m2: data.m2 || data.area || 0,
          // Asegurar que la ubicación esté disponible
          address: data.address || data.location || 'Ubicación no especificada',
          location: data.location || data.address || 'Ubicación no especificada'
        };
        
        console.log("Propiedad formateada:", {
          title: formattedData.title,
          imagesCount: formattedData.images.length,
          featuresCount: formattedData.features?.length || 0,
          price: formattedData.price,
          description: formattedData.description ? 'Presente' : 'Faltante'
        });
        
        setProperty(formattedData);
        setEditedProperty(formattedData);
      } catch (error) {
        console.error("Error al obtener la propiedad:", error);
        toast.error("Error al cargar la propiedad");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const handleEdit = () => {
    // Redirigir a la página de añadir propiedades con el ID como parámetro para edición
    navigate(`/add-property?edit=${id}`);
  };

  const openModifiedModal = () => {
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      console.log("Preparando datos para guardar...");
      console.log("Estado actual de la propiedad editada:", editedProperty);
      
      // Asegurarse de que tenemos un array de imágenes
      const allImages = editedProperty.images || [];
      console.log("Todas las imágenes disponibles:", allImages);
      
      // Separar la imagen principal y las imágenes adicionales
      const mainImage = allImages[0] || null;
      const additionalImages = allImages.slice(1) || [];
      
      console.log("Imagen principal:", mainImage);
      console.log("Imágenes adicionales:", additionalImages);
      
      // Preparar los datos según la estructura esperada por el backend
      const dataToSend = {
        ...editedProperty,
        image: mainImage,
        images: additionalImages.map(img => img.src)
      };
      
      // Eliminar campos que no deben enviarse
      delete dataToSend._id;
      delete dataToSend.__v;
      delete dataToSend.createdAt;
      delete dataToSend.updatedAt;
      
      console.log("Datos preparados para enviar:", dataToSend);
      
      const result = await updatePropertyPost(id, dataToSend);
      console.log("Respuesta del servidor:", result);
      
      if (result) {
        toast.success('Propiedad actualizada correctamente');
        
        // Reconstruir el estado con todas las imágenes
        const updatedProperty = {
          ...result,
          images: [
            result.image, // Imagen principal
            ...(result.images || []).map(imgUrl => ({ // Imágenes adicionales
              src: imgUrl,
              alt: "Imagen de la propiedad"
            }))
          ].filter(img => img && img.src) // Filtrar imágenes válidas
        };
        
        console.log("Propiedad actualizada con todas las imágenes:", updatedProperty);
        setProperty(updatedProperty);
        setEditedProperty(updatedProperty);
        setIsEditing(false);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      toast.error('Error al guardar los cambios');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProperty(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (index, newValue) => {
    const newImages = [...editedProperty.images];
    newImages[index] = {
      ...newImages[index],
      src: newValue
    };
    setEditedProperty(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleDeleteImage = (index) => {
    setEditedProperty(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddImage = () => {
    setEditedProperty(prev => ({
      ...prev,
      images: [...prev.images, { src: "", alt: "Nueva imagen" }]
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      console.log("Subiendo archivo...");
      const result = await uploadFile(file);
      console.log("Resultado de la subida:", result);

      if (result && result.secure_url) {
        const newImage = {
          src: result.secure_url,
          alt: file.name || "Imagen de la propiedad"
        };

        setEditedProperty(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));

        toast.success('Imagen subida correctamente');
      } else {
        throw new Error("No se pudo obtener la URL de la imagen");
      }
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      setUploadError("Error al subir la imagen");
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  // Funciones para el carrusel de imágenes
  const nextImage = () => {
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === property.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? property.images.length - 1 : prevIndex - 1
      );
    }
  };

  // Función para manejar los mensajes
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      try {
        toast('Por favor, escribe un mensaje', {
          icon: '⚠️',
          duration: 4000
        });
      } catch (e) {
        console.error('Error al mostrar notificación:', e);
        alert('Por favor, escribe un mensaje');
      }
      return;
    }

    if (!user) {
      try {
        toast('Debes iniciar sesión para enviar mensajes', {
          icon: '❌',
          duration: 4000
        });
      } catch (e) {
        console.error('Error al mostrar notificación:', e);
        alert('Debes iniciar sesión para enviar mensajes');
      }
      return;
    }

    setMessageLoading(true);
    try {
      const updatedProperty = await updatePropertyPost(id, {
        ...property,
        messages: [...(property.messages || []), {
          text: message,
          author: user.name || 'Usuario anónimo',
          date: new Date().toISOString()
        }]
      });

      setProperty(updatedProperty);
      setMessage('');
      try {
        toast('Mensaje enviado correctamente', {
          icon: '✅',
          duration: 4000
        });
      } catch (e) {
        console.error('Error al mostrar notificación:', e);
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      try {
        toast('Error al enviar mensaje', {
          icon: '❌',
          duration: 4000
        });
      } catch (e) {
        console.error('Error al mostrar notificación:', e);
        alert('Error al enviar mensaje');
      }
    } finally {
      setMessageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-blue-900 to-black/60 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-blue-900 to-black/60 flex flex-col justify-center items-center text-white px-4">
        <h2 className="text-2xl font-bold mb-4">Propiedad no encontrada</h2>
        <p className="mb-6">La propiedad que buscas no existe o ha sido eliminada.</p>
        <Link to="/propiedades" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Volver a propiedades
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-900 to-black/60 py-6 sm:py-10 px-4 sm:px-6">
      <div className="container mx-auto">
        {/* Navegación de regreso */}
        <div className="mb-6">
          <Link to="/propiedades" className="text-white hover:text-yellow-300 transition flex items-center text-sm sm:text-base">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a propiedades
          </Link>
        </div>
        
        {/* Contenido principal */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Carrusel de imágenes */}
          <div className="relative">
            <div className="h-48 sm:h-64 md:h-96 bg-gray-200 relative">
              {property.images && property.images.length > 0 ? (
                <>
                  <img 
                    src={property.images[currentImageIndex]?.src || ''} 
                    alt={property.images[currentImageIndex]?.alt || "Imagen de la propiedad"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/800x600?text=Imagen+no+disponible"
                    }}
                  />
                  
                  {/* Controles del carrusel para pantallas grandes */}
                  {property.images.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                        aria-label="Imagen anterior"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                        aria-label="Imagen siguiente"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      {/* Indicadores de imágenes */}
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                        {property.images.map((_, idx) => (
                          <button 
                            key={idx}
                            className={`w-2 h-2 rounded-full ${currentImageIndex === idx ? 'bg-white' : 'bg-white/50'}`}
                            onClick={() => setCurrentImageIndex(idx)}
                            aria-label={`Ver imagen ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400">Sin imágenes disponibles</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                  {property.title || property.typeProperty}
                </h1>
                <p className="text-gray-500 text-sm sm:text-base mb-1">
                  <FiMapPin className="inline-block mr-1" />
                  {property.address}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-col md:items-end">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
                  {formatPrice(property.price)}
                </div>
                <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                  {property.status || 'En venta'}
                </span>
              </div>
            </div>
            
            {/* Características principales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-b border-gray-200 py-4 mb-6">
              <div className="flex flex-col items-center">
                <FiHome className="text-blue-600 h-6 w-6 mb-1" />
                <span className="text-xs sm:text-sm text-gray-600">Tipo</span>
                <span className="font-semibold text-sm sm:text-base">{property.typeProperty}</span>
              </div>
              <div className="flex flex-col items-center">
                <FiMaximize className="text-blue-600 h-6 w-6 mb-1" />
                <span className="text-xs sm:text-sm text-gray-600">Superficie</span>
                <span className="font-semibold text-sm sm:text-base">{property.m2} m²</span>
              </div>
              {property.bedrooms && (
                <div className="flex flex-col items-center">
                  <svg className="text-blue-600 h-6 w-6 mb-1" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M21 9h-8V3H3v18h18V9zM5 19V5h6v14H5zm14 0h-6v-8h6v8z"></path>
                  </svg>
                  <span className="text-xs sm:text-sm text-gray-600">Habitaciones</span>
                  <span className="font-semibold text-sm sm:text-base">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex flex-col items-center">
                  <svg className="text-blue-600 h-6 w-6 mb-1" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M21 10H7V7c0-1.103.897-2 2-2s2 .897 2 2h2c0-2.206-1.794-4-4-4S5 4.794 5 7v3H3a1 1 0 0 0-1 1v2c0 2.606 1.674 4.823 4 5.65V22h2v-3h8v3h2v-3.35c2.326-.827 4-3.044 4-5.65v-2a1 1 0 0 0-1-1zm-1 3c0 2.206-1.794 4-4 4H8c-2.206 0-4-1.794-4-4v-1h16v1z"></path>
                  </svg>
                  <span className="text-xs sm:text-sm text-gray-600">Baños</span>
                  <span className="font-semibold text-sm sm:text-base">{property.bathrooms}</span>
                </div>
              )}
            </div>
            
            {/* Descripción */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Descripción</h2>
              <div 
                className="property-description mt-4 text-gray-600 leading-relaxed text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: property.description }}
              ></div>
            </div>
            
            {/* Características/Features */}
            {property.features && property.features.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Características</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {property.features.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <svg 
                        className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Información adicional */}
            {(property.location || property.propertyType) && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Información adicional</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {property.location && (
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <FiMapPin className="h-5 w-5 text-blue-500 mr-2" />
                      <div>
                        <span className="text-xs text-gray-500 block">Ubicación</span>
                        <span className="font-medium text-gray-700">{property.location}</span>
                      </div>
                    </div>
                  )}
                  {property.propertyType && (
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <FiHome className="h-5 w-5 text-green-500 mr-2" />
                      <div>
                        <span className="text-xs text-gray-500 block">Tipo de operación</span>
                        <span className="font-medium text-gray-700">{property.propertyType}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Acciones */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar Propiedad
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          
          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-semibold">
              Confirmar cambios
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-gray-600">
              ¿Estás seguro de que quieres guardar los cambios?
            </Dialog.Description>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
