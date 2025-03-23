import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const DocsPage = () => {
  const { user } = useUser();
  
  // Verificar si el usuario es administrador
  const isAdmin = user && user.role === 'admin';
  
  // Si no es admin, redirigir a la página principal
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Documentación del Sistema</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Arquitectura de la Aplicación</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Componentes Principales</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>UserContext:</strong> Maneja la autenticación y datos del usuario
            </li>
            <li>
              <strong>Principal:</strong> Página de inicio para usuarios autenticados
            </li>
            <li>
              <strong>SignIn:</strong> Formulario de inicio de sesión
            </li>
            <li>
              <strong>ProtectedRoute:</strong> Componente para rutas que requieren autenticación
            </li>
          </ul>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Servicios API</h3>
          <p className="mb-2">
            La aplicación se comunica con un backend mediante servicios API definidos en <code>src/services/api.js</code>.
          </p>
          <p>
            Las principales funcionalidades incluyen:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Autenticación de usuarios</li>
            <li>Gestión de blogs</li>
            <li>Gestión de propiedades inmobiliarias</li>
            <li>Subida de imágenes</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-xl font-medium mb-2">Manejo de Errores</h3>
          <p>
            La aplicación implementa varios mecanismos para detectar y manejar errores:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Error Boundary para capturar errores de renderizado</li>
            <li>Detección de ciclos de renderizado</li>
            <li>Recuperación automática de sesión</li>
            <li>Limpieza de datos corruptos en localStorage</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocsPage; 