
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_POT_REVIEWER, DOCUMENT_SPECIFIC_RULES } from '../constants.ts';

/**
 * Obtiene la instancia de la IA verificando la presencia de la clave de API.
 */
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  
  // Verificación exhaustiva de la variable de entorno
  if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey === "null") {
    console.error("❌ ERROR DE CONFIGURACIÓN: La variable de entorno 'API_KEY' no está definida.");
    console.info("💡 SOLUCIÓN: Debes configurar la variable API_KEY en tu panel de control de Vercel o en tu archivo .env");
    throw new Error("API_KEY_NOT_FOUND");
  }
  
  return new GoogleGenAI({ apiKey });
};

export interface ChatResponse {
  text: string;
  sources?: { title: string; uri: string }[];
}

export const consultRegulatoryChat = async (message: string): Promise<ChatResponse> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_POT_REVIEWER + "\n\nIMPORTANTE: Si mencionas normas recientes de Bogotá, usa Google Search para verificar si hay decretos modificatorios posteriores al 555 de 2021.",
        temperature: 0.2,
        tools: [{ googleSearch: {} }]
      }
    });
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || "Fuente externa",
        uri: chunk.web?.uri || ""
      })) || [];

    return {
      text: response.text || "No se pudo generar una respuesta.",
      sources: sources.length > 0 ? sources : undefined
    };
  } catch (error: any) {
    console.error("Error en consultRegulatoryChat:", error);
    if (error.message === "API_KEY_NOT_FOUND") {
      return { text: "⚠️ **CONFIGURACIÓN REQUERIDA**: No se detectó la clave de API (API_KEY). Por favor, asegúrate de haberla configurado en las variables de entorno de tu proyecto y realiza un redeploy." };
    }
    return { text: "El motor de IA está ocupado o la clave es inválida. Intente de nuevo." };
  }
};

export const crossValidateProject = async (projectData: any, extractedDocs: any[]): Promise<any> => {
  try {
    const ai = getAIInstance();
    const prompt = `
      ACTÚA COMO CURADOR URBANO DE BOGOTÁ. 
      Realiza un cruce técnico exhaustivo de la siguiente información:
      
      DATOS DEL PROYECTO:
      - Nombre: ${projectData.nombre}
      - Dirección: ${projectData.direccion}
      - Tipo: ${projectData.tipoLicencia}
      - Modalidad: ${projectData.modalidad}
      
      HALLAZGOS DE DOCUMENTOS:
      ${extractedDocs.map(d => `[${d.nombre}]: ${JSON.stringify(d.datosExtraidos)}`).join('\n')}
      
      TAREA:
      1. Verifica consistencia de nombres entre Cédula, Tradición y Formulario.
      2. Verifica si el tipo de licencia es coherente con los documentos (ej. si es Construcción, debe haber planos).
      3. Identifica riesgos normativos inmediatos bajo el POT 555 de 2021 (Bogotá).
      4. Genera un dictamen de viabilidad técnica.
      
      RESPONDE ÚNICAMENTE EN JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aprobado: { type: Type.BOOLEAN },
            puntajeCumplimiento: { type: Type.NUMBER },
            analisisHolistico: { type: Type.STRING },
            detalles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  norma: { type: Type.STRING },
                  valorProyecto: { type: Type.STRING },
                  valorNorma: { type: Type.STRING },
                  cumple: { type: Type.BOOLEAN },
                  observacion: { type: Type.STRING }
                }
              }
            }
          },
          required: ["aprobado", "detalles", "analisisHolistico"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error en crossValidateProject:", error);
    return null;
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
};

export const validateDocumentContent = async (file: File, docId: string): Promise<any> => {
  try {
    const ai = getAIInstance();
    const base64Data = await fileToBase64(file);
    const rules = DOCUMENT_SPECIFIC_RULES[docId];
    
    let properties: any = {
      observacion_tecnica: { type: Type.STRING, description: "Dictamen técnico breve sobre el documento" }
    };

    if (rules) {
      rules.expectedKeys.forEach(key => { properties[key] = { type: Type.STRING }; });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type.includes('pdf') ? 'application/pdf' : file.type, data: base64Data } },
          { text: `Analiza este documento para una Curaduría en Bogotá. Reglas: ${rules?.focusItems.join(', ') || 'General'}. Responde en JSON.` }
        ]
      },
      config: {
        systemInstruction: rules?.role || "Revisor de Curaduría",
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
    console.error("CRITICAL: validateDocumentContent failed", error);
    const isApiKeyError = error.message === "API_KEY_NOT_FOUND" || error.status === 403 || error.status === 401;
    
    return { 
      isConsistent: false, 
      extractedData: { 
        observacion_tecnica: isApiKeyError 
          ? "⚠️ ERROR DE CONFIGURACIÓN: No se encuentra la 'API_KEY' en el servidor. El administrador debe configurarla para habilitar la IA." 
          : `Error en el servicio de IA: ${error.message || "Fallo de conexión"}` 
      } 
    };
  }
};
