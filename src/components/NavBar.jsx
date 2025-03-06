import React, { useEffect } from 'react';
import { Button, Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { toast } from 'react-hot-toast';

// IMPORTANTE: Declarar las variables globales FUERA del componente
// para evitar problemas de inicialización
const navigation = [
  { name: 'Dashboard', href: '/', current: false },
  { name: 'Añadir Blog', href: '/crear-blog', current: false },
  { name: 'Ver Blogs', href: '/ver-blogs', current: false },
  { name: 'Añadir Propiedades', href: '/add-property', current: false },
  { name: 'Ver Propiedades', href: '/propiedades', current: false },
];

// Imágenes predeterminadas estáticas - fuera del componente
const IMG_DEFAULTS = {
  profile: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  property: "https://place-hold.it/300x200?text=Propiedad",
  blog: "https://place-hold.it/300x200?text=Blog",
  fallback: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Ccircle cx='75' cy='75' r='75' fill='%23ccc'/%3E%3C/svg%3E"
};

function clases(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Función para convertir HTTP a HTTPS si el sitio usa HTTPS
const secureUrl = (url) => {
  if (typeof url !== 'string') return '';
  
  // Si estamos en HTTPS, convertir todas las URLs a HTTPS
  if (window.location.protocol === 'https:' && url.startsWith('http:')) {
    return url.replace('http:', 'https:');
  }
  return url;
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Usar el hook simplificado
  const { user, isAuthenticated, logout } = useUser();
  
  // Actualizamos la navegación según la ruta actual
  const updatedNavigation = navigation.map((item) => ({
    ...item,
    current: location.pathname === item.href,
  }));
  
  // Manejar el cierre de sesión
  const handleLogout = () => {
    logout();
  };

  // Función simplificada para manejar errores de imagen
  const handleImageError = (e) => {
    console.log("Error cargando imagen, usando imagen predeterminada");
    
    const type = e.target.dataset.type || 'fallback';
    
    // Verificar si la URL ya es una imagen de respaldo para evitar bucles
    if (e.target.src.includes(IMG_DEFAULTS[type]) || e.target.retryCount >= 2) {
      // Si ya estamos usando la imagen predeterminada y aún falla,
      // crear un avatar con iniciales directamente en el DOM
      e.target.style.display = 'none';
      e.target.onload = null;
      e.target.onerror = null;
      
      // Obtener el padre donde insertar el avatar alternativo
      const parent = e.target.parentNode;
      
      // Crear el avatar con iniciales
      const avatarDiv = document.createElement('div');
      avatarDiv.className = "h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center";
      avatarDiv.style.display = 'flex';
      avatarDiv.style.alignItems = 'center';
      avatarDiv.style.justifyContent = 'center';
      
      const initialSpan = document.createElement('span');
      initialSpan.className = "text-gray-600 font-semibold";
      initialSpan.textContent = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
      
      avatarDiv.appendChild(initialSpan);
      parent.appendChild(avatarDiv);
    } else {
      // Si aún no hemos intentado con la imagen predeterminada, intentarlo ahora
      e.target.src = IMG_DEFAULTS[type];
      // Marcar que ya hemos intentado una vez
      e.target.retryCount = (e.target.retryCount || 0) + 1;
      
      // Conservar onerror para máximo 2 intentos
      if (e.target.retryCount >= 2) {
        e.target.onerror = null;
      }
    }
  };

  useEffect(() => {
    const handleSessionExpired = (event) => {
      toast.error(event.detail?.message || 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    };
    
    window.addEventListener('session-expired', handleSessionExpired);
    
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [navigate]);

  // Función mejorada para renderizar avatar
  const renderUserAvatar = (user) => {
    if (!user) return null;
    
    let imageUrl = '';
    
    // Determinar la URL de la imagen según el tipo de dato
    if (typeof user.profilePic === 'object' && user.profilePic?.src) {
      imageUrl = user.profilePic.src;
    } else if (typeof user.profilePic === 'string') {
      imageUrl = user.profilePic;
    } else {
      // Intentar obtener del localStorage (podría ser un string JSON)
      const storedPic = localStorage.getItem('profilePic');
      if (storedPic) {
        try {
          // Intentar parsear como JSON
          const picObj = JSON.parse(storedPic);
          imageUrl = picObj.src || picObj;
        } catch (e) {
          // Si no es JSON válido, usar como string
          imageUrl = storedPic;
        }
      }
    }
    
    // Asegurar que la URL sea HTTPS si estamos en HTTPS
    imageUrl = secureUrl(imageUrl);
    
    // Agregar timestamp para evitar caché del navegador
    const finalUrl = imageUrl ? `${imageUrl}?t=${Date.now()}` : null;
    
    if (finalUrl) {
      return (
        <img
          className="h-8 w-8 rounded-full" 
          src={finalUrl}
          alt={`${user?.name || 'Usuario'}`}
          onError={handleImageError}
          data-type="profile"
        />
      );
    } else {
      // Fallback a avatar con iniciales
      return (
        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-600 font-semibold">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </span>
        </div>
      );
    }
  };

  return (
    <Disclosure as="nav" className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Botón de menú en móvil */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block h-6 w-6 group-data-[open]:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden h-6 w-6 group-data-[open]:block" />
            </DisclosureButton>
          </div>

          {/* Logo y navegación principal */}
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex flex-shrink-0 items-center">
              <img
                className="h-8 w-auto"
                src="logo.jpg"
                alt="Your Company"
              />
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {updatedNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clases(
                      item.current
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'rounded-md px-3 py-2 text-sm font-medium'
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Menú de usuario */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {isAuthenticated ? (
              <>
                {/* Botón de notificaciones */}
                <button
                  type="button"
                  className="rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </button>

                {/* Menú de perfil */}
                <Menu as="div" className="relative ml-3">
                  <MenuButton className="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                    <span className="sr-only">Open user menu</span>
                    {renderUserAvatar(user)}
                  </MenuButton>
                  <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <MenuItem>
                      {({ active }) => (
                        <Link
                          to="/cambiar-perfil"
                          className={clases(
                            active ? 'bg-gray-100' : '',
                            'block px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          Tu Perfil
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={clases(
                            active ? 'bg-gray-100' : '',
                            'block w-full text-left px-4 py-2 text-sm text-gray-700'
                          )}
                        >
                          Cerrar Sesión
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </>
            ) : (
              <Link
                to="/login"
                className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {updatedNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={clases(
                item.current
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                'block rounded-md px-3 py-2 text-base font-medium'
              )}
              aria-current={item.current ? 'page' : undefined}
            >
              {item.name}
            </Link>
          ))}
          {!isAuthenticated && (
            <Link
              to="/login"
              className="text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
