import React, { useEffect } from 'react';

/**
 * Gestor de descargas para manejar descargas en segundo plano y caché
 * @module DownloadManager
 */

// Estado de las descargas pendientes
const pendingDownloads = new Map();

// Caché de descargas completadas
const downloadCache = new Map();

// Progreso de descargas activas
let activeDownloads = 0;
let totalDownloadSize = 0;
let downloadedSize = 0;

// Eventos personalizados
const EVENTS = {
  DOWNLOAD_STARTED: 'download-started',
  DOWNLOAD_PROGRESS: 'download-progress',
  DOWNLOAD_COMPLETED: 'download-completed',
  DOWNLOAD_FAILED: 'download-failed',
  ALL_DOWNLOADS_COMPLETED: 'all-downloads-completed'
};

/**
 * Crea un evento personalizado para notificar sobre cambios en las descargas
 * @param {string} event - Tipo de evento
 * @param {Object} detail - Detalles adicionales del evento
 * @returns {CustomEvent} Evento personalizado
 */
const createEvent = (event, detail = {}) => {
  return new CustomEvent(event, { detail });
};

/**
 * Dispara un evento personalizado
 * @param {string} eventName - Nombre del evento
 * @param {Object} detail - Detalles del evento
 */
const dispatchEvent = (eventName, detail = {}) => {
  window.dispatchEvent(createEvent(eventName, detail));
};

/**
 * Añade un oyente para eventos de descarga
 * @param {string} event - Tipo de evento
 * @param {Function} callback - Función que se ejecutará cuando ocurra el evento
 * @returns {Function} Función para eliminar el oyente
 */
export const onDownloadEvent = (event, callback) => {
  if (!Object.values(EVENTS).includes(event)) {
    console.warn(`Evento de descarga desconocido: ${event}`);
    return () => {};
  }
  
  window.addEventListener(event, callback);
  return () => window.removeEventListener(event, callback);
};

/**
 * Descarga un archivo en segundo plano
 * @param {string} url - URL del archivo a descargar
 * @param {Object} options - Opciones de descarga
 * @param {string} options.filename - Nombre con el que se guardará el archivo
 * @param {boolean} options.useCache - Usar caché si está disponible
 * @param {number} options.priority - Prioridad de la descarga (1-10)
 * @param {Function} options.onProgress - Callback para progreso de descarga
 * @returns {Promise<Blob>} Blob del archivo descargado
 */
export const downloadFile = async (url, options = {}) => {
  const {
    filename = url.split('/').pop(),
    useCache = true,
    priority = 5,
    onProgress = null
  } = options;
  
  // Verificar si está en caché
  if (useCache && downloadCache.has(url)) {
    console.log(`📦 Usando archivo en caché: ${filename}`);
    const cached = downloadCache.get(url);
    
    dispatchEvent(EVENTS.DOWNLOAD_COMPLETED, {
      url,
      filename,
      fromCache: true,
      size: cached.size
    });
    
    return cached;
  }
  
  // Si ya está en proceso de descarga, devolver la promesa existente
  if (pendingDownloads.has(url)) {
    console.log(`⏳ Descarga ya en proceso: ${filename}`);
    return pendingDownloads.get(url);
  }
  
  // Iniciar nueva descarga
  console.log(`🔽 Iniciando descarga: ${filename}`);
  activeDownloads++;
  
  const downloadPromise = (async () => {
    try {
      // Notificar inicio de descarga
      dispatchEvent(EVENTS.DOWNLOAD_STARTED, { url, filename, priority });
      
      // Crear petición con soporte para seguimiento de progreso
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error al descargar archivo: ${response.status} ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      const size = contentLength ? parseInt(contentLength, 10) : 0;
      
      totalDownloadSize += size;
      
      // Recibir la respuesta como stream para seguir el progreso
      const reader = response.body.getReader();
      const chunks = [];
      let receivedLength = 0;
      
      // Leer el stream en chunks
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        chunks.push(value);
        receivedLength += value.length;
        downloadedSize += value.length;
        
        // Calcular y notificar progreso
        const progress = size ? (receivedLength / size) * 100 : 0;
        
        if (onProgress) {
          onProgress(progress, receivedLength, size);
        }
        
        dispatchEvent(EVENTS.DOWNLOAD_PROGRESS, {
          url,
          filename,
          progress,
          received: receivedLength,
          total: size,
          globalProgress: {
            active: activeDownloads,
            totalSize: totalDownloadSize,
            downloadedSize
          }
        });
      }
      
      // Concatenar chunks en un único Uint8Array
      const chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }
      
      // Convertir a Blob
      const result = new Blob([chunksAll]);
      
      // Guardar en caché
      downloadCache.set(url, result);
      
      // Notificar finalización
      dispatchEvent(EVENTS.DOWNLOAD_COMPLETED, {
        url,
        filename,
        size: result.size,
        fromCache: false
      });
      
      console.log(`✅ Descarga completada: ${filename} (${(result.size / 1024).toFixed(2)} KB)`);
      
      return result;
    } catch (error) {
      console.error(`❌ Error en descarga: ${filename}`, error);
      
      dispatchEvent(EVENTS.DOWNLOAD_FAILED, {
        url,
        filename,
        error: error.message
      });
      
      throw error;
    } finally {
      activeDownloads--;
      pendingDownloads.delete(url);
      
      if (activeDownloads === 0) {
        dispatchEvent(EVENTS.ALL_DOWNLOADS_COMPLETED, {
          totalDownloaded: downloadedSize,
          cachedItems: downloadCache.size
        });
        
        downloadedSize = 0;
        totalDownloadSize = 0;
      }
    }
  })();
  
  pendingDownloads.set(url, downloadPromise);
  return downloadPromise;
};

