import { useState } from "react";
import { Button } from "@headlessui/react";
import { postBlogPosts, uploadImageCallBack } from "../services/api";
import { useNavigate } from "react-router-dom";

// You can also add these keyframes to your global CSS file (e.g., globals.css)
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

export default function BlogCreation() {
  // Inject global CSS for the shake animation
  if (typeof window !== "undefined") {
    const style = document.createElement("style");
    style.innerHTML = globalStyles;
    document.head.appendChild(style);
  }

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [readTime, setReadTime] = useState("");
  const [template, setTemplate] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({
    title: false,
    description: false,
    author: false,
    category: false,
    readTime: false,
    template: false,
  });

  const navigate = useNavigate();

  // Function to generate a slug from the title
  const generateSlug = (title) => {
    return title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
  };

  // Handler for file inputs (allowing multiple images)
  const handleFilesSelected = async (event) => {
    const files = event.target.files;
    if (!files) return;
    for (let file of files) {
      try {
        const result = await uploadImageCallBack(file);
        const imageUrl = result.imageUrl; // Expected { imageUrl: '/uploads/filename.jpg' }
        if (imageUrl) {
          setUploadedImages((prev) => [...prev, { url: imageUrl }]);
        }
      } catch (error) {
        console.error("Error al subir la imagen:", error);
      }
    }
    // Clear the input for future selections
    event.target.value = "";
  };

  // Function to remove an image from the array
  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation function: checks that required fields are not empty
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      title: false,
      description: false,
      author: false,
      category: false,
      readTime: false,
      template: false,
    };

    if (!title.trim()) {
      newErrors.title = true;
      valid = false;
    }
    if (!description.trim()) {
      newErrors.description = true;
      valid = false;
    }
    if (!author.trim()) {
      newErrors.author = true;
      valid = false;
    }
    if (!category.trim()) {
      newErrors.category = true;
      valid = false;
    }
    if (!readTime.trim()) {
      newErrors.readTime = true;
      valid = false;
    }
    if (!template.trim() || template === "default") {
      newErrors.template = true;
      valid = false;
    }

    setErrors(newErrors);
    setErrorMessage(valid ? "" : "Debe rellenar los campos requeridos.");
    return valid;
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      // Prevent submission if validation fails
      return;
    }

    const url = generateSlug(title);

    const data = {
      title,
      description,
      author,
      category,
      images: uploadedImages.map((img) => img.url),
      readTime,
      url,
      template,
    };

    try {
      const response = await postBlogPosts(data);
      console.log("Blog publicado:", response);

      // Optionally clear fields after submission
      setTitle("");
      setDescription("");
      setAuthor("");
      setCategory("");
      setUploadedImages([]);
      setReadTime("");
      setTemplate("");

      // Redirect to the blogs page after successful publication
      navigate("/ver-blogs");
    } catch (error) {
      console.error("Error al publicar el blog:", error);
    }
  };

  return (
    <div className="bg-gradient-to-tr from-blue-900 to-black/60 min-h-screen flex flex-col justify-center items-center">
      <div className="container mx-auto p-4 flex flex-col justify-center items-center">
        <h1 className="text-4xl font-bold text-center mb-8 relative">
          <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white">
            Crea un nuevo blog
          </span>
        </h1>
      </div>

      {errorMessage && (
        <div className="mb-4 text-red-500 font-bold">{errorMessage}</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-center items-center w-full max-w-lg"
      >
        <label htmlFor="title" className="w-full mb-1 font-medium">
          Título
        </label>
        <input
          type="text"
          id="title"
          name="title"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full p-2 mb-4 rounded-md border-2 ${
            errors.title ? "border-red-500 animate-shake" : "border-gray-300"
          }`}
          required
        />

        <label htmlFor="description" className="w-full mb-1 font-medium">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full p-2 mb-4 rounded-md border-2 ${
            errors.description ? "border-red-500 animate-shake" : "border-gray-300"
          }`}
          required
        />

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

        <label htmlFor="author" className="w-full mb-1 font-medium">
          Autor
        </label>
        <input
          type="text"
          id="author"
          name="author"
          placeholder="Autor"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className={`w-full p-2 mb-4 rounded-md border-2 ${
            errors.author ? "border-red-500 animate-shake" : "border-gray-300"
          }`}
          required
        />

        <label htmlFor="category" className="w-full mb-1 font-medium">
          Categoría
        </label>
        <input
          type="text"
          id="category"
          name="category"
          placeholder="Categoría"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`w-full p-2 mb-4 rounded-md border-2 ${
            errors.category ? "border-red-500 animate-shake" : "border-gray-300"
          }`}
          required
        />

        <label htmlFor="readTime" className="w-full mb-1 font-medium">
          Tiempo de lectura (ej. '5 min')
        </label>
        <input
          type="text"
          id="readTime"
          name="readTime"
          placeholder="Tiempo de lectura (ej. '5 min')"
          value={readTime}
          onChange={(e) => setReadTime(e.target.value)}
          className={`w-full p-2 mb-4 rounded-md border-2 ${
            errors.readTime ? "border-red-500 animate-shake" : "border-gray-300"
          }`}
        />

        <div className="mb-4 w-full">
          <label
            htmlFor="template"
            className="block mb-2 text-xl font-bold text-center relative"
          >
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white">
              Elige una plantilla de estilo
            </span>
          </label>
          <select
            id="template"
            name="template"
            value={template || "default"}
            onChange={(e) => setTemplate(e.target.value)}
            className={`w-full p-2 rounded-md border-2 ${
              errors.template ? "border-red-500 animate-shake" : "border-gray-300"
            }`}
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
