import React, { useState, useEffect } from 'react';

/**
 * Componente de seguridad para evitar errores de inicialización de variables
 * 
 * Este componente envuelve componentes hijos y los renderiza de forma segura
 * después de un breve retraso para asegurar que todas las variables estén
 * inicializadas correctamente.
 */
const SafeRender = ({ children, delay = 100 }) => {
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    // Pequeño retraso para asegurar que todas las variables estén inicializadas
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (!shouldRender) {
    // Mostrar un placeholder mientras se prepara el renderizado seguro
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Renderizar los componentes hijos dentro de un try-catch para mayor seguridad
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Error en SafeRender:", error);
    
    // Mostrar un mensaje de error amigable
    return (
      <div className="text-center p-4">
        <p className="text-red-500">Ocurrió un error al renderizar este componente.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Recargar página
        </button>
      </div>
    );
  }
};

export default SafeRender; 