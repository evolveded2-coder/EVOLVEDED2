
import React, { useState, useEffect } from 'react';
import { TipoLicencia, Modalidad, DocumentoRequerido, Proyecto, EstadoProyecto, ResultadoValidacionTecnica } from '../types';
import { LOCALIDADES_BOGOTA, DOCUMENTOS_INICIALES, DOCUMENTOS_JURIDICOS_COMPLEMENTARIOS, DOCUMENTOS_ARQUITECTONICOS, DOCUMENTOS_ESTRUCTURALES, DEFINICIONES_LICENCIAS, DEFINICIONES_MODALIDADES } from '../constants';
import { analyzeProjectFeasibility } from '../services/geminiService';
import { saveProject } from '../services/storageService';
import { validarProyectoContraPOT } from '../services/potBackendService';
import DocumentUploadSection from './DocumentUploadSection';
import { CheckCircle, AlertTriangle, FileText, ChevronRight, ChevronLeft, Loader2, Bot, Building, User, Download, Save, Server, ShieldCheck, XCircle, Wand2, Info, Sparkles, Trash2, ClipboardList } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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
  const [fieldsAutofilled, setFieldsAutofilled] = useState<Record<string, boolean>>({});
  const [isValidatingBackend, setIsValidatingBackend] = useState(false);
  const [backendReport, setBackendReport] = useState<ResultadoValidacionTecnica | null>(null);
  const [radicadoId, setRadicadoId] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData || formData);
        setFieldsAutofilled(parsed.fieldsAutofilled || {});
        if (parsed.step) setStep(parsed.step);
      } catch (e) { console.error("Error al cargar borrador", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, fieldsAutofilled, step }));
  }, [formData, fieldsAutofilled, step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDataExtraction = (docId: string, data: any) => {
      let updated = false;
      const newFormData = { ...formData };
      const newAutofilled = { ...fieldsAutofilled };

      if (docId === 'doc_cedula') {
          if (data.nombre_titular) { newFormData.propietario = data.nombre_titular; newAutofilled['propietario'] = true; updated = true; }
          if (data.numero_documento) { newFormData.cedula = data.numero_documento; newAutofilled['cedula'] = true; updated = true; }
      }
      if (docId === 'doc_tradicion') {
          if (data.direccion_predio) { newFormData.direccion = data.direccion_predio; newAutofilled['direccion'] = true; updated = true; }
          if (data.matricula_inmobiliaria) { newFormData.matricula = data.matricula_inmobiliaria; newAutofilled['matricula'] = true; updated = true; }
      }
      
      if (updated) {
          setFormData(newFormData);
          setFieldsAutofilled(newAutofilled);
          setAutofillMessage("Datos extraídos correctamente ✨");
          setTimeout(() => setAutofillMessage(null), 3500);
      }
  };

  const generateTechnicalPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // --- PÁGINA 1: CONSTANCIA OFICIAL ---
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CURADURÍA URBANA No. 1 - BOGOTÁ", margin, 20);
    doc.setFontSize(10);
    doc.text(`RADICADO: ${radicadoId}`, margin, 28);
    doc.text(`FECHA: ${new Date().toLocaleString()}`, pageWidth - margin, 28, { align: "right" });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text("CONSTANCIA TÉCNICA DE RADICACIÓN NORMAS POT", margin, 55);
    doc.setLineWidth(0.5);
    doc.line(margin, 58, pageWidth - margin, 58);

    doc.setFontSize(10);
    doc.text("I. DATOS DEL PROYECTO", margin, 70);
    let y = 80;
    const items = [
        ["Nombre:", formData.nombreProyecto || "N/A"],
        ["Propietario:", formData.propietario],
        ["Dirección:", formData.direccion],
        ["Licencia:", formData.tipoLicencia],
        ["Modalidad:", formData.modalidad]
    ];
    items.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin + 5, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), margin + 45, y);
        y += 7;
    });

    doc.setFont("helvetica", "bold");
    doc.text("II. RESUMEN DE DICTAMEN", margin, y + 10);
    y += 20;

    backendReport?.detalles.forEach((det) => {
        if (y > pageHeight - 20) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(det.norma, margin + 5, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(det.cumple ? 0 : 200, det.cumple ? 120 : 0, 0);
        doc.text(det.cumple ? "CUMPLE" : "REVISAR", pageWidth - margin - 5, y, { align: "right" });
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        const splitObs = doc.splitTextToSize(det.observacion, pageWidth - 60);
        doc.text(splitObs, margin + 5, y + 5);
        y += (splitObs.length * 4) + 8;
        doc.setTextColor(0, 0, 0);
    });

    // --- PÁGINA 2+: ANEXO TÉCNICO DETALLADO ---
    doc.addPage();
    y = 25;
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("ANEXO TÉCNICO: DESGLOSE DE HALLAZGOS IA (TRAZABILIDAD)", margin, 10);

    const allDocs = [...docsIniciales, ...docsJuridicosRestantes, ...docsArquitectonicos, ...docsEstructurales];

    allDocs.forEach((d) => {
        if (!d.datosExtraidos || Object.keys(d.datosExtraidos).length === 0) return;
        if (y > pageHeight - 40) { doc.addPage(); y = 20; }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(51, 102, 204);
        doc.text(`DOCUMENTO: ${d.nombre.toUpperCase()}`, margin, y);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 10;

        Object.entries(d.datosExtraidos).forEach(([key, value]) => {
            if (key === 'observacion' || !value) return;
            doc.setFontSize(8);
            if (key === 'observacion_tecnica') {
                doc.setFont("helvetica", "bold");
                doc.setTextColor(218, 41, 28);
                doc.text("DICTAMEN DETALLADO IA:", margin + 5, y);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(60, 60, 60);
                const splitHallazgo = doc.splitTextToSize(String(value), pageWidth - 50);
                doc.text(splitHallazgo, margin + 5, y + 4);
                y += (splitHallazgo.length * 4) + 6;
            } else {
                doc.setFont("helvetica", "bold");
                doc.setTextColor(100, 100, 100);
                const cleanKey = key.replace(/_/g, ' ').toUpperCase();
                doc.text(`${cleanKey}:`, margin + 5, y);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0, 0, 0);
                doc.text(String(value), margin + 65, y);
                y += 5;
            }
            if (y > pageHeight - 20) { doc.addPage(); y = 20; }
        });
        y += 10;
    });

    doc.save(`Reporte_Exhaustivo_IA_${radicadoId}.pdf`);
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

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[750px]">
        {/* Header con indicadores de progreso */}
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white relative">
            <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gov-blue rounded-xl flex items-center justify-center font-bold text-lg rotate-3">{step}</div>
                <div>
                    <h2 className="font-extrabold text-xl tracking-tight">Curaduría Digital Bogotá</h2>
                    <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Trámite de Licencia Urbana</p>
                </div>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
                {[1, 2, 3].map(s => (
                    <div key={s} className="flex items-center">
                        <div className={`h-2 w-12 rounded-full transition-all duration-500 ${step >= s ? 'bg-gov-blue' : 'bg-slate-700'}`} />
                        {s < 3 && <div className="mx-1 text-slate-600">/</div>}
                    </div>
                ))}
            </div>
        </div>

        {autofillMessage && (
            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-2 rounded-full shadow-2xl text-xs font-bold flex items-center animate-bounce">
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
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Propietario</label>
                            <input name="propietario" value={formData.propietario} onChange={handleInputChange} className="w-full bg-white border-slate-200 rounded-lg p-2.5 text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Cédula</label>
                            <input name="cedula" value={formData.cedula} onChange={handleInputChange} className="w-full bg-white border-slate-200 rounded-lg p-2.5 text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Dirección</label>
                            <input name="direccion" value={formData.direccion} onChange={handleInputChange} className="w-full bg-white border-slate-200 rounded-lg p-2.5 text-sm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Matrícula</label>
                            <input name="matricula" value={formData.matricula} onChange={handleInputChange} className="w-full bg-white border-slate-200 rounded-lg p-2.5 text-sm" />
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-xl font-bold text-slate-800 border-b pb-4">Actuación Urbanística</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-bold text-slate-700">Licencia</label>
                            <select name="tipoLicencia" value={formData.tipoLicencia} onChange={handleInputChange} className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gov-blue outline-none transition-all">
                                <option value="">Seleccione...</option>
                                {Object.values(TipoLicencia).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700">Modalidad</label>
                            <select name="modalidad" value={formData.modalidad} onChange={handleInputChange} className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gov-blue outline-none transition-all">
                                <option value="">Seleccione modalidad...</option>
                                {Object.values(Modalidad).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-bold text-slate-700">Descripción del Proyecto</label>
                            <textarea 
                                name="descripcion" 
                                value={formData.descripcion} 
                                onChange={handleInputChange} 
                                rows={5} 
                                placeholder="Describa brevemente las obras a realizar..."
                                className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gov-blue outline-none transition-all" 
                            />
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-12">
                    <DocumentUploadSection title="Jurídico" documents={docsJuridicosRestantes} onDocumentsUpdate={setDocsJuridicosRestantes} onFileSelect={(id, file) => setFileMap(prev => new Map(prev).set(id, file))} />
                    <DocumentUploadSection title="Arquitectónico" documents={docsArquitectonicos} onDocumentsUpdate={setDocsArquitectonicos} onFileSelect={(id, file) => setFileMap(prev => new Map(prev).set(id, file))} />
                    <DocumentUploadSection title="Estructural" documents={docsEstructurales} onDocumentsUpdate={setDocsEstructurales} onFileSelect={(id, file) => setFileMap(prev => new Map(prev).set(id, file))} />
                </div>
            )}

            {step === 4 && (
                <div className="animate-in zoom-in max-w-5xl mx-auto py-6">
                    <div className="flex items-center space-x-6 mb-10">
                        <div className={`h-20 w-20 flex items-center justify-center rounded-3xl shadow-lg ${backendReport?.aprobado ? 'bg-emerald-500 text-white' : 'bg-gov-red text-white'}`}>
                            {backendReport?.aprobado ? <ShieldCheck className="h-10 w-10" /> : <AlertTriangle className="h-10 w-10" />}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                {backendReport?.aprobado ? 'Proyecto Viable para Radicación' : 'Se requiere Subsanación Técnica'}
                            </h2>
                            <p className="text-slate-500 font-mono text-sm">ID TRÁMITE: <span className="font-bold text-gov-blue">{radicadoId}</span></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 px-8 py-4 border-b flex items-center justify-between">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                                        <ClipboardList className="h-4 w-4 mr-2" /> Log Técnico de Validación Automatizada
                                    </h3>
                                </div>
                                <div className="p-0 divide-y divide-slate-100">
                                    {backendReport?.detalles.map((d, i) => (
                                        <div key={i} className="p-8 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="font-bold text-slate-800 text-sm">{d.norma}</h4>
                                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase ${d.cumple ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {d.cumple ? 'Cumple' : 'Observación'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                    <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-tighter">Valor Detectado</p>
                                                    <p className="text-xs font-bold text-slate-700">{d.valorProyecto}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                    <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-tighter">Requisito Norma</p>
                                                    <p className="text-xs font-bold text-slate-700">{d.valorNorma}</p>
                                                </div>
                                            </div>
                                            <div className={`p-4 rounded-xl text-xs leading-relaxed font-medium ${d.cumple ? 'bg-blue-50/30 text-slate-600' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                                {d.observacion}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl">
                                <h4 className="text-lg font-bold mb-4">Expediente de Radicación</h4>
                                <p className="text-xs text-slate-400 mb-8 leading-relaxed">
                                    Este reporte contiene el desglose técnico de cada folio procesado por el motor de IA. Incluye trazabilidad de parámetros NSR-10 y POT 555.
                                </p>
                                <button 
                                    onClick={generateTechnicalPDF}
                                    className="w-full bg-gov-blue text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 flex items-center justify-center transition-all transform active:scale-95"
                                >
                                    <Download className="h-5 w-5 mr-3" /> 
                                    Descargar Reporte Exhaustivo
                                </button>
                                <button 
                                    onClick={() => setStep(1)} 
                                    className="w-full mt-4 py-3 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                                >
                                    Volver a Corregir Documentación
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
                    {isValidatingBackend ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : null}
                    {step === 3 ? 'Validar y Radicar' : 'Siguiente'} 
                    {step !== 3 && <ChevronRight className="h-5 w-5 ml-1" />}
                </button>
            </div>
        )}
    </div>
  );
};

export default LicenseWizard;
