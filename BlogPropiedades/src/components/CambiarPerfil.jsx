import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";
import { fallbackImageBase64, validateAndProcessImage } from "../utils/imageUtils";
import useProfileImage from "../hooks/useProfileImage";

export default function CambiarPerfil() {
  const [name, setName] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const navigate = useNavigate();
  const { user, refreshUserData } = useUser();
  
  // Usar el hook personalizado con sincronización automática
  const { 
    profileImage, 
    isLoading: profileLoading, 
    error: profileError, 
    handleImageError, 
    updateProfileImage,
    syncImage 
  } = useProfileImage({
    autoSync: true,
    listenForUpdates: true,
    syncInterval: 300000 // 5 minutos
  });

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (profilePic?.localUrl) {
        URL.revokeObjectURL(profilePic.localUrl);
      }
    };
  }, [profilePic]);

  // Determinar si estamos usando HTTPS
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // Definición de la URL de la API adaptada al protocolo
  const API_DOMAIN = 'api.realestategozamadrid.com';
  const API_URL = `${isHttps ? 'https' : 'http'}://${API_DOMAIN}`;

  console.log(`🔄 CambiarPerfil usando API en: ${API_URL} (${isHttps ? 'HTTPS' : 'HTTP'})`);

  // Manejar cambios en la imagen
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Validaciones
      if (!file.type.startsWith('image/')) {
        throw new Error("El archivo debe ser una imagen (jpg, png, etc.)");
      }
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("La imagen no debe superar los 5MB");
      }

      setLoading(true);
      setError(null);

      // Crear URL temporal para vista previa
      const localUrl = URL.createObjectURL(file);
      setProfilePic({ file, localUrl });

      // Convertir a base64 para almacenamiento y sincronización
      const reader = new FileReader();
      
      reader.onload = function(event) {
        try {
          // Envolver en un bloque try-catch adicional
          const imageData = event.target.result;
          
          // Guardar imagen en múltiples ubicaciones para mayor robustez
          try {
            localStorage.setItem('profilePic', imageData);
            localStorage.setItem('profilePic_backup', imageData);
            localStorage.setItem('profilePic_temp', imageData);
            console.log("Imagen guardada en múltiples ubicaciones para persistencia");
          } catch (storageError) {
            console.warn("Error al guardar imagen en localStorage:", storageError);
          }
          
          // Actualizar imagen en el sistema de sincronización
          updateProfileImage(imageData)
            .then(() => {
              setSuccess("Imagen actualizada y sincronizada correctamente");
              setLoading(false);
              
              // Notificar a otros componentes sobre el cambio
              try {
                window.dispatchEvent(new CustomEvent('profileImageUpdated', {
                  detail: { imageUrl: imageData }
                }));
                console.log("Notificación de cambio de imagen enviada a todos los componentes");
              } catch (e) {
                console.warn('Error al notificar actualización de imagen:', e);
              }
            })
            .catch(err => {
              console.error("Error al sincronizar imagen:", err);
              setError("Error al sincronizar la imagen. Inténtalo de nuevo.");
              setLoading(false);
            });
        } catch (err) {
          console.error("Error al procesar imagen:", err);
          setError("Error al procesar la imagen. Inténtalo de nuevo.");
          setLoading(false);
        }
      };
      
      reader.onerror = function() {
        setError("Error al leer el archivo. Inténtalo de nuevo.");
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error al procesar archivo:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name && !profilePic?.file) {
      setError("Debes cambiar al menos un campo.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Verificar si hay un token válido
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No hay sesión activa. Por favor, inicia sesión nuevamente.");
      }

      const userData = {
        name: name || user?.name,
        profilePic: profilePic?.file ? await validateAndProcessImage(profilePic.file) : null
      };

      // Guardar la imagen localmente incluso antes de enviarla al servidor
      if (profilePic?.localUrl) {
        localStorage.setItem('profilePic_temp', profilePic.localUrl);
      }

      // Llamada al backend para actualizar el perfil
      const response = await fetch(`${API_URL}/user/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        // Si hay error de autorización, intentar actualizar solo localmente
        if (response.status === 401) {
          console.warn("Error de autorización al actualizar perfil. Actualizando solo localmente.");
          
          // Actualizar datos locales
          if (name) {
            localStorage.setItem('name', name);
          }
          
          if (profilePic?.localUrl) {
            localStorage.setItem('profilePic', profilePic.localUrl);
            localStorage.setItem('profilePic_backup', profilePic.localUrl);
            
            // Notificar a otros componentes del cambio
            try {
              window.dispatchEvent(new CustomEvent('profileImageUpdated', {
                detail: { imageUrl: profilePic.localUrl }
              }));
            } catch (e) {
              console.warn("Error al notificar actualización local:", e);
            }
          }
          
          setSuccess("Perfil actualizado localmente. Los cambios se sincronizarán cuando inicies sesión.");
          setTimeout(() => navigate("/"), 2000);
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || `Error al actualizar el perfil: ${response.status}`);
      }

      // Procesar respuesta
      const data = await response.json();
      
      // Forzar sincronización de imagen
      if (data.profilePic) {
        await syncImage(true);
        
        // Guardar la imagen en múltiples lugares para asegurar persistencia
        if (typeof data.profilePic === 'string') {
          localStorage.setItem('profilePic', data.profilePic);
          localStorage.setItem('profilePic_backup', data.profilePic);
          localStorage.setItem('profilePic_temp', data.profilePic);
          
          // Actualizar userData para mantener todo coherente
          try {
            const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
            storedUserData.profilePic = data.profilePic;
            localStorage.setItem('userData', JSON.stringify(storedUserData));
          } catch (e) {
            console.warn('Error al actualizar datos de usuario en localStorage:', e);
          }
          
          // Notificar a otros componentes
          try {
            window.dispatchEvent(new CustomEvent('profileImageUpdated', {
              detail: { imageUrl: data.profilePic }
            }));
            console.log("Notificación de cambio de imagen enviada a todos los componentes");
          } catch (e) {
            console.warn('Error al notificar actualización de imagen:', e);
          }
        }
      }

      // Actualizar datos de usuario
      await refreshUserData();

      setSuccess("¡Perfil actualizado correctamente!");
      setTimeout(() => navigate("/"), 2000);

    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      setError(err.message || "No se pudo actualizar el perfil. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Obtener imagen actual
  const getCurrentImage = useCallback(() => {
    if (profilePic?.localUrl) return profilePic.localUrl;
    if (profileImage) return profileImage;
    return fallbackImageBase64;
  }, [profilePic, profileImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-amber-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-xl shadow-xl overflow-hidden p-8 border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Actualizar Perfil</h2>
          <p className="mt-2 text-blue-100">Cambia tu nombre o foto de perfil</p>
        </div>
        
        {(error || profileError) && (
          <div className="mb-4 p-3 bg-red-500/30 border border-red-500 rounded-lg text-white">
            {error || profileError?.message || "Error al procesar la imagen"}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-500/30 border border-green-500 rounded-lg text-white">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                src={getCurrentImage()} 
                alt="Vista previa" 
                className="w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-lg"
                onError={handleImageError}
              />
              {(loading || profileLoading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
              <label 
                htmlFor="profilePic" 
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </label>
            </div>
          </div>
          
          <input 
            type="file" 
            id="profilePic" 
            name="profilePic" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden" 
            disabled={loading || profileLoading}
          />
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-blue-100">
              Nombre
            </label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={user?.name || "Tu nombre"} 
              className="mt-1 block w-full px-3 py-2 bg-white/10 border border-white/30 rounded-md text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex space-x-4">
            <button 
              type="submit" 
              disabled={loading || profileLoading} 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(loading || profileLoading) ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Actualizar Perfil"}
            </button>
            
            <button 
              type="button" 
              onClick={() => navigate("/")} 
              className="w-full flex justify-center py-2 px-4 border border-white/30 rounded-md shadow-sm text-sm font-medium text-white bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
