import React, { useContext } from 'react';
import { Button, Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';

const navigation = [
  { name: 'Dashboard', href: '/', current: false },
  { name: 'Añadir Blog', href: '/blog', current: false },
  { name: 'Añadir Propiedades', href: '/propiedades', current: false },
  { name: 'Ver Blogs', href: '/ver-blogs', current: false },
  { name: 'Ver Propiedades', href: '/ver-propiedades', current: false },
];

function clases(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  
  // Actualizamos la navegación según la ruta actual
  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href,
  }));

  // Estado de autenticación basado en el token del usuario
  const isAuthenticated = !!user.token;

  // Valor por defecto para la foto de perfil
  const defaultProfilePic = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

  // Función para sanitizar la URL de la imagen
  const getImageUrl = (url) => {
    if (!url) return defaultProfilePic;
    
    try {
      // Si la URL comienza con http://localhost:4000, asegurarnos de que la ruta sea correcta
      if (url.startsWith('http://localhost:4000')) {
        const path = url.split('http://localhost:4000')[1];
        return `${import.meta.env.VITE_API_URL}${path}`;
      }
      return encodeURI(url);
    } catch (error) {
      console.error('Error procesando URL de imagen:', error);
      return defaultProfilePic;
    }
  };

  // Función para cerrar sesión
  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('profilePic');
    window.location.href = '/signin'; // Forzamos un refresh completo
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
            <div className="flex shrink-0 items-center">
              <img
                alt="Your Company"
                src="./logo.jpg"
                className="w-14 h-14"
              />
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {updatedNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={isAuthenticated ? item.href : '/signin'}
                    aria-current={item.current ? 'page' : undefined}
                    className={clases(
                      item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'rounded-md px-3 py-2 text-sm font-medium'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sección derecha: notificaciones y perfil/sign in */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <Button
              type="button"
              className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon aria-hidden="true" className="h-6 w-6" />
            </Button>

            {isAuthenticated ? (
              <Menu as="div" className="relative ml-3">
                <div>
                  <MenuButton className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                    <span className="sr-only">Open user menu</span>
                    <img
                      alt="Profile"
                      src={getImageUrl(user.profilePic)}
                      width={52}
                      height={52}
                      className="rounded-full object-cover"
                      onError={(e) => {
                        console.log('Error cargando imagen:', e);
                        console.log('URL que falló:', e.target.src);
                        e.target.src = defaultProfilePic;
                      }}
                    />
                  </MenuButton>
                </div>
                <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                  <MenuItem>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={clases(
                          active ? 'bg-gray-100' : '',
                          'block w-full px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        Configuración de perfil
                      </Link>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button
                        onClick={handleSignOut}
                        className={clases(
                          active ? 'bg-gray-100' : '',
                          'block w-full px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        Sign out
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Menu>
            ) : (
              <Link to="/signin" className="ml-3">
                <button className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-400 hover:text-white">
                  Sign in
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {updatedNavigation.map((item) => (
            <DisclosureButton
              key={item.name}
              as="a"
              href={isAuthenticated ? item.href : '/signin'}
              aria-current={item.current ? 'page' : undefined}
              className={clases(
                item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                'block rounded-md px-3 py-2 text-base font-medium'
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
