
import React, { useEffect, useState } from 'react';
import { Proyecto, EstadoProyecto, TipoLicencia, Modalidad } from '../types';
import { getAllProjects, saveProject } from '../services/storageService';
import { 
  AlertCircle, CheckCircle, Clock, Search, MoreVertical, FileText, 
  Database, X, ShieldCheck, AlertTriangle, Zap, Filter, LayoutGrid, Loader2,
  Map as MapIcon, Construction, Home, Landmark
} from 'lucide-react';

const ReviewerDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
        const data = await getAllProjects();
        setProjects(data || []);
    } catch (e) {
        console.error("Failed to load projects", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const simulateData = async () => {
    setSimulating(true);
    
    const mockNames = [
        "Torres de Suba II", "Remodelación Local Chapinero", "Edificio Multifamiliar Usaquén", 
        "Bodega Industrial Fontibón", "Casa Patrimonial Teusaquillo", "Centro Médico Kennedy",
        "Colegio El Recreo Bosa", "Ampliación Unicentro", "Oficinas Calle 100", "Vivienda VIS Usme",
        "Restaurante Parque 93", "Sede Bancaria Centro", "Apartamentos Cedritos", "Hotel Boutique Quinta Camacho",
        "Reforzamiento Colegio San José", "Demolición Lote Engativá", "Urbanización Los Lagos", 
        "Consultorios Médicos Suba", "Gimnasio Barrios Unidos", "Panadería Gran Combo Puente Aranda"
    ];

    const alertTypes = [
        { 
            titulo: "Alerta de Altura (POT 555)", 
            msg: "Exceso de altura: 8 pisos proyectados en zona de consolidación nivel 2 (Máximo permitido: 6 pisos).",
            norma: "Art. 345 - Edificabilidad"
        },
        { 
            titulo: "Inconsistencia de Uso", 
            msg: "Uso prohibido: Se detecta actividad comercial de alto impacto en zona residencial neta.",
            norma: "Cuadro de Usos UPL"
        },
        { 
            titulo: "Afectación Patrimonio (BIC)", 
            msg: "El predio colinda con un Bien de Interés Cultural y no presenta concepto previo del IDPC.",
            norma: "Decreto 555 - Patrimonio"
        },
        { 
            titulo: "Incumplimiento Aislamientos", 
            msg: "El aislamiento posterior detectado es de 2.1m, inferior a los 3.0m exigidos por norma.",
            norma: "Art. 342 - Aislamientos"
        },
        { 
            titulo: "Falla Estructural NSR-10", 
            msg: "Falta firma digital verificable del Ingeniero Geotecnista en el estudio de suelos.",
            norma: "Ley 400 - Seguridad Sísmica"
        },
        { 
            titulo: "Ocupación Espacio Público", 
            msg: "El voladizo proyectado sobre el antejardín excede los 1.50m permitidos en este perfil vial.",
            norma: "Cartilla Andenes Bogotá"
        }
    ];
    
    const owners = ["Inversiones Bogotá SAS", "María Paula Rodríguez", "Constructora Bolívar", "Luis Alberto Gómez", "Fundación Patrimonio Histórico", "EPS Sanitas", "Distrito Capital", "Cencosud Colombia"];
    const states = Object.values(EstadoProyecto);
    const types = Object.values(TipoLicencia);

    const generated: Proyecto[] = Array.from({ length: 20 }).map((_, i) => {
        const estadoIndex = i % states.length;
        const hasAlert = i % 3 === 0; // Aproximadamente 33% con alertas
        const alertInfo = hasAlert ? alertTypes[i % alertTypes.length] : null;

        return {
            id: `PROY-2024-${1000 + i}`,
            radicado: `2024-1-${100 + i}`,
            nombre: mockNames[i % mockNames.length],
            propietario: owners[i % owners.length],
            direccion: `Calle ${10 + i} # ${20 + i} - ${i % 2 === 0 ? 'Norte' : 'Sur'}`,
            tipoLicencia: types[i % types.length] as TipoLicencia,
            modalidad: Modalidad.OBRA_NUEVA,
            estado: states[estadoIndex] as EstadoProyecto,
            fechaRadicacion: new Date(Date.now() - (i * 86400000)).toISOString(),
            descripcion: alertInfo ? alertInfo.msg : `Proyecto ${mockNames[i % mockNames.length]} bajo normativa POT 555.`,
            alertaNormativa: hasAlert,
            reporteTecnico: {
                aprobado: !hasAlert,
                puntajeCumplimiento: hasAlert ? 65 : 100,
                fechaValidacion: new Date().toISOString(),
                detalles: [
                    { 
                        norma: alertInfo ? alertInfo.norma : 'Altura Máxima', 
                        valorProyecto: alertInfo ? 'Revisar Folio' : 'Cumple', 
                        valorNorma: 'Según POT', 
                        cumple: !hasAlert, 
                        observacion: alertInfo ? alertInfo.titulo : 'Cumple satisfactoriamente' 
                    },
                    { norma: 'Aislamiento', valorProyecto: '3.0m', valorNorma: '3.0m', cumple: true, observacion: 'Cumple' }
                ]
            },
            documentos: []
        };
    });

    try {
      for (const p of generated) {
          await saveProject(p, [], new Map());
      }
      await fetchProjects();
    } catch (e) {
      console.error("Error al simular:", e);
    } finally {
      setSimulating(false);
    }
  };

  const getStatusColor = (estado: EstadoProyecto) => {
    switch (estado) {
      case EstadoProyecto.RADICADO: return 'bg-slate-100 text-slate-700 border-slate-200';
      case EstadoProyecto.REVISION_JURIDICA: return 'bg-blue-50 text-blue-700 border-blue-200';
      case EstadoProyecto.REVISION_ARQUITECTONICA: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case EstadoProyecto.REVISION_ESTRUCTURAL: return 'bg-purple-50 text-purple-700 border-purple-200';
      case EstadoProyecto.ACTA_OBSERVACIONES: return 'bg-amber-50 text-amber-700 border-amber-200';
      case EstadoProyecto.VIABILIDAD: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case EstadoProyecto.EXPEDICION: return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100';
    }
  };

  const KanbanColumn: React.FC<{ title: string; count: number; projects: Proyecto[]; colorClass: string }> = ({ title, count, projects, colorClass }) => (
    <div className="flex-1 min-w-[320px] bg-slate-50 rounded-2xl p-4 flex flex-col h-full border border-slate-200 shadow-inner">
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center space-x-2">
            <div className={`h-2.5 w-2.5 rounded-full ${colorClass}`}></div>
            <h3 className="font-black text-slate-600 text-[11px] uppercase tracking-widest">{title}</h3>
        </div>
        <span className="bg-white text-slate-500 px-3 py-1 rounded-full text-[10px] font-black border border-slate-200 shadow-sm">{count}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar pb-10">
        {projects.length === 0 && !loading && (
            <div className="text-center py-20 text-slate-400 text-xs italic opacity-60">
                <LayoutGrid className="h-10 w-10 mx-auto mb-3 opacity-20" />
                No hay proyectos en esta etapa
            </div>
        )}
        {projects.map(p => (
          <div 
            key={p.id} 
            onClick={() => setSelectedProject(p)}
            className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-gov-blue transition-all cursor-pointer group relative overflow-hidden animate-in fade-in zoom-in-95 duration-300"
          >
            {p.alertaNormativa && (
                <div className="absolute top-0 right-0 h-16 w-16">
                    <div className="absolute top-0 right-0 bg-gov-red text-white text-[8px] font-bold px-8 py-1 rotate-45 translate-x-4 translate-y-2 shadow-sm">ALERTA IA</div>
                </div>
            )}

            <div className="flex justify-between items-start mb-3">
              <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">#{p.radicado}</span>
              <button className="text-slate-300 group-hover:text-gov-blue transition-colors"><MoreVertical className="h-4 w-4" /></button>
            </div>
            
            <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight group-hover:text-gov-blue transition-colors">{p.nombre}</h4>
            <p className="text-[10px] text-slate-400 mb-4 font-medium uppercase tracking-tight">{p.propietario}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
               <span className="text-[9px] px-2 py-1 bg-blue-50/50 border border-blue-100 rounded-md text-gov-blue font-bold">
                 {p.tipoLicencia}
               </span>
               {p.alertaNormativa && (
                   <span className="text-[9px] px-2 py-1 bg-red-50 border border-red-100 rounded-md text-gov-red font-bold flex items-center">
                       <AlertCircle className="h-3 w-3 mr-1" /> Riesgo
                   </span>
               )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
               <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-tighter ${getStatusColor(p.estado)}`}>
                 {p.estado}
               </span>
               <div className="flex -space-x-2">
                   {[1,2].map(i => (
                       <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                           <img src={`https://i.pravatar.cc/100?img=${(p.id.length + i) % 70}`} alt="avatar" />
                       </div>
                   ))}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-100 relative">
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-sm z-10">
        <div>
           <div className="flex items-center space-x-3">
               <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Proyectos</h1>
               <div className="flex items-center bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    <div className="h-2 w-2 bg-gov-blue rounded-full animate-pulse mr-2"></div>
                    <span className="text-[10px] font-black text-gov-blue uppercase tracking-widest">En Línea</span>
               </div>
           </div>
           <p className="text-xs text-slate-400 font-medium mt-1">Ventanilla Única Digital - Bogotá D.C.</p>
        </div>
        
        <div className="flex items-center space-x-4">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-gov-blue transition-colors" />
                <input 
                    type="text" 
                    placeholder="Buscar por radicado o dirección..." 
                    className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-gov-blue/10 focus:border-gov-blue w-72 transition-all outline-none"
                />
            </div>
            
            <button 
                onClick={simulateData}
                disabled={simulating}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center shadow-lg shadow-slate-200 disabled:opacity-50"
            >
                {simulating ? (
                    <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Poblando...
                    </>
                ) : (
                    <>
                        <Zap className="h-4 w-4 mr-2 text-yellow-400" />
                        Simular 20 Proyectos
                    </>
                )}
            </button>

            <button className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:text-gov-blue hover:border-gov-blue transition-all">
                <Filter className="h-5 w-5" />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-8 bg-slate-100">
        {loading && projects.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4 opacity-40">
                <Loader2 className="animate-spin h-12 w-12 text-gov-blue" />
                <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Cargando base de datos...</p>
            </div>
        ) : (
            <div className="flex space-x-8 h-full min-w-max">
                <KanbanColumn 
                    title="Radicados (Entrada)" 
                    colorClass="bg-slate-400"
                    count={projects.filter(p => p.estado === EstadoProyecto.RADICADO || p.estado === EstadoProyecto.REVISION_JURIDICA).length} 
                    projects={projects.filter(p => p.estado === EstadoProyecto.RADICADO || p.estado === EstadoProyecto.REVISION_JURIDICA)} 
                />
                <KanbanColumn 
                    title="Revisión Técnica" 
                    colorClass="bg-gov-blue"
                    count={projects.filter(p => p.estado === EstadoProyecto.REVISION_ARQUITECTONICA || p.estado === EstadoProyecto.REVISION_ESTRUCTURAL).length} 
                    projects={projects.filter(p => p.estado === EstadoProyecto.REVISION_ARQUITECTONICA || p.estado === EstadoProyecto.REVISION_ESTRUCTURAL)} 
                />
                <KanbanColumn 
                    title="Acta de Observaciones" 
                    colorClass="bg-amber-400"
                    count={projects.filter(p => p.estado === EstadoProyecto.ACTA_OBSERVACIONES).length} 
                    projects={projects.filter(p => p.estado === EstadoProyecto.ACTA_OBSERVACIONES)} 
                />
                <KanbanColumn 
                    title="Viabilidad y Expedición" 
                    colorClass="bg-emerald-500"
                    count={projects.filter(p => p.estado === EstadoProyecto.VIABILIDAD || p.estado === EstadoProyecto.EXPEDICION).length} 
                    projects={projects.filter(p => p.estado === EstadoProyecto.VIABILIDAD || p.estado === EstadoProyecto.EXPEDICION)} 
                />
            </div>
        )}
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                {/* Header Modal */}
                <div className="bg-slate-900 px-10 py-8 text-white relative">
                    <button 
                        onClick={() => setSelectedProject(null)}
                        className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    
                    <div className="flex items-start justify-between pr-12">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black tracking-tight">{selectedProject.nombre}</h2>
                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-white/20 bg-opacity-20 backdrop-blur-sm`}>
                                    {selectedProject.estado}
                                </span>
                            </div>
                            <div className="flex items-center space-x-4 text-slate-400 font-mono text-xs">
                                <span>RAD: {selectedProject.radicado}</span>
                                <span>•</span>
                                <span>INGRESADO: {new Date(selectedProject.fechaRadicacion).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className="text-gov-blue font-bold">{selectedProject.tipoLicencia}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Titular</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedProject.propietario}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                                    <p className="text-sm font-bold text-slate-800 truncate">{selectedProject.direccion}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expensas</p>
                                    <p className="text-sm font-bold text-emerald-600 flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-1.5" /> Pagado
                                    </p>
                                </div>
                            </div>

                            {selectedProject.alertaNormativa && (
                                <div className="bg-gov-red/5 border-l-8 border-gov-red p-6 rounded-2xl flex items-start animate-in slide-in-from-left-4 duration-500">
                                    <AlertTriangle className="h-6 w-6 text-gov-red mr-4 shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-black text-gov-red text-sm uppercase tracking-wider mb-1">
                                            {selectedProject.reporteTecnico?.detalles[0].observacion || "Alerta Normativa Crítica"} (POT 555)
                                        </h4>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                            {selectedProject.descripcion}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center">
                                        <ShieldCheck className="h-4 w-4 mr-2 text-gov-blue" />
                                        Dictamen de Relevancia Técnica
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <th className="px-4 py-3 text-left">Componente</th>
                                                <th className="px-4 py-3 text-left">Valor Proyecto</th>
                                                <th className="px-4 py-3 text-left">Norma</th>
                                                <th className="px-4 py-3 text-right">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {selectedProject.reporteTecnico?.detalles.map((d, idx) => (
                                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-4 text-xs font-bold text-slate-700">
                                                        {d.norma}
                                                        <p className="text-[10px] font-normal text-slate-400 mt-0.5">{d.observacion}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-xs font-mono text-slate-500">{d.valorProyecto}</td>
                                                    <td className="px-4 py-4 text-xs font-bold text-slate-400">{d.valorNorma}</td>
                                                    <td className="px-4 py-4 text-right">
                                                        {d.cumple ? 
                                                            <div className="h-6 w-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center ml-auto"><CheckCircle className="h-4 w-4" /></div> : 
                                                            <div className="h-6 w-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center ml-auto"><AlertTriangle className="h-4 w-4" /></div>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                             <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Expediente (Blobs)
                                </h3>
                                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center">
                                        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm"><FileText className="h-5 w-5 text-gov-blue" /></div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-slate-800 truncate">PLANO_ARQUITECTONICO.dwg</p>
                                            <p className="text-[9px] text-slate-400 uppercase font-black">Validado por IA</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center">
                                        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm"><FileText className="h-5 w-5 text-gov-blue" /></div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-slate-800 truncate">CERTIFICADO_LIBERTAD.pdf</p>
                                            <p className="text-[9px] text-slate-400 uppercase font-black">Validado por IA</p>
                                        </div>
                                    </div>
                                </div>
                                <button className="mt-8 w-full bg-slate-900 text-white py-4 rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                                    Ver Todo el Expediente
                                </button>
                             </div>

                             <div className="bg-indigo-900 text-white p-6 rounded-[2rem] shadow-xl">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-4">Herramientas de Revisor</h4>
                                <div className="space-y-2">
                                    <button className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-xs font-bold flex items-center">
                                        <MapIcon className="h-4 w-4 mr-2" /> Cruzar con GIS Bogotá
                                    </button>
                                    <button className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-xs font-bold flex items-center">
                                        <Construction className="h-4 w-4 mr-2" /> Validar NSR-10
                                    </button>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white px-10 py-6 border-t border-slate-100 flex justify-end gap-4">
                    <button onClick={() => setSelectedProject(null)} className="px-6 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all">
                        Cerrar Vista
                    </button>
                    <button className="px-8 py-3 bg-gov-red text-white rounded-2xl text-xs font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Emitir Acta
                    </button>
                    <button className="px-8 py-3 bg-gov-blue text-white rounded-2xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprobar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ReviewerDashboard;
