import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom"; // Replace useHistory with useNavigate
import { useUser } from "../context/UserContext";
import { getBlogPosts, getPropertyPosts } from "../services/api"; // Removed syncProfileImage import
import { motion } from "framer-motion";
import { fallbackImageBase64 } from "../utils";
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
      // Las APIs de GozaMadrid deben usar HTTPS
      if (url.includes('gozamadrid-api') || 
          url.includes('api.realestategozamadrid.com') ||
          url.includes('elasticbeanstalk.com')) {
        return url.replace('http://', 'https://');
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

  // Datos filtrados para mostrar solo los primeros 3 elementos
  const topBlogs = useMemo(() => {
    return blogs.slice(0, 3);
  }, [blogs]);

  const topProperties = useMemo(() => {
    return properties.slice(0, 3);
  }, [properties]);

  return (
    <motion.div 
      className="min-h-screen bg-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Blog de Propiedades</h1>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center">
                  <div className="relative group">
                    <img 
                      src={profileImage || defaultProfilePic} 
                      alt="Perfil" 
                      className="w-10 h-10 rounded-full border-2 border-blue-400 object-cover cursor-pointer"
                      onError={handleImageError}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <p className="font-bold">{name || 'Usuario'}</p>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </div>
                <nav className="hidden md:flex space-x-4">
                  <Link to="/blogs" className="py-2 px-4 text-blue-600 hover:text-blue-800 font-medium rounded-md hover:bg-blue-50 transition duration-300">Blogs</Link>
                  <Link to="/properties" className="py-2 px-4 text-blue-600 hover:text-blue-800 font-medium rounded-md hover:bg-blue-50 transition duration-300">Propiedades</Link>
                </nav>
              </>
            ) : (
              <div className="space-x-2">
                <Link to="/login" className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="py-2 px-4 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition">
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Banner principal */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="p-8 md:w-1/2">
                <h2 className="text-3xl font-bold text-white mb-4">Encuentra tu propiedad ideal</h2>
                <p className="text-blue-100 mb-6">Explora nuestra selección de propiedades y blogs sobre bienes raíces para encontrar tu hogar perfecto.</p>
                <div className="space-x-4">
                  <Link to="/blogs" className="inline-block py-2 px-6 bg-white text-blue-600 font-medium rounded-md hover:bg-blue-50 transition duration-300">
                    Ver Blogs
                  </Link>
                  <Link to="/properties" className="inline-block py-2 px-6 bg-transparent border border-white text-white font-medium rounded-md hover:bg-blue-700 transition duration-300">
                    Ver Propiedades
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2 hidden md:block">
                <img 
                  src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000" 
                  alt="Propiedad destacada" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sección de blogs destacados */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Blogs Destacados</h2>
            <Link to="/blogs" className="text-blue-600 hover:text-blue-800 font-medium">
              Ver todos →
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : topBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topBlogs.map((blog) => (
                <motion.div
                  key={blog._id || blog.id || `blog-${Math.random()}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300"
                  whileHover={{ y: -5 }}
                >
                  <div className="relative h-48 bg-blue-100">
                    <img
                      src={getImageUrl(blog) || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000'}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      {blog.category || 'Blog'}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{blog.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{blog.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {blog.author || 'Anónimo'} • {blog.readTime || '5'} min lectura
                      </span>
                      <Link
                        to={`/blog/${blog._id || blog.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Leer más
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <h3 className="text-xl font-medium text-gray-700 mb-2">No hay blogs disponibles</h3>
              <p className="text-gray-500 mb-4">Aún no se han publicado blogs en esta plataforma.</p>
              {isAuthenticated && (
                <Link
                  to="/blogs/new"
                  className="inline-block py-2 px-6 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-300"
                >
                  Crear nuevo blog
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Sección de propiedades destacadas */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Propiedades Destacadas</h2>
            <Link to="/properties" className="text-blue-600 hover:text-blue-800 font-medium">
              Ver todas →
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : topProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topProperties.map((property) => (
                <motion.div
                  key={property._id || property.id || `property-${Math.random()}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300"
                  whileHover={{ y: -5 }}
                >
                  <div className="relative h-48 bg-blue-100">
                    <img
                      src={getPropertyImageUrl(property) || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000'}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000';
                      }}
                    />
                    <div className="absolute top-0 left-0 bg-blue-600 text-white py-1 px-3 rounded-br">
                      {property.status || 'En venta'}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-gradient-to-l from-blue-900 to-transparent text-white p-2 w-full text-right">
                      <span className="font-bold">${property.price?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{property.title}</h3>
                    <p className="text-gray-500 mb-2 truncate">
                      <i className="fas fa-map-marker-alt mr-1"></i> {property.location || 'Madrid, España'}
                    </p>
                    <div className="flex justify-between text-gray-600 mb-4">
                      <span><i className="fas fa-bed mr-1"></i> {property.bedrooms || '0'} hab</span>
                      <span><i className="fas fa-bath mr-1"></i> {property.bathrooms || '0'} baños</span>
                      <span><i className="fas fa-vector-square mr-1"></i> {property.area || '0'} m²</span>
                    </div>
                    <Link
                      to={`/property/${property._id || property.id}`}
                      className="block text-center py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-300"
                    >
                      Ver detalles
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <h3 className="text-xl font-medium text-gray-700 mb-2">No hay propiedades disponibles</h3>
              <p className="text-gray-500 mb-4">Aún no se han publicado propiedades en esta plataforma.</p>
              {isAuthenticated && (
                <Link
                  to="/properties/new"
                  className="inline-block py-2 px-6 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-300"
                >
                  Publicar propiedad
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Sección de llamada a la acción */}
        <section className="bg-gray-50 p-8 rounded-xl shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">¿Buscas tu propiedad ideal?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Explora todas nuestras propiedades disponibles y encuentra tu hogar perfecto. También puedes leer nuestros blogs para consejos y tendencias del mercado inmobiliario.
            </p>
            <div className="space-x-4">
              <Link to="/properties" className="inline-block py-3 px-6 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-300">
                Ver propiedades
              </Link>
              <Link to="/blogs" className="inline-block py-3 px-6 bg-white border border-blue-600 text-blue-600 font-medium rounded-md hover:bg-blue-50 transition duration-300">
                Explorar blogs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-bold mb-2">Blog de Propiedades</h3>
              <p className="text-gray-400">Tu fuente de información inmobiliaria</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-bold mb-4">Enlaces</h4>
                <ul className="space-y-2">
                  <li><Link to="/" className="text-gray-400 hover:text-white">Inicio</Link></li>
                  <li><Link to="/blogs" className="text-gray-400 hover:text-white">Blogs</Link></li>
                  <li><Link to="/properties" className="text-gray-400 hover:text-white">Propiedades</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><Link to="/privacy" className="text-gray-400 hover:text-white">Privacidad</Link></li>
                  <li><Link to="/terms" className="text-gray-400 hover:text-white">Términos</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Contacto</h4>
                <ul className="space-y-2">
                  <li className="text-gray-400">info@blogpropiedades.com</li>
                  <li className="text-gray-400">+34 91 123 45 67</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Blog de Propiedades. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

export default Principal;
