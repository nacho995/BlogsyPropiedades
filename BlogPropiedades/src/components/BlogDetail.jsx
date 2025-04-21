"use client";
import React, { useEffect, useState, useContext } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { getBlogById, updateBlogPost, deleteBlogPost, uploadImageBlog } from "../services/api";
import { useUser } from "../context/UserContext";
import { FiCalendar, FiClock, FiUser, FiTag, FiX, FiUpload } from 'react-icons/fi';
import { toast } from 'sonner';

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
  const navigate = useNavigate();

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
    // Redirigir a la página de creación de blog con el ID como parámetro para edición
    navigate(`/crear-blog?edit=${id}`);
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
      <div className="min-h-screen bg-gradient-to-tr from-blue-900 to-black/60 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-blue-900 to-black/60 flex flex-col justify-center items-center text-white px-4">
        <h2 className="text-2xl font-bold mb-4">Blog no encontrado</h2>
        <p className="mb-6">El blog que buscas no existe o ha sido eliminado.</p>
        <Link to="/ver-blogs" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Volver a blogs
        </Link>
      </div>
    );
  }

  // Función para manejar la navegación de imágenes
  const nextImage = () => {
    if (blog && blog.images && Array.isArray(blog.images) && blog.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === blog.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (blog && blog.images && Array.isArray(blog.images) && blog.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? blog.images.length - 1 : prevIndex - 1
      );
    }
  };

  // Obtener todas las imágenes disponibles de manera segura
  const allImages = blog && blog.images ? blog.images : 
                    (blog && blog.image && blog.image.src ? [blog.image.src] : []);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-900 to-black/60 py-6 sm:py-10 px-4 sm:px-6">
      <div className="container mx-auto">
        {/* Navegación de regreso */}
        <div className="mb-6">
          <Link to="/ver-blogs" className="text-white hover:text-yellow-300 transition flex items-center text-sm sm:text-base">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a blogs
          </Link>
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Imagen destacada */}
          <div className="relative">
            <div className="h-48 sm:h-64 md:h-80 bg-gray-200 relative">
              {blog.images && blog.images.length > 0 ? (
                <>
                  <img 
                    src={blog.images[currentImageIndex]?.src || ''} 
                    alt={blog.images[currentImageIndex]?.alt || "Imagen del blog"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/800x400?text=Imagen+no+disponible"
                    }}
                  />
                  
                  {/* Controles del carrusel */}
                  {blog.images.length > 1 && (
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
                        {blog.images.map((_, idx) => (
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
            {/* Metadatos del blog */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
              <span className="flex items-center">
                <FiCalendar className="mr-1" />
                {new Date(blog.createdAt).toLocaleDateString('es-ES')}
              </span>
              {blog.readTime && (
                <span className="flex items-center">
                  <FiClock className="mr-1" />
                  {blog.readTime} min
                </span>
              )}
              {blog.author && (
                <span className="flex items-center">
                  <FiUser className="mr-1" />
                  {blog.author}
                </span>
              )}
              {blog.category && (
                <span className="flex items-center">
                  <FiTag className="mr-1" />
                  {blog.category}
                </span>
              )}
            </div>
            
            {/* Título y descripción */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {blog.title}
            </h1>
            
            <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-6">
              {blog.description}
            </p>
            
            {/* Contenido del blog */}
            <div
              className="prose prose-sm sm:prose lg:prose-lg max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
            
            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-8 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <span key={index} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Acciones */}
            <div className="flex flex-wrap gap-3 mt-6 border-t border-gray-200 pt-6">
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar Blog
              </button>
            </div>
          </div>
        </div>
      </div>

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
