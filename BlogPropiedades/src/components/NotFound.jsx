import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente para mostrar un mensaje de error 404 - Página no encontrada
 * con un diseño atractivo y opciones para volver a la página principal
 */
const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-amber-500 py-6 px-4 sm:py-12">
      <div className="w-full max-w-xs sm:max-w-md space-y-6 sm:space-y-8 backdrop-blur-lg bg-white/10 p-6 sm:p-8 rounded-xl shadow-2xl border border-white/20 text-center">
        <div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-4 sm:mb-6">404</h1>
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Página no encontrada</h2>
          <p className="text-base sm:text-xl text-blue-100 mb-6 sm:mb-8">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
          
          <div className="relative py-3 sm:py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-blue-800 bg-opacity-50 px-3 sm:px-4 text-xs sm:text-sm text-blue-200 rounded-full">
                ¿Ahora qué?
              </span>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3 sm:space-y-4 mt-6 sm:mt-8">
            <Link 
              to="/" 
              className="px-4 sm:px-6 py-2 sm:py-3 bg-amber-500 text-white text-sm sm:text-base font-medium rounded-full hover:bg-amber-600 transition shadow-lg"
            >
              Volver a la página principal
            </Link>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link 
                to="/ver-blogs" 
                className="px-4 sm:px-6 py-2 sm:py-3 bg-white/20 text-white text-sm sm:text-base font-medium rounded-full hover:bg-white/30 transition"
              >
                Ver blogs
              </Link>
              
              <Link 
                to="/propiedades" 
                className="px-4 sm:px-6 py-2 sm:py-3 bg-white/20 text-white text-sm sm:text-base font-medium rounded-full hover:bg-white/30 transition"
              >
                Explorar propiedades
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 