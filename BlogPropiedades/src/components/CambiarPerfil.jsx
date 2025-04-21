import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";
import useProfileImage from "../hooks/useProfileImage";
import { uploadProfileImageAndUpdate, BASE_URL } from "../services/api";

// Definimos la constante que falta para el fallback de imagen
const fallbackImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMWUxZTEiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzg4OCI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4=';

// Definimos la función que antes estaba en utils/imageUtils
const validateAndProcessImage = (imageFile) => {
  return new Promise((resolve, reject) => {
    if (!imageFile) {
      reject(new Error('No se proporcionó ninguna imagen'));
      return;
    }

    // Verificar el tipo de archivo
    if (!imageFile.type.match('image.*')) {
      reject(new Error('El archivo seleccionado no es una imagen válida'));
      return;
    }

    // Verificar el tamaño (máximo 2MB)
    if (imageFile.size > 2 * 1024 * 1024) {
      reject(new Error('La imagen es demasiado grande. El tamaño máximo es 2MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo de imagen'));
    };
    reader.readAsDataURL(imageFile);
  });
};

export default function CambiarPerfil() {
  const [name, setName] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [initialName, setInitialName] = useState("");
  
  const navigate = useNavigate();
  const { user, refreshUserData, loading: userLoading } = useUser();
  
  // Usar el hook simplificado con sincronización, pasando el usuario
  const { 
    profileImage, 
    isLoading: profileLoading, 
    error: profileError, 
    handleImageError, 
    updateProfileImage,
    fallbackImageBase64
  } = useProfileImage(user);

  // Efecto para cargar el nombre inicial cuando el usuario esté disponible
  useEffect(() => {
    if (user && user.name) {
      setName(user.name);
      setInitialName(user.name);
    }
  }, [user]);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (profilePic?.localUrl) {
        URL.revokeObjectURL(profilePic.localUrl);
      }
    };
  }, [profilePic]);

  console.log(`🔄 CambiarPerfil usando API base: ${BASE_URL}`); // Log actualizado

  // Manejar cambios en la imagen
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Obtener userId del contexto
    if (!user || !user.id) {
      setError("No se pudo obtener la información del usuario. Intenta iniciar sesión de nuevo.");
      return;
    }
    const userId = user.id;

    try {
      // Validaciones (puedes mantenerlas si quieres)
      if (!file.type.startsWith('image/')) {
        throw new Error("El archivo debe ser una imagen (jpg, png, etc.)");
      }
      if (file.size > 5 * 1024 * 1024) { // Podríamos ajustar a 2MB como la validación antigua si se prefiere
        throw new Error("La imagen no debe superar los 5MB");
      }

      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Crear URL temporal para vista previa (opcional, pero útil)
      const localUrl = URL.createObjectURL(file);
      setProfilePic({ file, localUrl }); // Mantenemos la vista previa local

      // --- Inicio: Lógica Antigua Eliminada ---
      /*
      // Convertir a base64 para almacenamiento
      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          const imageData = event.target.result;
          if (!imageData || typeof imageData !== 'string') {
            throw new Error("La imagen procesada no es válida");
          }
          localStorage.setItem('profilePic', imageData);
          localStorage.setItem('profilePic_backup', imageData);
          updateProfileImage(imageData)
            .then(async (success) => {
              if (success) {
                setSuccess("Imagen actualizada correctamente");
                window.dispatchEvent(new CustomEvent('profileImageUpdated', {
                  detail: { profileImage: imageData, timestamp: Date.now() }
                }));
                if (user && refreshUserData) {
                  refreshUserData().catch(err => console.warn("Error al actualizar datos de usuario:", err));
                }
                // Sincronizar con la nube para otros dispositivos
                try {
                  const syncResult = await syncProfileImageBetweenDevices(imageData);
                  if (syncResult.success) {
                    setSuccess(prev => prev + " (Sincronizada con todos tus dispositivos)");
                  } else {
                     console.warn("No se pudo sincronizar la imagen con la nube:", syncResult.error);
                  }
                } catch (syncError) {
                   console.error("Error al sincronizar imagen con la nube:", syncError);
                }
              } else {
                setError("No se pudo actualizar la imagen correctamente");
              }
              setLoading(false);
            })
            .catch(err => {
              setError("Error al actualizar imagen. Inténtalo de nuevo.");
              setLoading(false);
            });
        } catch (err) {
          setError("Error al procesar la imagen. Inténtalo de nuevo.");
          setLoading(false);
        }
      };
      reader.onerror = function() {
        setError("Error al leer el archivo. Inténtalo de nuevo.");
        setLoading(false);
      };
      reader.readAsDataURL(file);
      */
      // --- Fin: Lógica Antigua Eliminada ---
      
      // --- Inicio: Nueva Lógica --- 
      console.log(`CambiarPerfil: Subiendo imagen para usuario ${userId}...`);
      const result = await uploadProfileImageAndUpdate(userId, file);

      if (result.error) {
        throw new Error(result.message || 'Error al subir la imagen al servidor');
      }

      if (result.success && result.user && result.user.profileImage && result.user.profileImage.url) {
        const newImageUrl = result.user.profileImage.url;
        console.log("CambiarPerfil: Imagen subida y perfil actualizado. Nueva URL:", newImageUrl);
        
        // Actualizar el estado global/contexto con la URL real
        updateProfileImage(newImageUrl);
        
        // Opcional: Limpiar la vista previa local si se actualizó bien globalmente
        setProfilePic(null); 
        URL.revokeObjectURL(localUrl); // Liberar memoria de la URL temporal

        setSuccess("Imagen de perfil actualizada y guardada.");
        
        // Refrescar datos del usuario en el contexto (opcional si updateProfileImage ya lo hace)
        if (refreshUserData) {
           refreshUserData().catch(err => console.warn("Error al refrescar datos de usuario tras subida:", err));
        }
        
      } else {
        throw new Error('La respuesta del servidor no contiene la URL de la imagen actualizada.');
      }
      // --- Fin: Nueva Lógica ---

    } catch (err) {
      console.error("Error en handleFileChange:", err);
      setError(err.message || "Ocurrió un error inesperado al procesar la imagen.");
      // Limpiar vista previa si hubo error
      setProfilePic(null);
      if (localUrl) URL.revokeObjectURL(localUrl);
      
    } finally {
      setLoading(false);
    }
  };

  // Manejar envío del formulario (solo actualiza nombre)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Comprobar si el nombre es válido y diferente del inicial
    if (!name) {
      setError("El nombre no puede estar vacío.");
      return;
    }
    if (name === initialName) {
       setError("Escribe un nombre diferente al actual para guardar.");
       return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No hay sesión activa. Por favor, inicia sesión nuevamente.");
      }

      // Solo enviamos el nombre para actualizar
      const updateData = { name }; 

      console.log("Enviando nombre para actualizar perfil...");
      
      // Llamada al backend para actualizar el perfil (usando JSON)
      const response = await fetch(`${BASE_URL}/user/update-profile`, { // Usar BASE_URL importado
        method: 'POST', // O PATCH si es más apropiado para actualizar parcialmente
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' // Enviamos JSON
        },
        body: JSON.stringify(updateData) 
      });

      console.log("Respuesta del servidor:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()])
      });

      if (!response.ok) {
        // --- Inicio: Manejo de Errores (igual que antes) ---
        console.error("Error del servidor:", response.status, response.statusText);
        if (response.status === 401) {
          console.warn("Error de autorización al actualizar perfil. Actualizando solo localmente.");
          if (name) {
            localStorage.setItem('name', name);
          }
          setSuccess("Perfil actualizado localmente. Los cambios se sincronizarán cuando inicies sesión.");
          setTimeout(() => navigate("/"), 2000);
          return;
        }
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Error al actualizar el perfil: ${response.status}`;
          console.error("Detalles del error:", errorData);
        } catch (parseError) {
          errorMessage = `Error al actualizar el perfil: ${response.status}`;
          try {
            const errorText = await response.text();
            console.error("Respuesta de error (texto):", errorText);
          } catch (textError) {
            console.error("No se pudo leer la respuesta de error");
          }
        }
        throw new Error(errorMessage);
        // --- Fin: Manejo de Errores --- 
      }

      // No necesitamos procesar la respuesta para la imagen aquí
      console.log("Nombre actualizado correctamente en el servidor.");
      
      // Actualizar datos de usuario
      if (refreshUserData) {
        console.log("Refrescando datos de usuario después de actualizar perfil");
        await refreshUserData().catch(err => {
          console.warn("Error al actualizar datos de usuario:", err);
        });
      }

      setSuccess("¡Nombre actualizado correctamente!");
      setInitialName(name);
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
    // Si hay una imagen en vista previa local, usarla
    if (profilePic?.localUrl) return profilePic.localUrl;
    
    // Si hay una URL remota en profilePic, usarla
    if (profilePic?.remoteUrl) return profilePic.remoteUrl;
    
    // Si hay una imagen en el hook useProfileImage, usarla
    if (profileImage && profileImage !== fallbackImageBase64) return profileImage;
    
    // Buscar directamente en localStorage como último recurso
    const storedImage = localStorage.getItem('profilePic');
    if (storedImage && storedImage !== 'undefined' && storedImage !== 'null') {
      return storedImage;
    }
    
    // Usar la imagen de respaldo si no hay ninguna otra disponible
    return fallbackImageBase64;
  }, [profilePic, profileImage]);
  
  // Función para manejar errores al cargar imágenes
  const onImageError = () => {
    console.log("Error al cargar la imagen, usando fallback");
    // Usar el manejador de errores del hook y también actualizar la vista previa local
    handleImageError();
    // Si hay una URL local, revocarla para liberar memoria
    if (profilePic?.localUrl) {
      URL.revokeObjectURL(profilePic.localUrl);
    }
    // Establecer la imagen de perfil como null para que use el fallback
    setProfilePic(null);
  };

  // Log para depurar el estado de deshabilitación
  console.log('Estado CambiarPerfil Render:', { 
    userLoading, 
    userId: user?.id, 
    isUserValid: !!user?.id, // Booleano para ver si user.id existe
    localLoading: loading 
  });

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
              {(loading || profileLoading) ? (
                <div className="w-32 h-32 rounded-full border-4 border-white/30 shadow-lg flex items-center justify-center bg-gray-200">
                   <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <img 
                  src={getCurrentImage()} 
                  alt="Vista previa" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-lg"
                  onError={onImageError}
                />
              )}
              <label 
                htmlFor="profilePic" 
                className={`absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg transition ${ 
                  (userLoading || !user?.id || loading)
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:bg-blue-700' 
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <input 
                  type="file" 
                  id="profilePic" 
                  name="profilePic" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  disabled={userLoading || !user?.id || loading}
                />
              </label>
            </div>
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-blue-100">
              Nombre
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="name"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md border-white/30 bg-white/5 py-2 px-3 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Tu nombre"
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            {!profilePic?.file ? (
              <button 
                type="submit" 
                disabled={loading || userLoading || !name || name === initialName}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(loading || userLoading) ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Guardar Nombre'
                )}
              </button>
            ) : (
              <button 
                type="button" 
                disabled={loading || userLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => navigate("/")}
              >
                {(loading || userLoading) ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : "Actualizar Perfil"}
              </button>
            )}
            
            <button 
              type="button" 
              onClick={() => navigate("/")} 
              className="w-full flex justify-center py-2 px-4 border border-white/30 rounded-md shadow-sm text-sm font-medium text-white bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
          </div>
        </form>
        
        {/* Enlace a la herramienta de diagnóstico */}
        <div className="mt-6 text-center">
          <a 
            href="/test-imagen" 
            className="text-xs text-blue-300 hover:text-blue-100 transition"
          >
            ¿Problemas con la imagen? Usar herramienta de diagnóstico
          </a>
        </div>
      </div>
    </div>
  );
}
