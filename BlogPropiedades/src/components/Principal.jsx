import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router-dom"; // Replace useHistory with useNavigate
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";
import useProfileImage from "../hooks/useProfileImage";

// Definimos las constantes y funciones que antes estaban en utils/imageUtils
const fallbackImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMWUxZTEiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzg4OCI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4=';

const ensureHttps = (url) => {
  if (!url) return url;
  return url.replace(/^http:\/\//i, 'https://');
};

// Importar funciones de API usando lazy loading para evitar problemas de inicialización
const ApiService = lazy(() => import("../services/api").then(module => ({
  default: {
    getBlogPosts: module.getBlogPosts,
    getPropertyPosts: module.getPropertyPosts,
    testApiConnection: module.testApiConnection
  }
})));

// Definir la imagen de perfil por defecto
const defaultProfilePic = fallbackImageBase64;

// Wrapper para ejecutar funciones de API de forma segura
const safeApiCall = async (apiFunction, ...args) => {
  try {
    // En caso de que la API no esté cargada, devolver un array vacío
    if (!apiFunction) {
      console.warn('Función de API no disponible');
      return [];
    }
    
    return await apiFunction(...args);
  } catch (error) {
    console.error('Error en llamada a API:', error);
    return [];
  }
};

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
  
  // Usar el hook de imagen directamente - esto asegura que siempre tengamos una imagen válida
  const { profileImage, handleImageError } = useProfileImage();
  
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

  // Modificar la función fetchData para usar lazy loading
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setApiStatus({ testing: true, status: 'pendiente' });
        let blogsData = [];
        let propertiesData = [];
        
        // Cargar servicios de API de forma lazy
        const apis = await import("../services/api");
        
        // Realizar prueba de conexión a la API primero
        console.log("Probando conexión a la API...");
        const apiTest = await safeApiCall(apis.testApiConnection);
        console.log("Resultados de prueba de API:", apiTest);
        
        // Actualizar estado basado en resultados de la prueba
        if (apiTest.error) {
          if (isMounted) setApiStatus({ testing: false, status: 'error', details: apiTest.message });
          console.error("Error de conexión a API:", apiTest.message);
        } else if (apiTest.blogs === 200 || apiTest.properties === 200) {
          if (isMounted) setApiStatus({ testing: false, status: 'conectado', details: apiTest });
          console.log("API conectada correctamente");
        } else {
          if (isMounted) setApiStatus({ testing: false, status: 'error', details: 'Códigos de estado incorrectos' });
          console.error("API devolvió códigos de estado incorrectos:", apiTest);
        }
        
        try {
          console.log("Intentando obtener blogs...");
          blogsData = await safeApiCall(apis.getBlogPosts);
          console.log("Blogs obtenidos:", blogsData);
        } catch (error) {
          console.error("Error al cargar blogs:", error);
          blogsData = []; // Usar array vacío en caso de error
        }
        
        try {
          console.log("Intentando obtener propiedades...");
          propertiesData = await safeApiCall(apis.getPropertyPosts);
          console.log("Propiedades obtenidas:", propertiesData);
        } catch (error) {
          console.error("Error al cargar propiedades:", error);
          propertiesData = []; // Usar array vacío en caso de error
        }
        
        // Si no hay datos de la API, usar datos de ejemplo para demostración
        if (blogsData.length === 0) {
          console.log("Usando datos de ejemplo para blogs");
          blogsData = [
            {
              id: "mock-blog-1",
              title: "Las tendencias inmobiliarias para 2025",
              description: "Descubre las nuevas tendencias que definirán el mercado inmobiliario en los próximos años.",
              content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
              category: "Tendencias",
              author: "María García",
              readTime: "7",
              createdAt: new Date().toISOString(),
              image: {
                src: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000",
                alt: "Tendencias inmobiliarias"
              }
            },
            {
              id: "mock-blog-2",
              title: "Cómo preparar tu casa para venderla",
              description: "Consejos prácticos para preparar tu vivienda antes de ponerla en venta en el mercado.",
              content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
              category: "Consejos",
              author: "Carlos Rodríguez",
              readTime: "5",
              createdAt: new Date().toISOString(),
              image: {
                src: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=1000",
                alt: "Casa en venta"
              }
            },
            {
              id: "mock-blog-3",
              title: "Inversión en propiedades: Guía para principiantes",
              description: "Todo lo que necesitas saber para comenzar a invertir en el mercado inmobiliario con éxito.",
              content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
              category: "Inversión",
              author: "Ana Martínez",
              readTime: "10",
              createdAt: new Date().toISOString(),
              image: {
                src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000",
                alt: "Inversión inmobiliaria"
              }
            }
          ];
        }
        
        if (propertiesData.length === 0) {
          console.log("Usando datos de ejemplo para propiedades");
          propertiesData = [
            {
              id: "mock-property-1",
              title: "Piso de lujo en el centro de Madrid",
              description: "Espectacular piso reformado en pleno centro con acabados de alta calidad y vistas panorámicas.",
              price: 450000,
              bedrooms: 3,
              bathrooms: 2,
              area: 120,
              location: "Madrid, Centro",
              status: "En venta",
              images: [
                {
                  src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000",
                  alt: "Exterior de la propiedad"
                }
              ]
            },
            {
              id: "mock-property-2",
              title: "Chalet independiente con piscina",
              description: "Espectacular chalet con amplio jardín, piscina privada y zona de barbacoa en urbanización exclusiva.",
              price: 750000,
              bedrooms: 5,
              bathrooms: 3,
              area: 280,
              location: "Las Rozas, Madrid",
              status: "En venta",
              images: [
                {
                  src: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000",
                  alt: "Chalet con piscina"
                }
              ]
            },
            {
              id: "mock-property-3",
              title: "Apartamento moderno en zona exclusiva",
              description: "Apartamento de diseño con amplias terrazas y zonas comunes premium con piscina y gimnasio.",
              price: 325000,
              bedrooms: 2,
              bathrooms: 2,
              area: 95,
              location: "Chamberí, Madrid",
              status: "En venta",
              images: [
                {
                  src: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1000",
                  alt: "Interior del apartamento"
                }
              ]
            }
          ];
        }
        
        if (isMounted) {
          setBlogs(blogsData || []);
          setProperties(propertiesData || []);
          setLoading(false);
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

  // Datos filtrados para mostrar solo los primeros 3 elementos
  const topBlogs = useMemo(() => {
    return blogs.slice(0, 3);
  }, [blogs]);

  const topProperties = useMemo(() => {
    return properties.slice(0, 3);
  }, [properties]);

  // Renderizar la interfaz principal
  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-400 to-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header mejorado con colores azules */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-600 shadow-lg">
        <div className="container mx-auto px-6 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-yellow-300">Blog</span> de Propiedades
          </h1>
          
          {/* Indicador de estado de API */}
          {apiStatus.testing && (
            <div className="absolute top-2 right-2 bg-blue-900 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-300 mr-1 animate-pulse"></div>
              Probando API...
            </div>
          )}
          {!apiStatus.testing && apiStatus.status === 'conectado' && (
            <div className="absolute top-2 right-2 bg-green-700 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-300 mr-1"></div>
              API conectada
            </div>
          )}
          {!apiStatus.testing && apiStatus.status === 'error' && (
            <div className="absolute top-2 right-2 bg-red-700 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <div className="w-2 h-2 rounded-full bg-red-300 mr-1"></div>
              Error de conexión
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <div className="flex space-x-2">
                <Link to="/login" className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-md transition duration-200">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold rounded-md transition duration-200">
                  Registrarse
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="relative" ref={profileMenuRef}>
                  <img 
                    src={profileImage} 
                    alt="Perfil" 
                    className="h-14 w-14 rounded-full border-3 border-yellow-300 object-cover shadow-lg cursor-pointer" 
                    onError={handleImageError}
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    title="Haz clic para opciones de perfil"
                  />
                  
                  {/* Menú desplegable */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-700">Hola, {name || 'Usuario'}</p>
                      </div>
                      <Link 
                        to="/profile/edit" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Cambiar mi perfil
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">Hola, {name || 'Usuario'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sección de bienvenida personalizada */}
      {isAuthenticated && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="container mx-auto px-4 sm:px-6 py-6 sm:py-10"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <img 
                src={profileImage} 
                alt="Perfil" 
                className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full border-4 border-blue-500 object-cover shadow-lg" 
                onError={handleImageError}
              />
              <Link 
                to="/profile/edit"
                className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-1.5 sm:p-2 shadow-md hover:bg-yellow-500 transition-colors"
                title="Editar mi perfil"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </Link>
            </div>
            <div className="text-center md:text-left mt-4 md:mt-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-800 mb-2">
                ¡Bienvenido a tu espacio creativo, <span className="text-blue-600">{name || 'Usuario'}!</span>
              </h2>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                Desde aquí podrás gestionar tus blogs y propiedades. ¿Qué te gustaría hacer hoy?
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3 mt-4">
                <Link to="/crear-blog" className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-md transition duration-200">
                  Crear nuevo blog
                </Link>
                <Link to="/add-property" className="px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 text-xs sm:text-sm font-medium rounded-md transition duration-200">
                  Añadir propiedad
                </Link>
                <Link to="/profile/edit" className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm font-medium rounded-md transition duration-200 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-5 sm:w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Editar mi perfil
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Banner principal con efecto parallax - solo para visitantes no autenticados */}
      {!isAuthenticated && (
        <div className="relative bg-blue-800 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-pattern-blueprint"></div>
          <div className="container mx-auto px-6 py-20 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="max-w-3xl"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Descubre las mejores propiedades y consejos inmobiliarios
              </h2>
              <p className="mt-6 text-xl text-blue-100">
                Tu fuente de información sobre el mercado inmobiliario, tendencias y oportunidades de inversión.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/blogs" className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold rounded-md shadow-lg hover:shadow-xl transition duration-300">
                  Explorar Blogs
                </Link>
                <Link to="/properties" className="px-6 py-3 bg-transparent hover:bg-blue-700 text-white border-2 border-white font-bold rounded-md hover:shadow-lg transition duration-300">
                  Ver Propiedades
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      )}
      
      {/* Contenedor principal para usuarios autenticados */}
      {isAuthenticated && (
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-10">
            <Link to="/blogs" className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 flex flex-col items-center justify-center hover:shadow-xl transition-all duration-300 border-l-4 border-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800 mb-2">Gestionar Blogs</h3>
              <p className="text-gray-600 text-sm text-center">Administra tus publicaciones, edita contenido y crea nuevos artículos.</p>
              <span className="mt-3 sm:mt-4 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-md transition duration-200">
                Ver mis blogs
              </span>
            </Link>
            
            <Link to="/properties" className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 flex flex-col items-center justify-center hover:shadow-xl transition-all duration-300 border-l-4 border-yellow-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-500 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800 mb-2">Gestionar Propiedades</h3>
              <p className="text-gray-600 text-sm text-center">Administra tus propiedades, actualiza la información y añade nuevos inmuebles.</p>
              <span className="mt-3 sm:mt-4 px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 text-xs sm:text-sm font-medium rounded-md transition duration-200">
                Ver mis propiedades
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Sección de blogs destacados */}
      <section className="py-16 bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center mb-12">
            <h2 className="text-3xl font-bold text-blue-800 mb-2">Blogs Destacados</h2>
            <div className="w-20 h-1 bg-yellow-400 rounded"></div>
          </div>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topBlogs.map((blog) => (
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
                      onError={(e) => { e.target.src = defaultProfilePic }}
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
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {blog.description}
                    </p>
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
              ))}
            </div>
          )}
          
          <div className="text-center mt-10">
            <Link to="/blogs" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-md hover:shadow-lg transition duration-300">
              Ver todos los blogs
            </Link>
          </div>
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
            <div className="flex justify-center">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topProperties.map((property) => (
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
                      onError={(e) => { e.target.src = defaultProfilePic }}
                    />
                    <div className="absolute top-0 right-0 bg-yellow-400 text-blue-900 font-bold text-sm px-3 py-1 m-3 rounded-md">
                      {property.status || "En venta"}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900 to-transparent p-4">
                      <div className="text-white font-bold text-xl">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(property.price || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-blue-900 mb-2 line-clamp-2">
                      {property.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {property.description}
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
              ))}
            </div>
          )}
          
          <div className="text-center mt-10">
            <Link to="/properties" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-md hover:shadow-lg transition duration-300">
              Ver todas las propiedades
            </Link>
          </div>
        </div>
      </section>

      {/* Sección de llamada a la acción */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-repeat" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIzIiBjeT0iMyIgcj0iMyIvPjxjaXJjbGUgY3g9IjEzIiBjeT0iMTMiIHI9IjMiLz48L2c+PC9zdmc+')" }}></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white leading-tight mb-6">
              ¿Buscas asesoramiento inmobiliario profesional?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Nuestro equipo de expertos está listo para ayudarte a encontrar la propiedad perfecta o a vender tu inmueble al mejor precio.
            </p>
            <Link to="/contact" className="inline-block px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold rounded-md shadow-lg hover:shadow-xl transition duration-300">
              Contactar ahora
            </Link>
          </div>
        </div>
      </section>

      {/* Footer mejorado */}
      <footer className="bg-blue-900 text-white py-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">
                <span className="text-yellow-300">Blog</span> de Propiedades
              </h3>
              <p className="text-blue-200">
                Tu fuente confiable de información inmobiliaria y propiedades destacadas.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2">
                <li><Link to="/blogs" className="text-blue-200 hover:text-yellow-300 transition">Blogs</Link></li>
                <li><Link to="/properties" className="text-blue-200 hover:text-yellow-300 transition">Propiedades</Link></li>
                <li><Link to="/about" className="text-blue-200 hover:text-yellow-300 transition">Sobre Nosotros</Link></li>
                <li><Link to="/contact" className="text-blue-200 hover:text-yellow-300 transition">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Síguenos</h4>
              <div className="flex space-x-4">
                <a href="https://facebook.com" className="bg-blue-800 hover:bg-blue-700 h-10 w-10 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
                  </svg>
                </a>
                <a href="https://twitter.com" className="bg-blue-800 hover:bg-blue-700 h-10 w-10 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="https://instagram.com" className="bg-blue-800 hover:bg-blue-700 h-10 w-10 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-300 text-sm">
            <p>© {new Date().getFullYear()} Blog de Propiedades. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Estilos adicionales para spinner y efectos */}
      <style jsx="true">{`
        .bg-pattern-blueprint {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 36px;
          height: 36px;
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
