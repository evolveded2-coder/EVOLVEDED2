
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_POT_REVIEWER, DOCUMENT_SPECIFIC_RULES } from '../constants.ts';

/**
 * Función para inicializar la IA justo antes de usarla.
 * Esto previene el error "API key is missing" al asegurar que process.env.API_KEY sea leído en tiempo de ejecución.
 */
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const consultRegulatoryChat = async (message: string, history: string[] = []): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_POT_REVIEWER,
        temperature: 0.1,
      }
    });
    
    return response.text || "No se pudo generar una respuesta.";
  } catch (error) {
    console.error("Error consultando Gemini:", error);
    return "Error: " + (error instanceof Error && error.message.includes("key") 
      ? "API_KEY no detectada. Verifique la configuración en Vercel y realice un Redeploy." 
      : "Fallo en la conexión con el motor de IA.");
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
    const ai = getAI();
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

export const validateDocumentContent = async (file: File, docId: string): Promise<any> => {
  try {
    const ai = getAI();
    const base64Data = await fileToBase64(file);
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
        
        rules.expectedKeys.forEach(key => {
            properties[key] = { type: Type.STRING, description: `Valor extraído para ${key}` };
        });
    }

    const promptText = `
      ${specificInstructions}
      Responde EXCLUSIVAMENTE con un objeto JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: file.type.includes('pdf') ? 'application/pdf' : file.type, 
              data: base64Data 
            } 
          },
          { text: promptText }
        ]
      },
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
    console.error("Fallo en validación Real IA:", error);
    return { 
      isConsistent: false, 
      extractedData: { 
        observacion_tecnica: error instanceof Error && error.message.includes("key")
          ? "API_KEY faltante. Redespliegue la aplicación en Vercel tras configurar la variable de entorno."
          : "No se pudo procesar el documento. Verifique legibilidad y formato."
      } 
    };
  }
};
