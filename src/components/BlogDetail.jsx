"use client";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { getBlogById, updateBlogPost, deleteBlogPost, uploadImageBlog } from "../services/api";
import { useUser } from "../context/UserContext";

export default function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBlog, setEditedBlog] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // Obtener el usuario actual
  const { user } = useUser();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const data = await getBlogById(id);
        
        // Mejorar el manejo de imágenes
        let blogImages = [];
        
        // Si hay una imagen en formato antiguo (objeto image)
        if (data.image && data.image.src) {
          blogImages.push({
            src: data.image.src,
            alt: data.image.alt || "Imagen del blog"
          });
        }
        
        // Si hay un array de imágenes (formato nuevo)
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          // Si las imágenes son strings, convertirlas a objetos
          const formattedImages = data.images.map(img => {
            if (typeof img === 'string') {
              return { src: img, alt: "Imagen del blog" };
            }
            return img;
          });
          
          blogImages = [...blogImages, ...formattedImages];
        }
        
        const formattedData = {
          ...data,
          images: blogImages
        };
        
        setBlog(formattedData);
        setEditedBlog(formattedData);
        
        // Crear URLs de previsualización si existen imágenes
        if (blogImages.length > 0) {
          const urls = blogImages.map(img => img.src);
          setPreviewUrls(urls);
        }
      } catch (error) {
        console.error("Error al obtener el blog:", error);
      }
    };
    fetchBlog();
  }, [id]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const openModifiedModal = () => {
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      console.log("Datos a enviar:", editedBlog);
      
      // Preparar los datos según la estructura esperada por el backend
      const dataToSend = {
        ...editedBlog,
        // Mantener la estructura original del blog
        image: {
          src: editedBlog.images && editedBlog.images.length > 0 
            ? editedBlog.images[0].src 
            : "",
          alt: editedBlog.images && editedBlog.images.length > 0 
            ? editedBlog.images[0].alt || "Imagen del blog"
            : "Imagen del blog"
        }
      };
      
      // Eliminar campos que puedan causar problemas
      delete dataToSend._id;  // No enviar el ID en el cuerpo
      delete dataToSend.__v;  // No enviar la versión de MongoDB
      delete dataToSend.createdAt;  // No enviar la fecha de creación
      delete dataToSend.updatedAt;  // No enviar la fecha de actualización
      
      console.log("Datos preparados para enviar:", dataToSend);
      
      const result = await updateBlogPost(id, dataToSend);
      console.log("Respuesta del servidor:", result);
      
      setBlog(editedBlog);
      setIsEditing(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Error al guardar cambios:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedBlog({ ...editedBlog, [name]: value });
  };

  const handleImageChange = (index, newValue) => {
    const newImages = editedBlog.images ? [...editedBlog.images] : [];
    newImages[index].src = newValue;
    setEditedBlog({ ...editedBlog, images: newImages });
  };

  const handleDeleteImage = (index) => {
    const newImages = editedBlog.images ? [...editedBlog.images] : [];
    newImages.splice(index, 1);
    setEditedBlog({ ...editedBlog, images: newImages });
  };

  const handleAddImage = () => {
    const newImages = editedBlog.images ? [...editedBlog.images] : [];
    newImages.push({ src: "", alt: "" });
    setEditedBlog({ ...editedBlog, images: newImages });
  };

  const handleTagsChange = (e) => {
    const tagsArray = e.target.value.split(',').map(tag => tag.trim());
    setEditedBlog({ ...editedBlog, tags: tagsArray });
  };

  const handleButtonChange = (field, value) => {
    setEditedBlog({
      ...editedBlog,
      button: {
        ...editedBlog.button,
        [field]: value
      }
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleImageUpload = async (files) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`${API_BASE_URL}/upload-images`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Error al subir imágenes');

      const data = await response.json();
      return data.imageUrls;
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      throw error;
    }
  };

  // Función para manejar la subida de archivos
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      console.log("Subiendo archivo...");
      
      // Usar la función de la API para subir la imagen
      const result = await uploadImageBlog(file, user?.token);
      
      console.log("Resultado de la subida:", result);
      
      // Verificar si tenemos una URL de imagen en cualquier formato posible
      let imageUrl = null;
      if (result.imageUrl) {
        imageUrl = result.imageUrl;
      } else if (result.url) {
        imageUrl = result.url;
      } else if (result.secure_url) {
        imageUrl = result.secure_url;
      } else if (result.path) {
        imageUrl = result.path;
      }
      
      if (imageUrl) {
        // Añadir la nueva imagen al blog
        const newImages = editedBlog.images ? [...editedBlog.images] : [];
        newImages.push({
          src: imageUrl,
          alt: file.name || "Imagen subida"
        });
        
        setEditedBlog({ ...editedBlog, images: newImages });
        
        // Añadir URL a la previsualización
        setPreviewUrls(prev => [...prev, imageUrl]);
      } else {
        throw new Error("No se recibió URL de imagen del servidor");
      }
    } catch (error) {
      console.error("Error detallado:", error);
      setUploadError("Error al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  if (!blog) {
    return <p className="text-center text-gray-500">Cargando...</p>;
  }

  return (
    <div className="bg-gradient-to-br from-blue-900 to-black bg-fixed p-6">
      <div className="max-w-2xl mx-auto p-6 bg-gradient-to-bl from-white to-blue-900 rounded-lg shadow-md">
        {/* Título */}
        <h1 className="text-3xl font-bold mb-4">
          {isEditing ? (
            <input
              type="text"
              name="title"
              value={editedBlog.title || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          ) : (
            blog.title
          )}
        </h1>

        {/* Descripción */}
        <div className="mb-4">
          <label className="block font-semibold">Descripción:</label>
          <textarea
            name="description"
            value={editedBlog.description || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            readOnly={!isEditing}
          />
        </div>


        {/* Autor */}
        <div className="mb-4">
          <label className="block font-semibold">Autor:</label>
          <input
            type="text"
            name="author"
            value={editedBlog.author || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            readOnly={!isEditing}
          />
        </div>

        {/* Categoría */}
        <div className="mb-4">
          <label className="block font-semibold">Categoría:</label>
          <input
            type="text"
            name="category"
            value={editedBlog.category || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            readOnly={!isEditing}
          />
        </div>

        {/* Contenido */}
        <div className="mb-4">
          <label className="block font-semibold">Contenido:</label>
          <textarea
            name="content"
            value={editedBlog.content || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded h-32"
            readOnly={!isEditing}
          />
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="block font-semibold">Tags (separados por coma):</label>
          <input
            type="text"
            name="tags"
            value={editedBlog.tags ? editedBlog.tags.join(', ') : ''}
            onChange={handleTagsChange}
            className="w-full border p-2 rounded"
            readOnly={!isEditing}
          />
        </div>

        {/* Tiempo de lectura */}
        <div className="mb-4">
          <label className="block font-semibold">Tiempo de lectura:</label>
          <input
            type="text"
            name="readTime"
            value={editedBlog.readTime || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            readOnly={!isEditing}
          />
        </div>


        {/* Sección de imágenes actualizada */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Imágenes:</label>
          {editedBlog.images && editedBlog.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {editedBlog.images.map((img, idx) => (
                <div key={idx} className="relative border p-2 rounded">
                  <img
                    src={img.src || "/placeholder.png"}
                    alt={img.alt || "Imagen"}
                    className="w-full h-auto rounded object-cover"
                    style={{ height: "200px" }}
                    onError={(e) => {
                      console.error(`Error cargando imagen: ${img.src}`);
                      e.target.src = "/placeholder.png";
                      e.target.alt = "Imagen no disponible";
                    }}
                  />
                  {isEditing && (
                    <button
                      onClick={() => handleDeleteImage(idx)}
                      className="mt-2 bg-red-600 text-white px-2 py-1 rounded w-full"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay imágenes disponibles.</p>
          )}
          
          {/* Mostrar las imágenes de previsualización para nuevas subidas */}
          {isEditing && previewUrls.length > 0 && (
            <div className="mt-4">
              <label className="block font-semibold mb-2">Previsualización de nuevas imágenes:</label>
              <div className="grid grid-cols-2 gap-4">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative border p-2 rounded">
                    <img
                      src={url}
                      alt={`Vista previa ${idx + 1}`}
                      className="w-full h-auto rounded object-cover"
                      style={{ height: "200px" }}
                    />
                  </div>
                ))}
              </div>
            </div>
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
            </div>
          )}
        </div>

        {/* Botones de acción */}
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
                to={"/ver-blogs"}
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
