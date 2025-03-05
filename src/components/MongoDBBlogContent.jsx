import React, { useEffect } from 'react';
import DirectImage from '@/components/DirectImage';

const DEFAULT_IMAGE = '/img/default-image.jpg';

const MongoDBBlogContent = ({ blog }) => {
  // Esta función ya no necesita procesar contenido HTML
  // ya que el editor ReactQuill genera HTML bien formateado
  const processRawContent = (content) => {
    if (!content) return '';
    // El contenido ya viene con formato HTML de ReactQuill
    return content;
  };
  
  // Formatear fecha si está disponible
  const formattedDate = blog.createdAt 
    ? new Date(blog.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : blog.date || 'Fecha no disponible';

  return (
    <div className="pt-20 pb-12 bg-white">
      <article className="container mx-auto p-4 max-w-4xl">
        {/* Resto del código igual */}
        
        {/* Contenido principal con estilos unificados */}
        <div 
          className="professional-blog-content"
          dangerouslySetInnerHTML={{ __html: processRawContent(blog.content) }}
        />
        
        {/* Estilos CSS mejorados que coinciden con los del editor */}
        <style jsx global>{`
          /* Variables de colores */
          :root {
            --color-amarillo: #f59e0b;
          }
          
          /* Contenedor principal para el contenido del blog */
          .professional-blog-content {
            font-family: 'Inter', system-ui, sans-serif;
            color: #374151;
            line-height: 1.8;
          }
          
          /* Primera letra destacada y decorativa */
          .professional-blog-content > p:first-of-type::first-letter {
            float: left;
            font-size: 5rem;
            line-height: 0.65;
            padding: 0.1em 0.1em 0 0;
            color: var(--color-amarillo);
            font-weight: 800;
            text-shadow: 2px 2px 0px rgba(245, 158, 11, 0.3);
          }
          
          /* Párrafos con diseño mejorado */
          .professional-blog-content p {
            margin-bottom: 1.75rem;
            letter-spacing: -0.01em;
            position: relative;
          }
          
          /* Destacar párrafos importantes aleatoriamente */
          .professional-blog-content p:nth-of-type(4n+2) {
            margin-left: 2rem;
            padding-left: 1.5rem;
            border-left: 3px solid var(--color-amarillo);
            font-style: italic;
          }
          
          .professional-blog-content p:nth-of-type(5n+3) {
            font-size: 1.2rem;
            color: #1f2937;
            font-weight: 500;
          }
          
          /* Cada ciertos párrafos, añadir un estilo destacado */
          .professional-blog-content p:nth-of-type(7n) {
            background: linear-gradient(to right, rgba(245, 158, 11, 0.05), transparent);
            padding: 1.5rem;
            border-radius: 0.5rem;
            margin-left: -1rem;
            margin-right: -1rem;
            box-shadow: inset 4px 0 0 var(--color-amarillo);
          }
          
          /* Títulos con diseño más atractivo */
          .professional-blog-content h2 {
            font-size: 2rem;
            margin-top: 3.5rem;
            margin-bottom: 1.5rem;
            font-weight: 800;
            color: #111827;
            letter-spacing: -0.025em;
            position: relative;
            padding-bottom: 0.75rem;
            width: fit-content;
            display: flex;
            align-items: center;
          }
          
          .professional-blog-content h2::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(to right, var(--color-amarillo), transparent);
            border-radius: 3px;
          }
          
          .professional-blog-content h2::after {
            content: '';
            display: inline-block;
            width: 8px;
            height: 8px;
            background-color: var(--color-amarillo);
            border-radius: 50%;
            margin-left: 0.75rem;
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
          }
          
          .professional-blog-content h3 {
            font-size: 1.5rem;
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
            font-weight: 700;
            color: #1f2937;
            display: inline-block;
            background: rgba(245, 158, 11, 0.1);
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
          }
          
          /* Imágenes con efectos visuales mejorados */
          .professional-blog-content img {
            max-width: 100%;
            height: auto;
            border-radius: 0.75rem;
            margin: 2.5rem auto;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .professional-blog-content img:hover {
            transform: perspective(1000px) rotateY(2deg) translateY(-5px);
            box-shadow: 12px 15px 25px -5px rgba(0, 0, 0, 0.2);
          }
          
          /* Citas destacadas con diseño visual */
          .professional-blog-content blockquote {
            margin: 3rem 0;
            padding: 2rem;
            background-color: rgba(245, 158, 11, 0.05);
            border-radius: 1rem;
            position: relative;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
            border-left: none;
          }
          
          .professional-blog-content blockquote::before {
            content: '"';
            position: absolute;
            top: -1.5rem;
            left: 1rem;
            font-size: 8rem;
            color: rgba(245, 158, 11, 0.2);
            font-family: Georgia, serif;
            line-height: 1;
          }
          
          .professional-blog-content blockquote p {
            font-size: 1.25rem;
            line-height: 1.6;
            color: #4b5563;
            font-weight: 500;
            position: relative;
            z-index: 1;
            margin-bottom: 0;
          }
          
          /* Listas con diseño mejorado */
          .professional-blog-content ul, .professional-blog-content ol {
            margin-left: 2rem;
            margin-bottom: 2rem;
          }
          
          .professional-blog-content li {
            margin-bottom: 1rem;
            position: relative;
          }
          
          .professional-blog-content li::marker {
            color: var(--color-amarillo);
          }
          
          /* Enlaces con efectos visuales */
          .professional-blog-content a {
            color: var(--color-amarillo);
            text-decoration: none;
            font-weight: 500;
            position: relative;
            transition: all 0.2s ease;
            padding: 0 0.15rem;
            z-index: 1;
          }
          
          .professional-blog-content a::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 0.2rem;
            background-color: rgba(245, 158, 11, 0.2);
            z-index: -1;
            transition: height 0.2s ease;
          }
          
          .professional-blog-content a:hover {
            color: #fff;
          }
          
          .professional-blog-content a:hover::before {
            height: 100%;
            background-color: var(--color-amarillo);
          }
          
          /* Separador horizontal decorativo */
          .professional-blog-content hr {
            border: 0;
            height: 6px;
            margin: 4rem auto;
            width: 50%;
            background-image: 
              radial-gradient(circle, var(--color-amarillo) 0%, transparent 60%), 
              radial-gradient(circle, var(--color-amarillo) 0%, transparent 60%);
            background-size: 15px 15px;
            background-position: top center;
            opacity: 0.5;
          }
          
          /* Mantener compatibilidad con bloques especiales */
          .professional-blog-content .formula-block,
          .professional-blog-content .highlight-block,
          .professional-blog-content .note-block {
            /* Estilos existentes */
          }
          
          /* Media queries para dispositivos más pequeños */
          @media (max-width: 768px) {
            .professional-blog-content p:nth-of-type(4n+2) {
              margin-left: 1rem;
            }
          }
        `}</style>
      </article>
    </div>
  );
};

export default MongoDBBlogContent; 