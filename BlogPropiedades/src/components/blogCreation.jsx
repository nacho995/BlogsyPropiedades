import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createBlogPost, uploadImageBlog, getBlogById, updateBlogPost, getCloudinarySignature, uploadImageFallback } from '../services/api';
import { useUser } from '../context/UserContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FiUpload, FiEdit, FiType, FiFileText, FiUser, FiTag, FiList, FiX, FiPlus } from 'react-icons/fi';
import { toast } from 'sonner';

// Animaciones básicas
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Actualizar configuración del editor con más opciones y temas
const modules = {
  toolbar: {
    container: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
    handlers: {
      // Aquí se podrían añadir manejadores personalizados
    }
  },
  clipboard: {
    matchVisual: false
  },
  keyboard: {
    bindings: {
      // Desactivar algunos atajos de teclado que pueden causar problemas
      handleEnter: {
        key: 13,
        handler: function() { return true; } // permitir comportamiento nativo
      }
    }
  }
};

const formats = [
  'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike', 
  'color', 'background', 'align', 'list', 'bullet', 'indent',
  'link', 'image', 'video', 'blockquote', 'code-block'
];

// Estilos profesionales para el editor
const customStyles = `
  /* Variables de colores */
  :root {
    --color-amarillo: #f59e0b;
  }
  
  /* Editor básico */
  .ql-editor {
    font-family: 'Inter', system-ui, sans-serif;
    color: #374151;
    line-height: 1.8;
    font-size: 16px;
    min-height: 300px;
    padding: 16px;
  }
  
  /* Estilos para párrafos */
  .ql-editor p {
    margin-bottom: 1.75rem;
    letter-spacing: -0.01em;
    position: relative;
  }
  
  /* Para simular el efecto de primera letra, añadiremos una clase especial */
  .ql-editor .first-paragraph::first-letter {
    float: left;
    font-size: 5rem;
    line-height: 0.65;
    padding: 0.1em 0.1em 0 0;
    color: #f59e0b;
    font-weight: 800;
  }
  
  /* Títulos con diseño más atractivo */
  .ql-editor h2 {
    font-size: 2rem;
    margin-top: 3.5rem;
    margin-bottom: 1.5rem;
    font-weight: 800;
    color: #111827;
    letter-spacing: -0.025em;
    padding-bottom: 0.75rem;
    border-bottom: 3px solid rgba(245, 158, 11, 0.5);
  }
  
  .ql-editor h3 {
    font-size: 1.5rem;
    margin-top: 2.5rem;
    margin-bottom: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    background: rgba(245, 158, 11, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    display: inline-block;
  }
  
  /* Citas destacadas */
  .ql-editor blockquote {
    margin: 3rem 0;
    padding: 2rem;
    background-color: rgba(245, 158, 11, 0.05);
    border-radius: 1rem;
    position: relative;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    border-left: none;
  }
  
  .ql-editor blockquote p {
    font-size: 1.25rem;
    line-height: 1.6;
    color: #4b5563;
    font-weight: 500;
    position: relative;
    margin-bottom: 0;
  }
  
  /* Listas con diseño mejorado */
  .ql-editor ul, .ql-editor ol {
    margin-left: 2rem;
    margin-bottom: 2rem;
  }
  
  .ql-editor li {
    margin-bottom: 1rem;
    padding-left: 0.5rem;
  }
  
  /* Enlaces con estilo */
  .ql-editor a {
    color: #f59e0b;
    text-decoration: none;
    font-weight: 500;
    padding: 0 0.15rem;
    background-color: rgba(245, 158, 11, 0.1);
    border-radius: 3px;
  }
  
  /* Bloques especiales */
  .ql-editor .formula-block,
  .formula-block {
    background-color: #f8f9fa;
    border-left: 3px solid #4a89dc;
    padding: 16px 20px;
    margin: 1.5rem 0;
    font-family: 'Courier New', monospace;
    border-radius: 4px;
    color: #2c5282;
  }
  
  .ql-editor .highlight-block,
  .highlight-block {
    background-color: #fffde7;
    border-left: 3px solid #f59e0b;
    padding: 16px 20px;
    margin: 1.5rem 0;
    border-radius: 4px;
  }
  
  .ql-editor .note-block,
  .note-block {
    background-color: #e8f5e9;
    border-left: 3px solid #4caf50;
    padding: 16px 20px;
    margin: 1.5rem 0;
    font-style: italic;
    border-radius: 4px;
  }
  
  /* Títulos especiales */
  .ql-editor .title-main,
  .title-main {
    font-size: 2.5rem !important;
    font-weight: 700 !important;
    margin: 1.5rem 0 !important;
    color: #111827 !important;
    text-align: center !important;
    border-bottom: 2px solid #f59e0b !important;
    padding-bottom: 10px !important;
  }
  
  .ql-editor .title-section,
  .title-section {
    font-size: 1.8rem !important;
    font-weight: 600 !important;
    margin: 1.2rem 0 !important;
    color: #1f2937 !important;
    border-left: 4px solid #f59e0b !important;
    padding-left: 12px !important;
  }
  
  .ql-editor .title-subsection,
  .title-subsection {
    font-size: 1.4rem !important;
    font-weight: 600 !important;
    margin: 1rem 0 !important;
    color: #4a6fa5 !important;
    display: flex !important;
    align-items: center !important;
  }
  
  /* Separator personalizado explícito */
  .separator-decorative {
    border: 0; 
    height: 6px; 
    margin: 4rem auto; 
    width: 50%; 
    background-image: radial-gradient(circle, #f59e0b 0%, transparent 60%), radial-gradient(circle, #f59e0b 0%, transparent 60%); 
    background-size: 15px 15px; 
    background-position: top center; 
    opacity: 0.5;
  }
`;

