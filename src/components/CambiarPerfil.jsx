import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "../context/UserContext";

export default function CambiarPerfil() {
  const [name, setName] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const navigate = useNavigate();
  const { user, refreshUserData } = useUser();
  
  // Versión simplificada que no intenta crear vista previa
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      // No crear vista previa para evitar el error
    }
  };
  
  // Manejar envío de formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name && !profilePic) {
      setError("Debes cambiar al menos un campo.");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Crear FormData
      const userData = new FormData();
      if (name) userData.append('name', name);
      if (profilePic) userData.append('profilePic', profilePic);
      
      // Enviar al servidor
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_PUBLIC_API_URL}/user/update-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: userData
      });
      
      if (!response.ok) {
        throw new Error("Error al actualizar el perfil");
      }
      
      const result = await response.json();
      
      // Guardar imagen en localStorage
      if (result.profilePic && typeof result.profilePic === 'string') {
        // Convertir URL a HTTPS
        const secureUrl = result.profilePic.replace('http://', 'https://');
        localStorage.setItem("profilePic", secureUrl);
      }
      
      // Actualizar datos de usuario
      await refreshUserData();
      
      // Mostrar mensaje de éxito y redirección después de un breve retraso
      setSuccess("¡Perfil actualizado correctamente!");
      setTimeout(() => {
        navigate("/");
      }, 1500);
      
    } catch (error) {
      console.error("Error detallado al actualizar el perfil:", error);
      setError("No se pudo actualizar el perfil. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-6 px-6">
          <h2 className="text-center text-2xl font-extrabold text-white">
            Actualizar Perfil
          </h2>
          <p className="mt-2 text-center text-sm text-blue-100">
            Personaliza tu experiencia en la plataforma
          </p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md animate-pulse">
              <p className="font-medium">¡Ups! Algo salió mal</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md">
              <p className="font-medium">¡Éxito!</p>
              <p className="text-sm">{success}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Nombre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2.5 border"
                  placeholder={user?.name || "Tu nombre"}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="profilePic">
                Foto de perfil
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="profilePic"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                    >
                      <span>Seleccionar archivo</span>
                      <input
                        id="profilePic"
                        name="profilePic"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">o arrastra y suelta</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                </div>
              </div>
            </div>
            
            {profilePic && (
              <div className="bg-blue-50 rounded-lg p-4 flex items-center text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium">Imagen seleccionada: {profilePic.name}</p>
              </div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-300 ${
                  loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Actualizando...
                  </div>
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Volver al inicio
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
