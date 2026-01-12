
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_POT_REVIEWER, DOCUMENT_SPECIFIC_RULES } from '../constants.ts';

export const consultRegulatoryChat = async (message: string, history: string[] = []): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    if (error instanceof Error && error.message.includes("key")) {
        return "⚠️ **Error de Configuración**: La llave de IA (API_KEY) no ha sido detectada por el navegador. \n\n**Acciones requeridas:**\n1. Verifique que la variable `API_KEY` esté en los ajustes de Vercel.\n2. **IMPORTANTE**: Realice un 'Redeploy' desde el panel de Vercel para aplicar los cambios.";
    }
    return "Fallo en la conexión con el motor de IA.";
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Error en análisis.";
  } catch (error) {
    console.error("Error en análisis de viabilidad:", error);
    return "Error en el análisis de viabilidad técnica.";
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
          ? "ERROR CRÍTICO: Llave de API no detectada en el entorno de ejecución."
          : "No se pudo procesar el documento. Intente de nuevo o verifique el formato."
      } 
    };
  }
};
