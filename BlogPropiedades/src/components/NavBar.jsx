import React, { useState, useEffect, Fragment } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { fallbackImageBase64 } from '../utils/profileUtils';
import useProfileImage from '../hooks/useProfileImage';

// Función de utilidad para combinar clases CSS
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useUser();
  
  // Usar el hook personalizado para manejar la imagen de perfil
  const { 
    profileImage, 
    isLoading, 
    error, 
    handleImageError 
  } = useProfileImage({
    autoSync: true,
    listenForUpdates: true
  });

  // Verificar token expirado
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          console.log('Token expirado, cerrando sesión...');
          logout(true);
        }
      } catch (error) {
        console.error('Error al verificar token:', error);
        logout(true);
      }
    }
  }, [logout]);
  
  // Definir las rutas de navegación
  const navigation = [
    { name: 'Inicio', href: '/', current: location.pathname === '/' },
    { name: 'Blogs', href: '/ver-blogs', current: location.pathname === '/ver-blogs' },
    { name: 'Propiedades', href: '/propiedades', current: location.pathname === '/propiedades' },
  ];
  
  // Agregar rutas adicionales si el usuario está autenticado
  const userRoutes = [
    { name: 'Añadir Blog', href: '/crear-blog', current: location.pathname === '/crear-blog' },
  ];
  
  // Agregar rutas adicionales si el usuario es administrador
  const adminRoutes = [
    { name: 'Añadir Propiedad', href: '/add-property', current: location.pathname === '/add-property' },
  ];

  // Construir la navegación combinada basada en permisos
  let updatedNavigation = [...navigation];
  
  if (isAuthenticated) {
    updatedNavigation = [...updatedNavigation, ...userRoutes];
    
    // Añadir rutas de administrador si el usuario tiene el rol necesario
    if (user?.role === 'admin' || user?.isAdmin) {
      updatedNavigation = [...updatedNavigation, ...adminRoutes];
    }
  }

  return (
    <Disclosure as="nav" className="bg-black text-white shadow-md">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Logo y navegación principal */}
              <div className="flex">
                <Link to="/" className="flex-shrink-0 flex items-center">
                  <img className="h-8 w-auto" src="/logo.jpg" alt="Logo" />
                  <span className="ml-2 font-bold text-xl text-white">GozaMadrid</span>
                </Link>
                
                {/* Enlaces de navegación en escritorio */}
                <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                  {updatedNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={classNames(
                        item.current
                          ? 'border-blue-400 text-blue-400'
                          : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300',
                        'inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200'
                      )}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Botón de menú en móvil */}
              <div className="flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400">
                  <span className="sr-only">Abrir menú principal</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              
              {/* Menú de usuario */}
              <div className="hidden sm:flex sm:items-center">
                {isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <span className="hidden md:block text-gray-300">{user?.name || "Usuario"}</span>
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ring-offset-2 ring-offset-black">
                        <span className="sr-only">Abrir menú de usuario</span>
                        <img
                          className="h-10 w-10 rounded-full object-cover border-2 border-gray-700"
                          src={profileImage || fallbackImageBase64}
                          alt="Perfil"
                          onError={handleImageError}
                        />
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
                                Cambiar Perfil
                              </Link>
                            )}
                          </Menu.Item>
                          
                          {/* Opciones rápidas de navegación */}
                          {isAuthenticated && (
                            <>
                              <Menu.Item>
                                {({ active }) => (
                                  <Link
                                    to="/crear-blog"
                                    className={classNames(
                                      active ? 'bg-gray-100' : '',
                                      'block px-4 py-2 text-sm text-gray-700'
                                    )}
                                  >
                                    Añadir Blog
                                  </Link>
                                )}
                              </Menu.Item>
                              
                              {(user?.role === 'admin' || user?.isAdmin) && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <Link
                                      to="/add-property"
                                      className={classNames(
                                        active ? 'bg-gray-100' : '',
                                        'block px-4 py-2 text-sm text-gray-700'
                                      )}
                                    >
                                      Añadir Propiedad
                                    </Link>
                                  )}
                                </Menu.Item>
                              )}
                              
                              <div className="border-t border-gray-200 my-1"></div>
                            </>
                          )}
                          
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
                  <div className="flex items-center space-x-4">
                    <Link
                      to="/login"
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Iniciar Sesión
                    </Link>
                    <Link
                      to="/register"
                      className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Registrarse
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menú móvil */}
          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {updatedNavigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  to={item.href}
                  className={classNames(
                    item.current
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    'block px-3 py-2 rounded-md text-base font-medium'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
              
              {isAuthenticated ? (
                <>
                  <div className="border-t border-gray-700 my-2"></div>
                  <Disclosure.Button
                    as={Link}
                    to="/cambiar-perfil"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Cambiar Perfil
                  </Disclosure.Button>
                  <Disclosure.Button
                    as="button"
                    onClick={() => logout(true)}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Cerrar Sesión
                  </Disclosure.Button>
                </>
              ) : (
                <>
                  <Disclosure.Button
                    as={Link}
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Iniciar Sesión
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Registrarse
                  </Disclosure.Button>
                </>
              )}
            </div>
            
            {/* Perfil en móvil */}
            {isAuthenticated && (
              <div className="pt-4 pb-3 border-t border-gray-700">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={profileImage || fallbackImageBase64}
                      alt="Perfil"
                      onError={handleImageError}
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">{user?.name || "Usuario"}</div>
                  </div>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
