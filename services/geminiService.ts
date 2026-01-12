
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_POT_REVIEWER, DOCUMENT_SPECIFIC_RULES } from '../constants.ts';

/**
 * Función centralizada para obtener la instancia de la IA.
 * Valida la existencia de la llave en cada llamada.
 */
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey === "null") {
    throw new Error("API_KEY_NOT_FOUND");
  }
  
  return new GoogleGenAI({ apiKey });
};

export const consultRegulatoryChat = async (message: string, history: string[] = []): Promise<string> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_POT_REVIEWER,
        temperature: 0.1,
      }
    });
    
    return response.text || "No se pudo generar una respuesta.";
  } catch (error: any) {
    console.error("Error en consultRegulatoryChat:", error);
    
    if (error.message === "API_KEY_NOT_FOUND" || error.message?.includes("API Key")) {
      return "⚠️ **CONFIGURACIÓN PENDIENTE**: Tu configuración en Vercel es correcta, pero el sitio aún no ha sido actualizado.\n\n**PASO FINAL:**\n1. Ve a la pestaña **'Deployments'** en tu panel de Vercel.\n2. En el despliegue más reciente, haz clic en `...` y selecciona **'Redeploy'**.\n\nEsto 'quemará' la llave en el código y activará el sistema.";
    }
    
    return "El motor de IA está ocupado. Por favor, intenta de nuevo en un momento.";
  }
};

export const analyzeProjectFeasibility = async (description: string, licenseType: string): Promise<string> => {
  try {
    const ai = getAIInstance();
    const prompt = `
      Analiza viabilidad preliminar (Bogotá POT 555/2021):
      Licencia: ${licenseType}
      Proyecto: ${description}
      
      Salida Markdown:
      - **Modalidad**: Correcta/Incorrecta
      - **Alertas Normativas**: Altura, Usos, Aislamientos.
      - **Riesgo**: Bajo/Medio/Alto
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Error en análisis.";
  } catch (error) {
    console.error("Error en análisis de viabilidad:", error);
    return "Error técnico en el motor de análisis.";
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
    const ai = getAIInstance();
    const base64Data = await fileToBase64(file);
    const rules = DOCUMENT_SPECIFIC_RULES[docId];
    
    let systemRole = "Revisor Técnico de Curaduría Urbana";
    let specificInstructions = "Analiza el documento adjunto según normativa.";
    let properties: any = {
        observacion_tecnica: { type: Type.STRING, description: "Dictamen técnico breve" }
    };

    if (rules) {
        systemRole = rules.role;
        specificInstructions = `Valida técnicamente: ${rules.focusItems.join(', ')}`;
        rules.expectedKeys.forEach(key => {
            properties[key] = { type: Type.STRING };
        });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type.includes('pdf') ? 'application/pdf' : file.type, data: base64Data } },
          { text: specificInstructions + " Responde en JSON." }
        ]
      },
      config: {
        systemInstruction: systemRole,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                extractedData: { type: Type.OBJECT, properties: properties },
                isConsistent: { type: Type.BOOLEAN }
            },
            required: ["extractedData", "isConsistent"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Error validando documento:", error);
    return { 
      isConsistent: false, 
      extractedData: { 
        observacion_tecnica: "Error de configuración de API. Se requiere Redeploy en Vercel." 
      } 
    };
  }
};
