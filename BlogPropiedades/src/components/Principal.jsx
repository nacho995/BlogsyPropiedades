import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom"; // Replace useHistory with useNavigate
import { useUser } from "../context/UserContext";
import { getBlogPosts, getPropertyPosts } from "../services/api"; // Removed syncProfileImage import
import { motion } from "framer-motion";
import { fallbackImageBase64 } from "../utils/profileUtils";
import useProfileImage from "../hooks/useProfileImage"; // Import the new hook

// Definir la imagen de perfil por defecto
const defaultProfilePic = fallbackImageBase64;

function Principal() {
  // Obtener estado de autenticación directamente de localStorage
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");
  const isAuthenticated = !!token;
  
  // Estado para almacenar propiedades y blogs
  const [properties, setProperties] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  
  // Usar el hook personalizado para manejar la imagen de perfil
  const { 
    profileImage, 
    isLoading: profileLoading, 
    error: profileError, 
    handleImageError 
  } = useProfileImage({
    autoSync: true,
    listenForUpdates: true
  });
  
  // Obtener datos del usuario
  const { user, isAuthenticated: userAuthenticated, logout } = useUser();
  const navigate = useNavigate(); // Replace useHistory with useNavigate

  // Verificar si hay un problema de contenido mixto debido a la configuración de la API
  useEffect(() => {
    try {
      const currentProtocol = window.location.protocol;
      
      if (currentProtocol === 'https:') {
        console.log('La aplicación está cargada con HTTPS, verificando compatibilidad con API...');
        
        // Verificar si hay una advertencia de contenido mixto
        const mixedContentWarning = localStorage.getItem('mixedContentWarning');
        
        if (mixedContentWarning) {
          try {
            const warningData = JSON.parse(mixedContentWarning);
            const now = new Date();
            const warningTime = new Date(warningData.timestamp);
            
            // Si la advertencia es reciente (menos de 1 hora)
            if ((now - warningTime) < 3600000) {
              console.warn('⚠️ Detectados recientes problemas de contenido mixto (HTTP vs HTTPS)');
              console.log('Para mejor compatibilidad, considere usar HTTP en lugar de HTTPS o configurar Cloudflare correctamente');
            }
          } catch (e) {
            console.error('Error al procesar advertencia de contenido mixto:', e);
          }
        }
      }
    } catch (e) {
      console.error('Error al verificar protocolo:', e);
    }
  }, []);

  // Cargar datos reales de la API con protección contra errores
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        let blogsData = [];
        let propertiesData = [];
        
        try {
          console.log("Intentando obtener blogs...");
          blogsData = await getBlogPosts();
          console.log("Blogs obtenidos:", blogsData);
        } catch (error) {
          console.error("Error al cargar blogs:", error);
          blogsData = []; // Usar array vacío en caso de error
        }
        
        try {
          console.log("Intentando obtener propiedades...");
          propertiesData = await getPropertyPosts();
          console.log("Propiedades obtenidas:", propertiesData);
        } catch (error) {
          console.error("Error al cargar propiedades:", error);
          propertiesData = []; // Usar array vacío en caso de error
        }
        
        // Incluso si ambas peticiones fallan, continuamos con arrays vacíos
        setBlogs(blogsData || []);
        setProperties(propertiesData || []);
        setLoading(false);
      } catch (generalError) {
        console.error("Error general al cargar datos:", generalError);
        setBlogs([]);
        setProperties([]);
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Función para obtener la URL de la imagen de un blog, con manejo de errores mejorado
  const getImageUrl = (blog) => {
    if (!blog) return defaultProfilePic;
    
    try {
      console.log(`Obteniendo URL de imagen para blog:`, blog.title || 'sin título');
      
      // Caso 1: La imagen es un objeto con src
      if (blog.image && typeof blog.image === 'object' && blog.image.src) {
        const imageUrl = blog.image.src;
        console.log(`Imagen es un objeto con src:`, imageUrl);
        
        // Verificar si la URL es válida
        if (typeof imageUrl === 'string' && imageUrl.trim() !== '') {
          return ensureCorrectProtocol(imageUrl);
        }
      }
      
      // Caso 2: La imagen es un string directo
      if (blog.image && typeof blog.image === 'string') {
        console.log(`Imagen es un string directo:`, blog.image);
        
        if (blog.image.trim() !== '') {
          return ensureCorrectProtocol(blog.image);
        }
      }
      
      // Caso 3: Usar la primera imagen del array de imágenes
      if (blog.images && Array.isArray(blog.images) && blog.images.length > 0) {
        console.log(`Usando primera imagen del array:`, blog.images[0]);
        
        const firstImage = blog.images[0];
        if (typeof firstImage === 'string') {
          return ensureCorrectProtocol(firstImage);
        } else if (firstImage && typeof firstImage === 'object' && firstImage.src) {
          return ensureCorrectProtocol(firstImage.src);
        }
      }
    } catch (error) {
      console.error('Error al procesar imagen del blog:', error);
    }
    
    // Si todo falla, usar imagen por defecto
    return defaultProfilePic;
  };
  
  // Función para asegurar que siempre se use HTTPS para las APIs
  const ensureCorrectProtocol = (url) => {
    if (!url) return defaultProfilePic;
    
    try {
      // Las APIs de GozaMadrid necesitan usar HTTP
      if (url.includes('gozamadrid-api') || 
          url.includes('api.realestategozamadrid.com') ||
          url.includes('goza-madrid.onrender.com') ||
          url.includes('elasticbeanstalk.com')) {
        return url.replace('https://', 'http://');
      }
      return url;
    } catch (e) {
      console.error('Error al procesar URL:', e);
      return url;
    }
  };
  
  // Función segura para manejar el cierre de sesión
  const handleLogout = () => {
    console.log("Cerrando sesión...");
    
    try {
      // Usar el método de logout del contexto
      logout(true);
    } catch (error) {
      console.error("Error durante el cierre de sesión:", error);
      
      // Fallback: limpiar manualmente localStorage y redireccionar
      try {
        localStorage.clear(); // Limpiar todo para prevenir problemas
        navigate('/login');
      } catch (e) {
        console.error("Error en el fallback de cierre de sesión:", e);
        window.location.href = '/login';
      }
    }
  };

  const getPropertyImageUrl = (property) => {
    console.log(`Obteniendo URL de imagen para propiedad:`, property.title || 'sin título');
    
    // Caso 1: Verificar si hay imágenes en el array
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      const firstImage = property.images[0];
      console.log(`Primera imagen del array:`, firstImage);
      
      // Si la primera imagen es un objeto con src
      if (typeof firstImage === 'object' && firstImage.src) {
        const imageUrl = firstImage.src;
        
        // Verificar si la URL es válida
        if (typeof imageUrl === 'string' && 
            imageUrl.trim() !== '' && 
            imageUrl !== '""' && 
            imageUrl !== '"' && 
            imageUrl !== "''") {
          
          // Verificar si es una URL de placeholder
          if (imageUrl.includes('placeholder.com') || imageUrl.includes('via.placeholder')) {
            console.log(`URL de placeholder detectada, usando imagen por defecto`);
            return null;
          }
          
          return imageUrl;
        }
      }
      
      // Si la primera imagen es una cadena
      if (typeof firstImage === 'string') {
        const imageUrl = firstImage;
        
        // Verificar si la URL es válida
        if (imageUrl.trim() !== '' && 
            imageUrl !== '""' && 
            imageUrl !== '"' && 
            imageUrl !== "''") {
          
          // Verificar si es una URL de placeholder
          if (imageUrl.includes('placeholder.com') || imageUrl.includes('via.placeholder')) {
            console.log(`URL de placeholder detectada, usando imagen por defecto`);
            return null;
          }
          
          return imageUrl;
        }
      }
    }
    
    // Caso 2: Verificar si hay una imagen principal
    if (property.image) {
      console.log(`Intentando con la imagen principal:`, property.image);
      
      // Si la imagen principal es un objeto con src
      if (typeof property.image === 'object' && property.image.src) {
        const imageUrl = property.image.src;
        
        // Verificar si la URL es válida
        if (typeof imageUrl === 'string' && 
            imageUrl.trim() !== '' && 
            imageUrl !== '""' && 
            imageUrl !== '"' && 
            imageUrl !== "''") {
          
          // Verificar si es una URL de placeholder
          if (imageUrl.includes('placeholder.com') || imageUrl.includes('via.placeholder')) {
            console.log(`URL de placeholder detectada, usando imagen por defecto`);
            return null;
          }
          
          return imageUrl;
        }
      }
      
      // Si la imagen principal es una cadena
      if (typeof property.image === 'string') {
        const imageUrl = property.image;
        
        // Verificar si la URL es válida
        if (imageUrl.trim() !== '' && 
            imageUrl !== '""' && 
            imageUrl !== '"' && 
            imageUrl !== "''") {
          
          // Verificar si es una URL de placeholder
          if (imageUrl.includes('placeholder.com') || imageUrl.includes('via.placeholder')) {
            console.log(`URL de placeholder detectada, usando imagen por defecto`);
            return null;
          }
          
          return imageUrl;
        }
      }
    }
    
    // Si no hay imagen válida, devolver null
    console.log(`No se encontró ninguna imagen válida`);
    return null;
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
              
              {/* Perfil de usuario con animación - Diseño mejorado */}
              {isAuthenticated && (
                <div className="relative flex justify-center items-center py-8">
                  {/* Círculos decorativos alrededor de la imagen */}
                  <div className="absolute w-44 h-44 md:w-56 md:h-56 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-20 animate-pulse-slow"></div>
                  <div className="absolute w-52 h-52 md:w-64 md:h-64 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 opacity-10 animate-spin-slow"></div>
                  
                  {/* Contenedor principal de la imagen */}
                  <div className="relative">
                    {/* Efecto de brillo alrededor de la imagen */}
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-blue-500 to-purple-600 opacity-40 blur-md"></div>
                    
                    {/* Imagen de perfil */}
                    <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-white/80 shadow-2xl bg-white transform transition-all duration-500 hover:scale-105 z-10">
                      <img 
                        src={profileImage || fallbackImageBase64} 
                        alt="Foto de perfil" 
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                      
                      {/* Overlay con efecto de brillo */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
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
                  {blogs.map((blog, index) => {
                    const imageUrl = getImageUrl(blog);
                    
                    return (
                      <div 
                        key={blog._id} 
                        className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/20 transform transition hover:scale-105"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="h-48 overflow-hidden">
                          {imageUrl ? (
                            <img 
                              src={imageUrl}
                              alt={blog.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log(`Error cargando imagen para blog ${blog.title}`);
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = '<div class="flex items-center justify-center w-full h-full bg-gray-100"><span class="text-gray-400">Imagen no disponible</span></div>';
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gray-100">
                              <span className="text-gray-400">Imagen no disponible</span>
                            </div>
                          )}
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
                    const imageUrl = getPropertyImageUrl(property);
                    
                    return (
                      <div 
                        key={property._id} 
                        className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/20 transform transition hover:scale-105"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="h-48 overflow-hidden">
                          {imageUrl ? (
                            <img 
                              src={imageUrl}
                              alt={property.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log(`Error cargando imagen para propiedad ${property.title}`);
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = '<div class="flex items-center justify-center w-full h-full bg-gray-100"><span class="text-gray-400">Imagen no disponible</span></div>';
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gray-100">
                              <span className="text-gray-400">Imagen no disponible</span>
                            </div>
                          )}
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
      <style>
        {`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        .animate-pulse {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }
        `}
      </style>
    </div>
  );
}

export default Principal;
