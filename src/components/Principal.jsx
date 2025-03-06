import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { getBlogPosts, getPropertyPosts } from "../services/api";
import { motion } from "framer-motion";

export default function Principal() {
  const [blogs, setBlogs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  // Usar imágenes en base64 (pequeñas imágenes codificadas como texto)
  const defaultProfilePic = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAAA8AXHiAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTA2LTI5VDE0OjM3OjE5KzAyOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0wNi0yOVQxNDozODoxMSswMjowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0wNi0yOVQxNDozODoxMSswMjowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo3YzY4ZmY5Ni0xNjUw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";
  const defaultPropertyImage = "https://placehold.co/400x300";
  const defaultBlogImage = "https://placehold.co/400x300";

  // Función para manejar errores de carga de imagen
  const handleImageError = (e) => {
    const type = e.target.dataset.type;
    switch(type) {
      case 'profile':
        e.target.src = defaultProfilePic;
        break;
      case 'property':
        e.target.src = defaultPropertyImage;
        break;
      case 'blog':
        e.target.src = defaultBlogImage;
        break;
      default:
        e.target.src = defaultPropertyImage;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Solo cargar datos si el usuario está autenticado
        if (user) {
          const [blogsData, propertiesData] = await Promise.all([
            getBlogPosts(),
            getPropertyPosts()
          ]);
          setBlogs(blogsData);
          setProperties(propertiesData);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]); // Añadimos user como dependencia para que se ejecute cuando cambie el estado de autenticación

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black bg-fixed p-6">
        <div className="max-w-7xl mx-auto text-center text-white">
          <h1 className="text-4xl font-bold mb-6">Bienvenido a nuestra plataforma</h1>
          <p className="text-xl mb-8">Por favor, inicia sesión o regístrate para ver nuestro contenido</p>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              className="bg-white hover:bg-gray-100 text-blue-900 px-6 py-3 rounded-lg font-semibold"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black bg-fixed p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-amber-600">
      {/* Hero Section con efecto de vidrio esmerilado */}
      <header className="relative overflow-hidden py-24 px-4">
        {/* Círculos decorativos animados */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute w-96 h-96 rounded-full bg-amber-500 opacity-20 -top-20 -left-20 animate-pulse"></div>
          <div className="absolute w-80 h-80 rounded-full bg-blue-500 opacity-20 top-40 right-10 animate-pulse" style={{animationDelay: "1s"}}></div>
          <div className="absolute w-72 h-72 rounded-full bg-amber-400 opacity-20 bottom-10 left-20 animate-pulse" style={{animationDelay: "2s"}}></div>
        </div>
        
        {/* Contenido principal con efecto de vidrio */}
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Texto de bienvenida */}
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                  {user ? `¡Hola, ${user?.name || "Usuario"}!` : "Bienvenido a InmoBlog"}
                </h1>
                <p className="text-xl text-blue-100 mb-6 max-w-xl">
                  {user ? "Tu portal inmobiliario y de contenido personalizado" : "Descubre propiedades exclusivas y contenido de calidad"}
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  {user ? (
                    <>
                      <Link to="/crear-blog" className="bg-gradient-to-r from-amber-500 to-blue-600 text-white px-6 py-3 rounded-full font-bold transform transition hover:scale-105 hover:shadow-lg">
                        Crear Blog
                      </Link>
                      <Link to="/add-property" className="bg-white text-blue-700 px-6 py-3 rounded-full font-bold transform transition hover:scale-105 hover:shadow-lg">
                        Añadir Propiedad
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="bg-gradient-to-r from-amber-500 to-blue-600 text-white px-6 py-3 rounded-full font-bold transform transition hover:scale-105 hover:shadow-lg">
                        Iniciar Sesión
                      </Link>
                      <Link to="/register" className="bg-white text-blue-700 px-6 py-3 rounded-full font-bold transform transition hover:scale-105 hover:shadow-lg">
                        Registrarse
                      </Link>
                    </>
                  )}
                </div>
              </div>
              
              {/* Perfil de usuario con animación */}
              {user && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-blue-600 rounded-full animate-spin-slow opacity-70 blur-md"></div>
                  <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
                    <img 
                      src={user?.profilePic || defaultProfilePic}
                      alt="Perfil"
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                      data-type="profile"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-2 border-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto py-12 px-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Blogs */}
            {blogs.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white">Blogs Recientes</h2>
                  <Link to="/ver-blogs" className="text-blue-200 hover:text-white transition">
                    Ver todos →
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {blogs.map((blog, index) => (
                    <div 
                      key={blog._id} 
                      className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/20 transform transition hover:scale-105"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={blog.image?.src || defaultBlogImage} 
                          alt={blog.image?.alt || blog.title} 
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                          data-type="blog"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-xl mb-2 text-white">{blog.title}</h3>
                        <p className="text-blue-100 mb-4 line-clamp-2">{blog.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-200">
                            {new Date(blog.createdAt).toLocaleDateString('es-ES')}
                          </span>
                          <Link to={`/blog/${blog._id}`} className="text-amber-400 hover:text-amber-300 font-medium">
                            Leer más →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Propiedades */}
            {properties.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white">Propiedades Destacadas</h2>
                  <Link to="/propiedades" className="text-blue-200 hover:text-white transition">
                    Ver todas →
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {properties.map((property, index) => (
                    <div 
                      key={property._id} 
                      className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/20 transform transition hover:scale-105"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={Array.isArray(property.images) && property.images[0]?.src 
                            ? property.images[0].src 
                            : Array.isArray(property.images) && property.images[0] 
                              ? property.images[0] 
                              : defaultPropertyImage}
                          alt={property.title || "Propiedad"}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                          data-type="property"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {property.propertyType || 'Venta'}
                          </span>
                          <span className="text-lg font-bold text-white">
                            {property.price ? `${property.price.toLocaleString('es-ES')} €` : 'Consultar'}
                          </span>
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-white">{property.title}</h3>
                        <p className="text-blue-100 mb-4 line-clamp-2">{property.description}</p>
                        <div className="flex justify-between items-center text-sm text-blue-200">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {property.bedrooms || '3'} hab.
                          </div>
                          <Link to={`/property/${property._id}`} className="text-amber-400 hover:text-amber-300 font-medium">
                            Ver detalles →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer con efecto de vidrio */}
      <footer className="mt-16 py-12 px-4 backdrop-blur-lg bg-white/5 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-6">¿Listo para encontrar tu propiedad ideal?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/propiedades" className="bg-white text-blue-700 px-6 py-3 rounded-full font-bold transform transition hover:scale-105 hover:shadow-lg">
              Explorar Propiedades
            </Link>
            <Link to="/ver-blogs" className="bg-gradient-to-r from-amber-500 to-blue-600 text-white px-6 py-3 rounded-full font-bold transform transition hover:scale-105 hover:shadow-lg">
              Leer Blogs
            </Link>
          </div>
          <p className="mt-8 text-blue-200">© 2023 InmoBlog. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Estilos adicionales para animaciones */}
      <style jsx>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-pulse {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
