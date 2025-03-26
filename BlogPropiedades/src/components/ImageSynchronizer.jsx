import { useEffect } from 'react';

/**
 * Componente invisible que se encarga de mantener sincronizadas las imágenes
 * entre diferentes componentes de la aplicación.
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
      } else {
        console.log("⚠️ ImageSynchronizer: No se encontró imagen válida en localStorage");
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
      }
    };
    
    // Función para sincronizar cada 30 segundos (solo por seguridad)
    const periodicSync = () => {
      try {
        const storedImage = localStorage.getItem('profilePic');
        
        if (storedImage && 
            storedImage !== 'undefined' && 
            storedImage !== 'null' && 
            typeof storedImage === 'string') {
          
          console.log("🔄 ImageSynchronizer: Sincronización periódica");
          
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
        console.error("❌ ImageSynchronizer: Error en sincronización periódica:", err);
      }
    };
    
    // Configurar timer para sincronización periódica
    const syncInterval = setInterval(periodicSync, 30000);
    
    // Registrar escuchadores
    window.addEventListener('storage', handleStorageChange);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(syncInterval);
      console.log("👋 ImageSynchronizer: Servicio de sincronización detenido");
    };
  }, []);
  
  // Este componente no renderiza nada visible
  return null;
};

export default ImageSynchronizer; 