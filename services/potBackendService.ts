
import { Proyecto, DocumentoRequerido, ResultadoValidacionTecnica, TipoLicencia } from '../types';

/**
 * MOTOR DE REGLAS DE NEGOCIO - DECRETO 555 DE 2021 (EXTENDIDO)
 * Consolida la información técnica detallada extraída por la IA.
 */
export const validarProyectoContraPOT = async (
  proyecto: Proyecto, 
  documentos: DocumentoRequerido[]
): Promise<ResultadoValidacionTecnica> => {
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  const detalles = [];
  let cumpleTodo = true;

  // 1. SIMULACIÓN DE DATA GIS (Contexto Normativo del Predio)
  const normaPredio = {
    tratamiento: 'Consolidación',
    alturaMaxPisos: 6,
    usoPermitido: 'Residencial/Comercial de cobertura local',
    zonaSismica: 'Intermedia (Bogotá - Lacustre 200)'
  };

  // --- COMPONENTE 1: VALIDACIÓN JURÍDICA Y TITULARIDAD ---
  const docTradicion = documentos.find(d => d.id === 'doc_tradicion');
  const findJuridico = docTradicion?.datosExtraidos;
  const obsJuridica = findJuridico?.['observacion_tecnica'] || 'No se detectó observación técnica detallada.';
  
  const coincidenciaJuridica = findJuridico?.['propietario_titular'] 
    ? proyecto.propietario.toLowerCase().includes(String(findJuridico['propietario_titular']).toLowerCase().split(' ')[0]) 
    : true;

  detalles.push({
    norma: 'Jurídico: Titularidad del Predio',
    valorProyecto: String(findJuridico?.['propietario_titular'] || proyecto.propietario),
    valorNorma: 'Coincidencia con Folio de Matrícula',
    cumple: coincidenciaJuridica,
    observacion: `ANÁLISIS JURÍDICO IA: ${obsJuridica}`
  });
  if (!coincidenciaJuridica) cumpleTodo = false;

  // --- COMPONENTE 2: ARQUITECTÓNICO (ALTURAS Y ÁREAS) ---
  const docPlantas = documentos.find(d => d.id === 'arq_plantas');
  const findArq = docPlantas?.datosExtraidos;
  const obsArq = findArq?.['observacion_tecnica'] || 'Validación de niveles y áreas estándar.';
  
  let pisosDetectados = 5;
  if (findArq?.['numero_pisos_detectado']) {
      pisosDetectados = parseInt(String(findArq['numero_pisos_detectado']));
  }

  const cumpleAltura = pisosDetectados <= normaPredio.alturaMaxPisos;
  detalles.push({
    norma: `POT Art. 345 - Altura Máxima`,
    valorProyecto: `${pisosDetectados} Niveles`,
    valorNorma: `Máx. ${normaPredio.alturaMaxPisos} Niveles`,
    cumple: cumpleAltura,
    observacion: `ANÁLISIS ARQUITECTÓNICO IA: ${obsArq}`
  });
  if (!cumpleAltura) cumpleTodo = false;

  // --- COMPONENTE 3: ESTRUCTURAL (EL PUNTO CRÍTICO DEL USUARIO) ---
  const docMemorias = documentos.find(d => d.id === 'est_memorias');
  const docSuelos = documentos.find(d => d.id === 'est_suelos');
  
  const findMem = docMemorias?.datosExtraidos;
  const findSuelos = docSuelos?.datosExtraidos;
  
  // Aquí es donde capturamos TODA la información detallada que la IA extrajo
  const obsEstructural = findMem?.['observacion_tecnica'] || findSuelos?.['observacion_tecnica'] || 'Revisión técnica de memorias y suelos.';
  
  // Verificamos inconsistencias críticas (ej: Comercio vs Vivienda)
  const tieneInconsistenciaUso = obsEstructural.toLowerCase().includes('inconsistencia') || 
                                 (findMem?.['grupo_uso_edificacion'] === 'Comercio' && findSuelos?.['observacion_tecnica']?.toLowerCase().includes('vivienda'));

  const cumpleEstructural = !tieneInconsistenciaUso && !!findMem?.['norma_referencia'];

  detalles.push({
    norma: 'NSR-10: Memorias de Cálculo y Geotecnia',
    valorProyecto: `Uso: ${findMem?.['grupo_uso_edificacion'] || 'No definido'}`,
    valorNorma: 'Consistencia entre Folios Técnicos',
    cumple: cumpleEstructural,
    observacion: `ANÁLISIS ESTRUCTURAL IA (EXHAUSTIVO): ${obsEstructural}`
  });
  if (!cumpleEstructural) cumpleTodo = false;

  // --- COMPONENTE 4: PUBLICIDAD EXTERIOR ---
  const docValla = documentos.find(d => d.id === 'doc_valla');
  const findValla = docValla?.datosExtraidos;
  const vallaOk = docValla?.estadoValidacion === 'Validado';

  detalles.push({
      norma: 'Decreto 1077/2015 - Valla',
      valorProyecto: vallaOk ? 'Instalada' : 'No detectada',
      valorNorma: 'Valla Amarilla Reglamentaria',
      cumple: vallaOk,
      observacion: `ANÁLISIS PUBLICIDAD IA: ${findValla?.['observacion_tecnica'] || 'Pendiente de carga o validación visual.'}`
  });

  return {
    aprobado: cumpleTodo,
    puntajeCumplimiento: cumpleTodo ? 100 : 45,
    detalles: detalles,
    fechaValidacion: new Date().toISOString()
  };
};
