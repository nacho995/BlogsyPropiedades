import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { getProfileImageUrl } from "../utils/profileUtils";

function Navbar() {
  const { user, isAuthenticated, logout } = useUser();
  
  // Imagen por defecto (la misma que usamos en otros componentes)
  const defaultProfilePic = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img className="h-8 w-auto" src="/logo.png" alt="Logo" />
              <span className="ml-2 font-bold text-xl">GozaMadrid</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/perfil" className="text-gray-700 hover:text-gray-900">Mi Perfil</Link>
                <div className="relative group">
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <span className="hidden md:block">{user?.name || "Usuario"}</span>
                    <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200">
                      {user ? (
                        <img 
                          src={localStorage.getItem('profilePic') || defaultProfilePic}
                          alt="Perfil" 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.log("Error cargando imagen en navbar");
                            e.target.src = defaultProfilePic;
                          }}
                        />
                      ) : (
                        <img 
                          src={defaultProfilePic}
                          alt="Perfil por defecto" 
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="hidden group-hover:block absolute right-0 top-10 mt-2 w-48 bg-white rounded shadow-lg z-10">
                    <Link to="/cambiar-perfil" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      Cambiar perfil
                    </Link>
                    <button 
                      onClick={logout} 
                      className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-gray-900">Iniciar sesión</Link>
                <Link to="/register" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 