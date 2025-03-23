import React, { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';

// Definir acciones
const APP_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_NETWORK_STATUS: 'SET_NETWORK_STATUS',
  SET_MEMORY_USAGE: 'SET_MEMORY_USAGE',
  LOG_ERROR: 'LOG_ERROR',
  LOG_PERFORMANCE_ISSUE: 'LOG_PERFORMANCE_ISSUE',
  MARK_INITIALIZED: 'MARK_INITIALIZED',
  SET_DEBUG_MODE: 'SET_DEBUG_MODE',
  TOGGLE_MAINTENANCE_MODE: 'TOGGLE_MAINTENANCE_MODE'
};

// Estado inicial
const initialState = {
  loading: false,
  error: null,
  isInitialized: false,
  networkStatus: {
    online: navigator.onLine,
    lastCheck: Date.now(),
    apiConnected: true,
    connectionQuality: 'good' // 'good', 'fair', 'poor'
  },
  memoryUsage: {
    lastCheck: null,
    usageLevel: 'normal', // 'normal', 'high', 'critical'
    approximateUsageMb: 0
  },
  errorLog: [],
  performanceIssues: [],
  debugMode: process.env.NODE_ENV === 'development',
  maintenanceMode: false,
  diagnostics: {
    appStartTime: Date.now(),
    lastUserInteraction: Date.now(),
    renderCount: 0,
    slowRenders: 0,
    batteryLevel: null,
    deviceMemory: navigator.deviceMemory || null,
    connectionType: navigator.connection ? navigator.connection.effectiveType : null
  }
};

// Reductor para manejar acciones
const appStateReducer = (state, action) => {
  switch (action.type) {
    case APP_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case APP_ACTIONS.SET_ERROR:
      return { 
        ...state, 
        error: action.payload,
        errorLog: [
          { error: action.payload, timestamp: Date.now() },
          ...state.errorLog.slice(0, 19) // Mantener solo los últimos 20 errores
        ]
      };
      
    case APP_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
      
    case APP_ACTIONS.SET_NETWORK_STATUS:
      return { 
        ...state, 
        networkStatus: { 
          ...state.networkStatus, 
          ...action.payload,
          lastCheck: Date.now() 
        } 
      };
      
    case APP_ACTIONS.SET_MEMORY_USAGE:
      return { ...state, memoryUsage: { ...action.payload, lastCheck: Date.now() } };
      
    case APP_ACTIONS.LOG_ERROR:
      const newError = { ...action.payload, timestamp: Date.now() };
      return { 
        ...state, 
        errorLog: [newError, ...state.errorLog.slice(0, 19)]
      };
      
    case APP_ACTIONS.LOG_PERFORMANCE_ISSUE:
      const newIssue = { ...action.payload, timestamp: Date.now() };
      return {
        ...state,
        performanceIssues: [newIssue, ...state.performanceIssues.slice(0, 9)]
      };
      
    case APP_ACTIONS.MARK_INITIALIZED:
      return { ...state, isInitialized: true };
      
    case APP_ACTIONS.SET_DEBUG_MODE:
      return { ...state, debugMode: action.payload };
      
    case APP_ACTIONS.TOGGLE_MAINTENANCE_MODE:
      return { ...state, maintenanceMode: action.payload };
      
    default:
      return state;
  }
};

// Crear contexto
const AppStateContext = createContext();

