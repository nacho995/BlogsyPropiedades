import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";
import { BASE_URL } from "../services/api";

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

    // Verificar el tamaño (máximo 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      reject(new Error('La imagen es demasiado grande. El tamaño máximo es 10MB'));
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
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [initialName, setInitialName] = useState("");
  
  const navigate = useNavigate();
  const { user, refreshUserData, safeProfileSync, loading: userLoading, setUser } = useUser();
  
  // Usar la imagen del contexto directamente para mostrarla
  const currentProfileImage = user?.profileImage || fallbackImageBase4;

  // Efecto para cargar el nombre inicial
  useEffect(() => {
    if (user && user.name) {
      setName(user.name);
      setInitialName(user.name);
    }
  }, [user]);

  // Limpiar URL de vista previa al desmontar
  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  console.log(`🔄 CambiarPerfil usando API base: ${BASE_URL}`);

  // Manejar cambios en la imagen usando safeProfileSync
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Crear URL temporal para vista previa inmediata
    const previewUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(previewUrl); // Mostrar vista previa local
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validar antes de llamar a safeProfileSync (opcional, ya que safeProfileSync también valida)
      if (!file.type.startsWith('image/')) {
        throw new Error("El archivo debe ser una imagen (jpg, png, etc.)");
      }
      if (file.size > 10 * 1024 * 1024) { // Usar el límite consistente de 10MB
        throw new Error("La imagen no debe superar los 10MB");
      }

      console.log(`CambiarPerfil: Llamando a safeProfileSync para ${file.name}...`);
      
      // Llamar a la función del contexto
      const result = await safeProfileSync(file); 

      if (result && result.success) {
        console.log("CambiarPerfil: safeProfileSync exitoso. Nueva URL:", result.imageUrl);
        setSuccess("Imagen de perfil actualizada correctamente.");
        // Limpiar la vista previa local, ya que el contexto se habrá actualizado
        setLocalPreviewUrl(null); 
        URL.revokeObjectURL(previewUrl); 
        
        // NO es necesario llamar a refreshUserData aquí, safeProfileSync ya actualizó el contexto
        
      } else {
        // Usar el mensaje de error devuelto por safeProfileSync
        throw new Error(result?.error || 'Error desconocido al sincronizar la imagen.');
      }

    } catch (err) {
      console.error("Error en handleFileChange:", err);
      setError(err.message || "Ocurrió un error inesperado al procesar la imagen.");
      // Limpiar vista previa si hubo error
      setLocalPreviewUrl(null);
      URL.revokeObjectURL(previewUrl);
      
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
      
      // NO llamar a refreshUserData para evitar problemas de token
      // En su lugar, actualizar el nombre directamente en localStorage y contexto
      if (name) {
        localStorage.setItem('name', name);
        console.log("Nombre actualizado en localStorage:", name);
        
        // También actualizar el usuario en el contexto directamente si existe
        if (user) {
          setUser(prevUser => ({ ...prevUser, name: name }));
          console.log("Nombre actualizado en contexto de usuario:", name);
        }
      }
      
      /* Comentado para evitar problemas de token
      if (refreshUserData) {
        console.log("Refrescando datos de usuario después de actualizar perfil");
        await refreshUserData().catch(err => {
          console.warn("Error al actualizar datos de usuario:", err);
        });
      }
      */

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

  // Obtener imagen actual a mostrar (prioriza vista previa local, luego contexto)
  const getCurrentImage = useCallback(() => {
    if (localPreviewUrl) return localPreviewUrl; // Mostrar vista previa si existe
    return currentProfileImage; // Si no, mostrar la imagen del contexto
  }, [localPreviewUrl, currentProfileImage]);
  
  // Función para manejar errores al cargar la imagen del contexto o fallback
  const onImageError = () => {
    console.warn("Error al cargar la imagen principal, usando fallback.");
    // Aquí podríamos forzar el uso del fallback si es necesario, aunque getCurrentImage ya lo hace
    // Si usamos un hook, llamaríamos a handleImageError()
  };

  // Log para depurar el estado de deshabilitación
  console.log('Estado CambiarPerfil Render:', { 
    userLoading, 
    userId: user?.id, 
    isUserValid: !!user?.id, 
    localLoading: loading 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-amber-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-xl shadow-xl overflow-hidden p-8 border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Actualizar Perfil</h2>
          <p className="mt-2 text-blue-100">Cambia tu nombre o foto de perfil</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/30 border border-red-500 rounded-lg text-white">
            {error}
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
              {(loading || userLoading) ? (
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
            {!localPreviewUrl ? (
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
                disabled={true}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-500 cursor-wait"
              >
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                Subiendo Imagen...
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
