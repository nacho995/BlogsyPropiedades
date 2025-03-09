import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBlogPost, uploadImageBlog } from '../services/api';
import { useUser } from '../context/UserContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FiUpload, FiEdit, FiType, FiFileText, FiUser, FiTag, FiList, FiX, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

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
  const { user } = useUser();
  const fileInputRef = useRef(null);
  
  // Cargar estado desde localStorage o usar valores por defecto
  const [currentStep, setCurrentStep] = useState(() => 
    getFromLocalStorage('blog_currentStep', 1)
  );
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'Inmobiliaria',
    tags: [],
    url: '',
    image: {
      src: '',
      alt: ''
    },
    images: [], // Asegurarnos de que images siempre sea un array
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
    console.log('Iniciando envío del formulario:', formData);
    
    try {
        setLoading(true);
        setError(null);

        // Validar campos requeridos
        if (!formData.title?.trim()) {
            throw new Error('El título es obligatorio');
        }
        if (!formData.description?.trim()) {
            throw new Error('La descripción es obligatoria');
        }
        if (!formData.content?.trim()) {
            throw new Error('El contenido es obligatorio');
        }

        // Validar que haya al menos una imagen
        if (!formData.images || formData.images.length === 0) {
            throw new Error('Debes subir al menos una imagen');
        }

        // Asegurarse de que hay una imagen principal
        if (!formData.image || !formData.image.src) {
            // Si no hay imagen principal, usar la primera imagen
            formData.image = formData.images[0];
        }

        // Preparar los datos para enviar
        const blogData = {
            ...formData,
            // Asegurarse de que la imagen principal esté definida
            image: formData.image,
            // Asegurarse de que las imágenes estén en el formato correcto
            images: formData.images.map(img => ({
                src: img.src,
                alt: img.alt || formData.title
            }))
        };

        console.log('Enviando datos del blog:', blogData);
        const result = await createBlogPost(blogData);
        console.log('Blog creado exitosamente:', result);
        
        toast.success('¡Blog publicado exitosamente!');
        // Limpiar el formulario y localStorage
        resetForm();
        // Redirigir a la página de blogs
        navigate('/blogs');
    } catch (error) {
        console.error('Error al crear el blog:', error);
        setError(error.message || 'Error al crear el blog');
        toast.error(error.message || 'Error al crear el blog');
    } finally {
        setLoading(false);
    }
};
  
  // Movemos el ref al nivel superior del componente
  const quillRef = useRef(null);
  
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
                    
                    {/* Editor mejorado con referencia moderna */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-2">
                            Contenido
                        </label>
                        <div className="border border-gray-300 rounded-lg overflow-hidden quill-container">
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
                            
                            {/* Botones para insertar elementos */}
                            <div className="mt-4">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <h3 className="w-full text-sm text-gray-600 font-medium mb-1">Añadir títulos:</h3>
                                    <button
                                        type="button"
                                        onClick={() => insertSpecialBlock('title-main')}
                                        className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded hover:bg-indigo-200 flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Título Principal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertSpecialBlock('title-section')}
                                        className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded hover:bg-indigo-200 flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Título de Sección
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertSpecialBlock('title-subsection')}
                                        className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded hover:bg-indigo-200 flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Subtítulo
                                    </button>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <h3 className="w-full text-sm text-gray-600 font-medium mb-1">Añadir bloques especiales:</h3>
                                    <button
                                        type="button"
                                        onClick={() => insertSpecialBlock('formula')}
                                        className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.649 3.084A1 1 0 015.163 4.4 13.95 13.95 0 004 10c0 1.993.416 3.886 1.164 5.6a1 1 0 01-1.832.8A15.95 15.95 0 012 10c0-2.274.475-4.44 1.332-6.4a1 1 0 011.317-.516zM12.96 7a3 3 0 00-2.342 1.126l-.328.41-.111-.279A2 2 0 008.323 7H8a1 1 0 000 2h.323l.532 1.33-1.035 1.295a1 1 0 01-.781.375H7a1 1 0 100 2h.039a3 3 0 002.342-1.126l.328-.41.111.279A2 2 0 0011.677 14H12a1 1 0 100-2h-.323l-.532-1.33 1.035-1.295A1 1 0 0112.961 9H13a1 1 0 100-2h-.039z" clipRule="evenodd" />
                                        </svg>
                                        Bloque de cálculo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertSpecialBlock('highlight')}
                                        className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Bloque destacado
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertSpecialBlock('note')}
                                        className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded hover:bg-green-200 flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Bloque de nota
                                    </button>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                    <h3 className="w-full text-sm text-gray-600 font-medium mb-1">Elementos adicionales:</h3>
                                    <button
                                        type="button"
                                        onClick={() => insertSpecialBlock('quote')}
                                        className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded hover:bg-purple-200 flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6zM9 8H4v2h5V8z" clipRule="evenodd" />
                                        </svg>
                                        Cita o testimonio
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertSpecialBlock('pro-table')}
                                        className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200 flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2z" clipRule="evenodd" />
                                        </svg>
                                        Tabla
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertSpecialBlock('first-paragraph')}
                                        className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded hover:bg-orange-200 flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                        </svg>
                                        Párrafo inicial
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertSpecialBlock('emphasis-paragraph')}
                                        className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded hover:bg-orange-200 flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h7a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Párrafo enfatizado
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertSpecialBlock('separator')}
                                        className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded hover:bg-orange-200 flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Separador decorativo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between mt-8">
                        <button
                            type="button"
                            onClick={prevStep}
                            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium shadow-sm hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            Anterior
                        </button>
                        <button
                            type="button"
                            onClick={nextStep}
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                        
                        {/* Input para subir imágenes */}
                        <div className="mb-6">
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
                                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 hover:text-blue-500 transition-colors"
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
        blockHtml = '<hr style="border: 0; height: 6px; margin: 4rem auto; width: 50%; background-image: radial-gradient(circle, #f59e0b 0%, transparent 60%), radial-gradient(circle, #f59e0b 0%, transparent 60%); background-size: 15px 15px; background-position: top center; opacity: 0.5;">';
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
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setUploadingImage(true);
    setError(null);
    
    try {
        // Filtrar y validar archivos
        const validFiles = files.filter(file => {
            if (file.size > 10 * 1024 * 1024) {
                toast.warning(`La imagen ${file.name} es demasiado grande (máx. 10MB)`);
                return false;
            }
            if (!file.type.startsWith('image/')) {
                toast.warning(`El archivo ${file.name} no es una imagen válida`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) {
            throw new Error('No hay imágenes válidas para subir');
        }

        // Subir cada imagen individualmente
        const uploadPromises = validFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('title', 'Imagen de blog');
            formData.append('description', 'Imagen subida desde el formulario de blog');
            
            try {
                console.log(`Subiendo archivo: ${file.name}`);
                const result = await uploadImageBlog(formData);
                console.log('Resultado de subida de imagen:', result);
                return result;
            } catch (error) {
                console.error(`Error al subir imagen ${file.name}:`, error);
                toast.error(`Error al subir ${file.name}`);
                throw error;
            }
        });

        const results = await Promise.all(uploadPromises);
        console.log('Resultados de subida de imágenes:', results);
        
        // Filtrar resultados válidos
        const validResults = results.filter(result => result && result.src);
        
        if (validResults.length === 0) {
            throw new Error('No se pudo subir ninguna imagen correctamente');
        }
        
        // Actualizar el estado con las nuevas imágenes
        setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), ...validResults],
            // Si no hay imagen principal, usar la primera imagen subida
            image: prev.image?.src ? prev.image : validResults[0]
        }));

        toast.success(`${validResults.length} ${validResults.length === 1 ? 'imagen subida' : 'imágenes subidas'} correctamente`);
    } catch (error) {
        console.error('Error al subir imágenes:', error);
        setError(`Error al subir las imágenes: ${error.message}`);
        toast.error('Error al subir las imágenes');
    } finally {
        setUploadingImage(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-6 px-8">
          <h1 className="text-3xl font-bold text-white">Crear Nuevo Blog</h1>
          <p className="text-blue-100 mt-2">Comparte tus conocimientos con la comunidad</p>
        </div>
        
        {/* Indicador de progreso */}
        <div className="px-8 pt-6">
          <div className="flex items-center justify-between mb-8 relative">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep === step
                      ? 'bg-blue-600 text-white'
                      : currentStep > step
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step ? '✓' : step}
                </div>
                <span className={`text-sm mt-2 ${currentStep >= step ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  {step === 1 ? 'Información' : step === 2 ? 'Contenido' : 'Medios'}
                </span>
              </div>
            ))}
            
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200 -z-10">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(currentStep - 1) * 50}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Mensajes de error */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-8 mb-4 rounded">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {/* Formulario */}
        <form className="px-8 pb-8" onSubmit={handleSubmit}>
          {renderStep()}
        </form>
      </div>
    </div>
  );
} 