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
    try {
      const file = e.target.files[0];
      console.log("Archivo seleccionado:", file);
      
      if (!file) return;
      
      setProfilePic(file);
      
      // Crear URL segura para la vista previa
      try {
        // Método más directo y seguro para crear una URL de vista previa
        const objectUrl = URL.createObjectURL(file);
        console.log("URL de objeto creada:", objectUrl);
        setPreviewUrl(objectUrl);
        
        // Limpiar la URL cuando ya no se necesite
        return () => URL.revokeObjectURL(objectUrl);
      } catch (readerError) {
        console.error("Error al crear vista previa con URL.createObjectURL:", readerError);
        
        // Usar FileReader como fallback
        try {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
              console.log("Vista previa generada por FileReader");
              setPreviewUrl(event.target.result);
            }
          };
          reader.readAsDataURL(file);
        } catch (fileReaderError) {
          console.error("Error al usar FileReader como fallback:", fileReaderError);
          setPreviewUrl(null);
        }
      }
    } catch (error) {
      console.error("Error general en handleFileChange:", error);
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
      
      // Crear objeto con datos
      const userData = new FormData(); // Usar FormData directamente
      if (name) userData.append('name', name);
      if (profilePic) userData.append('profilePic', profilePic);
      
      console.log("Enviando datos de actualización:", {
        name: name || "(sin cambios)",
        profilePic: profilePic ? profilePic.name : "(sin cambios)"
      });
      
      // Enviar al servidor directamente usando fetch en lugar de la función updateProfile
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_PUBLIC_API_URL}/user/update-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: userData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error del servidor:", errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Perfil actualizado:", result);
      
      // Convertir la URL a HTTPS antes de guardarla en localStorage o mostrarla
      if (result.profilePic && typeof result.profilePic === 'string') {
        result.profilePic = result.profilePic.replace('http://', 'https://');
        localStorage.setItem("profilePic", result.profilePic);
      }
      
      // Actualizar el contexto del usuario
      await refreshUserData();
      
      // Redirigir
      navigate("/");
    } catch (error) {
      console.error("Error detallado al actualizar el perfil:", error);
      setError("No se pudo actualizar el perfil. Intenta de nuevo.");
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
            <p className="text-gray-700 mb-2">Vista previa:</p>
            <div className="w-32 h-32 rounded-full overflow-hidden border">
              <img 
                key={`preview-${Date.now()}`}
                src={previewUrl} 
                alt="Vista previa" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Error en vista previa");
                  e.target.src = "https://via.placeholder.com/100?text=Error"; 
                }}
              />
            </div>
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