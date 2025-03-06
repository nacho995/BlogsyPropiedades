import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { getBlogPosts, getPropertyPosts } from "../services/api";
import { motion } from "framer-motion";

function Principal() {
  // Estados mínimos necesarios
  const [blogs, setBlogs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Obtener datos del usuario
  const { user, isAuthenticated } = useUser();

  // Cargar datos una sola vez al montar
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Cargar datos básicos
        const blogsData = await getBlogPosts();
        const propertiesData = await getPropertyPosts();
        
        // Log para depuración
        console.log("Datos de blogs cargados:", blogsData);
        console.log("Datos de propiedades cargados:", propertiesData);
        
        // Guardar solo los primeros 3 elementos
        setBlogs(Array.isArray(blogsData) ? blogsData.slice(0, 3) : []);
        setProperties(Array.isArray(propertiesData) ? propertiesData.slice(0, 3) : []);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Imagen de perfil por defecto
  const defaultProfilePic = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

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
                  {isAuthenticated 
                    ? `¡Hola, ${user?.name || "Usuario"}!` 
                    : "Bienvenido a InmoBlog"}
                </h1>
                <p className="text-xl text-blue-100 mb-6 max-w-xl">
                  {isAuthenticated 
                    ? "Tu portal inmobiliario y de contenido personalizado" 
                    : "Descubre propiedades exclusivas y contenido de calidad"}
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  {isAuthenticated ? (
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
              {isAuthenticated && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-blue-600 rounded-full animate-spin-slow opacity-70 blur-md"></div>
                  <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
                    <img 
                      src={user?.profilePic || defaultProfilePic} 
                      alt="Perfil" 
                      className="w-full h-full object-cover"
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
                          src={(blog.image && blog.image.src) || (blog.images && blog.images.length > 0 ? blog.images[0].src || blog.images[0] : null) || blog.image || 'https://via.placeholder.com/400x300?text=Blog+Image'} 
                          alt={blog.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/400x300?text=Sin+Imagen';
                          }}
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
                          src={(property.images && property.images.length > 0) ? 
                            (typeof property.images[0] === 'string' ? property.images[0] : property.images[0].src || null) : 
                            'https://via.placeholder.com/400x300?text=Propiedad'} 
                          alt={property.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/400x300?text=Sin+Imagen';
                          }}
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

export default Principal;