/**
 * Descarga y guarda un archivo en el dispositivo del usuario
 * @param {string} url - URL del archivo a descargar
 * @param {Object} options - Opciones de descarga
 * @returns {Promise<boolean>} - Éxito de la operación
 */
export const downloadAndSaveFile = async (url, options = {}) => {
  try {
    const blob = await downloadFile(url, options);
    const filename = options.filename || url.split('/').pop();
    
    // Crear enlace para descargar
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    
    // Añadir a la página y hacer clic
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error al guardar archivo:', error);
    return false;
  }
};

/**
 * Limpia la caché de descargas
 * @param {string|null} url - URL específica a limpiar, o null para limpiar todo
 */
export const clearDownloadCache = (url = null) => {
  if (url) {
    downloadCache.delete(url);
    console.log(`🧹 Eliminado de caché: ${url}`);
  } else {
    downloadCache.clear();
    console.log('🧹 Caché de descargas limpiada completamente');
  }
};

/**
 * Obtiene estadísticas de descarga
 * @returns {Object} Estadísticas de descarga
 */
export const getDownloadStats = () => {
  const totalCachedSize = Array.from(downloadCache.values())
    .reduce((total, blob) => total + blob.size, 0);
  
  return {
    activeDownloads,
    pendingCount: pendingDownloads.size,
    cachedItems: downloadCache.size,
    cachedSize: totalCachedSize,
    totalProgress: activeDownloads ? (downloadedSize / totalDownloadSize) * 100 : 0
  };
};

/**
 * Componente React de Preload para precargar archivos en segundo plano
 * @param {Object} props - Propiedades del componente
 * @param {string[]} props.urls - URLs a precargar
 * @param {Function} props.onComplete - Callback cuando se completa la precarga
 * @returns {null} No renderiza nada visible
 */
export const Preload = ({ urls = [], onComplete = null }) => {
  // Implementar como un efecto de React
  useEffect(() => {
    if (!urls.length) return;
    
    let unmounted = false;
    
    const preloadFiles = async () => {
      try {
        const promises = urls.map(url => downloadFile(url, { priority: 2 }));
        await Promise.all(promises);
        
        if (!unmounted && onComplete) {
          onComplete();
        }
      } catch (error) {
        console.error('Error al precargar archivos:', error);
      }
    };
    
    preloadFiles();
    
    return () => {
      unmounted = true;
    };
  }, [urls, onComplete]);
  
  return null;
};

// Exportar constantes de eventos
export const DOWNLOAD_EVENTS = EVENTS; 