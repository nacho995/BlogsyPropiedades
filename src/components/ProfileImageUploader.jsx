import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

const ProfileImageUploader = ({ currentImageUrl, onImageUpdated }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [previewImage, setPreviewImage] = useState(currentImageUrl || null);
  const { user } = useUser();
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setUploadError('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('La imagen es demasiado grande. Máximo 5MB.');
        return;
      }
      
      // Mostrar vista previa
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Limpiar error previo y notificar al componente padre
      setUploadError(null);
      onImageUpdated(file);
    }
  };
  
  const renderInitialAvatar = (user) => {
    return (
      <div className="rounded-full w-32 h-32 bg-gray-300 flex items-center justify-center border-4 border-indigo-600">
        <span className="text-gray-600 font-semibold text-5xl">
          {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
        </span>
      </div>
    );
  };
  
  return (
    <div className="profile-image-uploader">
      <div className="image-preview mx-auto">
        {previewImage ? (
          <img 
            src={previewImage} 
            alt="Imagen de perfil" 
            className="rounded-full w-32 h-32 object-cover border-4 border-indigo-600"
            onError={(e) => {
              console.log("Error cargando vista previa");
              e.target.onerror = null; // Evitar bucle infinito
              renderInitialAvatar(user);
            }}
          />
        ) : renderInitialAvatar(user)}
      </div>
      
      <div className="mt-4 text-center">
        <label className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded cursor-pointer inline-block">
          {isUploading ? 'Subiendo...' : 'Seleccionar imagen'}
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleImageChange}
            disabled={isUploading}
          />
        </label>
      </div>
      
      {uploadError && (
        <div className="text-red-500 mt-2 text-center">
          {uploadError}
        </div>
      )}
    </div>
  );
};

export default ProfileImageUploader; 