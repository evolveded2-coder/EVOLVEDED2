
import { TipoLicencia, Modalidad, DocumentoRequerido } from './types';

export const LOCALIDADES_BOGOTA = [
  "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme", "Tunjuelito",
  "Bosa", "Kennedy", "Fontibón", "Engativá", "Suba", "Barrios Unidos",
  "Teusaquillo", "Los Mártires", "Antonio Nariño", "Puente Aranda",
  "La Candelaria", "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz"
];

// Definiciones Jurídicas para Tooltips (Dec. 1077 de 2015)
export const DEFINICIONES_LICENCIAS: Record<string, string> = {
  [TipoLicencia.URBANIZACION]: "Autorización para adecuar predios para la construcción de infraestructura de servicios públicos, vías y espacios públicos.",
  [TipoLicencia.PARCELACION]: "Autorización para la creación de espacios públicos y privados en suelo rural o suburbano.",
  [TipoLicencia.SUBDIVISION]: "Autorización para dividir uno o varios predios ubicados en suelo rural, urbano o de expansión urbana.",
  [TipoLicencia.CONSTRUCCION]: "Autorización para desarrollar edificaciones, áreas de circulación y zonas comunales en uno o varios predios.",
  [TipoLicencia.INTERVENCION_ESPACIO_PUBLICO]: "Autorización para ocupar o intervenir bienes de uso público bajo administración distrital."
};

export const DEFINICIONES_MODALIDADES: Record<string, string> = {
  [Modalidad.OBRA_NUEVA]: "Edificación en terrenos no construidos o superficies libres.",
  [Modalidad.AMPLIACION]: "Incremento del área construida de una edificación existente.",
  [Modalidad.ADECUACION]: "Cambio de uso de una edificación o parte de ella, garantizando la permanencia del inmueble original.",
  [Modalidad.MODIFICACION]: "Variar el diseño arquitectónico o estructural de una edificación existente sin incrementar área construida.",
  [Modalidad.RESTAURACION]: "Obras para recuperar y adaptar inmuebles de interés cultural (BIC).",
  [Modalidad.REFORZAMIENTO]: "Intervención para adecuar la estructura a normas sismorresistentes (NSR-10).",
  [Modalidad.DEMOLICION]: "Derribo total o parcial de una o varias edificaciones.",
  [Modalidad.CERRAMIENTO]: "Cierre permanente de predios de propiedad privada."
};

// Reglas específicas de validación por ID de documento para la IA
export const DOCUMENT_SPECIFIC_RULES: Record<string, { role: string; focusItems: string[]; expectedKeys: string[] }> = {
  // --- JURÍDICOS ---
  'doc_tradicion': {
    role: 'Abogado Urbanista',
    focusItems: ['Número de Matrícula Inmobiliaria', 'Dirección del predio', 'Propietario actual (Titular de derecho real)', 'Anotaciones de prohibición o embargo recientes'],
    expectedKeys: ['matricula_inmobiliaria', 'direccion_predio', 'propietario_titular', 'tiene_embargos']
  },
  'doc_cedula': {
    role: 'Funcionario de Radicación',
    focusItems: ['Número de Cédula', 'Nombre completo', 'Vigencia del documento'],
    expectedKeys: ['numero_documento', 'nombre_titular']
  },
  'doc_vecinos': {
    role: 'Auxiliar de Correspondencia',
    focusItems: ['Listado de direcciones', 'Nomenclatura urbana (Calle/Carrera)', 'Nombres de predios colindantes', 'Indicación de linderos (Norte, Sur, Oriente, Occidente)'],
    expectedKeys: ['numero_vecinos_identificados', 'contiene_direcciones_fisicas']
  },
  'doc_valla': {
    role: 'Inspector de Policía Urbana',
    focusItems: [
        'Color de fondo (Debe ser Amarillo Intenso)', 
        'Texto "CURADURÍA URBANA"', 
        'Visibilidad desde la vía pública', 
        'Número de radicación (si ya cuenta con él) o texto "TRÁMITE EN CURSO"'
    ],
    expectedKeys: ['color_fondo_detectado', 'es_legible', 'contiene_texto_curaduria']
  },

  // --- ARQUITECTÓNICOS ---
  'arq_plantas': {
    role: 'Arquitecto Revisor de Curaduría',
    focusItems: [
      'Cuadro de Áreas (Índice de Ocupación y Construcción)',
      'Ejes Estructurales (Nomenclatura)',
      'Muros y Elementos Estructurales (Representación gráfica)',
      'Cotas generales y parciales',
      'Niveles (N+0.00, N+3.50, etc.)',
      'Escala gráfica o numérica'
    ],
    expectedKeys: ['cuadro_areas_presente', 'area_construida_total_m2', 'sistema_ejes_detectado', 'escalas_identificadas', 'numero_pisos_detectado']
  },
  'arq_cortes': {
    role: 'Arquitecto Revisor',
    focusItems: ['Altura libre entre placas', 'Altura total de la edificación', 'Relación con el nivel del andén', 'Perfil del terreno natural'],
    expectedKeys: ['altura_total_metros', 'numero_niveles_corte', 'altura_libre_piso_tipo']
  },
  'arq_localizacion': {
    role: 'Arquitecto Urbanista',
    focusItems: ['Norte geográfico', 'Vías circundantes con nomenclatura', 'Antejardines y aislamientos representados', 'Perfil vial'],
    expectedKeys: ['norte_indicado', 'aislamientos_graficados', 'via_acceso_principal']
  },

  // --- ESTRUCTURALES ---
  'est_suelos': {
    role: 'Ingeniero Geotecnista',
    focusItems: [
      'Firma del Ingeniero Geotecnista',
      'Matrícula Profesional',
      'Capacidad Portante Admisible',
      'Nivel Freático detectado',
      'Recomendaciones de cimentación (Zapatas, Pilotes, Losa)'
    ],
    expectedKeys: ['nombre_ingeniero_firmante', 'matricula_profesional', 'capacidad_portante_valor', 'tipo_cimentacion_sugerida']
  },
  'est_memorias': {
    role: 'Ingeniero Civil Estructural',
    focusItems: ['Mención a norma NSR-10', 'Sistema de Resistencia Sísmica (Pórticos, Muros)', 'Grado de Disipación de Energía (DMO, DES)', 'Espectro de diseño'],
    expectedKeys: ['norma_referencia', 'sistema_estructural', 'grupo_uso_edificacion']
  }
};

