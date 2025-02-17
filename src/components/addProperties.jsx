import { useState } from "react";
import { Button } from "@headlessui/react";
import { postProperties, uploadImageCallBack } from "../services/api";
import { useNavigate } from "react-router-dom";

// Inyecta global CSS para la animación de shake (puedes moverlo a tu archivo global si lo prefieres)
const globalStyles = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}
.animate-shake {
  animation: shake 0.5s;
}
`;

export default function PropertyCreation() {
  // Inyectar el CSS de la animación en el head (sólo en navegador)
  if (typeof window !== "undefined") {
    const style = document.createElement("style");
    style.innerHTML = globalStyles;
    document.head.appendChild(style);
  }

  const [typeProperty, setTypeProperty] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [m2, setM2] = useState("");
  const [piso, setPiso] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [rooms, setRooms] = useState("");
  const [wc, setWc] = useState("");
  const [template, setTemplate] = useState("default");

  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({
    typeProperty: false,
    price: false,
    address: false,
    description: false,
    m2: false,
    piso: false,
    rooms: false,
    wc: false,
    template: false,
  });

  const navigate = useNavigate();

  // Función para generar un slug basado en el typeProperty
  const generateSlug = (typeProperty) => {
    return typeProperty.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  };

  // Manejador para subir imágenes
  const handleFilesSelected = async (event) => {
    const files = event.target.files;
    if (!files) return;
    for (let file of files) {
      try {
        const result = await uploadImageCallBack(file);
        const imageUrl = result.imageUrl; // Se espera que sea { imageUrl: '/uploads/filename.jpg' }
        if (imageUrl) {
          setUploadedImages((prev) => [...prev, { url: imageUrl }]);
        }
      } catch (error) {
        console.error("Error al subir la imagen:", error);
      }
    }
    // Limpiar el input para futuras selecciones
    event.target.value = "";
  };

  // Función para eliminar una imagen del array
  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Función de validación: verifica que los campos requeridos no estén vacíos
  const validateForm = () => {
    console.log({
      typeProperty,
      price,
      address,
      description,
      m2,
      piso,
      rooms,
      wc,
      template,
      images: uploadedImages
    });
    let valid = true;
    const newErrors = {
      typeProperty: false,
      price: false,
      address: false,
      description: false,
      m2: false,
      piso: false,
      rooms: false,
      wc: false,
      template: false,
    };

    if (!typeProperty.trim()) {
      newErrors.typeProperty = true;
      valid = false;
    }
    if (!price.trim()) {
      newErrors.price = true;
      valid = false;
    }
    if (!address.trim()) {
      newErrors.address = true;
      valid = false;
    }
    if (!description.trim()) {
      newErrors.description = true;
      valid = false;
    }
    if (!m2.trim()) {
      newErrors.m2 = true;
      valid = false;
    }
    if (!piso.trim()) {
      newErrors.piso = true;
      valid = false;
    }
    if (!rooms.trim()) {
      newErrors.rooms = true;
      valid = false;
    }
    if (!wc.trim()) {
      newErrors.wc = true;
      valid = false;
    }
    if (!template.trim()) {
      newErrors.template = true;
      valid = false;
    }

    setErrors(newErrors);
    setErrorMessage(valid ? "" : "Debe rellenar los campos requeridos.");
    return valid;
  };

  // Manejador del submit del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Si la validación falla, no se continúa
      return;
    }

    const url = generateSlug(typeProperty);

    // Enviar images como array de objetos con 'src' y 'alt'
    const data = {
      typeProperty,
      price,
      address,
      description,
      m2,
      piso,
      images: uploadedImages.map((img) => ({ src: img.url, alt: "Imagen de previsualización" })),
      url,
      rooms,
      template,
      wc,
    };

    try {
      const response = await postProperties(data);
      console.log("Propiedad publicada:", response);

      // Limpiar campos después de enviar
      setTypeProperty("");
      setPrice("");
      setAddress("");
      setDescription("");
      setM2("");
      setPiso("");
      setUploadedImages([]);
      setRooms("");
      setWc("");
      setTemplate("default");

      // Redirigir a la página de ver propiedades después de la publicación exitosa
      navigate("/ver-propiedades");
    } catch (error) {
      console.error("Error al publicar la propiedad:", error);
    }
  };

  return (
    <div className="bg-gradient-to-tr from-blue-900 to-black/60 min-h-screen flex flex-col justify-center items-center">
      <div className="container mx-auto p-4 flex flex-col justify-center items-center">
        <h1 className="text-4xl font-bold text-center mb-8 relative">
          <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white">
            Publica una propiedad
          </span>
        </h1>
      </div>

      {errorMessage && (
        <div className="mb-4 text-red-500 font-bold">{errorMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col justify-center items-center w-full max-w-lg">
        {/* Tipo de propiedad */}
        <label htmlFor="typeProperty" className="w-full mb-1 font-medium">Tipo de propiedad</label>
        <input
          type="text"
          id="typeProperty"
          name="typeProperty"
          placeholder="Tipo de propiedad"
          value={typeProperty}
          onChange={(e) => setTypeProperty(e.target.value)}
          className={`w-full p-2 mb-1 rounded-md border-2 ${errors.typeProperty ? "border-red-500 animate-shake" : "border-gray-300"}`}
          required
        />
        {errors.typeProperty && <p className="text-red-500 text-xs mb-2">Debe rellenar este campo.</p>}

        {/* Dirección */}
        <label htmlFor="address" className="w-full mb-1 font-medium">Dirección</label>
        <input
          type="text"
          id="address"
          name="address"
          placeholder="Dirección"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={`w-full p-2 mb-1 rounded-md border-2 ${errors.address ? "border-red-500 animate-shake" : "border-gray-300"}`}
          required
        />
        {errors.address && <p className="text-red-500 text-xs mb-2">Debe rellenar este campo.</p>}

        {/* Precio */}
        <label htmlFor="price" className="w-full mb-1 font-medium">Precio</label>
        <input
          type="text"
          id="price"
          name="price"
          placeholder="Precio"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={`w-full p-2 mb-1 rounded-md border-2 ${errors.price ? "border-red-500 animate-shake" : "border-gray-300"}`}
          required
        />
        {errors.price && <p className="text-red-500 text-xs mb-2">Debe rellenar este campo.</p>}

        {/* Planta */}
        <label htmlFor="piso" className="w-full mb-1 font-medium">Planta</label>
        <input
          type="text"
          id="piso"
          name="piso"
          placeholder="Planta"
          value={piso}
          onChange={(e) => setPiso(e.target.value)}
          className={`w-full p-2 mb-1 rounded-md border-2 ${errors.piso ? "border-red-500 animate-shake" : "border-gray-300"}`}
          required
        />
        {errors.piso && <p className="text-red-500 text-xs mb-2">Debe rellenar este campo.</p>}

        {/* Descripción */}
        <label htmlFor="description" className="w-full mb-1 font-medium">Descripción</label>
        <textarea
          id="description"
          name="description"
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full p-2 mb-1 rounded-md border-2 ${errors.description ? "border-red-500 animate-shake" : "border-gray-300"}`}
          required
        />
        {errors.description && <p className="text-red-500 text-xs mb-2">Debe rellenar este campo.</p>}

        {/* Subir imágenes */}
        <div className="bg-gradient-to-br from-blue-900 to-amarillo w-full p-2 mb-4 rounded-md border-2 border-gray-300">
          <label htmlFor="images" className="block mb-2 font-medium">
            Subir imágenes (puedes seleccionar múltiples):
          </label>
          <input
            type="file"
            id="images"
            name="images"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
          />
        </div>

        {uploadedImages.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-4">
            {uploadedImages.map((img, index) => (
              <div key={index} className="relative">
                <img
                  src={img.url}
                  alt={`Imagen ${index + 1}`}
                  className="object-cover h-24 w-24 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full px-2 py-1 text-xs"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Metros cuadrados */}
        <label htmlFor="m2" className="w-full mb-1 font-medium">Metros cuadrados</label>
        <input
          type="text"
          id="m2"
          name="m2"
          placeholder="Metros cuadrados"
          value={m2}
          onChange={(e) => setM2(e.target.value)}
          className={`w-full p-2 mb-1 rounded-md border-2 ${errors.m2 ? "border-red-500 animate-shake" : "border-gray-300"}`}
          required
        />
        {errors.m2 && <p className="text-red-500 text-xs mb-2">Debe rellenar este campo.</p>}

        {/* Habitaciones */}
        <label htmlFor="rooms" className="w-full mb-1 font-medium">Habitaciones</label>
        <input
          type="text"
          id="rooms"
          name="rooms"
          placeholder="Habitaciones"
          value={rooms}
          onChange={(e) => setRooms(e.target.value)}
          className={`w-full p-2 mb-1 rounded-md border-2 ${errors.rooms ? "border-red-500 animate-shake" : "border-gray-300"}`}
        />
        {errors.rooms && <p className="text-red-500 text-xs mb-2">Debe rellenar este campo.</p>}

        {/* Baños */}
        <label htmlFor="wc" className="w-full mb-1 font-medium">Baños</label>
        <input
          type="text"
          id="wc"
          name="wc"
          placeholder="Baños"
          value={wc}
          onChange={(e) => setWc(e.target.value)}
          className={`w-full p-2 mb-1 rounded-md border-2 ${errors.wc ? "border-red-500 animate-shake" : "border-gray-300"}`}
        />
        {errors.wc && <p className="text-red-500 text-xs mb-2">Debe rellenar este campo.</p>}

        {/* Selección de plantilla */}
        <div className="mb-4 w-full">
          <label htmlFor="template" className="block mb-2 text-xl font-bold text-center">
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white">
              Elige una plantilla de estilo
            </span>
          </label>
          <select
            id="template"
            name="template"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className={`w-full p-2 rounded-md border-2 ${errors.template ? "border-red-500 animate-shake" : "border-gray-300"}`}
          >
            <option value="default">Por defecto</option>
            <option value="estiloA">Estilo A</option>
            <option value="estiloB">Estilo B</option>
          </select>
        </div>

        {errorMessage && (
          <div className="mb-4 text-red-500 font-bold">{errorMessage}</div>
        )}

        <Button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors duration-300"
        >
          Publicar
        </Button>
      </form>
    </div>
  );
}
