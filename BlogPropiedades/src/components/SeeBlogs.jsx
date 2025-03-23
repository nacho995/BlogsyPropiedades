import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Dialog, Transition } from "@headlessui/react";
import { Link } from 'react-router-dom';
import { deleteBlogPost, getBlogPosts } from '../services/api';
import { FiCalendar, FiClock, FiUser, FiTag, FiTrash2, FiEdit } from 'react-icons/fi';
import { UserContext } from '../context/UserContext';
import toast from 'react-hot-toast';

// Componente simple para mostrar imágenes con manejo de errores
const DirectImage = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  
  if (error || !src) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-gray-400">Sin imagen disponible</span>
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt || "Imagen"} 
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};

export default function SeeBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Usar useContext directamente con manejo de errores
  const userContext = useContext(UserContext);
  const user = userContext?.user || null;

  useEffect(() => {
    let isMounted = true;

    const fetchBlogs = async () => {
      try {
        const blogsData = await getBlogPosts();
        if (!isMounted) return;
        
        // Normalizar el formato de las imágenes para cada blog
        const normalizedBlogs = blogsData.map(blog => {
          console.log('Procesando blog:', blog._id);
          console.log('Blog data completa:', JSON.stringify(blog, null, 2));
          
          let processedImages = [];
          
          // Procesar imágenes del array images
          if (blog.images && Array.isArray(blog.images)) {
            console.log('Procesando array de imágenes:', blog.images);
            
            processedImages = blog.images
              .filter(img => img !== null && img !== undefined)
              .map(img => {
                console.log('Procesando imagen individual:', img);
                
                // Si la imagen es un string, asumimos que es una URL
                if (typeof img === 'string') {
                  return { src: img, alt: "Imagen del blog" };
                }
                
                // Si la imagen es un objeto, verificamos su estructura
                if (img && typeof img === 'object') {
                  // Si tiene una propiedad url o path, la usamos como src
                  if (img.url) return { src: img.url, alt: img.alt || "Imagen del blog" };
                  if (img.path) return { src: img.path, alt: img.alt || "Imagen del blog" };
                  if (img.src) return img;
                }
                
                return null;
              })
              .filter(img => img !== null);
            
            console.log('Imágenes procesadas del array:', processedImages);
          }

          // Si hay una imagen principal y no está en el array de imágenes, la agregamos
          if (blog.image) {
            console.log('Procesando imagen principal:', blog.image);
            
            let mainImage;
            if (typeof blog.image === 'string') {
              mainImage = { src: blog.image, alt: "Imagen principal" };
            } else if (typeof blog.image === 'object') {
              mainImage = blog.image.url ? { src: blog.image.url, alt: "Imagen principal" } :
                         blog.image.path ? { src: blog.image.path, alt: "Imagen principal" } :
                         blog.image.src ? blog.image : null;
            }
            
            if (mainImage && !processedImages.some(img => img.src === mainImage.src)) {
              processedImages.unshift(mainImage);
            }
          }

          console.log('Total de imágenes procesadas:', processedImages.length);
          console.log('Imágenes procesadas final:', processedImages);
          
          return {
            ...blog,
            images: processedImages
          };
        });
        
        console.log('Blogs normalizados:', normalizedBlogs);
        setBlogs(normalizedBlogs);
        setLoading(false);
      } catch (error) {
        console.error('Error al obtener los blogs:', error);
        if (isMounted) {
          toast.error('Error al cargar los blogs');
          setLoading(false);
        }
      }
    };

    fetchBlogs();

    return () => {
      isMounted = false;
    };
  }, []);

  const openDeleteModal = (blog) => {
    if (!user || !(user.role === 'admin' || user.role === 'ADMIN' || user.isAdmin)) {
      toast.error('No tienes permisos para eliminar blogs');
      return;
    }
    setBlogToDelete(blog);
    setIsOpen(true);
  };

  const confirmDelete = async () => {
    if (!blogToDelete) return;
    setDeleteLoading(true);
    try {
      console.log('Intentando eliminar blog:', blogToDelete._id);
      const result = await deleteBlogPost(blogToDelete._id);
      console.log('Resultado de eliminación:', result);
      
      setBlogs(prevBlogs => prevBlogs.filter(blog => blog._id !== blogToDelete._id));
      toast.success('Blog eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el blog:', error);
      toast.error('Error al eliminar el blog');
    } finally {
      setDeleteLoading(false);
      setIsOpen(false);
      setBlogToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-blue-900 to-black/60 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-900 to-black/60">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white">
            Blogs
          </span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.length === 0 ? (
            <p className="text-white col-span-full text-center">No hay blogs disponibles.</p>
          ) : (
            blogs.map((blog) => (
              <article key={blog._id} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-48 overflow-hidden">
                  {blog.images && blog.images.length > 0 ? (
                    <DirectImage
                      src={blog.images[0].src}
                      alt={blog.images[0].alt || blog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">Sin imagen disponible</span>
                    </div>
                  )}
                  {blog.images && blog.images.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      +{blog.images.length - 1} fotos
                    </span>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center">
                      <FiCalendar className="mr-1" />
                      {new Date(blog.createdAt).toLocaleDateString('es-ES')}
                    </span>
                    <span className="flex items-center">
                      <FiClock className="mr-1" />
                      {blog.readTime} min
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold mb-2 text-gray-800">{blog.title}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">{blog.description}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <FiUser className="text-gray-500" />
                    <span className="text-sm text-gray-600">{blog.author}</span>
                  </div>

                  {blog.category && (
                    <div className="flex items-center gap-2 mb-4">
                      <FiTag className="text-gray-500" />
                      <span className="text-sm text-gray-600">{blog.category}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4">
                    <Link
                      to={`/blog/${blog._id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Leer más
                    </Link>

                    {user && (user.role === 'admin' || user.role === 'ADMIN' || user.isAdmin) && (
                      <div className="flex gap-2">
                        <Link
                          to={`/crear-blog?id=${blog._id}`}
                          className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Editar"
                        >
                          <FiEdit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(blog)}
                          className="p-2 text-red-600 hover:text-red-800 transition-colors"
                          title="Eliminar"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Confirmar eliminación
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      ¿Estás seguro de que quieres eliminar este blog?
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => setIsOpen(false)}
                      disabled={deleteLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={confirmDelete}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
