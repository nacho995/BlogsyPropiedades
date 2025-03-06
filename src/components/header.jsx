import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { getProfileImageUrl } from "../utils/profileUtils";

function Header() {
  const { user, isAuthenticated, logout } = useUser();
  
  // Imagen por defecto
  const defaultProfilePic = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";
  
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img className="h-8 w-auto" src="/logo.png" alt="Logo" />
              <span className="ml-2 font-bold text-xl">GozaMadrid</span>
            </Link>
          </div>
          
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center ml-4 relative group">
                <div className="flex items-center space-x-3">
                  <span className="hidden md:block">{user?.name || "Usuario"}</span>
                  <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200">
                    <img 
                      src={getProfileImageUrl(user, defaultProfilePic)}
                      alt="Perfil" 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        console.log("Error cargando imagen en header");
                        e.target.src = defaultProfilePic;
                      }}
                    />
                  </div>
                </div>
                
                {/* Menú desplegable */}
                <div className="hidden group-hover:block absolute right-0 top-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link to="/perfil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi perfil</Link>
                    <Link to="/cambiar-perfil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cambiar perfil</Link>
                    <button 
                      onClick={logout}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;