// Proveedor del contexto
export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  
  // Monitorear el estado de la red
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ 
        type: APP_ACTIONS.SET_NETWORK_STATUS, 
        payload: { online: true } 
      });
      
      toast.success('Conexión a internet restablecida', {
        icon: '🌐',
        duration: 3000
      });
    };
    
    const handleOffline = () => {
      dispatch({ 
        type: APP_ACTIONS.SET_NETWORK_STATUS, 
        payload: { online: false } 
      });
      
      toast.error('Conexión a internet perdida', {
        icon: '📶',
        duration: 5000
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Verificar la conexión con el API periódicamente
    const checkApiConnection = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '';
        if (!API_URL) return;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const startTime = Date.now();
        const response = await fetch(`${API_URL}/health`, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store'
        });
        const endTime = Date.now();
        clearTimeout(timeoutId);
        
        const responseTime = endTime - startTime;
        let connectionQuality = 'good';
        
        if (responseTime > 1000) {
          connectionQuality = 'poor';
        } else if (responseTime > 500) {
          connectionQuality = 'fair';
        }
        
        dispatch({
          type: APP_ACTIONS.SET_NETWORK_STATUS,
          payload: {
            apiConnected: response.ok,
            connectionQuality,
            responseTime
          }
        });
      } catch (error) {
        // Solo mostrar error en modo debug
        if (state.debugMode) {
          console.warn('Error al verificar conexión con API:', error);
        }
        
        dispatch({
          type: APP_ACTIONS.SET_NETWORK_STATUS,
          payload: {
            apiConnected: false,
            connectionQuality: 'poor'
          }
        });
      }
    };
    
    // Verificar conexión al inicio y cada 2 minutos
    checkApiConnection();
    const intervalId = setInterval(checkApiConnection, 120000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [state.debugMode]);
  
  // Monitorear uso de memoria
  useEffect(() => {
    const checkMemoryUsage = () => {
      if (!window.performance || !window.performance.memory) {
        return;
      }
      
      const memory = window.performance.memory;
      const usedHeapSizeMb = Math.round(memory.usedJSHeapSize / (1024 * 1024));
      const totalHeapSizeMb = Math.round(memory.totalJSHeapSize / (1024 * 1024));
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      let usageLevel = 'normal';
      
      if (usagePercentage > 80) {
        usageLevel = 'critical';
      } else if (usagePercentage > 60) {
        usageLevel = 'high';
      }
      
      dispatch({
        type: APP_ACTIONS.SET_MEMORY_USAGE,
        payload: {
          approximateUsageMb: usedHeapSizeMb,
          totalHeapSizeMb,
          usagePercentage: Math.round(usagePercentage),
          usageLevel
        }
      });
      
      // Advertir al usuario si el uso de memoria es crítico
      if (usageLevel === 'critical' && state.debugMode) {
        toast.error('Uso de memoria crítico. Considera refrescar la página.', {
          duration: 10000,
          icon: '⚠️'
        });
        
        dispatch({
          type: APP_ACTIONS.LOG_PERFORMANCE_ISSUE,
          payload: {
            type: 'memory',
            level: 'critical',
            detail: `Uso de memoria: ${usedHeapSizeMb}MB (${Math.round(usagePercentage)}%)`
          }
        });
      }
    };
    
    // Verificar memoria cada 30 segundos
    const intervalId = setInterval(checkMemoryUsage, 30000);
    checkMemoryUsage(); // Verificar inmediatamente al inicio
    
    return () => clearInterval(intervalId);
  }, [state.debugMode]);
  
  // Monitorear interacciones del usuario
  useEffect(() => {
    const updateUserInteraction = () => {
      dispatch({
        type: 'UPDATE_DIAGNOSTICS',
        payload: {
          lastUserInteraction: Date.now()
        }
      });
    };
    
    // Eventos comunes de interacción
    window.addEventListener('click', updateUserInteraction);
    window.addEventListener('keydown', updateUserInteraction);
    window.addEventListener('touchstart', updateUserInteraction);
    window.addEventListener('scroll', updateUserInteraction);
    
    return () => {
      window.removeEventListener('click', updateUserInteraction);
      window.removeEventListener('keydown', updateUserInteraction);
      window.removeEventListener('touchstart', updateUserInteraction);
      window.removeEventListener('scroll', updateUserInteraction);
    };
  }, []);
  
  // Marcar como inicializado después de un breve retraso
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch({ type: APP_ACTIONS.MARK_INITIALIZED });
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Verificar nivel de batería si está disponible
  useEffect(() => {
    const checkBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await navigator.getBattery();
          
          const updateBatteryStatus = () => {
            const batteryLevel = Math.round(battery.level * 100);
            
            dispatch({
              type: 'UPDATE_DIAGNOSTICS',
              payload: { batteryLevel }
            });
            
            // Advertir en modo de ahorro de batería
            if (battery.charging === false && batteryLevel < 15 && state.debugMode) {
              toast.warn('Batería baja. La aplicación puede reducir su rendimiento para ahorrar energía.', {
                duration: 5000,
                icon: '🔋'
              });
            }
          };
          
          // Monitorear cambios en la batería
          battery.addEventListener('levelchange', updateBatteryStatus);
          battery.addEventListener('chargingchange', updateBatteryStatus);
          
          // Verificar al inicio
          updateBatteryStatus();
          
          return () => {
            battery.removeEventListener('levelchange', updateBatteryStatus);
            battery.removeEventListener('chargingchange', updateBatteryStatus);
          };
        } catch (error) {
          console.warn('Error al acceder a la información de batería:', error);
        }
      }
    };
    
    checkBattery();
  }, [state.debugMode]);
  
  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAppState = () => {
  const context = useContext(AppStateContext);
  
  if (!context) {
    throw new Error('useAppState debe usarse dentro de un AppStateProvider');
  }
  
  return context;
};

// Acciones exportadas para uso común
export const appStateActions = {
  setLoading: (isLoading) => ({
    type: APP_ACTIONS.SET_LOADING,
    payload: isLoading
  }),
  
  setError: (error) => ({
    type: APP_ACTIONS.SET_ERROR,
    payload: error
  }),
  
  clearError: () => ({
    type: APP_ACTIONS.CLEAR_ERROR
  }),
  
  logError: (error, source, additionalInfo = {}) => ({
    type: APP_ACTIONS.LOG_ERROR,
    payload: {
      message: error.message || String(error),
      stack: error.stack,
      source,
      ...additionalInfo
    }
  }),
  
  setDebugMode: (enabled) => ({
    type: APP_ACTIONS.SET_DEBUG_MODE,
    payload: enabled
  }),
  
  toggleMaintenanceMode: (enabled) => ({
    type: APP_ACTIONS.TOGGLE_MAINTENANCE_MODE,
    payload: enabled
  }),
  
  logPerformanceIssue: (type, level, detail) => ({
    type: APP_ACTIONS.LOG_PERFORMANCE_ISSUE,
    payload: { type, level, detail }
  })
};

export default AppStateContext; 