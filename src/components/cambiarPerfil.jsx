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
  
  // Manejar cambio de imagen
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
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
      const userData = {};
      if (name) userData.name = name;
      if (profilePic) userData.profilePic = profilePic;
      
      // Enviar al servidor
      const token = localStorage.getItem("token");
      const result = await updateProfile(userData, token);
      
      console.log("Perfil actualizado:", result);
      
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
    // ... resto del componente ...
  );
} 