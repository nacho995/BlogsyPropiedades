import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "../services/api";
import { useUser } from "../context/UserContext";

export default function CambiarPerfil() {
  const [name, setName] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const { user, refreshUserData } = useUser();
  
  // Manejar cambio de imagen con manejo de errores mejorado
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      console.log("Archivo seleccionado:", file.name);
      setProfilePic(file);
      
      // No mostrar vista previa para evitar el error
      setPreviewUrl(null);
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
      
      // Crear FormData simple
      const userData = new FormData();
      if (name) userData.append('name', name);
      if (profilePic) userData.append('profilePic', profilePic);
      
      // Enviar al servidor de forma directa
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
      console.log("Perfil actualizado:", result);
      
      // Guardar imagen en localStorage si existe
      if (result.profilePic && typeof result.profilePic === 'string') {
        // Convertir URL a HTTPS
        const secureUrl = result.profilePic.replace('http://', 'https://');
        localStorage.setItem("profilePic", secureUrl);
      }
      
      // Actualizar datos de usuario
      await refreshUserData();
      
      // Mostrar mensaje y redirigir
      alert("Perfil actualizado correctamente");
      navigate("/");
      
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudo actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Cambiar Perfil</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="name">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Nuevo nombre"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="profilePic">
            Imagen de perfil
          </label>
          <input
            id="profilePic"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
        </div>
        
        {previewUrl && (
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              {previewUrl === "imagen-seleccionada" 
                ? "✅ Imagen seleccionada correctamente" 
                : "Vista previa:"}
            </p>
            {previewUrl !== "imagen-seleccionada" && (
              <div className="w-32 h-32 rounded-full overflow-hidden border">
                <img 
                  src={previewUrl} 
                  alt="Vista previa" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Error en vista previa");
                    e.target.src = "https://via.placeholder.com/100?text=Error"; 
                  }}
                />
              </div>
            )}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
} 