// src/context/AuthContext.jsx
// Archivo creado para compatibilidad con componentes que utilizan AuthContext
// en lugar de UserContext

import { UserContext, UserProvider, useUser } from './UserContext';

// Exportar UserContext como AuthContext para mantener compatibilidad
export const AuthContext = UserContext;
export const AuthProvider = UserProvider;

// Exportar hook personalizado con nombre alternativo
export const useAuth = useUser;

// Re-exportar el contexto original para mantener consistencia
export { UserContext, UserProvider, useUser };

// Este archivo sirve como puente para evitar errores
// cuando componentes importan desde '../context/AuthContext' 