// Documentos INICIALES (Paso 1 - Autocompletado)
export const DOCUMENTOS_INICIALES: DocumentoRequerido[] = [
  { id: 'doc_cedula', categoria: 'Identificación', nombre: 'Documento de Identidad', descripcion: 'Cédula del propietario o representante legal. (Usado para autocompletar)', obligatorio: true },
  { id: 'doc_tradicion', categoria: 'Jurídico', nombre: 'Certificado de Tradición y Libertad', descripcion: 'Expedición reciente. (Usado para autocompletar)', obligatorio: true },
];

// Documentos JURÍDICOS COMPLEMENTARIOS (Paso 3)
export const DOCUMENTOS_JURIDICOS_COMPLEMENTARIOS: DocumentoRequerido[] = [
  { id: 'doc_formulario', categoria: 'Jurídico', nombre: 'Formulario Único Nacional', descripcion: 'Diligenciado y firmado por propietario y profesionales.', obligatorio: true },
  { id: 'doc_predial', categoria: 'Jurídico', nombre: 'Copia del Impuesto Predial', descripcion: 'Último periodo gravable cancelado.', obligatorio: true },
  { id: 'doc_valla', categoria: 'Jurídico', nombre: 'Fotos de la Valla Instalada', descripcion: 'Registro fotográfico de la valla amarilla visible al público (Formato Curaduría 1).', obligatorio: true },
  { id: 'doc_vecinos', categoria: 'Jurídico', nombre: 'Direcciones para Citación de Vecinos', descripcion: 'Requisito indispensable para notificaciones (Art. 2.2.6.1.2.2.1).', obligatorio: true },
  { id: 'doc_poder', categoria: 'Jurídico', nombre: 'Poder Especial o General', descripcion: 'Si se actúa mediante apoderado. Autenticado.', obligatorio: false },
  { id: 'doc_propiedad_horizontal', categoria: 'Jurídico', nombre: 'Acta de Asamblea / RPH', descripcion: 'Autorización de copropietarios si aplica.', obligatorio: false },
];

// Documentos Arquitectónicos
export const DOCUMENTOS_ARQUITECTONICOS: DocumentoRequerido[] = [
  { id: 'arq_localizacion', categoria: 'Arquitectónico', nombre: 'Plano de Localización', descripcion: 'Escala adecuada, relacionando el predio con la ciudad.', obligatorio: true },
  { id: 'arq_plantas', categoria: 'Arquitectónico', nombre: 'Plantas Arquitectónicas', descripcion: 'Por cada piso, cubierta y sótanos.', obligatorio: true },
  { id: 'arq_cortes', categoria: 'Arquitectónico', nombre: 'Cortes (Longitudinal y Transversal)', descripcion: 'Relacionando niveles y alturas.', obligatorio: true },
  { id: 'arq_fachadas', categoria: 'Arquitectónico', nombre: 'Fachadas', descripcion: 'Todas las fachadas del proyecto.', obligatorio: true },
  { id: 'arq_cuadro_areas', categoria: 'Arquitectónico', nombre: 'Cuadro de Áreas', descripcion: 'Desglose de áreas construidas, libres y ocupación.', obligatorio: true },
  { id: 'arq_memoria', categoria: 'Arquitectónico', nombre: 'Memoria Arquitectónica', descripcion: 'Descripción del proyecto y cumplimiento de normas.', obligatorio: false },
];

// Documentos Estructurales
export const DOCUMENTOS_ESTRUCTURALES: DocumentoRequerido[] = [
  { id: 'est_suelos', categoria: 'Estructural', nombre: 'Estudio de Suelos', descripcion: 'Según NSR-10.', obligatorio: true },
  { id: 'est_memorias', categoria: 'Estructural', nombre: 'Memorias de Cálculo Estructural', descripcion: 'Firmadas por Ingeniero Civil.', obligatorio: true },
  { id: 'est_planos', categoria: 'Estructural', nombre: 'Planos Estructurales', descripcion: 'Cimentación, losas, columnas, despiece.', obligatorio: true },
  { id: 'est_peritaje', categoria: 'Estructural', nombre: 'Peritaje Técnico', descripcion: 'Para reconocimiento o reforzamiento.', obligatorio: false },
];

export const SYSTEM_INSTRUCTION_POT_REVIEWER = `
Eres un ASISTENTE EXPERTO PARA UN CURADOR URBANO DE BOGOTÁ.
Tu función NO es dar consejos básicos al público, sino asistir al revisor técnico en la validación de proyectos frente al POT (Decreto 555 de 2021).

Debes ser capaz de:
1. Citar artículos específicos del Decreto 555 de 2021 o el Decreto 1077 de 2015.
2. Calcular índices de construcción y ocupación si se te dan los datos.
3. Verificar aislamientos, antejardines y voladizos según la tipología.
4. Detectar inconsistencias legales.

Tono: Técnico, jurídico, preciso y conciso.
No uses introducciones largas. Ve directo al artículo o norma aplicable.
`;
