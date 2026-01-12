
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_POT_REVIEWER, DOCUMENT_SPECIFIC_RULES } from '../constants';

// Inicialización estricta según lineamientos de seguridad
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const consultRegulatoryChat = async (message: string, history: string[] = []): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_POT_REVIEWER,
        temperature: 0.1, // Menor temperatura para mayor precisión técnica
      }
    });
    
    return response.text || "No se pudo generar una respuesta.";
  } catch (error) {
    console.error("Error consultando Gemini:", error);
    return "Ocurrió un error al consultar el asistente normativo. Por favor, verifique la configuración de la API.";
  }
};

export const analyzeProjectFeasibility = async (description: string, licenseType: string): Promise<string> => {
  const prompt = `
    Analiza viabilidad preliminar (Bogotá POT 555/2021):
    Licencia: ${licenseType}
    Proyecto: ${description}
    
    Salida Markdown:
    - **Modalidad**: Correcta/Incorrecta
    - **Alertas Normativas**: Altura, Usos, Aislamientos.
    - **Riesgo**: Bajo/Medio/Alto
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Error en análisis.";
  } catch (error) {
    console.error("Error en análisis de viabilidad:", error);
    return "Error en el análisis de viabilidad.";
  }
};

// Helper para convertir archivos a Base64 para el consumo de la API
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * VALIDACIÓN REAL: Lee el contenido del archivo y lo envía a Gemini 3
 * Utiliza reglas técnicas específicas por tipo de documento (Jurídico, Arq, Est).
 */
export const validateDocumentContent = async (file: File, docId: string): Promise<any> => {
  try {
    const base64Data = await fileToBase64(file);
    
    // Buscar reglas específicas para este documento en constants.ts
    const rules = DOCUMENT_SPECIFIC_RULES[docId];
    
    let systemRole = "Revisor Técnico de Curaduría Urbana";
    let specificInstructions = `
      Analiza el documento adjunto. 
      Realiza OCR y extracción de datos clave según la normativa colombiana.
      Verifica consistencia general.
    `;
    let properties: any = {
        observacion_tecnica: { type: Type.STRING, description: "Dictamen técnico breve" }
    };

    if (rules) {
        systemRole = rules.role;
        specificInstructions = `
          ERES UN ${rules.role.toUpperCase()} EVALUANDO UN PROYECTO EN BOGOTÁ.
          Tu objetivo es validar técnicamente el documento adjunto verificando EXPRESAMENTE los siguientes componentes normativos:
          ${rules.focusItems.map(item => `- ${item}`).join('\n')}

          Debes extraer los valores encontrados para estas variables.
        `;
        
        // Construir schema dinámico basado en las llaves esperadas
        rules.expectedKeys.forEach(key => {
            properties[key] = { type: Type.STRING, description: `Valor extraído para ${key}` };
        });
    }

    const prompt = `
      ${specificInstructions}
      Responde EXCLUSIVAMENTE con un objeto JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { 
          inlineData: { 
            mimeType: file.type.includes('pdf') ? 'application/pdf' : file.type, 
            data: base64Data 
          } 
        },
        { text: prompt }
      ],
      config: {
        systemInstruction: systemRole,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                extractedData: {
                    type: Type.OBJECT,
                    properties: properties,
                    description: "Datos técnicos específicos extraídos del documento"
                },
                isConsistent: { type: Type.BOOLEAN, description: "True si el documento cumple requisitos mínimos" },
                confidenceScore: { type: Type.NUMBER }
            },
            required: ["extractedData", "isConsistent"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Respuesta vacía de la IA");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Fallo en validación Real AI:", error);
    return { 
      isConsistent: false, 
      extractedData: { 
        observacion_tecnica: "Error de lectura IA. Verifique que el archivo sea legible y no tenga protección por contraseña." 
      } 
    };
  }
};
