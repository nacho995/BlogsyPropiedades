"use client";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { getPropertyById, updatePropertyPost, uploadFile } from "../services/api";
import { useUser } from "../context/UserContext";

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProperty, setEditedProperty] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // Obtener el usuario actual para el token
  const { user } = useUser();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await getPropertyById(id);
        
        // Asegurarse de que las imágenes tengan el formato correcto
        let formattedImages = [];
        if (data.images && Array.isArray(data.images)) {
          formattedImages = data.images.map(img => {
            if (typeof img === 'string') {
              return { src: img, alt: "Imagen de propiedad" };
            }s
            return img;
          });
        }
        
        const formattedData = {
          ...data,
          images: formattedImages
        };
        
        setProperty(formattedData);
        setEditedProperty(formattedData);
      } catch (error) {
        console.error("Error al obtener la propiedad:", error);
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
      console.log("Datos que se enviarán a la API:", editedProperty);
      
      // Preparar los datos para enviar
      const dataToSend = {
        ...editedProperty,
        // Convertir el array de objetos de imágenes a un array de URLs si es necesario
        images: editedProperty.images.map(img => img.src)
      };
      
      // Eliminar campos que puedan causar problemas
      delete dataToSend._id;
      delete dataToSend.__v;
      delete dataToSend.createdAt;
      delete dataToSend.updatedAt;
      
      const result = await updatePropertyPost(id, dataToSend);
      console.log("Respuesta del servidor:", result);
      
      setProperty(editedProperty);
      setIsEditing(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Error al guardar cambios:", error);
    }
  };

  // Manejo de campos de texto (para los campos "normales")
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProperty({ ...editedProperty, [name]: value });
  };

  // Manejo del array de imágenes
  const handleImageChange = (index, newValue) => {
    const newImages = editedProperty.images ? [...editedProperty.images] : [];
    newImages[index].src = newValue;
    setEditedProperty({ ...editedProperty, images: newImages });
  };

  const handleDeleteImage = (index) => {
    const newImages = editedProperty.images ? [...editedProperty.images] : [];
    newImages.splice(index, 1);
    setEditedProperty({ ...editedProperty, images: newImages });
  };

  const handleAddImage = () => {
    const newImages = editedProperty.images ? [...editedProperty.images] : [];
    newImages.push({ src: "", alt: "Imagen de propiedad" });
    setEditedProperty({ ...editedProperty, images: newImages });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    
    try {
      console.log("Subiendo imagen para propiedad...");
      
      // Crear un objeto FormData
      const formData = new FormData();
      formData.append('images', file);
      
      // Añadir el token de autenticación
      const headers = {};
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      
      // Usar la ruta de actualización de propiedades
      console.log("Subiendo archivo a:", `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/property/${id}`);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/property/${id}`, {
        method: 'PUT',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Respuesta de error del servidor:", errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Respuesta exitosa del servidor:", data);
      
      // Actualizar la propiedad con los datos devueltos por el servidor
      if (data.images && Array.isArray(data.images)) {
        // Formatear las imágenes
        const formattedImages = data.images.map(img => {
          if (typeof img === 'string') {
            return { src: img, alt: "Imagen de propiedad" };
          }
          return img;
        });
        
        // Actualizar el estado
        setEditedProperty({
          ...editedProperty,
          images: formattedImages
        });
      } else {
        // Si el servidor no devuelve las imágenes, añadir la URL manualmente
        // (esto es un fallback, idealmente el servidor debería devolver las imágenes)
        const imageUrl = file.name; // Esto es solo un placeholder
        const newImages = editedProperty.images ? [...editedProperty.images] : [];
        newImages.push({
          src: imageUrl,
          alt: file.name || "Imagen de propiedad"
        });
        
        setEditedProperty({
          ...editedProperty,
          images: newImages
        });
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      setUploadError("Error al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  if (!property) {
    return <p className="text-center text-gray-500">Cargando...</p>;
  }

  return (
    <div className="bg-gradient-to-br from-blue-900 to-black bg-fixed p-6">
      <div className="max-w-2xl mx-auto p-6 bg-gradient-to-bl from-white to-blue-900 rounded-lg shadow-md">
        {/* Tipo de Propiedad */}
        <h1 className="text-3xl font-bold mb-4">
          {isEditing ? (
            <input
              type="text"
              name="typeProperty"
              value={editedProperty.typeProperty || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          ) : (
            property.typeProperty
          )}
        </h1>

        {/* Descripción */}
        <div className="mb-4">
          <label className="block font-semibold">Descripción:</label>
          <textarea
            name="description"
            value={editedProperty.description || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            readOnly={!isEditing}
          />
        </div>

        {/* Dirección */}
        <div className="mb-4">
          <label className="block font-semibold">Dirección:</label>
          <input
            type="text"
            name="address"
            value={editedProperty.address || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            readOnly={!isEditing}
          />
        </div>

        {/* Precio */}
        <div className="mb-4">
          <label className="block font-semibold">Precio:</label>
          <input
            type="text"
            name="price"
            value={editedProperty.price || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            readOnly={!isEditing}
          />
        </div>

        {/* Metros Cuadrados */}
        <div className="mb-4">
          <label className="block font-semibold">Metros Cuadrados:</label>
          <input
            type="text"
            name="m2"
            value={editedProperty.m2 || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            readOnly={!isEditing}
          />
        </div>

        {/* Planta */}
        <div className="mb-4">
          <label className="block font-semibold">Planta:</label>
          <input
            type="text"
            name="piso"
            value={editedProperty.piso || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            readOnly={!isEditing}
          />
        </div>

        {/* Habitaciones */}
        <div className="mb-4">
          <label className="block font-semibold">Habitaciones:</label>
          <input
            type="text"
            name="rooms"
            value={editedProperty.rooms || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            readOnly={!isEditing}
          />
        </div>

        {/* Baños */}
        <div className="mb-4">
          <label className="block font-semibold">Baños:</label>
          <input
            type="text"
            name="wc"
            value={editedProperty.wc || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            readOnly={!isEditing}
          />
        </div>

        {/* Sección de imágenes actualizada */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Imágenes subidas:</label>
          {editedProperty.images && editedProperty.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {editedProperty.images.map((img, idx) => (
                <div key={idx} className="relative border p-2 rounded">
                  <img
                    src={img.src || "/placeholder.png"}
                    alt={img.alt || "Imagen"}
                    className="w-full h-auto rounded"
                  />
                  {isEditing && (
                    <>
                      <input
                        type="text"
                        value={img.src}
                        onChange={(e) => handleImageChange(idx, e.target.value)}
                        className="mt-2 w-full border p-1 rounded"
                        placeholder="URL de la imagen"
                      />
                      <button
                        onClick={() => handleDeleteImage(idx)}
                        className="mt-2 bg-red-600 text-white px-2 py-1 rounded w-full"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay imágenes subidas.</p>
          )}
          {isEditing && (
            <div className="mt-4 space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600 inline-block"
              >
                {uploading ? "Subiendo..." : "Subir imagen desde ordenador"}
              </label>
              {uploadError && (
                <p className="text-red-500 mt-2">{uploadError}</p>
              )}
              <button
                type="button"
                onClick={handleAddImage}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
              >
                Añadir URL de imagen
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-4">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Modificar
            </button>
          ) : (
            <button
              onClick={openModifiedModal}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Guardar cambios
            </button>
          )}
        </div>

        {/* Modal de confirmación */}
        <Dialog
          open={isOpen}
          onClose={() => setIsOpen(false)}
          className="fixed inset-0 flex items-center justify-center p-4"
        >
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <Dialog.Title className="text-lg font-semibold">
              Confirmar modificación
            </Dialog.Title>
            <Dialog.Description className="mt-2">
              ¿Estás seguro de que quieres guardar los cambios?
            </Dialog.Description>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <Link
                to={"/propiedades"}
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Guardar cambios
              </Link>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
