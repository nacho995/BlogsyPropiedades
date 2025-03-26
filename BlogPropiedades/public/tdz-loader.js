/**
 * TDZ-LOADER: Cargador de scripts para prevención de errores TDZ
 * Asegura que los scripts de prevención se carguen en el orden correcto
 * y antes de que React comience a renderizar.
 */
(function() {
  console.log("🚀 TDZ-LOADER: Iniciando carga de scripts de protección...");
  
  // Configuración de scripts a cargar en orden
  const scripts = [
    { name: 'y-fix.js', critical: true },
    { name: 'navbar-fix.js', critical: true },
    { name: 'tdz-resolver.js', critical: true }
  ];
  
  // Función para cargar un script
  function loadScript(src, critical) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false; // Mantener el orden de ejecución
      script.onload = () => {
        console.log(`✅ TDZ-LOADER: Script ${src} cargado correctamente`);
        resolve();
      };
      script.onerror = (error) => {
        console.error(`❌ TDZ-LOADER: Error al cargar ${src}:`, error);
        if (critical) {
          reject(error);
        } else {
          resolve(); // No fallar para scripts no críticos
        }
      };
      document.head.appendChild(script);
    });
  }
  
  // Cargar scripts en secuencia
  async function loadScripts() {
    try {
      // Definir variables globales preventivas
      window.TDZ_PROTECTED_VARS = window.TDZ_PROTECTED_VARS || {};
      window.TDZ_PROTECTED_VARS.y = window.TDZ_PROTECTED_VARS.y || {};
      
      // Prevenir errores TDZ directamente
      try {
        // Pre-definir 'y' de forma segura
        window.y = window.y || {};
      } catch (e) {
        console.warn("⚠️ TDZ-LOADER: No se pudo pre-definir 'y':", e);
      }
      
      // Marca de tiempo para medir rendimiento
      const startTime = performance.now();
      
      // Cargar scripts en secuencia
      for (const script of scripts) {
        await loadScript(script.name, script.critical);
      }
      
      const duration = (performance.now() - startTime).toFixed(2);
      console.log(`✅ TDZ-LOADER: Todos los scripts cargados en ${duration}ms`);
      
      // Registrar en localStorage que los scripts se cargaron
      try {
        localStorage.setItem('tdz_protection_loaded', 'true');
        localStorage.setItem('tdz_protection_time', new Date().toISOString());
      } catch (e) {
        console.warn("⚠️ TDZ-LOADER: No se pudo guardar estado en localStorage");
      }
      
    } catch (error) {
      console.error("❌ TDZ-LOADER: Error crítico en la carga de scripts:", error);
      
      // Intentar aplicar protección de emergencia para la variable 'y'
      try {
        if (typeof window.y === 'undefined') {
          window.y = window.y || {};
          console.warn("⚠️ TDZ-LOADER: Aplicada protección de emergencia para 'y'");
        }
      } catch (e) {
        console.error("❌ TDZ-LOADER: No se pudo aplicar protección de emergencia:", e);
      }
    }
  }
  
  // Ejecutar la carga de scripts inmediatamente
  loadScripts();
})(); 