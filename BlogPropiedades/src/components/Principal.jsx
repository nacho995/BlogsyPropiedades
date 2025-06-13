import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router-dom"; // Replace useHistory with useNavigate
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";
import { FiMapPin, FiCamera, FiHome, FiTrendingUp, FiChevronRight, FiClock, FiUsers, FiStar, FiPlay, FiSearch, FiFilter, FiHeart, FiPhone, FiMail, FiMessageCircle, FiInstagram, FiTwitter } from 'react-icons/fi';
import { getProperties, getBlogPosts } from '../services/api';
import { toast } from 'sonner';
import { formatPrice } from '../utils';

// Definimos las constantes y funciones que antes estaban en utils/imageUtils
const fallbackImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMWUxZTEiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzg4OCI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4=';

const ensureHttps = (url) => {
  if (!url) return url;
  return url.replace(/^http:\/\//i, 'https://');
};

// Función para eliminar etiquetas HTML
const stripHtml = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

// Importar funciones de API usando lazy loading para evitar problemas de inicialización
const ApiService = lazy(() => import("../services/api").then(module => ({
  default: {
    getBlogs: module.getBlogs,
    getProperties: module.getProperties,
    testConnection: module.testConnection
  }
})));

// Definir la imagen de perfil por defecto
const defaultProfilePic = fallbackImageBase64;

// Wrapper para ejecutar funciones de API de forma segura
const safeApiCall = async (apiFunction, fallback = []) => {
  try {
    if (typeof apiFunction !== 'function') {
      console.warn('Función de API no disponible, usando fallback');
      return fallback;
    }
    const result = await apiFunction();
    return result || fallback;
  } catch (error) {
    console.error('Error en llamada a API:', error);
    return fallback;
  }
};

// Componentes para mostrar "No hay datos"
const NoDataCard = ({ type, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="col-span-full flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-8 text-center"
  >
    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-blue-800 mb-2">No hay {type} disponibles</h3>
    <p className="text-gray-600 mb-4">Sé el primero en crear nuevo contenido.</p>
    <Link 
      to={type === "blogs" ? "/crear-blog" : "/add-property"} 
      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-300"
    >
      {type === "blogs" ? "Crear un blog" : "Añadir una propiedad"}
    </Link>
  </motion.div>
);

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
  const [apiStatus, setApiStatus] = useState({ testing: true, status: 'pendiente' });
  
  // Estado para controlar la visibilidad del menú de perfil
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  
  // Obtener datos del usuario
  const { user, isAuthenticated: userAuthenticated, logout } = useUser();
  const navigate = useNavigate(); // Replace useHistory with useNavigate

  // Efecto para cerrar el menú de perfil al hacer clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

  // Cargar datos de blogs y propiedades
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setApiStatus({ testing: true, status: 'pendiente' });
        
        // Configurar APIs disponibles con fallbacks seguros
        const apis = {
          getBlogs: module.getBlogs,
          getProperties: module.getProperties,
          testConnection: module.testConnection,
        };

        console.log('APIs disponibles:', Object.keys(apis));

        // Función auxiliar para llamadas seguras a la API
        const safeApiCall = async (apiFunction, fallback = []) => {
          try {
            if (typeof apiFunction !== 'function') {
              console.warn('Función de API no disponible, usando fallback');
              return fallback;
            }
            const result = await apiFunction();
            return result || fallback;
          } catch (error) {
            console.error('Error en llamada a API:', error);
            return fallback;
          }
        };

        // Probar conexión primero
        const isConnected = await safeApiCall(apis.testConnection, false);
        
        if (isConnected) {
          console.log('API conectada correctamente');
          
          // Obtener datos en paralelo
          const [blogsData, propertiesData] = await Promise.all([
            safeApiCall(apis.getBlogs),
            safeApiCall(apis.getProperties)
          ]);
          
          if (isMounted) {
            setBlogs(blogsData || []);
            setProperties(propertiesData || []);
            setLoading(false);
          }
        } else {
          if (isMounted) setApiStatus({ testing: false, status: 'error', details: 'Códigos de estado incorrectos' });
          console.error("API devolvió códigos de estado incorrectos:", isConnected);
        }
      } catch (generalError) {
        console.error("Error general al cargar datos:", generalError);
        if (isMounted) {
          setBlogs([]);
          setProperties([]);
          setLoading(false);
        }
      }
    };
    
    // Usar un pequeño timeout para asegurar que todo esté inicializado
    const timer = setTimeout(() => {
      fetchData();
    }, 100);
    
    return () => {
      clearTimeout(timer);
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
          return ensureHttps(imageUrl);
        }
      }
      
      // Caso 2: La imagen es un string directo
      if (blog.image && typeof blog.image === 'string') {
        console.log(`Imagen es un string directo:`, blog.image);
        
        if (blog.image.trim() !== '') {
          return ensureHttps(blog.image);
        }
      }
      
      // Caso 3: Usar la primera imagen del array de imágenes
      if (blog.images && Array.isArray(blog.images) && blog.images.length > 0) {
        console.log(`Usando primera imagen del array:`, blog.images[0]);
        
        const firstImage = blog.images[0];
        if (typeof firstImage === 'string') {
          return ensureHttps(firstImage);
        } else if (firstImage && typeof firstImage === 'object' && firstImage.src) {
          return ensureHttps(firstImage.src);
        }
      }
    } catch (error) {
      console.error('Error al procesar imagen del blog:', error);
    }
    
    // Si todo falla, usar imagen por defecto
    return defaultProfilePic;
  };
  
  // Función segura para manejar el cierre de sesión
  const handleLogout = () => {
    console.log("Cerrando sesión...");
    
    try {
      logout(true);
    } catch (error) {
      console.error("Error durante el cierre de sesión:", error);
      localStorage.clear();
      navigate('/login');
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

  // Datos filtrados para mostrar solo los primeros 3 elementos
  const topBlogs = useMemo(() => blogs.slice(0, 3), [blogs]);
  const topProperties = useMemo(() => properties.slice(0, 3), [properties]);

  // Renderizar la interfaz principal
  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-700 to-blue-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section con Efecto Parallax */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900 opacity-80"></div>
        
        {/* Patrón de fondo creativo */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 0 10 L 40 10 M 10 0 L 10 40" stroke="white" strokeWidth="0.5" fill="none" />
              </pattern>
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
        
        {/* Contenido del hero */}
        <div className="relative container mx-auto px-6 pt-24 pb-16 z-10">
          {isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="flex flex-col md:flex-row items-center gap-8"
            >
              {/* Imagen de perfil con efecto de animación */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-50 blur-md animate-pulse"></div>
                <div className="relative z-10">
                  <img 
                    src={user?.profileImage || fallbackImageBase64} 
                    alt="Perfil"
                    className="h-28 w-28 md:h-36 md:w-36 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                </div>
                <Link 
                  to="/cambiar-perfil"
                  className="absolute bottom-0 right-0 bg-yellow-400 rounded-full p-2 shadow-lg hover:bg-yellow-500 transition-colors z-20"
                  title="Editar perfil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </Link>
              </div>
              
              {/* Texto de bienvenida personalizado */}
              <div className="text-center md:text-left">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">¡Bienvenido</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-100">, {user?.name || name || 'Usuario'}!</span>
                  </h1>
                  <p className="mt-4 text-lg md:text-xl text-blue-100">
                    ¿Qué te gustaría hacer hoy? Explora o crea nuevo contenido y administra tus publicaciones
                  </p>
                  
                  <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-3">
                    <Link to="/crear-blog" className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Crear nuevo blog
                      </span>
                    </Link>
                    <Link to="/add-property" className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Añadir propiedad
                      </span>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                  Blog de Propiedades
                </span>
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Tu portal para descubrir y compartir contenido inmobiliario de calidad.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/login" className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                  Registrarse
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Sección de Tablero - Accesos rápidos */}
      {isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="container mx-auto px-6 py-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-lg flex flex-col items-center md:items-start text-center md:text-left hover:shadow-xl transition-shadow">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Gestionar Blogs</h3>
              <p className="mb-4">Administra tus publicaciones, edita contenido y crea nuevos artículos.</p>
              <Link to="/ver-blogs" className="mt-auto px-4 py-2 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors">
                Ver blogs
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl p-6 text-blue-900 shadow-lg flex flex-col items-center md:items-start text-center md:text-left hover:shadow-xl transition-shadow">
              <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Gestionar Propiedades</h3>
              <p className="mb-4">Administra tus propiedades, actualiza información y añade nuevos inmuebles.</p>
              <Link to="/propiedades" className="mt-auto px-4 py-2 bg-white text-yellow-700 font-medium rounded-lg hover:bg-yellow-50 transition-colors">
                Ver propiedades
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sección de blogs destacados */}
      <section className="py-16 bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center mb-12">
            <h2 className="text-3xl font-bold text-blue-800 mb-2">Blogs Destacados</h2>
            <div className="w-20 h-1 bg-yellow-400 rounded"></div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : blogs.length === 0 ? (
            <NoDataCard 
              type="blogs" 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              } 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topBlogs.map((blog) => {
                console.log(`[Principal Debug] Blog ID: ${blog._id}, Raw Description:`, blog.description);
                return (
                  <motion.div
                    key={blog.id || blog._id}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                  >
                    <div className="h-48 overflow-hidden">
                      <img
                        src={getImageUrl(blog)}
                        alt={blog.title}
                        className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-6">
                      <div className="mb-3">
                        <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full">
                          {blog.category || "General"}
                        </span>
                        <span className="inline-block px-3 py-1 ml-2 text-xs font-semibold text-blue-800 bg-yellow-300 rounded-full">
                          {blog.readTime || "5"} min lectura
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-blue-900 mb-2 line-clamp-2">
                        {blog.title}
                      </h3>
                      <div 
                        className="text-gray-600 mb-4 line-clamp-3 blog-description-preview" 
                      >
                        {stripHtml(blog.description || '')}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700 font-medium text-sm">
                          Por {blog.author || "Admin"}
                        </span>
                        <Link
                          to={`/blog/${blog.id || blog._id}`}
                          className="px-3 py-1 text-blue-700 border border-blue-700 rounded hover:bg-blue-700 hover:text-white transition-colors duration-300 text-sm font-medium"
                        >
                          Leer más
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {blogs.length > 0 && (
            <div className="text-center mt-10">
              <Link to="/ver-blogs" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-md hover:shadow-lg transition duration-300">
                Ver todos los blogs
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Sección de propiedades destacadas */}
      <section className="py-16 bg-blue-50/70 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center mb-12">
            <h2 className="text-3xl font-bold text-blue-800 mb-2">Propiedades Destacadas</h2>
            <div className="w-20 h-1 bg-yellow-400 rounded"></div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : properties.length === 0 ? (
            <NoDataCard 
              type="propiedades" 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              } 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topProperties.map((property) => {
                console.log(`[Principal Debug] Property ID: ${property._id}, Raw Description:`, property.description);
                return (
                  <motion.div
                    key={property.id || property._id}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full"
                  >
                    <div className="h-56 overflow-hidden relative">
                      <img
                        src={getPropertyImageUrl(property)}
                        alt={property.title}
                        className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-0 right-0 bg-yellow-400 text-blue-900 font-bold text-sm px-3 py-1 m-3 rounded-md">
                        {property.status || "En venta"}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900 to-transparent p-4">
                        <div className="text-white font-bold text-xl">
                          {formatPrice(property.price)}
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-blue-900 mb-2 line-clamp-2">
                        {property.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {stripHtml(property.description || '')}
                      </p>
                      <div className="flex justify-between items-center text-blue-800 mb-4">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-1" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M21 9h-8V3H3v18h18V9zM5 19V5h6v14H5zm14 0h-6v-8h6v8z"></path>
                          </svg>
                          <span>{property.bedrooms || 0} hab.</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-1" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M21 10H7V7c0-1.103.897-2 2-2s2 .897 2 2h2c0-2.206-1.794-4-4-4S5 4.794 5 7v3H3a1 1 0 0 0-1 1v2c0 2.606 1.674 4.823 4 5.65V22h2v-3h8v3h2v-3.35c2.326-.827 4-3.044 4-5.65v-2a1 1 0 0 0-1-1zm-1 3c0 2.206-1.794 4-4 4H8c-2.206 0-4-1.794-4-4v-1h16v1z"></path>
                          </svg>
                          <span>{property.bathrooms || 0} baños</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-1" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M12 2a9.5 9.5 0 0 0-9.5 9.5c0 5.095 7.91 11.86 8.26 12.17a1 1 0 0 0 1.48 0c.35-.31 8.26-7.075 8.26-12.17A9.5 9.5 0 0 0 12 2zm0 13.5a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"></path>
                          </svg>
                          <span>{property.area || 0} m²</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700 font-medium truncate max-w-[150px]">
                          {property.location || "Madrid"}
                        </span>
                        <Link
                          to={`/property/${property.id || property._id}`}
                          className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-blue-900 rounded font-medium transition-colors duration-300 text-sm"
                        >
                          Ver detalles
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {properties.length > 0 && (
            <div className="text-center mt-10">
              <Link to="/propiedades" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-md hover:shadow-lg transition duration-300">
                Ver todas las propiedades
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer mejorado */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">
                <span className="text-yellow-300">Blog</span> de Propiedades
              </h3>
              <p className="text-blue-200">
                Tu plataforma de gestión inmobiliaria y publicación de contenido especializado.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2">
                <li><Link to="/ver-blogs" className="text-blue-200 hover:text-yellow-300 transition">Blogs</Link></li>
                <li><Link to="/propiedades" className="text-blue-200 hover:text-yellow-300 transition">Propiedades</Link></li>
                {isAuthenticated && (
                  <>
                    <li><Link to="/crear-blog" className="text-blue-200 hover:text-yellow-300 transition">Crear Blog</Link></li>
                    <li><Link to="/add-property" className="text-blue-200 hover:text-yellow-300 transition">Añadir Propiedad</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Cuenta</h4>
              <ul className="space-y-2">
                {isAuthenticated ? (
                  <>
                    <li><Link to="/cambiar-perfil" className="text-blue-200 hover:text-yellow-300 transition">Mi Perfil</Link></li>
                    <li><button onClick={handleLogout} className="text-blue-200 hover:text-yellow-300 transition">Cerrar Sesión</button></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login" className="text-blue-200 hover:text-yellow-300 transition">Iniciar Sesión</Link></li>
                    <li><Link to="/register" className="text-blue-200 hover:text-yellow-300 transition">Registrarse</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-300 text-sm">
            <p>© {new Date().getFullYear()} Blog de Propiedades. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Estilos adicionales para spinner y efectos */}
      <style jsx="true">{`
        .spinner {
          border: 4px solid rgba(59, 130, 246, 0.2);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border-left-color: #3B82F6;
          animation: spin 1s linear infinite;
        }
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
        .line-clamp-3 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}

export default Principal;
