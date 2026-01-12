
import { Proyecto, DocumentoRequerido, ResultadoValidacionTecnica } from '../types';
import { crossValidateProject } from './geminiService.ts';

/**
 * MOTOR DE VALIDACIÓN INTEGRAL - POT BOGOTÁ
 */
export const validarProyectoContraPOT = async (
  proyecto: Proyecto, 
  documentos: DocumentoRequerido[]
): Promise<ResultadoValidacionTecnica> => {
  
  // Realizar validación AI cruzada de todos los documentos cargados
  const aiReport = await crossValidateProject(proyecto, documentos);

  if (aiReport) {
    return {
      aprobado: aiReport.aprobado,
      puntajeCumplimiento: aiReport.puntajeCumplimiento || (aiReport.aprobado ? 100 : 50),
      detalles: aiReport.detalles,
      fechaValidacion: new Date().toISOString()
    };
  }

  // Fallback a lógica simulada si la AI falla o no hay API Key
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    aprobado: false,
    puntajeCumplimiento: 0,
    detalles: [{
      norma: 'Error de Validación',
      valorProyecto: 'N/A',
      valorNorma: 'N/A',
      cumple: false,
      observacion: 'No se pudo contactar con el motor de validación IA. Verifique su API Key.'
    }],
    fechaValidacion: new Date().toISOString()
  };
};