// Definir plantillas de contenido para diferentes tipos de blogs
const contentTemplates = {
  standardArticle: `
    <h1 class="title-main" style="font-size: 2.5rem; font-weight: 700; margin: 1.5rem 0; color: #111827; text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">Título Principal del Artículo</h1>
    
    <p class="first-paragraph">Este es el párrafo de introducción donde puedes plantear el tema central del artículo y despertar el interés del lector. Un buen artículo capta la atención desde las primeras líneas y establece claramente de qué va a tratar.</p>
    
    <h2 style="font-size: 2rem; margin-top: 3.5rem; margin-bottom: 1.5rem; font-weight: 800; color: #111827; letter-spacing: -0.025em; position: relative; padding-bottom: 0.75rem; border-bottom: 3px solid rgba(245, 158, 11, 0.5);">Primera sección importante</h2>
    
    <p>Desarrolla aquí el primer punto clave de tu artículo con información relevante y datos interesantes. Recuerda que los párrafos no deben ser demasiado extensos para facilitar la lectura.</p>
    
    <blockquote style="margin: 3rem 0; padding: 2rem; background-color: rgba(245, 158, 11, 0.05); border-radius: 1rem; position: relative; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
      <p style="font-size: 1.25rem; line-height: 1.6; color: #4b5563; font-weight: 500;">"Una cita relevante o testimonio puede añadir credibilidad y un toque humano a tu artículo"</p>
    </blockquote>
    
    <h3 style="font-size: 1.5rem; margin-top: 2.5rem; margin-bottom: 1.25rem; font-weight: 700; color: #1f2937; background: rgba(245, 158, 11, 0.1); padding: 0.25rem 0.75rem; border-radius: 4px; display: inline-block;">Subtema relevante</h3>
    
    <p style="margin-left: 2rem; padding-left: 1.5rem; border-left: 3px solid #f59e0b; font-style: italic;">Profundiza en aspectos específicos del tema principal. Este párrafo tiene un estilo especial para destacar información importante.</p>
    
    <hr style="border: 0; height: 6px; margin: 4rem auto; width: 50%; background-image: radial-gradient(circle, #f59e0b 0%, transparent 60%), radial-gradient(circle, #f59e0b 0%, transparent 60%); background-size: 15px 15px; background-position: top center; opacity: 0.5;">
    
    <h2 style="font-size: 2rem; margin-top: 3.5rem; margin-bottom: 1.5rem; font-weight: 800; color: #111827; letter-spacing: -0.025em; position: relative; padding-bottom: 0.75rem; border-bottom: 3px solid rgba(245, 158, 11, 0.5);">Segunda sección importante</h2>
    
    <p>Continúa con el desarrollo de tu segundo punto principal. Usa transiciones suaves entre párrafos para mantener un flujo de lectura agradable.</p>
    
    <div class="highlight-block" style="background-color: #fffde7; border-left: 3px solid #f59e0b; padding: 16px 20px; margin: 1.5rem 0; border-radius: 4px;">
      <p>Este bloque destacado puede utilizarse para resaltar información importante que no quieres que el lector pase por alto.</p>
    </div>
    
    <h2 style="font-size: 2rem; margin-top: 3.5rem; margin-bottom: 1.5rem; font-weight: 800; color: #111827; letter-spacing: -0.025em; position: relative; padding-bottom: 0.75rem; border-bottom: 3px solid rgba(245, 158, 11, 0.5);">Conclusiones</h2>
    
    <p>Resume los puntos principales tratados en el artículo y ofrece una conclusión o reflexión final que invite al lector a la acción o a profundizar más en el tema.</p>
  `,
  
  realEstateAnalysis: `
    <h1 class="title-main" style="font-size: 2.5rem; font-weight: 700; margin: 1.5rem 0; color: #2a3f5f; text-align: center; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">Análisis del Mercado Inmobiliario en Madrid 2023</h1>
    
    <p>El mercado inmobiliario de Madrid ha experimentado cambios significativos durante el último año. En este análisis, examinaremos las tendencias actuales, los precios por zona, y las proyecciones para los próximos meses.</p>
    
    <h2 class="title-section" style="font-size: 1.8rem; font-weight: 600; margin: 1.2rem 0; color: #3a5482; border-left: 4px solid #3a5482; padding-left: 12px;">Panorama General del Mercado</h2>
    
    <p>Madrid continúa siendo uno de los mercados inmobiliarios más activos de España, con un volumen de transacciones que ha aumentado un 8% respecto al año anterior. La demanda se mantiene sólida, especialmente en viviendas con espacios exteriores y ubicaciones bien conectadas.</p>
    
    <div class="pro-callout pro-info" style="margin: 1.5rem 0; padding: 1.5rem; border-radius: 0.5rem; border: 1px solid #bee3f8; background-color: #ebf8ff; position: relative; overflow: hidden;">
      <p style="margin-left: 0.5rem;"><strong>Dato clave:</strong> El precio medio por metro cuadrado en Madrid capital ha alcanzado los 3,890€, representando un incremento del 5.7% interanual.</p>
    </div>
    
    <h2 class="title-section" style="font-size: 1.8rem; font-weight: 600; margin: 1.2rem 0; color: #3a5482; border-left: 4px solid #3a5482; padding-left: 12px;">Análisis por Distritos</h2>
    
    <p>Las diferencias de precio entre distritos siguen siendo notables, con Salamanca y Chamberí liderando el ranking de las zonas más exclusivas, mientras que Villaverde y Usera ofrecen opciones más asequibles.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 2rem 0; font-size: 0.95rem; border-radius: 0.25rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <thead style="background-color: #4a5568; color: white;">
        <tr>
          <th style="text-align: left; padding: 0.75rem 1rem;">Distrito</th>
          <th style="text-align: left; padding: 0.75rem 1rem;">Precio medio (€/m²)</th>
          <th style="text-align: left; padding: 0.75rem 1rem;">Variación anual</th>
          <th style="text-align: left; padding: 0.75rem 1rem;">Tiempo medio de venta</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">Salamanca</td>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">6,250</td>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">+7.3%</td>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">45 días</td>
        </tr>
        <tr style="background-color: #f7fafc;">
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">Chamberí</td>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">5,890</td>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">+6.8%</td>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">52 días</td>
        </tr>
        <tr>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">Chamartín</td>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">5,420</td>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">+5.2%</td>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">60 días</td>
        </tr>
        <tr style="background-color: #f7fafc;">
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">Villaverde</td>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">2,180</td>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">+3.1%</td>
          <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">95 días</td>
        </tr>
      </tbody>
    </table>
    
    <h3 class="title-subsection" style="font-size: 1.4rem; font-weight: 600; margin: 1rem 0; color: #4a6fa5;">• Zonas emergentes</h3>
    
    <p>Distritos como Arganzuela, Tetuán y algunas áreas de Carabanchel están experimentando una revitalización, con incrementos de precio superiores a la media debido a proyectos de renovación urbana y mejor conectividad.</p>
    
    <div class="highlight-block" style="background-color: #fffde7; border-left: 3px solid #ffc107; padding: 10px 15px; margin: 10px 0;">
      <p>El barrio de Malasaña en el distrito Centro sigue siendo uno de los más demandados por inversores, con una rentabilidad bruta por alquiler cercana al 5.8%.</p>
    </div>
    
    <h2 class="title-section" style="font-size: 1.8rem; font-weight: 600; margin: 1.2rem 0; color: #3a5482; border-left: 4px solid #3a5482; padding-left: 12px;">Perspectivas para el Próximo Año</h2>
    
    <p>Los expertos proyectan una estabilización de precios en los próximos meses, con crecimientos más moderados que en años anteriores. La oferta de obra nueva sigue siendo limitada, lo que mantendrá la presión sobre los precios en ciertas zonas.</p>
    
    <div class="pro-callout pro-warning" style="margin: 1.5rem 0; padding: 1.5rem; border-radius: 0.5rem; border: 1px solid #feebc8; background-color: #fffaf0; position: relative; overflow: hidden;">
      <p style="margin-left: 0.5rem;"><strong>Importante:</strong> Los cambios en la política de tipos de interés podrían afectar la capacidad de financiación de los compradores, moderando el crecimiento de precios en los segmentos medios del mercado.</p>
    </div>
    
    <h2 class="title-section" style="font-size: 1.8rem; font-weight: 600; margin: 1.2rem 0; color: #3a5482; border-left: 4px solid #3a5482; padding-left: 12px;">Conclusiones</h2>
    
    <p>El mercado inmobiliario madrileño mantiene su dinamismo, con tendencias de crecimiento sostenible. Las oportunidades más interesantes se encuentran en barrios emergentes y en propiedades que ofrecen espacios flexibles adaptados a las nuevas formas de vida y trabajo.</p>
  `,
  
  calculationGuide: `
    <h1 class="title-main" style="font-size: 2.5rem; font-weight: 700; margin: 1.5rem 0; color: #2a3f5f; text-align: center; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">Guía de Cálculos Hipotecarios</h1>
    
    <p>Entender los cálculos hipotecarios es fundamental para tomar decisiones financieras informadas al comprar una vivienda. Esta guía explica las fórmulas más importantes y presenta ejemplos prácticos.</p>
    
    <h2 class="title-section" style="font-size: 1.8rem; font-weight: 600; margin: 1.2rem 0; color: #3a5482; border-left: 4px solid #3a5482; padding-left: 12px;">Cálculo de la Cuota Mensual</h2>
    
    <div class="formula-block" style="background-color: #f8f9fa; border-left: 3px solid #4a89dc; padding: 10px 15px; margin: 10px 0; font-family: Courier New, monospace;">
      <p><strong>Fórmula de la cuota mensual:</strong></p>
      <p>Cuota = [C × i × (1 + i)^n] / [(1 + i)^n - 1]</p>
      <p>Donde:</p>
      <ul>
        <li>C = Capital prestado</li>
        <li>i = Tipo de interés mensual (interés anual ÷ 12)</li>
        <li>n = Número total de cuotas (años del préstamo × 12)</li>
      </ul>
    </div>
    
    <h3 class="title-subsection" style="font-size: 1.4rem; font-weight: 600; margin: 1rem 0; color: #4a6fa5;">• Ejemplo práctico</h3>
    
    <p>Para un préstamo de €200,000 a 30 años con un interés anual del 3%:</p>
    <ul>
      <li>Capital = €200,000</li>
      <li>Interés mensual = 0.03 ÷ 12 = 0.0025</li>
      <li>Plazo = 30 años × 12 meses = 360 meses</li>
    </ul>
    
    <p>Aplicando la fórmula:</p>
    <p>Cuota = [200,000 × 0.0025 × (1 + 0.0025)^360] / [(1 + 0.0025)^360 - 1] = €843.21</p>
    
    <div class="pro-card" style="background-color: white; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08); margin: 1.5rem 0; padding: 1.5rem; border: 1px solid #e2e8f0;">
      <h4 style="margin-top: 0; color: #2c5282;">Tabla de Amortización</h4>
      <p>La siguiente tabla muestra los primeros meses de amortización:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem;">
        <thead>
          <tr>
            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #e2e8f0;">Mes</th>
            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #e2e8f0;">Cuota</th>
            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #e2e8f0;">Interés</th>
            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #e2e8f0;">Amortización</th>
            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #e2e8f0;">Capital Pendiente</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">1</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">€843.21</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">€500.00</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">€343.21</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">€199,656.79</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">2</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">€843.21</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">€499.14</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">€344.07</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">€199,312.72</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <h2 class="title-section" style="font-size: 1.8rem; font-weight: 600; margin: 1.2rem 0; color: #3a5482; border-left: 4px solid #3a5482; padding-left: 12px;">Rentabilidad de Inversiones Inmobiliarias</h2>
    
    <div class="formula-block" style="background-color: #f8f9fa; border-left: 3px solid #4a89dc; padding: 10px 15px; margin: 10px 0; font-family: Courier New, monospace;">
      <p><strong>ROI (Retorno sobre la Inversión):</strong></p>
      <p>ROI = (Beneficio Neto Anual ÷ Inversión Total) × 100</p>
      <p>Donde:</p>
      <ul>
        <li>Beneficio Neto Anual = Ingresos por alquiler anuales - Gastos anuales</li>
        <li>Inversión Total = Precio de compra + Costes de adquisición + Reformas</li>
      </ul>
    </div>
    
    <div class="pro-callout pro-warning" style="margin: 1.5rem 0; padding: 1.5rem; border-radius: 0.5rem; border: 1px solid #feebc8; background-color: #fffaf0; position: relative; overflow: hidden;">
      <p style="margin-left: 0.5rem;"><strong>Importante:</strong> No olvide incluir en los gastos los impuestos, seguros, mantenimiento y posibles períodos sin alquilar.</p>
    </div>
  `
};

