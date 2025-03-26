import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

const ProfileImageUploader = ({ currentImageUrl, onImageUpdated }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [previewImage, setPreviewImage] = useState(currentImageUrl || 
                                                localStorage.getItem('profilePic'));
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
        const imageDataUrl = reader.result;
        setPreviewImage(imageDataUrl);
        
        // Guardar en localStorage
        localStorage.setItem('profilePic', imageDataUrl);
        localStorage.setItem('profilePic_backup', imageDataUrl);
        
        // Notificar al componente padre
        if (onImageUpdated) {
          onImageUpdated(imageDataUrl);
        }
      };
      reader.readAsDataURL(file);
      
      // Limpiar error previo
      setUploadError(null);
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
  
  // Función para manejar errores cuando la imagen no carga
  const handlePreviewError = (e) => {
    // Mostrar mensaje en consola
    console.log("❌ No se pudo cargar la imagen de perfil");
    
    // Evitar que se repita el error infinitamente
    e.target.onerror = null;
    
    // Ocultar la imagen que falló
    e.target.style.display = 'none';
    
    // Encontrar el div contenedor
    const contenedor = e.target.parentNode;
    
    // Crear un div para el avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.className = "rounded-full w-32 h-32 bg-gray-300 flex items-center justify-center border-4 border-indigo-600";
    
    // Asegurarse que el div se muestre correctamente
    avatarDiv.style.display = 'flex';
    avatarDiv.style.alignItems = 'center';
    avatarDiv.style.justifyContent = 'center';
    
    // Añadir la inicial del nombre
    const textoInicial = document.createElement('span');
    textoInicial.className = "text-gray-600 font-semibold text-5xl";
    
    // Usar la primera letra del nombre o '?' si no hay nombre
    const letraInicial = user?.name ? user.name.charAt(0).toUpperCase() : '?';
    textoInicial.textContent = letraInicial;
    
    // Añadir elementos al DOM
    avatarDiv.appendChild(textoInicial);
    contenedor.appendChild(avatarDiv);
  };
  
  return (
    <div className="profile-image-uploader">
      <div className="image-preview mx-auto">
        {previewImage ? (
          <img 
            src={previewImage} 
            alt="Imagen de perfil" 
            className="rounded-full w-32 h-32 object-cover border-4 border-indigo-600"
            onError={handlePreviewError}
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