// UserContext.js
import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: localStorage.getItem('name') || 'Usuario',
    profilePic: localStorage.getItem('profilePic') || 'https://via.placeholder.com/80',
    token: localStorage.getItem('token') || null,
  });

  // Puedes agregar un efecto para actualizar localStorage cuando user cambie:
  useEffect(() => {
    localStorage.setItem('name', user.name);
    localStorage.setItem('profilePic', user.profilePic);
    localStorage.setItem('token', user.token);
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
