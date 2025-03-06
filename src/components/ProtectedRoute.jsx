import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// Versión simplificada que solo verifica isAuthenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useUser();
  
  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Si está autenticado, mostrar el componente hijo
  return children;
};

export default ProtectedRoute; 