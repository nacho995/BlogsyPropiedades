import React, { useState, useEffect, Fragment } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// Variables requeridas para evitar errores TDZ en producción - NO ELIMINAR
window.y = window.y || {};
window.wi = window.wi || {};
window.Fp = window.Fp || {};
window.Nc = window.Nc || {};

// Definir variables localmente también
const y = {};
const wi = {};
const Fp = {};
const Nc = {};

// Definir fallback image localmente
const fallbackImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMWUxZTEiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzg4OCI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4=';

// Función de utilidad para combinar clases CSS
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar({ showOnlyAuth = false }) {
  // Variables locales para evitar TDZ
  const y = {};
  
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, loading: userLoading } = useUser();
  
  // Definir la imagen a mostrar usando el contexto y el fallback
  const displayProfileImage = user?.profileImage || fallbackImageBase64;

  // Manejador de error simple para la imagen
  const handleImageError = (e) => {
    if (e.target.src !== fallbackImageBase64) {
      console.warn(`NavBar: Error al cargar ${e.target.src}, usando fallback.`);
      e.target.src = fallbackImageBase64;
    }
  };
  
  // Verificar token expirado
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          console.log('Token expirado en NavBar, cerrando sesión...');
          logout(true);
        }
      } catch (error) {
        console.error('Error al verificar token en NavBar:', error);
        logout(true);
      }
    }
    
    // Verificar el token cada minuto para detectar expiración
    const tokenVerifier = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        try {
          const payload = JSON.parse(atob(currentToken.split('.')[1]));
          
          // Calcular tiempo restante en minutos
          const expiryTime = payload.exp * 1000;
          const timeRemaining = expiryTime - Date.now();
          const minutesRemaining = Math.floor(timeRemaining / 60000);
          
          // Si expira en menos de 2 minutos, mostrar advertencia
          if (timeRemaining > 0 && timeRemaining < 120000) {
            console.warn(`⚠️ Token expirará pronto (en ${minutesRemaining} minutos)`);
            // Mostrar toast de advertencia
            try {
              window.dispatchEvent(new CustomEvent('tokenExpiringWarning', {
                detail: { minutesRemaining }
              }));
            } catch (e) {
              console.error('Error al disparar evento de advertencia:', e);
            }
          }
          
          // Si ya expiró, cerrar sesión
          if (expiryTime < Date.now()) {
            console.log('Token expirado durante la verificación periódica en NavBar, cerrando sesión...');
            
            // Limpiar datos de sesión y redireccionar
            try {
              // Despachar evento de cierre de sesión
              window.dispatchEvent(new CustomEvent('userLoggedOut', {
                detail: { reason: 'token_expired' }
              }));
              
              // Limpiar todos los datos relacionados con la sesión
              localStorage.removeItem("token");
              localStorage.removeItem("userData");
              localStorage.removeItem("userResponse");
              localStorage.removeItem("tempToken");
              localStorage.removeItem("email");
              localStorage.removeItem("name");
              localStorage.removeItem("role");
              
              // Actualizar estado local para reflejar el cierre de sesión
              logout(true);
            } catch (e) {
              console.error('Error al manejar expiración de token:', e);
              // Última opción - redirección directa
              window.location.href = "/login";
            }
            
            clearInterval(tokenVerifier);
          }
        } catch (e) {
          console.error('Error al verificar token periódicamente:', e);
          logout(true);
        }
      } else {
        // Si no hay token, verificar si debería estar no autenticado
        if (isAuthenticated) {
          console.warn('NavBar detectó estado inconsistente: autenticado pero sin token');
          logout(true);
        }
      }
    }, 60000); // Verificar cada minuto
    
    return () => {
      clearInterval(tokenVerifier);
    };
  }, [logout, isAuthenticated]);
  
  // Definir las rutas de navegación
  const navigation = [
    { name: 'Inicio', href: '/', current: location.pathname === '/' },
    { name: 'Blogs', href: '/ver-blogs', current: location.pathname === '/ver-blogs' },
    { name: 'Propiedades', href: '/propiedades', current: location.pathname === '/propiedades' },
  ];
  
  // Agregar rutas adicionales si el usuario está autenticado
  const userRoutes = [
    { name: 'Añadir Blog', href: '/crear-blog', current: location.pathname === '/crear-blog' },
    { name: 'Añadir Propiedad', href: '/add-property', current: location.pathname === '/add-property' },
  ];
  
  // Agregar rutas adicionales si el usuario es administrador
  const adminRoutes = [
    // Opciones específicas de administrador pueden ir aquí en el futuro
  ];

  // Si estamos en el modo showOnlyAuth, mostrar menú simplificado
  if (showOnlyAuth) {
    return (
      <Disclosure as="nav" className="bg-black text-white shadow-md">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
              <div className="flex justify-between h-16">
                {/* Logo */}
                <div className="flex">
                  <Link to="/" className="flex-shrink-0 flex items-center">
                    <img className="h-6 w-auto sm:h-8" src="/logo.jpg" alt="Logo" />
                    <span className="ml-2 text-sm sm:text-xl font-bold text-white">GozaMadrid - Subir Imágenes</span>
                  </Link>
                </div>
                
                {/* Perfil de usuario o login */}
                <div className="flex items-center">
                  {isAuthenticated ? (
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                          <span className="sr-only">Abrir menú de usuario</span>
                          {userLoading ? (
                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            </div>
                          ) : (
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={displayProfileImage}
                              alt="Foto de perfil"
                              onError={handleImageError}
                            />
                          )}
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => logout(true)}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block w-full text-left px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Cerrar Sesión
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (
                    <Link
                      to="/login"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Iniciar Sesión
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </Disclosure>
    );
  }

  // Construir la navegación combinada basada en permisos
  let updatedNavigation = [...navigation];
  
  if (isAuthenticated) {
    updatedNavigation = [...updatedNavigation, ...userRoutes];
    
    // Añadir rutas de administrador si el usuario tiene el rol necesario
    if (user?.role === 'admin' || user?.role === 'ADMIN' || user?.isAdmin === true) {
      updatedNavigation = [...updatedNavigation, ...adminRoutes];
    }
  }

  return (
    <Disclosure as="nav" className="bg-black text-white shadow-md sticky top-0 z-50">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
            <div className="relative flex h-14 sm:h-16 items-center justify-between">
              {/* Logo y navegación principal */}
              <div className="flex items-center">
                <Link to="/" className="flex-shrink-0 flex items-center">
                  <img className="h-6 w-auto sm:h-8" src="/logo.jpg" alt="Logo" />
                  <span className="ml-1 sm:ml-2 text-sm sm:text-base md:text-xl font-bold text-white truncate max-w-[120px] sm:max-w-none">GozaMadrid</span>
                </Link>
                
                {/* Enlaces de navegación en escritorio */}
                <div className="hidden md:ml-4 lg:ml-6 md:flex md:space-x-2 lg:space-x-4">
                  {updatedNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={classNames(
                        item.current
                          ? 'border-blue-400 text-blue-400'
                          : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300',
                        'inline-flex items-center px-1 sm:px-2 lg:px-3 py-2 border-b-2 text-xs sm:text-sm font-medium transition-colors duration-200'
                      )}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Menú de usuario */}
              <div className="hidden md:flex md:items-center">
                {isAuthenticated ? (
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <span className="hidden lg:block text-gray-300 text-sm">{user?.name || "Usuario"}</span>
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ring-offset-2 ring-offset-black">
                        <span className="sr-only">Abrir menú de usuario</span>
                        {userLoading ? (
                           <div className="w-8 h-8 lg:h-9 lg:w-9 rounded-full bg-gray-600 flex items-center justify-center border-2 border-gray-700">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                           </div>
                        ) : (
                          <img
                            className="h-8 w-8 lg:h-9 lg:w-9 rounded-full object-cover border-2 border-gray-700"
                            src={displayProfileImage}
                            alt="Perfil"
                            onError={handleImageError}
                          />
                        )}
                      </Menu.Button>
                      
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/cambiar-perfil"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Cambiar mi perfil
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => logout(true)}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block w-full text-left px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Cerrar Sesión
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Iniciar Sesión
                  </Link>
                )}
              </div>
              
              {/* Botón de menú en móvil */}
              <div className="flex items-center md:hidden">
                {isAuthenticated && (
                  <div className="flex items-center mr-2">
                     {userLoading ? (
                        <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center border border-gray-700">
                           <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                        </div>
                      ) : (
                       <img
                         className="h-7 w-7 rounded-full object-cover border border-gray-700"
                         src={displayProfileImage}
                         alt="Perfil"
                         onError={handleImageError}
                       />
                     )}
                  </div>
                )}
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400">
                  <span className="sr-only">Abrir menú principal</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* Panel de navegación móvil */}
          <Disclosure.Panel className="md:hidden bg-gray-900">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {updatedNavigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  to={item.href}
                  className={classNames(
                    item.current
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    'block rounded-md px-3 py-2 text-base font-medium'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
              {isAuthenticated && (
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex items-center px-3 py-2">
                    {userLoading ? (
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-2">
                         <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      </div>
                     ) : (
                      <img
                        className="h-8 w-8 rounded-full mr-2 object-cover"
                        src={displayProfileImage}
                        alt="Perfil"
                        onError={handleImageError}
                      />
                    )}
                    <span className="text-gray-300 text-sm font-medium">{user?.name || "Usuario"}</span>
                  </div>
                  <div className="mt-1">
                    <Link
                      to="/cambiar-perfil"
                      className="block text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
                    >
                      Cambiar mi perfil
                    </Link>
                    <button
                      onClick={() => logout(true)}
                      className="w-full text-left text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
