import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { getBlogPosts, getPropertyPosts } from "../services/api";
import { motion } from "framer-motion";
import { getProfileImageUrl } from "../utils/profileUtils";

// Console log para verificar si el componente se carga
console.log("Componente Principal.jsx está siendo importado");

function Principal() {
  // Estados mínimos necesarios
  const [blogs, setBlogs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Obtener datos del usuario
  const { user, isAuthenticated } = useUser();
  
  // Console log para verificar si el componente se monta
  console.log("Componente Principal está renderizando");

  // Cargar datos una sola vez al montar
  useEffect(() => {
    console.log("useEffect en Principal.jsx se ha ejecutado");
    
    const fetchData = async () => {
      console.log("Iniciando fetchData en Principal.jsx");
      setLoading(true);
      
      try {
        // Verificar si las funciones de API existen
        console.log("Funciones API disponibles:", {
          getBlogPosts: typeof getBlogPosts === 'function',
          getPropertyPosts: typeof getPropertyPosts === 'function'
        });
        
        // Cargar datos básicos
        console.log("Intentando cargar blogs...");
        let blogsData;
        try {
          blogsData = await getBlogPosts();
          console.log("Blogs cargados con éxito:", blogsData);
        } catch (blogError) {
          console.error("Error específico al cargar blogs:", blogError);
          blogsData = [];
        }
        
        console.log("Intentando cargar propiedades...");
        let propertiesData;
        try {
          propertiesData = await getPropertyPosts();
          console.log("Propiedades cargadas con éxito:", propertiesData);
        } catch (propError) {
          console.error("Error específico al cargar propiedades:", propError);
          propertiesData = [];
        }
        
        // Guardar solo los primeros 3 elementos
        const processedBlogs = Array.isArray(blogsData) ? blogsData.slice(0, 3) : [];
        const processedProperties = Array.isArray(propertiesData) ? propertiesData.slice(0, 3) : [];
        
        console.log("Blogs procesados:", processedBlogs);
        console.log("Propiedades procesadas:", processedProperties);
        
        setBlogs(processedBlogs);
        setProperties(processedProperties);
      } catch (error) {
        console.error("Error general al cargar datos:", error);
      } finally {
        setLoading(false);
        console.log("Carga de datos finalizada");
      }
    };

    fetchData();
  }, []);

  // En el useEffect donde se maneja la renderización del perfil de usuario
  useEffect(() => {
    // Este efecto se ejecutará cuando el usuario cambie
    console.log("Datos actualizados del usuario:", user);
  }, [user]);

  // Después de la función getProfileImageUrl
  useEffect(() => {
    if (user) {
      console.log("Estructura detallada del usuario:", JSON.stringify(user, null, 2));
      console.log("Tipo de profilePic:", typeof user.profilePic);
      if (user.profilePic && typeof user.profilePic === 'object') {
        console.log("Propiedades de profilePic:", Object.keys(user.profilePic));
      }
      if (user.profileImage && typeof user.profileImage === 'object') {
        console.log("Propiedades de profileImage:", Object.keys(user.profileImage));
      }
    }
  }, [user]);

  // Imagen de perfil por defecto
  const defaultProfilePic = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  // Añadir una función para depurar la estructura de imágenes
  const getImageUrl = (blog) => {
    console.log("Analizando imagen para blog:", blog.title);
    let imageUrl = null;
    
    if (blog.image && blog.image.src) {
      console.log("Encontrada imagen en format objeto.src:", blog.image.src);
      imageUrl = blog.image.src;
    } else if (blog.images && blog.images.length > 0) {
      if (typeof blog.images[0] === 'string') {
        console.log("Encontrada imagen en formato array de strings:", blog.images[0]);
        imageUrl = blog.images[0];
      } else if (blog.images[0] && blog.images[0].src) {
        console.log("Encontrada imagen en formato array de objetos:", blog.images[0].src);
        imageUrl = blog.images[0].src;
      }
    } else if (blog.image && typeof blog.image === 'string') {
      console.log("Encontrada imagen en formato string directo:", blog.image);
      imageUrl = blog.image;
    }
    
    if (!imageUrl) {
      console.log("No se encontró imagen, usando placeholder");
      imageUrl = 'https://via.placeholder.com/400x300?text=Blog+Image';
    }
    
    return imageUrl;
  };

  const getPropertyImageUrl = (property) => {
    console.log("Analizando imagen para propiedad:", property.title);
    let imageUrl = null;
    
    if (property.images && property.images.length > 0) {
      if (typeof property.images[0] === 'string') {
        console.log("Encontrada imagen en formato string:", property.images[0]);
        imageUrl = property.images[0];
      } else if (property.images[0] && property.images[0].src) {
        console.log("Encontrada imagen en formato objeto:", property.images[0].src);
        imageUrl = property.images[0].src;
      }
    }
    
    if (!imageUrl) {
      console.log("No se encontró imagen, usando placeholder");
      imageUrl = 'https://via.placeholder.com/400x300?text=Propiedad';
    }
    
    return imageUrl;
  };

  // Función para corregir URLs HTTP a HTTPS
  const ensureHttps = (url) => {
    if (!url) return null;
    return typeof url === 'string' ? url.replace('http://', 'https://') : url;
  };

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
                    {/* Agregar un botón de depuración directamente en la UI para desarrollo */}
                    {import.meta.env.DEV && (
                      <button 
                        onClick={() => {
                          console.log("DEPURACIÓN DE IMAGEN DE PERFIL");
                          console.log("Usuario:", user);
                          console.log("Tipo de profilePic:", typeof user?.profilePic);
                          console.log("Usuario JSON:", JSON.stringify(user, null, 2));
                          console.log("LocalStorage profilePic:", localStorage.getItem('profilePic'));
                          
                          // Intentar cargar directamente desde localStorage
                          const storedProfilePic = localStorage.getItem('profilePic');
                          alert(`URL desde localStorage: ${storedProfilePic || 'no encontrada'}`);
                        }}
                        className="absolute top-0 right-0 z-10 bg-red-500 text-white text-xs p-1"
                      >
                        Debug
                      </button>
                    )}
                    
                    <img 
                      src={getProfileImageUrl(user, defaultProfilePic)}
                      alt="Perfil" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Error cargando imagen de perfil:", e);
                        // Intentar directamente con la imagen en localStorage
                        const storedImg = localStorage.getItem('profilePic');
                        if (storedImg && storedImg !== e.target.src) {
                          console.log("Intentando con imagen en localStorage:", storedImg);
                          e.target.src = storedImg;
                        } else {
                          console.log("Usando imagen por defecto");
                          e.target.src = defaultProfilePic;
                        }
                      }}
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
        {console.log("Renderizando el contenido principal, loading:", loading)}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Blogs */}
            {console.log("Número de blogs a mostrar:", blogs.length)}
            {blogs.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white">Blogs Recientes</h2>
                  <Link to="/ver-blogs" className="text-blue-200 hover:text-white transition">
                    Ver todos →
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {blogs.map((blog, index) => {
                    console.log(`Renderizando blog ${index}:`, blog);
                    const imageUrl = getImageUrl(blog);
                    console.log(`URL de imagen final para blog ${index}:`, imageUrl);
                    
                    return (
                      <div 
                        key={blog._id} 
                        className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/20 transform transition hover:scale-105"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={imageUrl}
                            alt={blog.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log(`Error cargando imagen para blog ${blog.title}`);
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
                    );
                  })}
                </div>
              </section>
            )}

            {/* Propiedades */}
            {console.log("Número de propiedades a mostrar:", properties.length)}
            {properties.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white">Propiedades Destacadas</h2>
                  <Link to="/propiedades" className="text-blue-200 hover:text-white transition">
                    Ver todas →
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {properties.map((property, index) => {
                    console.log(`Renderizando propiedad ${index}:`, property);
                    const imageUrl = getPropertyImageUrl(property);
                    console.log(`URL de imagen final para propiedad ${index}:`, imageUrl);
                    
                    return (
                      <div 
                        key={property._id} 
                        className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/20 transform transition hover:scale-105"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={imageUrl}
                            alt={property.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log(`Error cargando imagen para propiedad ${property.title}`);
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
                    );
                  })}
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
