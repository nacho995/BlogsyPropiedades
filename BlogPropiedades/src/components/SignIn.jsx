import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, createUser, fetchProfileImageFromServer } from "../services/api";
import { UserContext } from '../context/UserContext';
import { toast } from 'sonner';
import PropTypes from 'prop-types';
import { detectAndPreventLoopError } from "../utils";

const SignIn = ({ isRegistering = false }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showRecover, setShowRecover] = useState(false);
    const [loadingTimeout, setLoadingTimeout] = useState(null);
    const navigate = useNavigate();
    const authAttemptCount = useRef(0);
    const isSubmitting = useRef(false);
    
    const { isAuthenticated, user, login } = useContext(UserContext);

    // Limpiar localStorage al cargar el componente para prevenir problemas
    useEffect(() => {
        // Solo limpiar datos específicos que podrían estar causando problemas
        try {
            if (localStorage.getItem('homeRouteCycleDetected')) {
                console.log("🧹 Limpiando detección de ciclos previos");
                localStorage.removeItem('homeRouteCycleDetected');
            }
            
            // Verificar si hay demasiados intentos de autenticación
            const authAttempts = JSON.parse(localStorage.getItem('authAttempts') || '[]');
            if (authAttempts.length > 5) {
                const lastAttempt = new Date(authAttempts[0].timestamp);
                const now = new Date();
                // Si han pasado menos de 2 minutos desde el último intento y hay muchos intentos
                if ((now - lastAttempt) < 120000 && authAttempts.length > 10) {
                    console.warn("⚠️ Demasiados intentos de autenticación, limpiando datos de sesión");
                    localStorage.clear();
                    // Guardar un indicador de que se realizó esta limpieza
                    localStorage.setItem('sessionCleanedAt', new Date().toISOString());
                }
            }
        } catch (e) {
            console.error("Error al limpiar localStorage:", e);
        }
    }, []);

    // Redirigir si ya está autenticado
    useEffect(() => {
        let isMounted = true;
        let redirectTimer = null;
        
        // Solo redirigir si este componente aún está montado y existe información de usuario
        if (isMounted && isAuthenticated && user) {
            console.log("Usuario ya autenticado, preparando redirección...");
            
            // Verificar si ya estamos en un bucle de redirección
            if (detectAndPreventLoopError('auth_redirect', 5000, 3)) {
                console.warn("⚠️ Posible bucle de redirección detectado, omitiendo redirección automática");
                return;
            }
            
            // Usar un temporizador pequeño para evitar redirecciones inmediatas
            // que puedan causar problemas de renders
            redirectTimer = setTimeout(() => {
                if (isMounted) {
                    console.log("Redirigiendo a Principal...");
                    navigate("/");
                }
            }, 300);
            
            return () => {
                clearTimeout(redirectTimer);
                isMounted = false;
            };
        }
        
        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, user, navigate]);

    // Temporizador de seguridad para evitar carga infinita
    useEffect(() => {
        if (loading) {
            // Si la carga dura más de 10 segundos, detenerla automáticamente
            const timeout = setTimeout(() => {
                console.error("🚨 Tiempo de carga excedido - Deteniendo");
                setLoading(false);
                setError("La aplicación tardó demasiado en responder. Por favor, intente nuevamente.");
                setShowRecover(true);
                
                // Limpiar local storage si está atascado
                if (detectAndPreventLoopError('signin_timeout', 30000, 2)) {
                    console.log("🧹 Limpiando datos de sesión por timeout repetido");
                    localStorage.removeItem('token');
                }
            }, 10000);
            
            setLoadingTimeout(timeout);
            
            return () => clearTimeout(timeout);
        } else {
            if (loadingTimeout) {
                clearTimeout(loadingTimeout);
            }
        }
    }, [loading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // MEJORA 1: Prevención temprana de múltiples envíos
        if (isSubmitting.current || loading) {
            console.log("Omitiendo nuevo envío: ya hay una solicitud en curso");
            return;
        }
        
        // MEJORA 2: Verificar si estamos en un bucle y romperlo definitivamente
        try {
            // Usar el detector de bucles
            if (detectAndPreventLoopError('login_attempts', 3000, 2)) {
                console.error("🛑 BUCLE DE LOGIN DETECTADO - Limpiando token");
                // Limpiar token para romper bucle
                localStorage.removeItem('token');
                // Mostrar mensaje de error
                setError("Demasiados intentos en poco tiempo. Por favor, espere unos segundos e intente de nuevo.");
                setLoading(false);
                isSubmitting.current = false;
                return;
            }
        } catch (e) {
            console.error("Error al verificar bucles:", e);
        }
        
        isSubmitting.current = true;
        setLoading(true);
        setError("");
        
        // MEJORA 3: Simplificar registro del intento
        try {
            const attempts = JSON.parse(localStorage.getItem('authAttempts') || '[]');
            attempts.unshift({
                timestamp: new Date().toISOString(),
                email
            });
            
            // Mantener solo los últimos 10 intentos
            if (attempts.length > 10) {
                attempts.length = 10;
            }
            
            localStorage.setItem('authAttempts', JSON.stringify(attempts));
        } catch (e) {
            console.error("Error al registrar intento:", e);
        }

        try {
            if (isRegistering) {
                if (password !== confirmPassword) {
                    setError("Las contraseñas no coinciden");
                    setLoading(false);
                    isSubmitting.current = false;
                    return;
                }

                const response = await createUser({ email, password });
                if (response) {
                    toast("Registro exitoso", {
                        icon: "✅",
                        duration: 4000
                    });
                    
                    // Intentar el login y verificar que fue exitoso
                    const loginSuccess = await login(response.token, response.user);
                    
                    if (loginSuccess) {
                        console.log("✅ Login exitoso después del registro");
                        setTimeout(() => navigate("/"), 300);
                    } else {
                        console.warn("⚠️ El registro fue exitoso pero el login falló");
                        setError("El registro fue exitoso pero hubo un problema al iniciar sesión automáticamente. Por favor, intenta iniciar sesión manualmente.");
                    }
                }
            } else {
                // MEJORA 4: Simplificar el flujo de login y manejar errores
                console.log("Intentando iniciar sesión con:", { email, password: '***' });
                
                try {
                    // Paso 1: Intentar login con la API
                    const response = await loginUser({ 
                        email: email,
                        password: password 
                    });
                    
                    // Verificar si tenemos un error de API
                    if (response.error) {
                        console.error("Error en respuesta de API:", response.message);
                        
                        // Mensajes personalizados según el tipo de error
                        if (response.message.includes("incorrecta")) {
                            setError("Contraseña incorrecta. Por favor, verifica tus credenciales.");
                        } 
                        else if (response.message.includes("no encontrado") || response.message.includes("not found")) {
                            setError("Este correo electrónico no está registrado. Por favor, regístrate primero.");
                        }
                        else if (response.status === 400) {
                            setError("Datos de inicio de sesión incorrectos. Por favor, intenta nuevamente.");
                        }
                        else {
                            setError(response.message || "Error de autenticación. Por favor, intente más tarde.");
                        }
                        
                        setLoading(false);
                        isSubmitting.current = false;
                        return;
                    }
                    
                    // Paso 2: Verificar si tenemos una respuesta válida
                    if (!response) {
                        throw new Error("No se recibió respuesta del servidor");
                    }
                    
                    // Paso 3: Intentar login en el contexto
                    let loginSuccess = false;
                    
                    if (response.token && response.user) {
                        // Caso normal: tenemos token y usuario
                        loginSuccess = await login(response.token, response.user);
                    } else if (response.token) {
                        // Caso parcial: solo tenemos token
                        const minimalUser = {
                            email,
                            name: email.split('@')[0] || "Usuario",
                            role: 'user'
                        };
                        loginSuccess = await login(response.token, minimalUser);
                    } else {
                        // No tenemos token, no podemos hacer login
                        throw new Error("La respuesta del servidor no incluye un token válido");
                    }
                    
                    // Paso 4: Redireccionar si el login fue exitoso
                    if (loginSuccess) {
                        toast("¡Inicio de sesión exitoso!", { icon: "✅", duration: 3000 });
                        // MEJORA 5: Retardo para evitar redireccionamiento inmediato
                        setTimeout(() => navigate("/"), 300);
                    }
                } catch (error) {
                    console.error("Error durante el login:", error);
                    
                    // Verificar si es un error de servidor interno
                    if (error.message && error.message.includes('500')) {
                        setError("El servidor no está disponible en este momento. Por favor, intente más tarde.");
                    } else if (error.message && error.message.includes('401')) {
                        setError("Credenciales incorrectas. Por favor, verifique su email y contraseña.");
                    } else {
                        setError(error.message || "Error al iniciar sesión. Por favor, intente de nuevo.");
                    }
                }
            }

            // Sincronizar imagen de perfil desde el servidor
            setTimeout(async () => {
                try {
                    console.log("Sincronizando imagen de perfil desde el servidor después del login...");
                    const imageResult = await fetchProfileImageFromServer();
                    
                    if (imageResult.success) {
                        console.log("Imagen sincronizada correctamente desde el servidor");
                    } else {
                        console.warn("No se pudo obtener la imagen del servidor, usando la local si existe");
                    }
                } catch (syncError) {
                    console.error("Error al sincronizar imagen después del login:", syncError);
                }
            }, 1000);
        } catch (err) {
            console.error("Error general durante la autenticación:", err);
            // Manejar timeout específicamente (cold start del backend)
            if (err.message && err.message.includes("timeout") || err.message.includes("Timeout")) {
                setError("🕐 El servidor está iniciando (Render cold start). Esto puede tardar hasta 60 segundos la primera vez. Por favor, intenta nuevamente en unos momentos.");
            } else {
                setError(err.message || "Error durante la autenticación");
            }
        } finally {
            setLoading(false);
            isSubmitting.current = false;
        }
    };

    return (
        <div className="flex min-h-screen flex-col justify-center bg-gray-100 py-6 sm:py-12">
            <div className="relative py-3 sm:mx-auto sm:max-w-xl">
                <div className="absolute inset-0 -skew-y-6 transform bg-gradient-to-r from-black to-gray-800 shadow-lg sm:-rotate-6 sm:skew-y-0 sm:rounded-3xl"></div>
                <div className="relative bg-white px-4 py-10 shadow-lg sm:rounded-3xl sm:p-14 sm:p-20">
                    <div className="mx-auto max-w-md">
                        <div className="flex justify-center">
                            <img src="/logo.jpg" alt="Logo" className="h-12 sm:h-16 rounded-full" />
                        </div>
                        <div className="divide-y divide-gray-200">
                            <div className="space-y-4 py-4 text-base leading-6 text-gray-700 sm:text-lg sm:leading-7">
                                <h1 className="text-center text-xl font-semibold sm:text-2xl md:text-3xl">
                                    {isRegistering ? "Crear una cuenta" : "Iniciar sesión"}
                                </h1>
                                
                                {error && (
                                    <div className="rounded-md bg-red-50 p-4">
                                        <div className="flex">
                                            <div className="ml-3">
                                                <p className="text-sm text-red-700">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-gray-700 text-sm font-medium sm:text-base">
                                            Correo electrónico
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                            placeholder="tu@email.com"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="password" className="block text-gray-700 text-sm font-medium sm:text-base">
                                            Contraseña
                                        </label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete={isRegistering ? "new-password" : "current-password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                            placeholder="Contraseña"
                                        />
                                    </div>
                                    
                                    {isRegistering && (
                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium sm:text-base">
                                                Confirmar Contraseña
                                            </label>
                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                autoComplete="new-password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                                placeholder="Repite la contraseña"
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between pt-2">
                                        {!isRegistering && (
                                            <div className="text-sm">
                                                <Link to="/recover-password" className="font-medium text-blue-600 hover:text-blue-500">
                                                    ¿Olvidaste tu contraseña?
                                                </Link>
                                            </div>
                                        )}
                                        <div className={`text-sm ${!isRegistering ? "ml-auto" : ""}`}>
                                            <Link
                                                to={isRegistering ? "/login" : "/register"}
                                                className="font-medium text-blue-600 hover:text-blue-500"
                                            >
                                                {isRegistering
                                                    ? "¿Ya tienes una cuenta? Inicia sesión"
                                                    : "¿No tienes cuenta? Regístrate"}
                                            </Link>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`flex w-full justify-center rounded-md py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-base
                                                ${loading
                                                    ? "bg-blue-400 cursor-not-allowed"
                                                    : "bg-blue-600 hover:bg-blue-700"
                                                }`}
                                        >
                                            {loading ? (
                                                <span className="flex items-center">
                                                    <svg className="h-5 w-5 animate-spin mr-2" viewBox="0 0 24 24">
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                            fill="none"
                                                        ></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        ></path>
                                                    </svg>
                                                    {isRegistering ? "Creando cuenta..." : "Conectando al servidor... (puede tardar hasta 60s)"}
                                                </span>
                                            ) : (
                                                <span>{isRegistering ? "Crear cuenta" : "Iniciar sesión"}</span>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

SignIn.propTypes = {
    isRegistering: PropTypes.bool,
};

export default SignIn; 