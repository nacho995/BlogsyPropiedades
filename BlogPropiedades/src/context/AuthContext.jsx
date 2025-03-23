// src/context/AuthContext.jsx
// Este archivo es un alias para mantener la compatibilidad con las importaciones existentes

import { UserContext, UserProvider, useUser } from './UserContext';

// Exportamos los mismos componentes pero con nombres diferentes
export const AuthContext = UserContext;
export const AuthProvider = UserProvider;

// Hook personalizado con el nombre usado en las importaciones
export function useAuth() {
  return useUser();
}

export default { AuthContext, AuthProvider, useAuth }; 