// UserContext.js
import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: localStorage.getItem('name') || '',
    profilePic: localStorage.getItem('profilePic') || '',
    token: localStorage.getItem('token') || null,
  });

  useEffect(() => {
    console.log('UserContext - Estado actual:', user);
    
    if (user.name !== undefined) {
      localStorage.setItem('name', user.name);
      console.log('Guardando nombre en localStorage:', user.name);
    }
    
    if (user.profilePic !== undefined) {
      localStorage.setItem('profilePic', user.profilePic);
      console.log('Guardando profilePic en localStorage:', user.profilePic);
    }
    
    if (user.token) {
      localStorage.setItem('token', user.token);
      console.log('Guardando token en localStorage:', user.token);
    }
    
    console.log('localStorage después de actualizar en UserContext:', {
      name: localStorage.getItem('name'),
      profilePic: localStorage.getItem('profilePic'),
      token: localStorage.getItem('token')
    });
  }, [user]);

  const setUserData = (userData) => {
    console.log('setUserData recibió:', userData);
    const sanitizedData = {
      name: typeof userData.name === 'string' ? userData.name : '',
      profilePic: typeof userData.profilePic === 'string' ? userData.profilePic : '',
      token: userData.token || localStorage.getItem('token') || null,
    };
    console.log('Datos sanitizados antes de actualizar:', sanitizedData);
    setUser(sanitizedData);
  };

  return (
    <UserContext.Provider value={{ user, setUser: setUserData }}>
      {children}
    </UserContext.Provider>
  );
};
