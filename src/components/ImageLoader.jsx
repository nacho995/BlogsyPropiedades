import React from 'react';

// Componente simple para precargar imágenes
function ImageLoader() {
  // Imagen por defecto (la misma que usamos en otros componentes)
  const defaultProfilePic = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";
  
  // Obtener imagen del localStorage
  const profilePic = localStorage.getItem('profilePic');
  
  return (
    <div style={{ display: 'none' }}>
      {/* Precargar imagen por defecto */}
      <img src={defaultProfilePic} alt="preload default" />
      
      {/* Precargar imagen de perfil si existe */}
      {profilePic && <img src={profilePic} alt="preload profile" />}
    </div>
  );
}

export default ImageLoader; 