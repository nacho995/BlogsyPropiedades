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
    return JSON.parse(stored);
  } catch {
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
  
  const [formData, setFormData] = useState(() => 
    getFromLocalStorage('blog_formData', {
      title: '',
      subtitle: '',
      content: '',
      category: 'Inmobiliaria',
      tags: [],
      image: '',
      author: ''
    })
  );
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(() => 
    getFromLocalStorage('blog_previewImage', '')
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
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  }
  
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
  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Generar preview temporal
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
    
    try {
      setUploadingImage(true);
      setError(null);
      
      // Subir imagen al servidor
      const result = await uploadImageBlog(file, user?.token);
      
      if (result && result.imageUrl) {
        setFormData({
          ...formData,
          image: result.imageUrl
        });
        toast.success('Imagen subida correctamente');
      } else {
        throw new Error('No se pudo obtener la URL de la imagen');
      }
    } catch (err) {
      console.error('Error al subir imagen:', err);
      setError('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  }
  
  function removeImage() {
    setPreviewImage('');
    setFormData({
      ...formData,
      image: ''
    });
  }
  
  // Enviar formulario
  async function handleSubmit(e) {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      // Datos básicos
      const blogData = {
        title: formData.title,
        subtitle: formData.subtitle,
        content: formData.content || `<p>${formData.subtitle}</p>`,
        description: formData.subtitle,
        category: formData.category,
        tags: formData.tags,
        author: formData.author || user?.name || 'Anónimo',
        readTime: Math.max(1, Math.ceil(formData.content.length / 1000)),
        image: {
          src: formData.image || '',
          alt: formData.title || 'Imagen del blog'
        }
      };
      
      const response = await createBlogPost(blogData);
      console.log("Blog creado:", response);
      
      // Limpiar localStorage al finalizar con éxito
      localStorage.removeItem('blog_currentStep');
      localStorage.removeItem('blog_formData');
      localStorage.removeItem('blog_previewImage');
      
      toast.success('Blog creado con éxito');
      navigate('/blogs');
    } catch (err) {
      console.error('Error al crear blog:', err);
      
      // Mensaje más descriptivo basado en el error
      if (err.message.includes('500')) {
        setError('Error en el servidor. Verifica que todos los campos obligatorios estén completos.');
      } else if (err.message.includes('401')) {
        setError('No estás autorizado para crear blogs. Por favor, inicia sesión nuevamente.');
      } else {
        setError(`Error al crear el blog: ${err.message}`);
      }
      
      // Notificación de error
      toast.error('No se pudo crear el blog');
    } finally {
      setLoading(false);
    }
  }
  
  // Movemos el ref al nivel superior del componente
  const quillRef = useRef(null);
  
  // Actualiza la función renderStep para manejar correctamente todos los pasos
  function renderStep() {
    console.log("Renderizando paso:", currentStep);
    
    if (currentStep === 1) {
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
              Subtítulo
            </label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
              placeholder="Ej: Todo lo que necesitas saber antes de solicitar tu préstamo"
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
          
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Autor
            </label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              className="w-full border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
              placeholder="Tu nombre o el nombre del autor"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Etiquetas
            </label>
            <div className="flex">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 border-2 border-blue-200 p-3 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
                placeholder="Añade una etiqueta y presiona Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="ml-2 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <div
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end mt-8">
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
    } else if (currentStep === 2) {
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
                value={formData.content}
                onChange={(content) => setFormData({...formData, content})}
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
    } else if (currentStep === 3) {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-6">Imagen destacada</h2>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Imagen de portada
            </label>
            <div className="mt-2">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col w-full h-64 border-2 border-blue-200 border-dashed hover:border-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer transition-all">
                  <div className="flex flex-col items-center justify-center pt-7">
                    {!previewImage ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-400 group-hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <p className="pt-1 text-sm tracking-wider text-gray-600 group-hover:text-blue-600">
                          Selecciona una imagen
                        </p>
                      </>
                    ) : (
                      <div className="relative w-full h-full">
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="absolute inset-0 w-full h-full object-contain p-4"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    className="opacity-0" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                  />
                </label>
              </div>
              {uploadingImage && <p className="text-blue-500 mt-2">Subiendo imagen...</p>}
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
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium shadow-sm hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50"
            >
              {loading ? 'Publicando...' : 'Publicar blog'}
            </button>
          </div>
        </div>
      );
    } else {
      console.error("Paso no válido:", currentStep);
      // Manejar caso de error - redirigir al paso 1
      setCurrentStep(1);
      return <div>Redirigiendo...</div>;
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
      image: '',
      author: ''
    });
    setPreviewImage('');
    setTagInput('');
    setError(null);
  }
  
  // Puedes llamar a esta función después de una publicación exitosa o cuando un usuario inicie un nuevo blog
  
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
        <form className="px-8 pb-8" onSubmit={(e) => e.preventDefault()}>
          {renderStep()}
        </form>
      </div>
    </div>
  );
} 