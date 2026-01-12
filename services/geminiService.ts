
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_INSTRUCTION_POT_REVIEWER, DOCUMENT_SPECIFIC_RULES } from '../constants';

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const consultRegulatoryChat = async (message: string, history: string[] = []): Promise<string> => {
  if (!ai) return "Error: API Key no configurada.";

  try {
    const model = ai.models;
    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_POT_REVIEWER,
        temperature: 0.2, 
      }
    });
    
    return response.text || "No se pudo generar una respuesta.";
  } catch (error) {
    console.error("Error consultando Gemini:", error);
    return "Ocurrió un error al consultar el asistente normativo.";
  }
};

export const analyzeProjectFeasibility = async (description: string, licenseType: string): Promise<string> => {
  if (!ai) return "Error: API Key no configurada.";

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
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Error en análisis.";
  } catch (error) {
    return "Error en el análisis de viabilidad.";
  }
};

// Helper to convert File to Base64 for API consumption
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // remove data:application/pdf;base64, prefix to get raw base64
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
};

// REAL VALIDATION: Reads the actual file content and sends it to Gemini
// Updated to use specific technical rules per document type
export const validateDocumentContent = async (file: File, docId: string): Promise<any> => {
  if (!ai) return { isConsistent: false, extractedData: { observacion: "API Key no configurada" } };

  try {
    const base64Data = await fileToBase64(file);
    
    // Buscar reglas específicas para este documento
    const rules = DOCUMENT_SPECIFIC_RULES[docId];
    
    let systemRole = "Revisor Técnico de Curaduría Urbana";
    let specificInstructions = `
      Analiza el documento adjunto. 
      Realiza OCR y extracción de datos clave.
      Verifica consistencia general.
    `;
    let expectedProperties: Record<string, Schema> = {
        observacion: { type: Type.STRING },
        entidad_emisora: { type: Type.STRING },
        fecha_documento: { type: Type.STRING }
    };

    if (rules) {
        systemRole = rules.role;
        specificInstructions = `
          ERES UN ${rules.role.toUpperCase()} EVALUANDO UN PROYECTO EN BOGOTÁ.
          Tu objetivo es validar técnicamente el documento adjunto verificando EXPRESAMENTE los siguientes componentes normativos:
          ${rules.focusItems.map(item => `- ${item}`).join('\n')}

          Debes extraer los valores encontrados para estas variables. Si un componente técnico vital (ej: Cuadro de Áreas en planos, Firma en memorias) no es legible o no existe, repórtalo como null.
        `;
        
        // Construir schema dinámico basado en las keys esperadas
        expectedProperties = {};
        rules.expectedKeys.forEach(key => {
            expectedProperties[key] = { type: Type.STRING, description: `Valor extraído para ${key}` };
        });
        expectedProperties['observacion_tecnica'] = { type: Type.STRING, description: "Dictamen técnico breve sobre el cumplimiento de los requisitos del documento" };
    }

    const prompt = `
      ${specificInstructions}
      
      Responde EXCLUSIVAMENTE con un objeto JSON que contenga los datos extraídos y una evaluación de consistencia.
      Confidence score de 0.0 a 1.0 basado en la legibilidad y formalidad del documento.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: file.type.includes('pdf') ? 'application/pdf' : file.type, 
              data: base64Data 
            } 
          },
          { text: prompt }
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
                    properties: expectedProperties,
                    // Make sure schema is flexible but structured
                    description: "Datos técnicos específicos extraídos del documento"
                },
                isConsistent: { type: Type.BOOLEAN, description: "True si el documento parece cumplir con los requisitos mínimos de su categoría" },
                confidenceScore: { type: Type.NUMBER }
            }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Real AI Validation failed", error);
    return { 
      isConsistent: false, 
      extractedData: { 
        observacion_tecnica: "Error de lectura IA. Verifique que el archivo no esté corrupto o protegido." 
      } 
    };
  }
};
