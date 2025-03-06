import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { updateProfile } from '../services/api';

const ProfileImageUploader = ({ currentImageUrl, onImageUpdated }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [previewImage, setPreviewImage] = useState(currentImageUrl || null);
  const { user, updateProfileImage } = useUser();
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Mostrar vista previa local
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Notificar al componente padre
      onImageUpdated(file);
      
      // Si quieres subir la imagen inmediatamente sin esperar a que el usuario haga clic en "Actualizar perfil"
      // handleDirectUpload(file);
    }
  };
  
  
  return (
    <div className="profile-image-uploader">
      <div className="image-preview mx-auto">
        {previewImage ? (
          <img 
            src={previewImage} 
            alt="Imagen de perfil" 
            className="rounded-full w-32 h-32 object-cover border-4 border-indigo-600"
            onError={(e) => e.target.src = "https://placehold.co/150"}
          />
        ) : (
          <div className="rounded-full w-32 h-32 bg-gray-200 flex items-center justify-center border-4 border-indigo-600">
            <span className="text-gray-500">Sin imagen</span>
          </div>
        )}
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