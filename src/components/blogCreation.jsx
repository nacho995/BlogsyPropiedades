import { useState } from "react";
import { Button } from "@headlessui/react";
import { postBlogPosts } from "../services/api";
import { Link } from "react-router-dom";

; // Asegúrate de que la función postBlogPosts esté configurada correctamente

export default function BlogCreation() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [author, setAuthor] = useState("");
    const [category, setCategory] = useState("");
    const [imageSrc, setImageSrc] = useState("");
    const [imageAlt, setImageAlt] = useState("");
    const [readTime, setReadTime] = useState("");
    const [template, setTemplate] = useState("");

    // Función para generar una URL amigable (slug) basada en el título
    const generateSlug = (title) => {
        return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Generar la URL automáticamente a partir del título
        const url = generateSlug(title);

        // Crear el objeto con los datos del blog
        const data = {
            title,
            description,
            author,
            category,
            image: {
                src: imageSrc,
                alt: imageAlt,
            },
            readTime,
            url,  // Generar URL automáticamente
        };

        try {
            // Enviar los datos al backend
            const response = await postBlogPosts(data);
            console.log("Blog publicado:", response);

            // Limpiar los campos después de enviar el formulario
            setTitle("");
            setDescription("");
            setAuthor("");
            setCategory("");
            setImageSrc("");
            setImageAlt("");
            setReadTime("");
            setTemplate("");
        } catch (error) {
            console.error("Error al publicar el blog:", error);
        }
    };

    return (
        <div className="bg-gradient-to-tr from-blue-900 to-black/60 min-h-screen flex flex-col justify-center items-center">
            <div className="container mx-auto p-4 flex flex-col justify-center items-start">
                <h1 className="text-4xl font-bold text-center mb-8 relative">
                    <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white">
                        Crea un nuevo blog
                    </span>
                </h1>
            </div>

            {/* Formulario de creación de blog */}
            <form onSubmit={handleSubmit} className="flex flex-col justify-center items-center w-full max-w-lg">
                <input
                    type="text"
                    placeholder="Título"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 mb-4 rounded-md border-2 border-gray-300"
                    required
                />
                <textarea
                    placeholder="Descripción"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 mb-4 rounded-md border-2 border-gray-300"
                    required
                />
                <input
                    type="text"
                    placeholder="Autor"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full p-2 mb-4 rounded-md border-2 border-gray-300"
                    required
                />
                <input
                    type="text"
                    placeholder="Categoría"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 mb-4 rounded-md border-2 border-gray-300"
                    required
                />
                <input
                    type="text"
                    placeholder="URL de la imagen"
                    value={imageSrc}
                    onChange={(e) => setImageSrc(e.target.value)}
                    className="w-full p-2 mb-4 rounded-md border-2 border-gray-300"
                />
                <input
                    type="text"
                    placeholder="Texto alternativo de la imagen"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    className="w-full p-2 mb-4 rounded-md border-2 border-gray-300"
                />
                <input
                    type="text"
                    placeholder="Tiempo de lectura (ej. '5 min')"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="w-full p-2 mb-4 rounded-md border-2 border-gray-300"
                />
                <input
                    type="text"
                    placeholder="Plantilla"
                    value={template}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="w-full p-2 mb-4 rounded-md border-2 border-gray-300"
                />
                

                {/* Botón de publicación */}
                <Link to="/ver-blogs">
                    <Button
                        type="submit"
                        className="bg-black text-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors duration-300"
                    >
                        Publicar
                    </Button>
                </Link>
            </form>
        </div>
    );
}
