import { useEffect } from 'react';
import { syncProfileImageBetweenDevices, fetchProfileImageFromServer } from '../services/api';

/**
 * Componente invisible que se encarga de mantener sincronizadas las imágenes
 * entre diferentes dispositivos de la aplicación.
 * 
 * Este componente debe añadirse al layout principal de la aplicación.
 */
const ImageSynchronizer = () => {
  useEffect(() => {
    console.log("🔄 ImageSynchronizer: Iniciando servicio de sincronización de imágenes");
    
    // Verificar si hay una imagen en localStorage al montar
    try {
      const storedImage = localStorage.getItem('profilePic');
      
      if (storedImage && 
          storedImage !== 'undefined' && 
          storedImage !== 'null' && 
          typeof storedImage === 'string') {
        
        console.log("🔍 ImageSynchronizer: Encontrada imagen en localStorage, sincronizando...");
        
        // Emitir evento solo si la imagen existe
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('profileImageUpdated', {
            detail: { 
              profileImage: storedImage, 
              timestamp: Date.now(),
              source: 'ImageSynchronizer'
            }
          }));
          console.log("📣 ImageSynchronizer: Evento de sincronización inicial emitido");
        }, 500);
        
        // Intentar sincronizar con el servidor (baja prioridad)
        setTimeout(async () => {
          try {
            // Verificar última sincronización cloud
            const lastCloudSync = localStorage.getItem('profilePic_lastCloudSync');
            const lastUpdateTime = localStorage.getItem('profilePic_lastUpdate');
            
            // Si la imagen local es más reciente que la última sincronización cloud
            if (!lastCloudSync || (lastUpdateTime && parseInt(lastUpdateTime) > parseInt(lastCloudSync))) {
              console.log("🔄 ImageSynchronizer: Sincronizando imagen con el servidor...");
              
              await syncProfileImageBetweenDevices(storedImage);
              console.log("📤 ImageSynchronizer: Imagen sincronizada con el servidor");
            } else {
              console.log("✅ ImageSynchronizer: La imagen ya está sincronizada con el servidor");
            }
          } catch (err) {
            console.warn("⚠️ ImageSynchronizer: Error al sincronizar con servidor:", err);
          }
        }, 5000);
      } else {
        console.log("⚠️ ImageSynchronizer: No se encontró imagen válida en localStorage");
        
        // Intentar obtener la imagen del servidor
        setTimeout(async () => {
          try {
            console.log("🔍 ImageSynchronizer: Intentando obtener imagen desde el servidor...");
            const result = await fetchProfileImageFromServer();
            
            if (result.success) {
              console.log("✅ ImageSynchronizer: Imagen obtenida del servidor");
            } else {
              console.log("❌ ImageSynchronizer: No hay imagen disponible en el servidor");
            }
          } catch (err) {
            console.warn("⚠️ ImageSynchronizer: Error al obtener imagen del servidor:", err);
          }
        }, 3000);
      }
    } catch (err) {
      console.error("❌ ImageSynchronizer: Error al verificar imagen inicial:", err);
    }
    
    // Escuchar cambios en localStorage
    const handleStorageChange = (e) => {
      if ((e.key === 'profilePic' || e.key === 'profilePic_backup') && e.newValue) {
        console.log("🔄 ImageSynchronizer: Cambio detectado en localStorage:", e.key);
        
        // Emitir evento para actualizar todos los componentes
        window.dispatchEvent(new CustomEvent('profileImageUpdated', {
          detail: { 
            profileImage: e.newValue, 
            timestamp: Date.now(),
            source: 'localStorage'
          }
        }));
        
        // Retrasar la sincronización con el servidor
        setTimeout(async () => {
          try {
            console.log("🔄 ImageSynchronizer: Sincronizando cambio con el servidor...");
            await syncProfileImageBetweenDevices(e.newValue);
          } catch (syncError) {
            console.warn("⚠️ ImageSynchronizer: Error al sincronizar cambio con servidor:", syncError);
          }
        }, 2000);
      }
    };
    
    // Función para sincronización regular con el servidor cada 10 minutos
    const syncWithServer = async () => {
      try {
        // Verificar si hay token e imagen local
        const token = localStorage.getItem('token');
        const storedImage = localStorage.getItem('profilePic');
        
        if (!token || !storedImage) {
          console.log("🔄 ImageSynchronizer: No hay token o imagen para sincronización periódica");
          return;
        }
        
        console.log("🔄 ImageSynchronizer: Comprobando cambios con el servidor...");
        
        // 1. Primero intentar obtener imagen del servidor
        const serverImage = await fetchProfileImageFromServer();
        
        // 2. Si el servidor tiene una imagen
        if (serverImage.success && serverImage.profileImage) {
          // La imagen del servidor es diferente a la local
          if (serverImage.profileImage !== storedImage) {
            console.log("🔄 ImageSynchronizer: Imagen del servidor diferente, actualizando local...");
            window.dispatchEvent(new CustomEvent('profileImageUpdated', {
              detail: { 
                profileImage: serverImage.profileImage, 
                timestamp: Date.now(),
                source: 'serverSync'
              }
            }));
          } else {
            console.log("✅ ImageSynchronizer: Imagen local ya está sincronizada con el servidor");
          }
        } 
        // 3. Si no hay imagen en el servidor pero hay local, subir la local
        else if (storedImage) {
          console.log("🔄 ImageSynchronizer: Enviando imagen local al servidor...");
          await syncProfileImageBetweenDevices(storedImage);
        }
      } catch (err) {
        console.warn("⚠️ ImageSynchronizer: Error en sincronización periódica:", err);
      }
    };
    
    // Configurar timers para sincronización periódica
    const shortSyncInterval = setInterval(() => {
      try {
        const storedImage = localStorage.getItem('profilePic');
        
        if (storedImage && 
            storedImage !== 'undefined' && 
            storedImage !== 'null' && 
            typeof storedImage === 'string') {
          
          console.log("🔄 ImageSynchronizer: Sincronización periódica local");
          
          // Emitir evento solo si la imagen existe
          window.dispatchEvent(new CustomEvent('profileImageUpdated', {
            detail: { 
              profileImage: storedImage, 
              timestamp: Date.now(),
              source: 'periodicSync'
            }
          }));
        }
      } catch (err) {
        console.error("❌ ImageSynchronizer: Error en sincronización periódica local:", err);
      }
    }, 30000); // cada 30 segundos
    
    // Sincronización con el servidor menos frecuente
    const serverSyncInterval = setInterval(syncWithServer, 10 * 60 * 1000); // cada 10 minutos
    
    // Primera sincronización con el servidor después de 30 segundos
    const initialServerSync = setTimeout(syncWithServer, 30000);
    
    // Registrar escuchadores
    window.addEventListener('storage', handleStorageChange);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(shortSyncInterval);
      clearInterval(serverSyncInterval);
      clearTimeout(initialServerSync);
      console.log("👋 ImageSynchronizer: Servicio de sincronización detenido");
    };
  }, []);
  
  // Este componente no renderiza nada visible
  return null;
};

export default ImageSynchronizer; 