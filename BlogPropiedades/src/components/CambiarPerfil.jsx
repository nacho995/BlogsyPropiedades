import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";
import useProfileImage from "../hooks/useProfileImage";

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
  
  const navigate = useNavigate();
  const { user, refreshUserData } = useUser();
  
  // Usar el hook simplificado con sincronización
  const { 
    profileImage, 
    isLoading: profileLoading, 
    error: profileError, 
    handleImageError, 
    updateProfileImage,
    fallbackImageBase64
  } = useProfileImage();

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (profilePic?.localUrl) {
        URL.revokeObjectURL(profilePic.localUrl);
      }
    };
  }, [profilePic]);

  // Inicializar la imagen al montar el componente
  useEffect(() => {
    try {
      const storedImage = localStorage.getItem('profilePic');
      // Solo actualizar si hay una imagen válida
      if (storedImage && storedImage !== 'undefined' && storedImage !== 'null' && typeof storedImage === 'string') {
        console.log("CambiarPerfil: Inicializando con imagen guardada");
        updateProfileImage(storedImage).catch(err => 
          console.error("Error al inicializar imagen en CambiarPerfil:", err)
        );
      }
    } catch (err) {
      console.error("Error al cargar imagen inicial en CambiarPerfil:", err);
    }
  }, [updateProfileImage]);

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
      setSuccess(null); // Limpiar mensaje de éxito anterior

      // Crear URL temporal para vista previa
      const localUrl = URL.createObjectURL(file);
      setProfilePic({ file, localUrl });

      // Convertir a base64 para almacenamiento
      const reader = new FileReader();
      
      reader.onload = function(event) {
        try {
          const imageData = event.target.result;
          
          // Verificar que la imagen es válida
          if (!imageData || typeof imageData !== 'string') {
            throw new Error("La imagen procesada no es válida");
          }
          
          console.log("CambiarPerfil: Imagen cargada desde el ordenador, actualizando...");
          
          // Guardar la imagen en localStorage para asegurar persistencia
          localStorage.setItem('profilePic', imageData);
          localStorage.setItem('profilePic_backup', imageData);
          
          // Actualizar la imagen usando el hook con la función actualizada
          updateProfileImage(imageData)
            .then((success) => {
              if (success) {
                console.log("CambiarPerfil: Imagen actualizada correctamente en toda la aplicación");
                setSuccess("Imagen actualizada correctamente");
                
                // Notificar a toda la aplicación sobre el cambio
                window.dispatchEvent(new CustomEvent('profileImageUpdated', {
                  detail: { profileImage: imageData, timestamp: Date.now() }
                }));
                
                // También actualizar el perfil del usuario si está disponible
                if (user && refreshUserData) {
                  refreshUserData().catch(err => 
                    console.warn("Error al actualizar datos de usuario:", err)
                  );
                }
              } else {
                setError("No se pudo actualizar la imagen correctamente");
              }
              setLoading(false);
            })
            .catch(err => {
              console.error("Error al actualizar imagen:", err);
              setError("Error al actualizar la imagen. Inténtalo de nuevo.");
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

      // Crear FormData para enviar los datos
      const formData = new FormData();
      if (name) formData.append('name', name);
      
      // Si tenemos una imagen, añadirla al FormData con el nombre correcto esperado por el backend
      if (profilePic?.file) {
        console.log(`Añadiendo archivo de imagen (${profilePic.file.name}, ${profilePic.file.type}, ${profilePic.file.size} bytes) al FormData`);
        formData.append('profilePic', profilePic.file);
        
        // También actualizar la imagen localmente para respuesta inmediata
        try {
          const imageData = await validateAndProcessImage(profilePic.file);
          await updateProfileImage(imageData);
          localStorage.setItem('profilePic', imageData);
          localStorage.setItem('profilePic_backup', imageData);
        } catch (imgError) {
          console.error("Error al procesar imagen localmente:", imgError);
        }
      }

      console.log("Enviando datos de perfil al servidor...");
      
      // Log para depuración - ver contenido del FormData
      for (let pair of formData.entries()) {
        console.log(`FormData contiene: ${pair[0]}: ${pair[1] instanceof File ? `Archivo: ${pair[1].name}` : pair[1]}`);
      }
      
      // Llamada al backend para actualizar el perfil usando FormData
      const response = await fetch(`${API_URL}/user/update-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        // No incluir Content-Type para que el navegador establezca el boundary correcto
      });

      // Registrar los detalles completos de la respuesta para depuración
      console.log("Respuesta del servidor:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()])
      });

      if (!response.ok) {
        console.error("Error del servidor:", response.status, response.statusText);
        
        // Si hay error de autorización, intentar actualizar solo localmente
        if (response.status === 401) {
          console.warn("Error de autorización al actualizar perfil. Actualizando solo localmente.");
          
          if (name) {
            localStorage.setItem('name', name);
          }
          
          setSuccess("Perfil actualizado localmente. Los cambios se sincronizarán cuando inicies sesión.");
          setTimeout(() => navigate("/"), 2000);
          return;
        }
        
        // Intentar obtener más detalles del error
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
      }

      // Intentar procesar la respuesta
      let data;
      try {
        data = await response.json();
        console.log("Respuesta del servidor (datos):", data);
      } catch (parseError) {
        console.warn("No se pudo parsear la respuesta como JSON:", parseError);
        // Si la respuesta no es JSON pero el status es OK, asumimos éxito
        if (response.ok) {
          data = { success: true };
        }
      }
      
      // Si la API devolvió una URL de imagen, actualizarla en toda la aplicación
      let imageUpdated = false;
      
      // Buscar la imagen en diferentes ubicaciones de la respuesta
      if (data?.profilePic && typeof data.profilePic === 'string') {
        console.log("📤 Recibida imagen de perfil como string:", data.profilePic.substring(0, 30) + "...");
        localStorage.setItem('profilePic', data.profilePic);
        localStorage.setItem('profilePic_backup', data.profilePic);
        await updateProfileImage(data.profilePic);
        imageUpdated = true;
      } else if (data?.user?.profilePic && typeof data.user.profilePic === 'string') {
        console.log("📤 Recibida imagen de perfil en user.profilePic:", data.user.profilePic.substring(0, 30) + "...");
        localStorage.setItem('profilePic', data.user.profilePic);
        localStorage.setItem('profilePic_backup', data.user.profilePic);
        await updateProfileImage(data.user.profilePic);
        imageUpdated = true;
      } else if (data?.profileImage?.url && typeof data.profileImage.url === 'string') {
        console.log("📤 Recibida imagen de perfil en profileImage.url:", data.profileImage.url.substring(0, 30) + "...");
        localStorage.setItem('profilePic', data.profileImage.url);
        localStorage.setItem('profilePic_backup', data.profileImage.url);
        await updateProfileImage(data.profileImage.url);
        imageUpdated = true;
      } else if (data?.user?.profileImage?.url && typeof data.user.profileImage.url === 'string') {
        console.log("📤 Recibida imagen de perfil en user.profileImage.url:", data.user.profileImage.url.substring(0, 30) + "...");
        localStorage.setItem('profilePic', data.user.profileImage.url);
        localStorage.setItem('profilePic_backup', data.user.profileImage.url);
        await updateProfileImage(data.user.profileImage.url);
        imageUpdated = true;
      }
      
      // Si no se recibió imagen del servidor pero subimos una, usamos la versión local
      if (!imageUpdated && profilePic?.file) {
        console.log("📤 No se recibió imagen del servidor, usando versión local almacenada");
        const currentImage = localStorage.getItem('profilePic');
        if (currentImage) {
          window.dispatchEvent(new CustomEvent('profileImageUpdated', {
            detail: { profileImage: currentImage, timestamp: Date.now() }
          }));
        }
      }

      // Actualizar datos de usuario
      if (refreshUserData) {
        console.log("Refrescando datos de usuario después de actualizar perfil");
        await refreshUserData().catch(err => {
          console.warn("Error al actualizar datos de usuario:", err);
        });
      }

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
    // Si hay una imagen en vista previa local, usarla
    if (profilePic?.localUrl) return profilePic.localUrl;
    
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
                onError={onImageError}
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

          {profilePic?.file && (
            <div className="text-center">
              <button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm transition"
                onClick={() => navigate("/")}
                disabled={loading || profileLoading}
              >
                Guardar y volver
              </button>
            </div>
          )}
          
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
