import React, { useState } from 'react';
import useProfileImage from '../hooks/useProfileImage';
import { fallbackImageBase64 } from '../utils/imageUtils';

/**
 * Componente de ejemplo que muestra cómo utilizar el hook useProfileImage
 * para manejar imágenes de perfil de forma robusta.
 */
const ProfileImageExample = () => {
  // Usar el hook personalizado para manejar la imagen de perfil
  const { 
    profileImage, 
    isLoading, 
    error, 
    syncImage, 
    handleImageError, 
    updateProfileImage 
  } = useProfileImage({
    autoSync: true,
    listenForUpdates: true
  });
  
  // Estado para la URL de imagen personalizada
  const [customImageUrl, setCustomImageUrl] = useState('');
  
  // Función para manejar la actualización manual de la imagen
  const handleUpdateImage = async () => {
    if (!customImageUrl.trim()) {
      alert('Por favor, introduce una URL de imagen válida');
      return;
    }
    
    try {
      const success = await updateProfileImage(customImageUrl);
      if (success) {
        alert('Imagen actualizada correctamente');
        setCustomImageUrl('');
      } else {
        alert('No se pudo actualizar la imagen');
      }
    } catch (error) {
      console.error('Error al actualizar imagen:', error);
      alert(`Error al actualizar imagen: ${error.message}`);
    }
  };
  
  // Función para manejar la sincronización manual de la imagen
  const handleSyncImage = async () => {
    try {
      await syncImage();
      alert('Imagen sincronizada correctamente');
    } catch (error) {
      console.error('Error al sincronizar imagen:', error);
      alert(`Error al sincronizar imagen: ${error.message}`);
    }
  };
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Ejemplo de Imagen de Perfil
      </h2>
      
      {/* Mostrar estado de carga */}
      {isLoading && (
        <div className="mb-4 text-blue-600">
          Cargando imagen de perfil...
        </div>
      )}
      
      {/* Mostrar errores */}
      {error && (
        <div className="mb-4 text-red-600">
          Error: {error.message || 'Error al cargar la imagen de perfil'}
        </div>
      )}
      
      {/* Contenedor de la imagen */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg mb-4">
          <img 
            src={profileImage || fallbackImageBase64} 
            alt="Imagen de perfil" 
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
          
          {/* Indicador de carga sobre la imagen */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-2">
          {profileImage ? 'Imagen cargada correctamente' : 'Usando imagen por defecto'}
        </p>
        
        {/* Mostrar tipo de imagen */}
        <p className="text-gray-500 text-xs mb-4">
          Tipo: {profileImage?.startsWith('data:') 
            ? 'Base64' 
            : profileImage?.startsWith('http') 
              ? 'URL remota' 
              : 'Desconocido o por defecto'}
        </p>
      </div>
      
      {/* Formulario para actualizar la imagen */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Actualizar imagen manualmente
        </h3>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={customImageUrl}
            onChange={(e) => setCustomImageUrl(e.target.value)}
            placeholder="URL de la imagen"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={handleUpdateImage}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Actualizar
          </button>
        </div>
        
        <p className="text-gray-500 text-xs mt-1">
          Introduce la URL de una imagen para actualizarla
        </p>
      </div>
      
      {/* Botón para sincronizar la imagen */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Sincronizar con el servidor
        </h3>
        
        <button
          onClick={handleSyncImage}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isLoading ? 'Sincronizando...' : 'Sincronizar imagen'}
        </button>
        
        <p className="text-gray-500 text-xs mt-1">
          Sincroniza la imagen de perfil con el servidor
        </p>
      </div>
      
      {/* Información sobre localStorage */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Información de almacenamiento
        </h3>
        
        <div className="text-xs text-gray-600">
          <p><strong>profilePic:</strong> {localStorage.getItem('profilePic')?.substring(0, 30)}...</p>
          <p><strong>profilePic_local:</strong> {localStorage.getItem('profilePic_local')?.substring(0, 30)}...</p>
          <p><strong>profilePic_base64:</strong> {localStorage.getItem('profilePic_base64')?.substring(0, 30)}...</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileImageExample; 