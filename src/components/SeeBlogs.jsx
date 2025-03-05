import React, { useEffect, useState } from 'react';
import { Dialog } from "@headlessui/react"; // Headless UI para el modal
import { Link } from 'react-router-dom';
import { deleteBlogPost, getBlogPosts } from '../services/api';



export default function SeeBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false); // Estado para mostrar el modal
  const [blogToDelete, setBlogToDelete] = useState(null); // Blog que se eliminará

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const blogsData = await getBlogPosts();
        setBlogs(blogsData);
      } catch (error) {
        console.error('Error al obtener los blogs:', error);
      }
    };
    fetchBlogs();
  }, []);

  const openDeleteModal = (blog) => {
    setBlogToDelete(blog);
    setIsOpen(true);
  };

  const confirmDelete = async () => {
    if (!blogToDelete) return;
    try {
      await deleteBlogPost(blogToDelete._id);
      // Actualizamos el estado usando una función para asegurarnos de tener el estado más reciente
      setBlogs(prevBlogs => prevBlogs.filter(blog => blog._id !== blogToDelete._id));
      console.log('Blog eliminado correctamente:', blogToDelete._id);
    } catch (error) {
      console.error('Error al eliminar el blog:', error);
    } finally {
      setIsOpen(false); // Cerrar modal
      setBlogToDelete(null);
    }
  };

  return (
    <div className="bg-gradient-to-tr from-blue-900 to-black/60 min-h-screen flex flex-col justify-center items-center">
      <div className="container mx-auto p-4 flex flex-col justify-center items-start">
        <h1 className="text-4xl font-bold text-center mb-8 relative">
          <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white">
            Blogs
          </span>
        </h1>
      </div>
      <div className="space-y-4">
        {blogs.length === 0 ? (
          <p className="text-red-700">No hay blogs disponibles.</p>
        ) : (
          blogs.map((blog) => (
            <div key={blog._id} className="bg-white p-4 rounded-md shadow-md">
              <h2 className="text-2xl font-semibold">{blog.title}</h2>
              <p>{blog.description}</p>
              <p><strong>Autor:</strong> {blog.author}</p>
              <p><strong>Categoría:</strong> {blog.category}</p>
              <p><strong>Tiempo de lectura:</strong> {blog.readTime}</p>

              {/* Mostrar la imagen si existe */}
              {blog.image && blog.image.src && (
                <div className="mt-4">
                  <img
                    src={blog.image.src}
                    alt={blog.image.alt || 'Imagen del blog'}
                    className="w-[30vh] h-[10vh] object-cover rounded-md"
                  />
                </div>
              )}

              <div className="m-4 flex justify-between">
                <button
                  onClick={() => openDeleteModal(blog)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Eliminar
                </button>
            
              
                <Link
                    to={`/blog/${blog._id}`}
                  className="bg-red-500 text-white px-4  py-2 rounded hover:bg-red-700"
                >
                  Ver completo
                </Link>
                </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <Dialog.Title className="text-lg font-semibold">Confirmar eliminación</Dialog.Title>
          <Dialog.Description className="mt-2">
            ¿Estás seguro de que quieres eliminar este blog?
          </Dialog.Description>

          <div className="mt-4 flex justify-end gap-2">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button 
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
