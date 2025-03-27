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
    
    // Intentar sincronizar imágenes pendientes al cargar
    const attemptPendingSync = async () => {
      try {
        const hasPendingSync = localStorage.getItem('pendingProfileSync') === 'true';
        const pendingImage = localStorage.getItem('profilePic_pending');
        
        if (hasPendingSync && pendingImage) {
          console.log("🔄 ImageSynchronizer: Intentando sincronizar imagen pendiente...");
          const result = await syncProfileImageBetweenDevices(pendingImage);
          
          if (result.success) {
            console.log("✅ ImageSynchronizer: Imagen pendiente sincronizada correctamente");
            localStorage.removeItem('pendingProfileSync');
            localStorage.removeItem('profilePic_pending');
          } else {
            console.warn("⚠️ ImageSynchronizer: No se pudo sincronizar imagen pendiente:", result.error);
          }
        }
      } catch (error) {
        console.error("🛑 ImageSynchronizer: Error al intentar sincronizar imagen pendiente:", error);
      }
    };
    
    // Verificar si hay una imagen en localStorage al montar
    try {
      const storedImage = localStorage.getItem('profilePic');
      
      if (storedImage && 
          storedImage !== 'undefined' && 
          storedImage !== 'null' && 
          typeof storedImage === 'string') {
        
        console.log("🔍 ImageSynchronizer: Encontrada imagen en localStorage, sincronizando...");
        
        // Asegurarnos de que la imagen esté en el backup también
        localStorage.setItem('profilePic_backup', storedImage);
        
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
          await attemptPendingSync();
          
          try {
            console.log("🔄 ImageSynchronizer: Sincronizando imagen inicial con el servidor...");
            const result = await syncProfileImageBetweenDevices(storedImage);
            if (result.success) {
              console.log("✅ ImageSynchronizer: Imagen sincronizada correctamente con el servidor");
            } else {
              console.warn("⚠️ ImageSynchronizer: No se pudo sincronizar imagen con el servidor:", result.error);
            }
          } catch (syncError) {
            console.warn("⚠️ ImageSynchronizer: Error al sincronizar imagen inicial:", syncError);
          }
        }, 3000);
      } else {
        console.log("🔍 ImageSynchronizer: No se encontró imagen en localStorage, intentando cargar del servidor...");
        
        // Si no hay imagen en localStorage, intentar cargar del servidor
        setTimeout(async () => {
          try {
            const serverImage = await fetchProfileImageFromServer();
            if (serverImage.success && serverImage.profileImage) {
              console.log("✅ ImageSynchronizer: Imagen cargada correctamente del servidor");
              // La función fetchProfileImageFromServer ya actualiza localStorage y emite evento
            } else {
              console.log("ℹ️ ImageSynchronizer: No hay imagen en el servidor");
            }
          } catch (loadError) {
            console.warn("⚠️ ImageSynchronizer: Error al cargar imagen del servidor:", loadError);
          }
        }, 2000);
      }
    } catch (e) {
      console.error("🛑 ImageSynchronizer: Error al procesar imagen inicial:", e);
    }
    
    // Manejar eventos de actualización de localStorage
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
        // Verificar primero si hay sincronizaciones pendientes
        await attemptPendingSync();
        
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
    const syncInterval = setInterval(syncWithServer, 10 * 60 * 1000); // Cada 10 minutos
    
    // Recuperar imagen en caso de fallo al inicio de sesión
    const recoverImageOnLogin = () => {
      try {
        const backupImage = localStorage.getItem('profilePic_backup');
        if (backupImage && 
            backupImage !== 'undefined' && 
            backupImage !== 'null' && 
            typeof backupImage === 'string') {
          
          // La imagen principal se ha perdido pero tenemos backup
          console.log("🔄 ImageSynchronizer: Recuperando imagen de backup tras inicio de sesión");
          localStorage.setItem('profilePic', backupImage);
          
          // Emitir evento para actualizar UI
          window.dispatchEvent(new CustomEvent('profileImageUpdated', {
            detail: { 
              profileImage: backupImage, 
              timestamp: Date.now(),
              source: 'recoverySync'
            }
          }));
          
          // Sincronizar con servidor
          setTimeout(async () => {
            try {
              await syncProfileImageBetweenDevices(backupImage);
            } catch (syncError) {
              console.warn("⚠️ ImageSynchronizer: Error al sincronizar imagen recuperada:", syncError);
            }
          }, 2000);
        }
      } catch (e) {
        console.error("🛑 ImageSynchronizer: Error al recuperar imagen de backup:", e);
      }
    };
    
    // Escuchar eventos de login
    window.addEventListener('userLoggedIn', () => {
      console.log("🔄 ImageSynchronizer: Evento de login detectado, verificando imágenes...");
      
      // Intentar recuperar imagen de backup si es necesario
      setTimeout(recoverImageOnLogin, 1000);
      
      // Intentar sincronizar con el servidor después de login
      setTimeout(async () => {
        try {
          await syncWithServer();
        } catch (err) {
          console.warn("⚠️ ImageSynchronizer: Error en sincronización post-login:", err);
        }
      }, 3000);
    });
    
    // Configurar listener para cambios en localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Limpiar al desmontar
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return null;
};

export default ImageSynchronizer; 