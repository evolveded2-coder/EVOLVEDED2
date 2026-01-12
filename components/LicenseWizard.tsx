
import React, { useState, useEffect } from 'react';
import { TipoLicencia, Modalidad, DocumentoRequerido, Proyecto, EstadoProyecto, ResultadoValidacionTecnica } from '../types';
import { DOCUMENTOS_INICIALES, DOCUMENTOS_JURIDICOS_COMPLEMENTARIOS, DOCUMENTOS_ARQUITECTONICOS, DOCUMENTOS_ESTRUCTURALES } from '../constants';
import { saveProject } from '../services/storageService';
import { validarProyectoContraPOT } from '../services/potBackendService';
import DocumentUploadSection from './DocumentUploadSection';
import { CheckCircle, AlertTriangle, FileText, ChevronRight, ChevronLeft, Loader2, ShieldCheck, Download, Wand2, ClipboardList, Info, FileSearch } from 'lucide-react';
import { jsPDF } from "jspdf";

const DRAFT_KEY = 'CURADURIA_BOGOTA_DRAFT';

const LicenseWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nombreProyecto: '',
    propietario: '',
    cedula: '',
    direccion: '',
    matricula: '',
    localidad: '',
    tipoLicencia: '' as TipoLicencia | '',
    modalidad: '' as Modalidad | '',
    descripcion: ''
  });

  const [docsIniciales, setDocsIniciales] = useState<DocumentoRequerido[]>(DOCUMENTOS_INICIALES);
  const [docsJuridicosRestantes, setDocsJuridicosRestantes] = useState<DocumentoRequerido[]>(DOCUMENTOS_JURIDICOS_COMPLEMENTARIOS);
  const [docsArquitectonicos, setDocsArquitectonicos] = useState<DocumentoRequerido[]>(DOCUMENTOS_ARQUITECTONICOS);
  const [docsEstructurales, setDocsEstructurales] = useState<DocumentoRequerido[]>(DOCUMENTOS_ESTRUCTURALES);
  
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());
  const [autofillMessage, setAutofillMessage] = useState<string | null>(null);
  const [isValidatingBackend, setIsValidatingBackend] = useState(false);
  const [backendReport, setBackendReport] = useState<ResultadoValidacionTecnica | null>(null);
  const [radicadoId, setRadicadoId] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData || formData);
        if (parsed.step) setStep(parsed.step);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, step }));
  }, [formData, step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDataExtraction = (docId: string, data: any) => {
    let updated = false;
    const newFormData = { ...formData };
    if (docId === 'doc_cedula') {
      if (data.nombre_titular) { newFormData.propietario = data.nombre_titular; updated = true; }
      if (data.numero_documento) { newFormData.cedula = data.numero_documento; updated = true; }
    }
    if (docId === 'doc_tradicion') {
      if (data.direccion_predio) { newFormData.direccion = data.direccion_predio; updated = true; }
      if (data.matricula_inmobiliaria) { newFormData.matricula = data.matricula_inmobiliaria; updated = true; }
    }
    if (updated) {
      setFormData(newFormData);
      setAutofillMessage("Datos extraídos correctamente ✨");
      setTimeout(() => setAutofillMessage(null), 3000);
    }
  };

  const handleRadication = async () => {
    setIsValidatingBackend(true);
    const newId = `CUR1-BOG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setRadicadoId(newId);

    const allDocs = [...docsIniciales, ...docsJuridicosRestantes, ...docsArquitectonicos, ...docsEstructurales];
    
    try {
      const report = await validarProyectoContraPOT({ 
          id: newId, radicado: newId, nombre: formData.nombreProyecto, direccion: formData.direccion, 
          propietario: formData.propietario, tipoLicencia: formData.tipoLicencia as TipoLicencia, 
          modalidad: formData.modalidad as Modalidad,
          estado: EstadoProyecto.RADICADO, fechaRadicacion: new Date().toISOString(), descripcion: formData.descripcion 
      } as Proyecto, allDocs);
      
      setBackendReport(report);
      setStep(4);
    } catch (e) {
      alert("Error en el servidor de validación.");
    } finally {
      setIsValidatingBackend(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Constancia de Radicación - Curaduría Digital", 10, 20);
    doc.setFontSize(12);
    doc.text(`Radicado: ${radicadoId}`, 10, 30);
    doc.text(`Proyecto: ${formData.nombreProyecto}`, 10, 40);
    doc.text(`Propietario: ${formData.propietario}`, 10, 50);
    doc.text(`Dirección: ${formData.direccion}`, 10, 60);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 10, 70);
    doc.save(`Radicado_${radicadoId}.pdf`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[750px]">
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white">
            <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gov-blue rounded-xl flex items-center justify-center font-bold text-lg">{step}</div>
                <div>
                    <h2 className="font-extrabold text-xl tracking-tight">Curaduría Digital Bogotá</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Trámite de Licencia Urbana</p>
                </div>
            </div>
        </div>

        {autofillMessage && (
            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 bg-gov-blue text-white px-6 py-2 rounded-full shadow-2xl text-xs font-bold flex items-center">
                <Wand2 className="h-4 w-4 mr-2" /> {autofillMessage}
            </div>
        )}

        <div className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar">
            {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <DocumentUploadSection 
                        title="1. Identificación y Predio" 
                        documents={docsIniciales} 
                        onDocumentsUpdate={setDocsIniciales}
                        onDataExtracted={handleDataExtraction}
                        onFileSelect={(id, file) => setFileMap(prev => new Map(prev).set(id, file))}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nombre del Proyecto</label>
                            <input name="nombreProyecto" value={formData.nombreProyecto} onChange={handleInputChange} className="w-full bg-white border-slate-200 rounded-lg p-2.5 text-sm" />
                        </div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Propietario</label><input name="propietario" value={formData.propietario} onChange={handleInputChange} className="w-full bg-white border-slate-200 rounded-lg p-2.5 text-sm" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Cédula</label><input name="cedula" value={formData.cedula} onChange={handleInputChange} className="w-full bg-white border-slate-200 rounded-lg p-2.5 text-sm" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Dirección</label><input name="direccion" value={formData.direccion} onChange={handleInputChange} className="w-full bg-white border-slate-200 rounded-lg p-2.5 text-sm" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Matrícula</label><input name="matricula" value={formData.matricula} onChange={handleInputChange} className="w-full bg-white border-slate-200 rounded-lg p-2.5 text-sm" /></div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-xl font-bold text-slate-800 border-b pb-4">Actuación Urbanística</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-bold text-slate-700">Licencia</label>
                            <select name="tipoLicencia" value={formData.tipoLicencia} onChange={handleInputChange} className="w-full border-slate-200 rounded-lg p-3 text-sm">
                                <option value="">Seleccione...</option>
                                {['Construcción', 'Urbanización', 'Parcelación', 'Subdivisión'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700">Modalidad</label>
                            <select name="modalidad" value={formData.modalidad} onChange={handleInputChange} className="w-full border-slate-200 rounded-lg p-3 text-sm">
                                <option value="">Seleccione...</option>
                                {['Obra Nueva', 'Ampliación', 'Adecuación', 'Modificación'].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-bold text-slate-700">Descripción</label>
                            <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={4} className="w-full border-slate-200 rounded-lg p-3 text-sm" />
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <DocumentUploadSection title="Documentación Técnica" documents={[...docsJuridicosRestantes, ...docsArquitectonicos, ...docsEstructurales]} onFileSelect={(id, file) => setFileMap(prev => new Map(prev).set(id, file))} />
                </div>
            )}

            {step === 4 && (
                <div className="animate-in zoom-in py-6">
                    <div className="flex items-center space-x-6 mb-10">
                        <div className={`h-20 w-20 flex items-center justify-center rounded-3xl shadow-lg ${backendReport?.aprobado ? 'bg-emerald-500 text-white' : 'bg-gov-red text-white'}`}>
                            {backendReport?.aprobado ? <ShieldCheck className="h-10 w-10" /> : <AlertTriangle className="h-10 w-10" />}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                {backendReport?.aprobado ? 'Proyecto Viable para Radicación' : 'Requiere Subsanación'}
                            </h2>
                            <p className="text-slate-500 font-mono text-sm uppercase">Número de Seguimiento: <span className="font-bold text-gov-blue">{radicadoId}</span></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 px-8 py-4 border-b flex items-center">
                                    <ClipboardList className="h-4 w-4 mr-2 text-slate-400" />
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Dictamen Técnico de IA</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {backendReport?.detalles.map((d, i) => (
                                        <div key={i} className="p-6 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-bold text-slate-800 text-sm">{d.norma}</h4>
                                                <span className={`text-[10px] px-2 py-1 rounded-md font-black uppercase ${d.cumple ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {d.cumple ? 'Cumple' : 'Alerta'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-[11px] mb-3">
                                                <div className="text-slate-500">Valor Detectado: <span className="text-slate-900 font-bold">{d.valorProyecto}</span></div>
                                                <div className="text-slate-500">Referencia POT: <span className="text-slate-900 font-bold">{d.valorNorma}</span></div>
                                            </div>
                                            <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100 italic">
                                                "{d.observacion}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl">
                                <div className="h-12 w-12 bg-gov-blue rounded-2xl flex items-center justify-center mb-6">
                                    <FileSearch className="h-6 w-6" />
                                </div>
                                <h4 className="text-lg font-bold mb-4">Descargar Constancia</h4>
                                <p className="text-xs text-slate-400 mb-8 leading-relaxed">
                                    Su radicación ha sido procesada por nuestro motor de IA. Descargue el reporte para su archivo personal o para subsanar observaciones.
                                </p>
                                <button 
                                    onClick={generatePDF}
                                    className="w-full bg-gov-blue text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 flex items-center justify-center transition-all"
                                >
                                    <Download className="h-5 w-5 mr-3" /> Descargar Acta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {step < 4 && (
            <div className="bg-slate-50 border-t p-6 flex justify-between items-center">
                <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="flex items-center text-slate-500 font-bold disabled:opacity-30">
                    <ChevronLeft className="h-5 w-5 mr-1" /> Atrás
                </button>
                <button 
                    onClick={step === 3 ? handleRadication : () => setStep(s => s + 1)}
                    disabled={isValidatingBackend}
                    className="bg-gov-blue text-white px-10 py-3 rounded-xl font-extrabold shadow-xl hover:bg-blue-700 transition-all flex items-center"
                >
                    {isValidatingBackend && <Loader2 className="animate-spin h-5 w-5 mr-3" />}
                    {step === 3 ? 'Validar y Radicar' : 'Siguiente'} 
                    {step !== 3 && <ChevronRight className="h-5 w-5 ml-1" />}
                </button>
            </div>
        )}
    </div>
  );
};

export default LicenseWizard;
