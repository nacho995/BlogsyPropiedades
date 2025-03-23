"use client";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { getBlogById, updateBlogPost, deleteBlogPost, uploadImageBlog } from "../services/api";
import { useUser } from "../context/UserContext";
import { FiCalendar, FiClock, FiUser, FiTag, FiX, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';

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
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  
  // Obtener el usuario actual
  const { user } = useUser();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const data = await getBlogById(id);
        console.log("Datos del blog recibidos:", data);
        
        // Normalizar el formato de las imágenes
        let blogImages = [];
        
        // Manejar imagen principal
        if (data.image && typeof data.image === 'object' && data.image.src) {
          blogImages.push(data.image);
          console.log("Imagen principal añadida:", data.image);
        }
        
        // Manejar imágenes adicionales si existen
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          console.log("Imágenes adicionales encontradas en data.images:", data.images);
          const additionalImages = data.images.map(img => {
            if (typeof img === 'string') {
              return { src: img, alt: "Imagen del blog" };
            } else if (typeof img === 'object' && img.src) {
              return img;
            }
            return { src: img, alt: "Imagen del blog" };
          });
          console.log("Imágenes adicionales procesadas:", additionalImages);
          blogImages = [...blogImages, ...additionalImages];
        }
        
        const formattedData = {
          ...data,
          images: blogImages
        };
        
        console.log("Blog formateado con todas las imágenes:", formattedData);
        console.log("Número total de imágenes:", blogImages.length);
        setBlog(formattedData);
        setEditedBlog(formattedData);
      } catch (error) {
        console.error("Error al obtener el blog:", error);
        toast.error('Error al cargar el blog');
      } finally {
        setLoading(false);
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
      console.log("Preparando datos para guardar...");
      console.log("Estado actual del blog editado:", editedBlog);
      
      // Asegurarse de que tenemos un array de imágenes
      const allImages = editedBlog.images || [];
      console.log("Todas las imágenes disponibles:", allImages);
      
      // Separar la imagen principal y las imágenes adicionales
      const mainImage = allImages[0] || { src: "", alt: "" };
      const additionalImages = allImages.slice(1) || [];
      
      console.log("Imagen principal:", mainImage);
      console.log("Imágenes adicionales:", additionalImages);
      
      // Preparar los datos según la estructura esperada por el backend
      const dataToSend = {
        title: editedBlog.title,
        content: editedBlog.content,
        description: editedBlog.description,
        category: editedBlog.category,
        tags: editedBlog.tags,
        // Enviar la imagen principal en el campo image
        image: mainImage,
        // Enviar las imágenes adicionales como array de URLs en el campo images
        images: additionalImages.map(img => img.src)
      };
      
      console.log("Datos preparados para enviar:", dataToSend);
      
      const result = await updateBlogPost(id, dataToSend);
      console.log("Respuesta del servidor:", result);
      
      if (result) {
        toast.success('Blog actualizado correctamente');
        
        // Reconstruir el estado con todas las imágenes
        const updatedBlog = {
          ...result,
          images: [
            result.image, // Imagen principal
            ...(result.images || []).map(imgUrl => ({ // Imágenes adicionales
              src: imgUrl,
              alt: "Imagen del blog"
            }))
          ].filter(img => img && img.src) // Filtrar imágenes válidas
        };
        
        console.log("Blog actualizado con todas las imágenes:", updatedBlog);
        setBlog(updatedBlog);
        setEditedBlog(updatedBlog);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      toast.error('Error al guardar los cambios');
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
      setUploading(true);
      setUploadError(null);

      // Convertir FileList a Array
      const fileArray = Array.from(files);
      
      // Validar cada archivo
      const invalidFiles = fileArray.filter(file => !file.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
        throw new Error('Solo se permiten archivos de imagen');
      }

      // Subir cada imagen y obtener sus URLs
      const uploadPromises = fileArray.map(async (file) => {
        const result = await uploadImageBlog(file);
        return {
          src: result.secure_url || result.imageUrl,
          alt: file.name,
          public_id: result.public_id
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);

      // Actualizar el estado con las nuevas imágenes
      setEditedBlog(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedImages]
      }));

      // Actualizar las URLs de vista previa
      setPreviewUrls(prev => [...prev, ...uploadedImages.map(img => img.src)]);

      toast.success('Imágenes subidas correctamente');
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      setUploadError(error.message);
      toast.error(`Error al subir imágenes: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Validar campos requeridos
      if (!editedBlog.title || !editedBlog.description || !editedBlog.content) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      // Asegurarse de que las imágenes tengan el formato correcto
      const formattedImages = editedBlog.images.map(img => {
        if (typeof img === 'string') {
          return { src: img, alt: editedBlog.title };
        }
        return img;
      });

      const updatedBlog = {
        ...editedBlog,
        images: formattedImages
      };

      const response = await updateBlogPost(id, updatedBlog);
      setBlog(response.blog);
      setIsEditing(false);
      toast.success('Blog actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar el blog:', error);
      toast.error('Error al actualizar el blog');
    }
  };

  // Función para manejar los comentarios
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      try {
        toast('Por favor, escribe un comentario', {
          icon: '⚠️',
          duration: 4000
        });
      } catch (e) {
        console.error('Error al mostrar notificación:', e);
        alert('Por favor, escribe un comentario');
      }
      return;
    }

    if (!user) {
      try {
        toast('Debes iniciar sesión para comentar', {
          icon: '❌',
          duration: 4000
        });
      } catch (e) {
        console.error('Error al mostrar notificación:', e);
        alert('Debes iniciar sesión para comentar');
      }
      return;
    }

    setCommentLoading(true);
    try {
      const updatedBlog = await updateBlogPost(id, {
        ...blog,
        comments: [...(blog.comments || []), {
          text: comment,
          author: user.name || 'Usuario anónimo',
          date: new Date().toISOString()
        }]
      });

      setBlog(updatedBlog);
      setComment('');
      try {
        toast('Comentario añadido correctamente', {
          icon: '✅',
          duration: 4000
        });
      } catch (e) {
        console.error('Error al mostrar notificación:', e);
      }
    } catch (error) {
      console.error('Error al añadir comentario:', error);
      try {
        toast('Error al añadir comentario', {
          icon: '❌',
          duration: 4000
        });
      } catch (e) {
        console.error('Error al mostrar notificación:', e);
        alert('Error al añadir comentario');
      }
    } finally {
      setCommentLoading(false);
    }
  };

  // Función para eliminar un comentario
  const handleCommentDelete = async (commentIndex) => {
    if (!user) {
      try {
        toast('Debes iniciar sesión para eliminar comentarios', {
          icon: '❌',
          duration: 4000
        });
      } catch (e) {
        console.error('Error al mostrar notificación:', e);
        alert('Debes iniciar sesión para eliminar comentarios');
      }
      return;
    }

    try {
      const comments = [...(blog.comments || [])];
      comments.splice(commentIndex, 1);

      const updatedBlog = await updateBlogPost(id, {
        ...blog,
        comments
      });

      setBlog(updatedBlog);
      try {
        toast('Comentario eliminado correctamente', {
          icon: '✅',
          duration: 4000
        });
      } catch (e) {
        console.error('Error al mostrar notificación:', e);
      }
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      try {
        toast('Error al eliminar comentario', {
          icon: '❌',
          duration: 4000
        });
      } catch (e) {
        console.error('Error al mostrar notificación:', e);
        alert('Error al eliminar comentario');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800">Blog no encontrado</h2>
      </div>
    );
  }

  // Función para manejar la navegación de imágenes
  const nextImage = () => {
    if (blog.images && Array.isArray(blog.images) && blog.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === blog.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (blog.images && Array.isArray(blog.images) && blog.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? blog.images.length - 1 : prevIndex - 1
      );
    }
  };

  // Obtener todas las imágenes disponibles
  const allImages = blog.images || (blog.image ? [blog.image.src] : []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {!isEditing ? (
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Carrusel de imágenes */}
          <div className="relative h-[400px] bg-gray-100">
            {blog.images && Array.isArray(blog.images) && blog.images.length > 0 ? (
              <>
                <img
                  src={blog.images[currentImageIndex]?.src || ''}
                  alt={blog.images[currentImageIndex]?.alt || `Imagen ${currentImageIndex + 1} del blog`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Error al cargar la imagen:", e);
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDgwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSI0MDAiIHk9IjIwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM0QjU1NjMiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==";
                  }}
                />
                {blog.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                    >
                      →
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {blog.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">No hay imágenes disponibles</p>
                </div>
              </div>
            )}
          </div>

          {/* Miniaturas de imágenes */}
          {blog.images && Array.isArray(blog.images) && blog.images.length > 1 && (
            <div className="flex overflow-x-auto p-4 space-x-2">
              {blog.images.map((img, index) => (
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
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNNDAgMzBDNDAgMzMuMzEzNyAzNy4zMTM3IDM2IDM0IDM2QzMwLjY4NjMgMzYgMjggMzMuMzEzNyAyOCAzMEMyOCAyNi42ODYzIDMwLjY4NjMgMjQgMzQgMjRDMzcuMzEzNyAyNCA0MCAyNi42ODYzIDQwIDMwWiIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik01NiA1Mkw0MCA0MEwyNCA1Mkg1NloiIGZpbGw9IiM5Q0EzQUYiLz48cGF0aCBkPSJNNjQgNTJMNDggMzZMMjQgNjRINjRWNTJaIiBmaWxsPSIjOUNBM0FGIi8+PC9zdmc+";
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
            
            <div className="flex flex-wrap gap-4 text-gray-600 mb-8">
              <div className="flex items-center">
                <FiCalendar className="mr-2" />
                <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <FiClock className="mr-2" />
                <span>{blog.readTime || '5'} min de lectura</span>
              </div>
              <div className="flex items-center">
                <FiUser className="mr-2" />
                <span>{blog.author}</span>
              </div>
              {blog.category && (
                <div className="flex items-center">
                  <FiTag className="mr-2" />
                  <span>{blog.category}</span>
                </div>
              )}
            </div>

            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: blog.content }} />
            </div>
            
            {blog.tags && Array.isArray(blog.tags) && blog.tags.length > 0 && (
              <div className="mt-8 pt-4 border-t">
                <h3 className="text-lg font-semibold mb-2">Etiquetas:</h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            {user && (user.role === 'admin' || user.role === 'ADMIN') && (
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={handleEdit}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Editar Blog
                </button>
              </div>
            )}
          </div>
        </article>
      ) : (
        /* Modo de edición */
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6">Editar Blog</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input
                type="text"
                name="title"
                value={editedBlog.title || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                name="description"
                value={editedBlog.description || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <input
                type="text"
                name="category"
                value={editedBlog.category || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido
              </label>
              <textarea
                name="content"
                value={editedBlog.content || ''}
                onChange={handleChange}
                rows="10"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imágenes del Blog
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {editedBlog.images?.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.src}
                      alt={img.alt || `Imagen ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg shadow-md"
                    />
                    <button
                      onClick={() => {
                        setEditedBlog(prev => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index)
                        }));
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                  <button
                    type="button"
                    onClick={() => document.getElementById('image-upload').click()}
                    className="flex flex-col items-center"
                  >
                    <FiUpload className="w-8 h-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-500">Subir imagen</span>
                  </button>
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiquetas (separadas por comas)
              </label>
              <input
                type="text"
                value={editedBlog.tags ? editedBlog.tags.join(', ') : ''}
                onChange={handleTagsChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para vista ampliada de imágenes */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-75" />
        <div className="relative z-50 max-w-4xl w-full mx-4">
          <img
            src={blog.images?.[currentImageIndex]?.src}
            alt={blog.images?.[currentImageIndex]?.alt || `Imagen ${currentImageIndex + 1}`}
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/75"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
      </Dialog>
    </div>
  );
}
