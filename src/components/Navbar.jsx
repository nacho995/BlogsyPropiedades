import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

export default function Navbar() {
  const { user } = useUser();
  
  return (
    <nav className="bg-blue-900 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-xl font-bold">
          Tu Logo
        </Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            // Menú para usuarios autenticados
            <div className="flex items-center space-x-4">
              {/* ... existing authenticated menu items ... */}
            </div>
          ) : (
            // Botones para usuarios no autenticados
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-white hover:bg-blue-700 px-4 py-2 rounded"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="bg-white text-blue-900 hover:bg-gray-100 px-4 py-2 rounded"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 