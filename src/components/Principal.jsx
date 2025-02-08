import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Principal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <div className="bg-gradient-to-tr from-blue-900 to-black/60 min-h-screen flex flex-col justify-center items-center">
      <div className="container mx-auto p-4 flex flex-col justify-center items-center">
        <h1 className="text-4xl font-bold text-center mb-8 relative">
          <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white">
            ¿Qué quieres añadir?
          </span>
        </h1>
      </div>
      <div className="flex flex-col justify-center items-center">
        {isAuthenticated && (
          <>
            <Link
              className="mb-4 bg-black text-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors duration-300"
              to="/blog"
            >
              Añade un blog
            </Link>
            <Link
              className="bg-black text-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors duration-300"
              to="/propiedades"
            >
              Añade una propiedad
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