// Función para guardar en localStorage
function saveToLocalStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Función para obtener de localStorage
function getFromLocalStorage(key, defaultValue) {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    const parsedValue = JSON.parse(stored);
    
    // Si esperamos un array (basado en defaultValue) pero no recibimos uno, devolver el valor por defecto
    if (Array.isArray(defaultValue) && !Array.isArray(parsedValue)) {
      console.warn(`Se esperaba un array para ${key}, pero se recibió:`, parsedValue);
      return defaultValue;
    }
    
    return parsedValue;
  } catch (error) {
    console.error(`Error al parsear ${key} desde localStorage:`, error);
    return defaultValue;
  }
}

export default function BlogCreation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useUser();
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Estado para controlar si estamos en modo edición
  const [isEditMode, setIsEditMode] = useState(false);
  const [blogId, setBlogId] = useState(null);
  
  // Cargar estado desde localStorage o usar valores por defecto
  const [currentStep, setCurrentStep] = useState(() => 
    getFromLocalStorage('blog_currentStep', 1)
  );
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    description: '',
    category: 'Inmobiliaria',
    tags: [],
    url: '',
    image: {
      src: '',
      alt: ''
    },
    images: [],
    readTime: '5',
    button: {
      title: '',
      variant: 'primary',
      size: 'medium',
      iconRight: ''
    }
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(() => 
    getFromLocalStorage('blog_previewImage', '')
  );
  const [previewImages, setPreviewImages] = useState(() => 
    getFromLocalStorage('blog_previewImages', [])
  );
  const [tagInput, setTagInput] = useState('');
  
  // Detectar si estamos en modo edición y cargar los datos del blog
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const editBlogId = queryParams.get('edit');
    
    console.log("Parámetros de URL detectados:", location.search);
    console.log("ID de blog a editar:", editBlogId);
    
    if (editBlogId) {
      setIsEditMode(true);
      setBlogId(editBlogId);
      loadBlogData(editBlogId);
    } else {
      // Si no estamos en modo edición, asegurarse de que estamos en el paso 1
      setCurrentStep(1);
      // Y resetear el form si es necesario
      setFormData(prevData => ({
        ...prevData,
        title: prevData.title || '',
        description: prevData.description || '',
        content: prevData.content || '',
        category: prevData.category || 'Inmobiliaria'
      }));
    }
  }, [location.search]);
  
  // Función para cargar los datos del blog a editar
  const loadBlogData = async (id) => {
    try {
      const blogData = await getBlogById(id);
      
      if (!blogData) {
        throw new Error('No se pudo obtener la información del blog');
      }
      
      // Procesar las imágenes para que tengan el formato correcto
      let blogImages = [];
      
      // Procesar la imagen principal
      if (blogData.image && typeof blogData.image === 'object' && blogData.image.src) {
        blogImages.push(blogData.image);
      } else if (blogData.image && typeof blogData.image === 'string') {
        blogImages.push({ src: blogData.image, alt: "Imagen principal" });
      }
      
      // Procesar las imágenes adicionales
      if (blogData.images && Array.isArray(blogData.images)) {
        const additionalImages = blogData.images.map(img => {
          if (typeof img === 'string') {
            return { src: img, alt: "Imagen del blog" };
          } else if (typeof img === 'object' && img.src) {
            return img;
          }
          return null;
        }).filter(img => img !== null);
        
        blogImages = [...blogImages, ...additionalImages];
      }
      
      // Actualizar el estado del formulario con los datos del blog
      setFormData({
        title: blogData.title || '',
        subtitle: blogData.subtitle || '',
        content: blogData.content || '',
        description: blogData.description || '',
        category: blogData.category || 'Inmobiliaria',
        tags: blogData.tags || [],
        url: blogData.url || '',
        image: blogData.image && typeof blogData.image === 'object' ? blogData.image : { src: '', alt: '' },
        images: blogImages || [],
        readTime: blogData.readTime || '5',
        button: blogData.button || {
          title: '',
          variant: 'primary',
          size: 'medium',
          iconRight: ''
        }
      });
      
      // Actualizar previewImage si hay una imagen principal
      if (blogImages.length > 0) {
        setPreviewImage(blogImages[0].src);
      }
      
      toast.success('Datos del blog cargados correctamente');
    } catch (error) {
      console.error('Error al cargar los datos del blog:', error);
      toast.error('Error al cargar los datos del blog');
    }
  };
  
  // Guardar cambios en localStorage cuando cambie el estado
  useEffect(() => {
    saveToLocalStorage('blog_currentStep', currentStep);
  }, [currentStep]);
  
  useEffect(() => {
    saveToLocalStorage('blog_formData', formData);
  }, [formData]);
  
  useEffect(() => {
    saveToLocalStorage('blog_previewImage', previewImage);
  }, [previewImage]);
  
  useEffect(() => {
    saveToLocalStorage('blog_previewImages', previewImages);
  }, [previewImages]);
  
  // Efecto para sincronizar la imagen del formulario con la previsualización
  useEffect(() => {
    // Si estamos en el paso de la imagen
    if (currentStep === 3) {
      console.log("Paso 3 activo - Verificando sincronización de imagen");
      
      // Si hay una imagen en el formData pero no hay previsualización
      if (formData.image && !previewImage) {
        console.log("Sincronizando previsualización con la imagen del formulario:", formData.image);
        setPreviewImage(formData.image);
      } 
      // Si hay previsualización pero no hay imagen en formData
      else if (!formData.image && previewImage && !previewImage.startsWith('blob:')) {
        // Si la previsualización es una URL válida (no un blob temporal), actualizar formData
        console.log("Sincronizando formData con la previsualización:", previewImage);
        setFormData({
          ...formData,
          image: previewImage
        });
        
        // Actualizar localStorage
        localStorage.setItem('blog_formData', JSON.stringify({
          ...formData,
          image: previewImage
        }));
      }
      
      // Verificar si hay una imagen guardada en localStorage pero no en el estado
      const savedPreviewImage = localStorage.getItem('blog_previewImage');
      const savedFormData = JSON.parse(localStorage.getItem('blog_formData') || '{}');
      
      if (!previewImage && savedPreviewImage) {
        console.log("Recuperando previsualización desde localStorage");
        setPreviewImage(savedPreviewImage);
      }
      
      if (!formData.image && savedFormData.image) {
        console.log("Recuperando imagen desde localStorage");
        setFormData(prevFormData => ({
          ...prevFormData,
          image: savedFormData.image
        }));
      }
    }
  }, [currentStep, formData.image, previewImage]);
  
  // Limpiar localStorage al montar el componente (opcional)
  useEffect(() => {
    return () => {
      // Limpieza al desmontar si se navega a otra página 
      // (comentar si deseas mantener el estado al volver)
      // localStorage.removeItem('blog_currentStep');
      // localStorage.removeItem('blog_formData');
      // localStorage.removeItem('blog_previewImage');
    };
  }, []);
  
  // Agregar el estilo personalizado al montar el componente
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = customStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Manejo de cambios simple
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Campo ${name} actualizado:`, value);
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Navegación entre pasos muy simplificada
  function nextStep() {
    // No validamos para simplificar
    const newStep = currentStep + 1;
    console.log("Avanzando al paso:", newStep);
    setCurrentStep(newStep);
  }
  
  function prevStep() {
    const newStep = currentStep - 1;
    console.log("Retrocediendo al paso:", newStep);
    setCurrentStep(newStep);
  }
  
  // Manejar etiquetas
  function addTag() {
    if (tagInput.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  }
  
  function removeTag(index) {
    const newTags = [...formData.tags];
    newTags.splice(index, 1);
    setFormData({
      ...formData,
      tags: newTags
    });
  }
  
  // Subir imagen
  const handleImageUpload = async (files) => {
    try {
      setUploadingImage(true);
      setError(null);

      // Convertir FileList a Array
      const fileArray = Array.from(files);
      
      // Validar cada archivo
      const invalidFiles = fileArray.filter(file => !file.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
        throw new Error('Solo se permiten archivos de imagen');
      }

      // Subir cada imagen y obtener sus URLs
      const uploadPromises = fileArray.map(async (file) => {
        const result = await uploadImageBlog(file);
        return {
          src: result.secure_url || result.imageUrl,
          alt: file.name,
          public_id: result.public_id
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);

      // Actualizar el estado con las nuevas imágenes
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedImages]
      }));

      // Actualizar las URLs de vista previa
      const newPreviewUrls = uploadedImages.map(img => img.src);
      setPreviewImages(prev => [...prev, ...newPreviewUrls]);

      toast.success('Imágenes subidas correctamente');
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      setError(error.message);
      toast.error(`Error al subir imágenes: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };
  
  function removeImage() {
    console.log("Eliminando imagen de previsualización");
    
    try {
      // Si no hay imágenes adicionales, no permitir eliminar la imagen principal
      if (!Array.isArray(formData.images) || formData.images.length === 0) {
        console.warn("No se puede eliminar la única imagen disponible");
        toast.warning("No se puede eliminar la única imagen disponible");
        return;
      }
      
      // Si hay una URL de objeto, liberarla para evitar fugas de memoria
      if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
        console.log("URL de objeto liberada:", previewImage);
      }
      
      // Si hay imágenes adicionales, usar la primera como imagen principal
      const newMainImage = formData.images[0];
      
      // Limpiar estados
      setPreviewImage(newMainImage);
      setFormData(prevFormData => ({
        ...prevFormData,
        image: {
          src: newMainImage,
          alt: prevFormData.title || 'Imagen del blog'
        }
      }));
      
      // Limpiar el input de archivo para permitir seleccionar el mismo archivo nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        console.log("Input de archivo limpiado");
      }
      
      // Actualizar localStorage
      localStorage.setItem('blog_previewImage', newMainImage);
      
      // Actualizar formData en localStorage
      const currentFormData = JSON.parse(localStorage.getItem('blog_formData') || '{}');
      localStorage.setItem('blog_formData', JSON.stringify({
        ...currentFormData,
        image: {
          src: newMainImage,
          alt: currentFormData.title || 'Imagen del blog'
        }
      }));
      
      console.log("Imagen principal actualizada a:", newMainImage);
      toast.info('Imagen principal actualizada');
    } catch (error) {
      console.error("Error al actualizar la imagen principal:", error);
      toast.error('Error al actualizar la imagen principal');
    }
  }
  
  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validar campos requeridos
      if (!formData.title || !formData.content) {
        throw new Error('Por favor, completa todos los campos requeridos');
      }
      
      // Si no hay imagen, usar una imagen por defecto
      if (!formData.image.src && (!formData.images || formData.images.length === 0)) {
        formData.image = {
          src: 'https://via.placeholder.com/800x400?text=Blog+GozaMadrid',
          alt: formData.title
        };
      }
      
      console.log(`${isEditMode ? 'Actualizando' : 'Creando'} blog:`, formData);
      
      let response;
      
      if (isEditMode && blogId) {
        // Editar blog existente
        response = await updateBlogPost(blogId, formData);
        toast.success('¡Blog actualizado exitosamente!');
      } else {
        // Crear nuevo blog
        response = await createBlogPost(formData);
        toast.success('¡Blog creado exitosamente!');
      }
      
      console.log('Respuesta del servidor:', response);
      
      // Limpiar localStorage
      localStorage.removeItem('blog_currentStep');
      localStorage.removeItem('blog_formData');
      localStorage.removeItem('blog_previewImage');
      
      navigate('/ver-blogs');
    } catch (error) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} el blog:`, error);
      setError(`Error al ${isEditMode ? 'actualizar' : 'crear'} el blog: ${error.message}`);
      toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} el blog: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Añadir el manejador para el contenido del editor
  const handleEditorChange = (content) => {
    console.log('Contenido del editor actualizado:', content);
    setFormData(prevData => ({
      ...prevData,
      content: content
    }));
  };
  
  // Actualiza la función renderStep para manejar correctamente todos los pasos
  function renderStep() {
    console.log('Renderizando paso:', currentStep);
    
    // Asegurarnos de que formData tenga todas las propiedades necesarias
    const safeFormData = {
      title: formData.title || '',
      description: formData.description || '',
      content: formData.content || '',
      category: formData.category || 'Inmobiliaria',
      tags: Array.isArray(formData.tags) ? formData.tags : [],
      // Resto de propiedades con valores por defecto seguros
      image: formData.image || { src: '', alt: '' },
      images: Array.isArray(formData.images) ? formData.images : [],
      readTime: formData.readTime || '5'
    };
    
    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-blue-800 mb-6">Información básica</h2>
                    
                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Título
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                            placeholder="Ej: Guía completa sobre hipotecas en Madrid"
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Descripción
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                            rows="3"
                            placeholder="Breve descripción del contenido del blog..."
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Categoría
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                        >
                            <option value="Inmobiliaria">Inmobiliaria</option>
                            <option value="Finanzas">Finanzas</option>
                            <option value="Legal">Legal</option>
                            <option value="Consejos">Consejos y tips</option>
                            <option value="Mercado">Análisis de mercado</option>
                            <option value="Inversión">Inversión</option>
                        </select>
                    </div>
                    
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={nextStep}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            );
        case 2:
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-blue-800 mb-6">Contenido del blog</h2>
                    
                    {/* Plantillas profesionales */}
                    <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Plantillas profesionales
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => loadTemplate('standardArticle')}
                                className="bg-white border-2 border-blue-200 hover:border-blue-500 p-3 rounded-lg text-left transition"
                            >
                                <div className="font-medium text-blue-800">Artículo estándar</div>
                                <div className="text-xs text-gray-500">Estructura básica con introducción, desarrollo y conclusión</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => loadTemplate('realEstateAnalysis')}
                                className="bg-white border-2 border-blue-200 hover:border-blue-500 p-3 rounded-lg text-left transition"
                            >
                                <div className="font-medium text-blue-800">Análisis inmobiliario</div>
                                <div className="text-xs text-gray-500">Incluye tablas comparativas y análisis de zonas</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => loadTemplate('calculationGuide')}
                                className="bg-white border-2 border-blue-200 hover:border-blue-500 p-3 rounded-lg text-left transition"
                            >
                                <div className="font-medium text-blue-800">Guía de cálculos</div>
                                <div className="text-xs text-gray-500">Formato ideal para explicar fórmulas y ejemplos</div>
                            </button>
                        </div>
                    </div>
                    
                    {/* Editor mejorado con vista previa */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Contenido
                        </label>
                        <div className="border border-gray-300 rounded-lg overflow-hidden quill-container bg-white">
                            <ReactQuill
                                ref={quillRef}
                                value={formData.content || ''}
                                onChange={handleEditorChange}
                                modules={modules}
                                formats={formats}
                                className="min-h-[400px]"
                                preserveWhitespace={true}
                                theme="snow"
                                placeholder="Escribe el contenido del blog aquí..."
                                bounds=".quill-container"
                            />
                            
                            {/* Barra de herramientas visual mejorada */}
                            <div className="p-3 bg-gray-50 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Columna 1: Títulos */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm text-gray-600 font-medium mb-1 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Títulos
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => insertSpecialBlock('title-main')}
                                                className="text-sm px-3 py-2 rounded hover:bg-indigo-50 border border-indigo-100 flex items-center gap-1 text-left"
                                            >
                                                <div className="flex-1">
                                                    <span className="font-bold text-lg text-indigo-800 block">Título Principal</span>
                                                    <span className="text-xs text-gray-500">Título grande centrado</span>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertSpecialBlock('title-section')}
                                                className="text-sm px-3 py-2 rounded hover:bg-indigo-50 border border-indigo-100 flex items-center gap-1 text-left"
                                            >
                                                <div className="flex-1">
                                                    <span className="font-bold text-base text-indigo-800 block" style={{borderBottom: '2px solid #f59e0b'}}>Título de Sección</span>
                                                    <span className="text-xs text-gray-500">Título con subrayado</span>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertSpecialBlock('title-subsection')}
                                                className="text-sm px-3 py-2 rounded hover:bg-indigo-50 border border-indigo-100 flex items-center gap-1 text-left"
                                            >
                                                <div className="flex-1">
                                                    <span className="font-bold text-indigo-800 inline-block px-2 py-1" style={{backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: '4px'}}>Subtítulo</span>
                                                    <span className="text-xs text-gray-500 block mt-1">Subtítulo con fondo</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Columna 2: Bloques especiales */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm text-gray-600 font-medium mb-1 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd" />
                                            </svg>
                                            Bloques especiales
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => insertSpecialBlock('formula')}
                                                className="text-sm px-3 py-2 rounded hover:bg-blue-50 border border-blue-100 flex items-center gap-1 text-left"
                                            >
                                                <div className="flex-1">
                                                    <span className="font-bold text-blue-800 block">Bloque de cálculo</span>
                                                    <span className="text-xs text-gray-500 block" style={{fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '2px 6px', borderLeft: '2px solid #4a89dc'}}>Fórmulas y cálculos</span>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertSpecialBlock('highlight')}
                                                className="text-sm px-3 py-2 rounded hover:bg-yellow-50 border border-yellow-100 flex items-center gap-1 text-left"
                                            >
                                                <div className="flex-1">
                                                    <span className="font-bold text-yellow-800 block">Bloque destacado</span>
                                                    <span className="text-xs text-gray-500 block" style={{backgroundColor: '#fffde7', padding: '2px 6px', borderLeft: '2px solid #f59e0b'}}>Información importante</span>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertSpecialBlock('note')}
                                                className="text-sm px-3 py-2 rounded hover:bg-green-50 border border-green-100 flex items-center gap-1 text-left"
                                            >
                                                <div className="flex-1">
                                                    <span className="font-bold text-green-800 block">Bloque de nota</span>
                                                    <span className="text-xs text-gray-500 block" style={{backgroundColor: '#e8f5e9', padding: '2px 6px', borderLeft: '2px solid #4caf50', fontStyle: 'italic'}}>Nota aclaratoria</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Columna 3: Elementos adicionales */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm text-gray-600 font-medium mb-1 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                            Elementos adicionales
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => insertSpecialBlock('quote')}
                                                className="text-sm px-3 py-2 rounded hover:bg-purple-50 border border-purple-100 flex items-center gap-1 text-left"
                                            >
                                                <div className="flex-1">
                                                    <span className="font-bold text-purple-800 block">Cita o testimonio</span>
                                                    <span className="text-xs text-gray-500 block" style={{backgroundColor: 'rgba(245, 158, 11, 0.05)', padding: '6px', borderRadius: '0.5rem', fontStyle: 'italic'}}>"Texto destacado entre comillas"</span>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertSpecialBlock('emphasis-paragraph')}
                                                className="text-sm px-3 py-2 rounded hover:bg-orange-50 border border-orange-100 flex items-center gap-1 text-left"
                                            >
                                                <div className="flex-1">
                                                    <span className="font-bold text-orange-800 block">Párrafo enfatizado</span>
                                                    <span className="text-xs text-gray-500 block" style={{borderLeft: '2px solid #f59e0b', paddingLeft: '8px', fontStyle: 'italic'}}>Párrafo con estilo especial</span>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertSpecialBlock('separator')}
                                                className="text-sm px-3 py-2 rounded hover:bg-orange-50 border border-orange-100 flex items-center gap-1 text-left"
                                            >
                                                <div className="flex-1">
                                                    <span className="font-bold text-orange-800 block">Separador decorativo</span>
                                                    <div className="my-1" style={{
                                                        height: '4px',
                                                        width: '100%',
                                                        backgroundImage: 'radial-gradient(circle, #f59e0b 0%, transparent 60%), radial-gradient(circle, #f59e0b 0%, transparent 60%)',
                                                        backgroundSize: '15px 15px'
                                                    }}></div>
                                                    <span className="text-xs text-gray-500">Línea decorativa</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Vista previa */}
                        <div className="mt-8 border rounded-lg p-4 bg-white shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                Vista previa del contenido
                            </h3>
                            <div 
                                className="ql-editor preview-container p-4 border rounded bg-gray-50"
                                dangerouslySetInnerHTML={{ __html: formData.content }}
                            ></div>
                        </div>
                    </div>
                    
                    {/* Botones de navegación */}
                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={prevStep}
                            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
                        >
                            Anterior
                        </button>
                        <button
                            type="button"
                            onClick={nextStep}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            );
        case 3:
            return (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">Imágenes del Blog</h3>
                        
                        {/* Input y zona de drop para subir imágenes */}
                        <div 
                          className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors" // Estilos añadidos al div contenedor
                          onDragOver={(e) => { // <-- Añadido onDragOver al div
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={handleDrop} // <-- Añadido onDrop al div
                        >
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subir Imágenes
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleMultipleImageUpload}
                                ref={fileInputRef}
                                className="hidden"
                                disabled={uploadingImage}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center bg-white hover:bg-gray-50 transition-colors"
                                disabled={uploadingImage}
                            >
                                {uploadingImage ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Subiendo...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        <FiUpload className="mr-2" />
                                        Seleccionar Imágenes
                                    </span>
                                )}
                            </button>
                            <p className="text-xs text-gray-500 mt-2">o arrastra y suelta los archivos aquí</p> {/* Texto añadido */}
                        </div>

                        {/* Previsualización de imágenes */}
                        {formData.images && formData.images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                {formData.images.map((img, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={img.src}
                                            alt={img.alt || 'Imagen del blog'}
                                            className="w-full h-40 object-cover rounded-lg"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => setAsMainImage(index)}
                                                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                                                title="Establecer como imagen principal"
                                            >
                                                <FiEdit size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeSpecificImage(index)}
                                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                title="Eliminar imagen"
                                            >
                                                <FiX size={16} />
                                            </button>
                                        </div>
                                        {formData.image?.src === img.src && (
                                            <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs">
                                                Principal
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botones de navegación */}
                    <div className="flex justify-between mt-6">
                        <button
                            type="button"
                            onClick={prevStep}
                            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Anterior
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 ease-in-out flex items-center justify-center"
                            disabled={uploadingImage}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Publicando...
                                </>
                            ) : (
                                'Publicar Blog'
                            )}
                        </button>
                    </div>
                </div>
            );
        
        default:
            return null;
    }
}
  
  // Actualiza la función insertSpecialBlock para usar los nuevos estilos dinámicos
  function insertSpecialBlock(blockType) {
    let blockHtml = '';
    
    switch(blockType) {
      case 'formula':
        blockHtml = `
          <div class="formula-block" style="background-color: #f8f9fa; border-left: 3px solid #4a89dc; padding: 16px 20px; margin: 1.5rem 0; font-family: 'Courier New', monospace; border-radius: 4px; color: #2c5282;">
            <p><strong>Fórmula o cálculo:</strong></p>
            <p>Ejemplo: Precio total = Precio base × (1 + IVA)</p>
            <p>Variables:</p>
            <ul>
              <li>Precio base = precio sin impuestos</li>
              <li>IVA = 0.21 (21%)</li>
            </ul>
          </div>
        `;
        break;
      case 'highlight':
        blockHtml = `
          <div class="highlight-block" style="background-color: #fffde7; border-left: 3px solid #f59e0b; padding: 16px 20px; margin: 1.5rem 0; border-radius: 4px;">
            <p style="font-weight: 500; color: #1f2937; font-size: 1.1rem;">Información destacada</p>
            <p>Este bloque es ideal para enfatizar datos importantes, estadísticas o conclusiones clave que quieres que el lector recuerde.</p>
          </div>
        `;
        break;
      case 'note':
        blockHtml = `
          <div class="note-block" style="background-color: #e8f5e9; border-left: 3px solid #4caf50; padding: 16px 20px; margin: 1.5rem 0; border-radius: 4px; font-style: italic;">
            <p><strong>Nota:</strong> Información adicional o advertencia relevante para el lector.</p>
          </div>
        `;
        break;
      case 'title-main':
        blockHtml = `
          <h1 class="title-main" style="font-size: 2.5rem; font-weight: 800; margin: 2rem 0 1.5rem; color: #111827; text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 12px; letter-spacing: -0.025em; line-height: 1.2;">Título Principal</h1>
        `;
        break;
      case 'title-section':
        blockHtml = `
          <h2 style="font-size: 2rem; margin-top: 3.5rem; margin-bottom: 1.5rem; font-weight: 800; color: #111827; letter-spacing: -0.025em; position: relative; padding-bottom: 0.75rem; width: fit-content; border-bottom: 3px solid rgba(245, 158, 11, 0.5);">Título de Sección</h2>
        `;
        break;
      case 'title-subsection':
        blockHtml = `
          <h3 style="font-size: 1.5rem; margin-top: 2.5rem; margin-bottom: 1.25rem; font-weight: 700; color: #1f2937; background: rgba(245, 158, 11, 0.1); padding: 0.25rem 0.75rem; border-radius: 4px; display: inline-block;">Subtítulo</h3>
        `;
        break;
      case 'separator':
        blockHtml = `<hr class="separator-decorative" style="border: 0; height: 6px; margin: 4rem auto; width: 50%; background-image: radial-gradient(circle, #f59e0b 0%, transparent 60%), radial-gradient(circle, #f59e0b 0%, transparent 60%); background-size: 15px 15px; background-position: top center; opacity: 0.5;">`;
        break;
      case 'emphasis-paragraph':
        blockHtml = '<p style="margin-left: 2rem; padding-left: 1.5rem; border-left: 3px solid #f59e0b; font-style: italic; margin-bottom: 1.75rem;">Párrafo con énfasis especial que destaca información importante dentro del artículo.</p>';
        break;
      case 'first-paragraph':
        blockHtml = '<p class="first-paragraph" style="margin-bottom: 1.75rem; letter-spacing: -0.01em; position: relative; font-size: 1.1rem; color: #1f2937;">Este párrafo tendrá la primera letra destacada. Es ideal para comenzar tu artículo con un impacto visual que atraiga la atención del lector desde el primer momento.</p>';
        break;
      case 'quote':
        blockHtml = `
          <blockquote style="margin: 3rem 0; padding: 2rem; background-color: rgba(245, 158, 11, 0.05); border-radius: 1rem; position: relative; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); border-left: none;">
            <p style="font-size: 1.25rem; line-height: 1.6; color: #4b5563; font-weight: 500; position: relative; z-index: 1; margin-bottom: 0.5rem;">"Una cita inspiradora o relevante para tu artículo."</p>
            <p style="text-align: right; font-style: italic; color: #6b7280;">— Autor de la cita</p>
          </blockquote>
        `;
        break;
      case 'pro-table':
        blockHtml = `
          <div style="margin: 2rem 0; overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; margin: 2rem 0; font-size: 0.95rem; border-radius: 0.25rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <thead style="background-color: #4a5568; color: white;">
                <tr>
                  <th style="text-align: left; padding: 0.75rem 1rem; font-weight: 600;">Encabezado 1</th>
                  <th style="text-align: left; padding: 0.75rem 1rem; font-weight: 600;">Encabezado 2</th>
                  <th style="text-align: left; padding: 0.75rem 1rem; font-weight: 600;">Encabezado 3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">Celda 1</td>
                  <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">Celda 2</td>
                  <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">Celda 3</td>
                </tr>
                <tr style="background-color: #f7fafc;">
                  <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">Celda 4</td>
                  <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">Celda 5</td>
                  <td style="padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0;">Celda 6</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
        break;
      default:
        return;
    }
    
    // Agregar el bloque al contenido existente
    setFormData({
      ...formData,
      content: formData.content + blockHtml
    });
  }
  
  // Función para cargar una plantilla predefinida
  function loadTemplate(templateName) {
    if (formData.content && formData.content.trim() !== '') {
      if (!confirm('¿Estás seguro de que quieres reemplazar el contenido actual?')) {
        return;
      }
    }
    
    setFormData({
      ...formData,
      content: contentTemplates[templateName] || ''
    });
    
    toast.success('Plantilla cargada correctamente');
  }
  
  // Añade esta función para reiniciar el formulario
  function resetForm() {
    // Limpiar localStorage
    localStorage.removeItem('blog_currentStep');
    localStorage.removeItem('blog_formData');
    localStorage.removeItem('blog_previewImage');
    
    // Restablecer estado
    setCurrentStep(1);
    setFormData({
      title: '',
      subtitle: '',
      content: '',
      category: 'Inmobiliaria',
      tags: [],
      url: '', // Nuevo campo
      image: {
        src: '',
        alt: ''
      },
      images: [], // Asegurarnos de que images siempre sea un array
      readTime: '5',
      button: {  // Nuevo campo
        title: '',
        variant: 'primary',
        size: 'medium',
        iconRight: ''
      }
    });
    setPreviewImage('');
    setTagInput('');
    setError(null);
  }
  
  // Puedes llamar a esta función después de una publicación exitosa o cuando un usuario inicie un nuevo blog
  
  const handleMultipleImageUpload = async (e) => {
    // Validar selección
    if (!e.target.files || e.target.files.length === 0) {
      toast.info('No se seleccionaron archivos.');
      return;
    }
    setUploadingImage(true);
    setError(null);
    const files = Array.from(e.target.files);
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const uploadedUrls = [];

    // Obtener configuración una vez para todo el lote
    console.log('Obteniendo configuración de Cloudinary UNA VEZ para todo el lote...');
    let signatureData;
    try {
      signatureData = await getCloudinarySignature();
      if (!signatureData || !signatureData.success) {
        const msg = signatureData?.message || 'No se pudo obtener la configuración para la subida';
        throw new Error(msg);
      }
      console.log('Configuración obtenida con éxito para el lote.');
    } catch (sigError) {
      console.error('Error al obtener configuración de Cloudinary:', sigError);
      toast.error(`Error al configurar subida: ${sigError.message}`);
      setUploadingImage(false);
      return;
    }

    // Procesar cada archivo
    for (const file of files) {
      if (file.size > maxFileSize) {
        toast.warning(`El archivo ${file.name} excede 5MB y será omitido.`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        toast.warning(`El archivo ${file.name} no es una imagen válida y será omitido.`);
        continue;
      }
      try {
        const formDataCloudinary = new FormData();
        formDataCloudinary.append('file', file);
        
        // Intentar upload con el preset principal primero
        let uploadSuccessful = false;
        let result = null;
        const presetsToTry = [signatureData.uploadPreset, ...(signatureData.fallbackPresets || [])];
        
        for (const preset of presetsToTry) {
          try {
            // Limpiar FormData y volver a crear para cada intento
            const formData = new FormData();
            formData.append('file', file);
            if (preset) {
              formData.append('upload_preset', preset);
              console.log(`Subiendo a Cloudinary (unsigned) con preset "${preset}": ${file.name}`);
            } else {
              // Sin preset - upload directo (requiere que la cuenta permita uploads unsigned sin preset)
              console.log(`Subiendo a Cloudinary (unsigned) SIN PRESET: ${file.name}`);
            }
            formData.append('folder', signatureData.folder);
            
            const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;
            const resp = await fetch(uploadUrl, { method: 'POST', body: formData });
            result = await resp.json();
            
            if (resp.ok && !result.error) {
              uploadSuccessful = true;
              console.log(`Upload exitoso ${preset ? `con preset "${preset}"` : 'sin preset'}`);
              break;
            } else {
              console.warn(`${preset ? `Preset "${preset}"` : 'Upload sin preset'} falló:`, result.error?.message || 'Error desconocido');
            }
          } catch (presetError) {
            console.warn(`Error ${preset ? `con preset "${preset}"` : 'sin preset'}:`, presetError.message);
            continue;
          }
        }
        
        if (!uploadSuccessful || !result) {
          console.warn(`⚠️ Todos los presets de Cloudinary fallaron para ${file.name}`);
          
          // Intentar fallback con el backend
          try {
            console.log(`🔄 Intentando fallback del backend para ${file.name}`);
            const { uploadImageFallback } = await import('../services/api');
            const fallbackResult = await uploadImageFallback(file, 'blog');
            
            if (fallbackResult && fallbackResult.src) {
              uploadedUrls.push(fallbackResult);
              toast.success(`${file.name} subido correctamente (usando backend).`);
              continue;
            }
          } catch (fallbackError) {
            console.error(`Error en fallback del backend para ${file.name}:`, fallbackError);
          }
          
          throw new Error(`Error al subir ${file.name} - todos los métodos fallaron`);
        }
        
        uploadedUrls.push({ src: result.secure_url, alt: file.name, publicId: result.public_id });
        toast.success(`${file.name} subido correctamente.`);
      } catch (upErr) {
        console.error(`Error procesando ${file.name}:`, upErr);
        toast.error(`Error al subir ${file.name}: ${upErr.message}`);
        continue;
      }
    }

    // Actualizar estado de forma asíncrona para evitar conflictos con DnD
    if (uploadedUrls.length > 0) {
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...uploadedUrls]
        }));
        setPreviewImages(prev => [...prev, ...uploadedUrls.map(u => u.src)]);
      }, 0);
    }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  // Función auxiliar para asegurar el formato correcto de una imagen
  const formatImageObject = (img, altText = '') => {
      if (typeof img === 'string') {
          return {
              src: img,
              alt: altText || 'Imagen del blog'
          };
      }
      if (typeof img === 'object' && img !== null && typeof img.src === 'string') {
          return {
              src: img.src,
              alt: img.alt || altText || 'Imagen del blog'
          };
      }
      return null;
  };

  // Función para establecer una imagen como principal
  const setAsMainImage = (index) => {
      try {
          setFormData(prevData => {
              const images = Array.isArray(prevData.images) ? prevData.images : [];
              if (!images[index]) {
                  throw new Error('Imagen no encontrada');
              }

              const selectedImage = formatImageObject(images[index], prevData.title);
              if (!selectedImage) {
                  throw new Error('Formato de imagen inválido');
              }

              // Actualizar el estado con el nuevo formato
              return {
                  ...prevData,
                  image: selectedImage,
                  images: images.map(img => formatImageObject(img, prevData.title)).filter(img => img !== null)
              };
          });

          // Actualizar localStorage
          const currentFormData = JSON.parse(localStorage.getItem('blog_formData') || '{}');
          if (currentFormData.images && currentFormData.images[index]) {
              const selectedImage = formatImageObject(currentFormData.images[index], currentFormData.title);
              localStorage.setItem('blog_formData', JSON.stringify({
                  ...currentFormData,
                  image: selectedImage
              }));
          }

          toast.success('Imagen principal actualizada');
      } catch (error) {
          console.error('Error al establecer la imagen principal:', error);
          toast.error('Error al establecer la imagen principal');
      }
  };

  // Función para eliminar una imagen específica
  const removeSpecificImage = (index) => {
      try {
          setFormData(prevData => {
              const images = Array.isArray(prevData.images) ? [...prevData.images] : [];
              
              // No permitir eliminar la última imagen
              if (images.length <= 1) {
                  throw new Error('No se puede eliminar la única imagen disponible');
              }

              // Si la imagen a eliminar es la principal, actualizar la imagen principal
              const isMainImage = prevData.image?.src === images[index]?.src;
              images.splice(index, 1);

              return {
                  ...prevData,
                  images: images.map(img => formatImageObject(img, prevData.title)).filter(img => img !== null),
                  // Si era la imagen principal, usar la primera imagen disponible
                  image: isMainImage ? formatImageObject(images[0], prevData.title) : prevData.image
              };
          });

          // Actualizar localStorage
          const currentFormData = JSON.parse(localStorage.getItem('blog_formData') || '{}');
          if (Array.isArray(currentFormData.images)) {
              const images = [...currentFormData.images];
              const isMainImage = currentFormData.image?.src === images[index]?.src;
              images.splice(index, 1);
              
              localStorage.setItem('blog_formData', JSON.stringify({
                  ...currentFormData,
                  images: images.map(img => formatImageObject(img, currentFormData.title)).filter(img => img !== null),
                  image: isMainImage ? formatImageObject(images[0], currentFormData.title) : currentFormData.image
              }));
          }

          toast.success('Imagen eliminada');
      } catch (error) {
          console.error('Error al eliminar la imagen:', error);
          toast.error(error.message || 'Error al eliminar la imagen');
      }
  };
  
  // Nueva función para manejar el drop en blogs
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadingImage) return; // No hacer nada si ya se está subiendo
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      // Llamar a handleMultipleImageUpload con un objeto evento simulado
      handleMultipleImageUpload({ target: { files: files } });
    }
  };
  
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="bg-indigo-600 text-white py-6 px-6 md:px-12">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Editar Blog' : 'Crear Nuevo Blog'}
          </h1>
          <p className="mt-2 text-indigo-200">
            Comparte información valiosa con tus lectores
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {/* Pasos simples */}
          <div className="mb-8 flex justify-between border-b pb-4">
            <div className="flex space-x-4">
              <span className={currentStep === 1 ? "font-bold text-blue-600" : "text-gray-500"}>1. Información</span>
              <span className={currentStep === 2 ? "font-bold text-blue-600" : "text-gray-500"}>2. Contenido</span>
              <span className={currentStep === 3 ? "font-bold text-blue-600" : "text-gray-500"}>3. Imágenes</span>
              <span className={currentStep === 4 ? "font-bold text-blue-600" : "text-gray-500"}>4. Publicar</span>
            </div>
          </div>
          
          {/* Contenido del paso actual */}
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                <p>{error}</p>
              </div>
            )}
            
            {renderStep()}
          </form>
        </div>
      </div>
    </div>
  );
} 