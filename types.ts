
export enum TipoLicencia {
  URBANIZACION = 'Urbanización',
  PARCELACION = 'Parcelación',
  SUBDIVISION = 'Subdivisión',
  CONSTRUCCION = 'Construcción',
  INTERVENCION_ESPACIO_PUBLICO = 'Intervención y Ocupación de Espacio Público'
}

export enum Modalidad {
  OBRA_NUEVA = 'Obra Nueva',
  AMPLIACION = 'Ampliación',
  ADECUACION = 'Adecuación',
  MODIFICACION = 'Modificación',
  RESTAURACION = 'Restauración',
  REFORZAMIENTO = 'Reforzamiento Estructural',
  DEMOLICION = 'Demolición',
  CERRAMIENTO = 'Cerramiento'
}

export enum EstadoProyecto {
  RADICADO = 'Radicado',
  REVISION_JURIDICA = 'Revisión Jurídica',
  REVISION_ARQUITECTONICA = 'Revisión Arquitectónica',
  REVISION_ESTRUCTURAL = 'Revisión Estructural',
  ACTA_OBSERVACIONES = 'Acta de Observaciones',
  VIABILIDAD = 'Viabilidad',
  EXPEDICION = 'Expedición'
}

export interface DocumentoRequerido {
  id: string;
  categoria: 'Identificación' | 'Jurídico' | 'Arquitectónico' | 'Estructural' | 'Otros';
  nombre: string;
  descripcion: string;
  obligatorio: boolean;
  estadoValidacion?: 'Pendiente' | 'Validado' | 'Rechazado';
  datosExtraidos?: Record<string, string>;
}

export interface ResultadoValidacionTecnica {
  aprobado: boolean;
  puntajeCumplimiento: number;
  detalles: {
    norma: string;
    valorProyecto: string;
    valorNorma: string;
    cumple: boolean;
    observacion: string;
  }[];
  fechaValidacion: string;
}

export interface Proyecto {
  id: string;
  radicado: string;
  nombre: string;
  direccion: string;
  propietario: string;
  tipoLicencia: TipoLicencia;
  modalidad?: Modalidad;
  estado: EstadoProyecto;
  fechaRadicacion: string;
  alertaNormativa?: boolean;
  reporteTecnico?: ResultadoValidacionTecnica;
  descripcion: string;
  documentos?: DocumentoRequerido[]; // Nuevo campo para persistir estado de docs
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}