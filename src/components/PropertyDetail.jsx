"use client";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { getPropertyById, updatePropertyPost, uploadFile } from "../services/api";
import { useUser } from "../context/UserContext";
import { FiMapPin, FiMaximize, FiDollarSign, FiHome, FiLayers, FiDroplet } from 'react-icons/fi';
import toast from 'react-hot-toast';

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
  
  const { user } = useUser();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await getPropertyById(id);
        console.log("Datos de la propiedad recibidos:", data);
        
        // Normalizar el formato de las imágenes
        let propertyImages = [];
        
        // Manejar imagen principal
        if (data.image && typeof data.image === 'object' && data.image.src) {
          propertyImages.push(data.image);
          console.log("Imagen principal añadida:", data.image);
        } else if (data.image && typeof data.image === 'string') {
          propertyImages.push({ src: data.image, alt: "Imagen principal" });
        }
        
        // Manejar imágenes adicionales
        if (data.images && Array.isArray(data.images)) {
          console.log("Imágenes adicionales encontradas:", data.images);
          const additionalImages = data.images.map(img => {
            if (typeof img === 'string') {
              return { src: img, alt: "Imagen de la propiedad" };
            } else if (typeof img === 'object' && img.src) {
              return img;
            }
            return null;
          }).filter(img => img !== null);
          
          console.log("Imágenes adicionales procesadas:", additionalImages);
          propertyImages = [...propertyImages, ...additionalImages];
        }
        
        const formattedData = {
          ...data,
          images: propertyImages
        };
        
        console.log("Propiedad formateada con todas las imágenes:", formattedData);
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
    setIsEditing(true);
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
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === property.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? property.images.length - 1 : prevIndex - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800">Propiedad no encontrada</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Carrusel de imágenes */}
        <div className="relative h-[400px] bg-gray-100">
          {property.images && property.images.length > 0 ? (
            <>
              <img
                src={property.images[currentImageIndex]?.src}
                alt={property.images[currentImageIndex]?.alt || `Imagen ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/800x400?text=Imagen+no+disponible";
                }}
              />
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/75"
                  >
                    ←
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/75"
                  >
                    →
                  </button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {property.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">No hay imágenes disponibles</span>
            </div>
          )}
        </div>

        {/* Miniaturas */}
        {property.images && property.images.length > 1 && (
          <div className="flex overflow-x-auto p-4 space-x-2">
            {property.images.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 ${
                  currentImageIndex === index ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <img
                  src={img.src}
                  alt={img.alt || `Miniatura ${index + 1}`}
                  className="h-20 w-20 object-cover rounded"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/80x80?text=Error";
                  }}
                />
              </button>
            ))}
          </div>
        )}

        <div className="p-6">
          {!isEditing ? (
            // Vista de detalles
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">{property.typeProperty}</h1>
              
              <div className="grid grid-cols-2 gap-4 text-gray-600">
                <div className="flex items-center">
                  <FiMapPin className="mr-2" />
                  <span>{property.address}</span>
                </div>
                <div className="flex items-center">
                  <FiMaximize className="mr-2" />
                  <span>{property.m2} m²</span>
                </div>
                <div className="flex items-center">
                  <FiDollarSign className="mr-2" />
                  <span>{property.price}</span>
                </div>
                <div className="flex items-center">
                  <FiLayers className="mr-2" />
                  <span>Planta {property.piso}</span>
                </div>
                <div className="flex items-center">
                  <FiHome className="mr-2" />
                  <span>{property.rooms} habitaciones</span>
                </div>
                <div className="flex items-center">
                  <FiDroplet className="mr-2" />
                  <span>{property.wc} baños</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Descripción</h2>
                <p className="text-gray-600">{property.description}</p>
              </div>

              {user && (user.role === 'admin' || user.role === 'ADMIN') && (
                <div className="flex justify-end">
                  <button
                    onClick={handleEdit}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Editar Propiedad
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Formulario de edición
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Propiedad
                </label>
                <input
                  type="text"
                  name="typeProperty"
                  value={editedProperty.typeProperty || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  value={editedProperty.address || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={editedProperty.price || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metros Cuadrados
                  </label>
                  <input
                    type="text"
                    name="m2"
                    value={editedProperty.m2 || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planta
                  </label>
                  <input
                    type="text"
                    name="piso"
                    value={editedProperty.piso || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habitaciones
                  </label>
                  <input
                    type="number"
                    name="rooms"
                    value={editedProperty.rooms || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Baños
                  </label>
                  <input
                    type="number"
                    name="wc"
                    value={editedProperty.wc || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={editedProperty.description || ''}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {editedProperty.images && editedProperty.images.map((img, index) => (
                    <div key={index} className="relative border p-2 rounded">
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      <input
                        type="text"
                        value={img.src}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="URL de la imagen"
                      />
                      <button
                        onClick={() => handleDeleteImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 space-y-2">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600 inline-block"
                  >
                    {uploading ? "Subiendo..." : "Subir nueva imagen"}
                  </label>
                  {uploadError && (
                    <p className="text-red-500 text-sm">{uploadError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="ml-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Añadir URL de imagen
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={openModifiedModal}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}
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
