import React, { useEffect, useState } from 'react';
import { Button } from "@headlessui/react";  // Para los botones si usas Headless UI

// Función para obtener los blogs desde el backend
const getBlogPosts = async () => {
  const response = await fetch('http://localhost:3000/blog');
  const data = await response.json();
  return data;
};

// Función para eliminar un blog
const deleteBlogPost = async (id) => {
  const response = await fetch(`http://localhost:3000/blog/${id}`, {
    method: 'DELETE',
  });
  if (response.ok) {
    return id;  // Si la eliminación fue exitosa, devolver el ID del blog eliminado
  }
  throw new Error('Error al eliminar el blog');
};

export default function SeeBlogs() {
  const [blogs, setBlogs] = useState([]);
  
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

  const handleDelete = async (id) => {
    try {
      const deletedId = await deleteBlogPost(id);
      setBlogs(blogs.filter(blog => blog._id !== deletedId));  // Eliminar el blog de la lista localmente
      alert('Blog eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el blog:', error);
      alert('Hubo un error al eliminar el blog');
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
                    src={blog.image.src} // Usamos la propiedad src para mostrar la imagen
                    alt={blog.image.alt || 'Imagen del blog'}
                    className="w-[30vh] h-[10vh] object-cover rounded-md"
                  />
                </div>
              )}

              <div className="mt-4">
                <Button
                  onClick={() => handleDelete(blog._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
