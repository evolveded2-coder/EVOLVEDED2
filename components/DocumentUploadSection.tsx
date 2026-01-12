
import React, { useState, useEffect } from 'react';
import { DocumentoRequerido } from '../types';
import { validateDocumentContent } from '../services/geminiService';
import { Upload, CheckCircle, AlertTriangle, FileText, Loader2, ScanLine, Eye, Wand2, Download } from 'lucide-react';
import { jsPDF } from "jspdf";

interface Props {
  documents: DocumentoRequerido[];
  title: string;
  onDocumentsUpdate?: (updatedDocs: DocumentoRequerido[]) => void;
  onFileSelect?: (docId: string, file: File) => void;
  onDataExtracted?: (docId: string, data: any) => void; // Nuevo prop para devolver datos al padre
}

const DocumentUploadSection: React.FC<Props> = ({ documents, title, onDocumentsUpdate, onFileSelect, onDataExtracted }) => {
  const [docs, setDocs] = useState(documents);
  const [validating, setValidating] = useState<string | null>(null);

  useEffect(() => {
     setDocs(documents);
  }, [documents]);

  const generateVallaTemplate = () => {
    // Generación dinámica del Formato de Valla Curaduría 1
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" }); // A3 Landscape como referencia de tamaño
    
    // Fondo Amarillo (Reglamentario)
    doc.setFillColor(255, 242, 0); // Amarillo Intenso
    doc.rect(0, 0, 420, 297, 'F');
    
    // Marco Negro
    doc.setLineWidth(2);
    doc.rect(10, 10, 400, 277);

    // Texto Curaduría
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(60);
    doc.text("CURADURÍA URBANA No. 1", 210, 40, { align: "center" });
    doc.setFontSize(40);
    doc.text("DE BOGOTÁ D.C.", 210, 55, { align: "center" });

    // Sección de Datos
    doc.setFontSize(30);
    doc.text("SOLICITUD DE LICENCIA URBANÍSTICA", 210, 80, { align: "center" });

    doc.setFontSize(20);
    doc.setFont("helvetica", "normal");
    
    let yPos = 110;
    const items = [
        "RADICACIÓN No: ___________________________ (Espacio para sticker)",
        "FECHA: _________________________________",
        "SOLICITANTE: ___________________________",
        "DIRECCIÓN: _____________________________",
        "TIPO DE LICENCIA: ______________________",
        "MODALIDAD: ____________________________",
        "USO SOLICITADO: ________________________",
        "ALTURA: _____________ PISOS"
    ];

    items.forEach(item => {
        doc.text(item, 30, yPos);
        yPos += 15;
    });

    // Pie de página legal
    doc.setFontSize(14);
    doc.text("El presente aviso se fija en cumplimiento del Art. 2.2.6.1.2.3.6 del Decreto 1077 de 2015.", 210, 260, { align: "center" });
    doc.text("Cualquier interesado podrá hacerse parte del trámite.", 210, 270, { align: "center" });

    doc.save("Formato_Valla_Curaduria_1.pdf");
  };

  const handleFileChange = async (id: string, file: File) => {
    // Basic Client-side validation
    if (file.size > 25 * 1024 * 1024) {
        alert("El archivo excede el tamaño máximo de 25MB.");
        return;
    }
    
    // Notify parent to hold the file for DB storage
    if (onFileSelect) {
        onFileSelect(id, file);
    }
    
    // 1. Mark as uploading/validating
    setValidating(id);
    
    // 2. Perform Real AI Analysis (Sending file content)
    // Pass the specific doc ID to get specific rules
    const result = await validateDocumentContent(file, id);
    
    // 3. Update state with results
    const newDocs = docs.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          estadoValidacion: result.isConsistent ? 'Validado' : 'Rechazado' as any,
          datosExtraidos: result.extractedData
        };
      }
      return doc;
    });

    setDocs(newDocs);
    if (onDocumentsUpdate) {
        onDocumentsUpdate(newDocs);
    }

    // 4. Propagate extracted data to parent form for Autofill
    if (onDataExtracted && result.isConsistent && result.extractedData) {
        onDataExtracted(id, result.extractedData);
    }
    
    setValidating(null);
  };

  const formatKey = (key: string) => {
      return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <h4 className="font-semibold text-slate-800">{title}</h4>
      </div>
      <div className="divide-y divide-slate-100">
        {docs.map((doc) => (
          <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between md:justify-start">
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${doc.obligatorio ? 'text-slate-900' : 'text-slate-600'}`}>
                        {doc.nombre}
                    </span>
                    {doc.obligatorio && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        REQ
                        </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{doc.descripcion}</p>
                
                {/* Botón de descarga de formato para la Valla */}
                {doc.id === 'doc_valla' && (
                    <button 
                        onClick={generateVallaTemplate}
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-yellow-300 shadow-sm text-xs font-medium rounded text-yellow-800 bg-yellow-50 hover:bg-yellow-100 focus:outline-none"
                    >
                        <Download className="h-3 w-3 mr-1.5" />
                        Descargar Formato Curaduría #1
                    </button>
                )}

                {/* AI Validation Results - Enhanced View */}
                {doc.datosExtraidos && (
                  <div className={`mt-3 border rounded-md overflow-hidden animate-in slide-in-from-top-2 ${
                      doc.estadoValidacion === 'Validado' ? 'bg-blue-50/50 border-blue-100' : 'bg-red-50/50 border-red-100'
                  }`}>
                    <div className={`px-3 py-2 text-xs font-bold flex items-center justify-between ${
                         doc.estadoValidacion === 'Validado' ? 'bg-blue-100/50 text-blue-800' : 'bg-red-100/50 text-red-800'
                    }`}>
                        <div className="flex items-center">
                            <ScanLine className="h-3.5 w-3.5 mr-2" />
                            Análisis Técnico Automatizado
                        </div>
                        <span className="opacity-75">{doc.estadoValidacion === 'Validado' ? 'Consistente' : 'Revisar'}</span>
                    </div>
                    
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {/* Render 'observacion_tecnica' full width if exists */}
                        {doc.datosExtraidos['observacion_tecnica'] && (
                            <div className="col-span-1 sm:col-span-2 mb-2 pb-2 border-b border-gray-200/50">
                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Dictamen IA</span>
                                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                    {String(doc.datosExtraidos['observacion_tecnica'])}
                                </p>
                            </div>
                        )}

                        {Object.entries(doc.datosExtraidos).map(([key, value]) => {
                            if (!value || value === 'null' || key === 'observacion' || key === 'observacion_tecnica') return null;
                            return (
                                <div key={key} className="flex flex-col border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">{formatKey(key)}</span>
                                    <span className="text-xs font-semibold text-slate-800 truncate" title={String(value)}>
                                        {String(value)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 self-end md:self-center mt-2 md:mt-0">
                {validating === doc.id ? (
                  <div className="flex items-center text-gov-blue text-sm px-4 py-2 bg-blue-50 rounded-lg">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    <span className="text-xs font-bold">Procesando...</span>
                  </div>
                ) : doc.estadoValidacion === 'Validado' ? (
                   <div className="flex flex-col items-end">
                      <span className="flex items-center text-green-700 text-sm font-bold bg-green-100 px-3 py-1.5 rounded-md border border-green-200 shadow-sm">
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Aprobado
                      </span>
                      {doc.datosExtraidos && (doc.id === 'doc_cedula' || doc.id === 'doc_tradicion') && (
                          <span className="text-[10px] text-gov-blue flex items-center mt-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                             <Wand2 className="h-3 w-3 mr-1" />
                             Autocompletado
                          </span>
                      )}
                      <button 
                         className="text-[10px] text-slate-400 mt-1 hover:text-gov-blue flex items-center underline"
                         onClick={() => document.getElementById(doc.id)?.click()}
                      >
                         Reemplazar
                      </button>
                   </div>
                ) : doc.estadoValidacion === 'Rechazado' ? (
                   <div className="flex flex-col items-end">
                      <span className="flex items-center text-red-700 text-sm font-bold bg-red-100 px-3 py-1.5 rounded-md border border-red-200 shadow-sm">
                        <AlertTriangle className="h-4 w-4 mr-1.5" />
                        Rechazado
                      </span>
                      <button 
                         className="text-[10px] text-slate-400 mt-1 hover:text-gov-blue flex items-center underline"
                         onClick={() => document.getElementById(doc.id)?.click()}
                      >
                         Reintentar
                      </button>
                   </div>
                ) : (
                  <div className="relative group">
                    <input 
                        type="file" 
                        id={doc.id} 
                        accept=".pdf,image/png,image/jpeg"
                        className="hidden" 
                        onChange={(e) => e.target.files?.[0] && handleFileChange(doc.id, e.target.files[0])}
                    />
                    <label 
                        htmlFor={doc.id} 
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-all hover:border-gov-blue hover:text-gov-blue"
                    >
                        <Upload className="h-4 w-4 mr-2 text-slate-400 group-hover:text-gov-blue" />
                        Cargar
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentUploadSection;
