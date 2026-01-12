
import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, CreditCard, Download, CheckCircle2, Building, Landmark, ShieldCheck, ArrowRight, Loader2, Info } from 'lucide-react';
import { jsPDF } from "jspdf";

const SMDLV_2024 = 43333; // Valor aproximado Salario Mínimo Diario 2024 Colombia

const FeePayment: React.FC = () => {
  const [step, setStep] = useState(1);
  const [area, setArea] = useState<number>(0);
  const [estrato, setEstrato] = useState<number>(4);
  const [uso, setUso] = useState<string>('Residencial');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Formateador de moneda para uso repetitivo
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

  // Cálculo de Expensas - Basado en Decreto 1077 de 2015
  const totals = useMemo(() => {
    // 1. Factor de Estrato (i) - Varía según el impacto social
    let factorI = 1.0;
    if (estrato === 1) factorI = 0.1;
    else if (estrato === 2) factorI = 0.2;
    else if (estrato === 3) factorI = 0.5;
    else if (estrato === 4) factorI = 1.0;
    else if (estrato === 5) factorI = 1.25;
    else if (estrato === 6) factorI = 1.5;

    // 2. Factor de Área (j) - A mayor área, el factor por m2 disminuye pero el total sube
    let factorJ = 0.45;
    if (area > 100 && area <= 500) factorJ = 0.40;
    else if (area > 500 && area <= 1000) factorJ = 0.35;
    else if (area > 1000) factorJ = 0.30;

    // 3. Factor de Uso (m) - Categoría del municipio (Bogotá = 1.0)
    const factorM = 1.0;

    // --- CARGO FIJO (Cf) ---
    // Cf = (Cf_base * i * m) -> Cf_base suele ser 0.5 SMDLV
    const cargoFijo = 0.5 * SMDLV_2024 * factorI * factorM;
    
    // --- CARGO VARIABLE (Cv) ---
    // Cv = (Cv_base * i * j * m) -> Cv_base suele ser proporcional al área
    // Si el área es 0, el cargo variable base es mínimo (0.5 SMDLV)
    const cargoVariableBase = area > 0 ? (area * 0.1 * SMDLV_2024) : (0.5 * SMDLV_2024);
    const cargoVariable = (cargoVariableBase * factorI * factorJ * factorM);
    
    const subtotal = cargoFijo + cargoVariable;
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    return {
      cargoFijo: Math.max(0, Math.round(cargoFijo)),
      cargoVariable: Math.max(0, Math.round(cargoVariable)),
      subtotal: Math.max(0, Math.round(subtotal)),
      iva: Math.max(0, Math.round(iva)),
      total: Math.max(0, Math.round(total))
    };
  }, [area, estrato, uso]);

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setTransactionId(`TX-${Math.floor(100000 + Math.random() * 900000)}`);
      setStep(3);
      setIsProcessing(false);
    }, 2500);
  };

  const generateReceiptPDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    // Estilo Institucional
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pw, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("RECIBO DE PAGO DE EXPENSAS", 20, 20);
    doc.setFontSize(10);
    doc.text("CURADURÍA URBANA No. 1 DE BOGOTÁ D.C.", 20, 30);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLES DE LA TRANSACCIÓN", 20, 55);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let y = 65;
    const data = [
        ["ID Transacción:", transactionId],
        ["Fecha:", new Date().toLocaleString()],
        ["Área Proyectada:", `${area} m2`],
        ["Estrato:", String(estrato)],
        ["Uso:", uso],
        ["", ""],
        ["Cargo Fijo (Radicación):", formatCurrency(totals.cargoFijo)],
        ["Cargo Variable (Expedición):", formatCurrency(totals.cargoVariable)],
        ["IVA (19%):", formatCurrency(totals.iva)],
        ["TOTAL PAGADO:", formatCurrency(totals.total)]
    ];

    data.forEach(([l, v]) => {
        doc.text(l, 25, y);
        doc.setFont("helvetica", "bold");
        doc.text(v, 100, y);
        doc.setFont("helvetica", "normal");
        y += 7;
    });

    doc.save(`Recibo_Expensas_${transactionId}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Banner de Bienvenida */}
        <div className="bg-slate-900 px-10 py-8 text-white flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-black tracking-tight">Liquidación de Expensas</h1>
                <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Ventanilla de Pagos Digitales</p>
            </div>
            <Landmark className="h-12 w-12 text-gov-blue opacity-50" />
        </div>

        <div className="p-10">
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Calculator className="h-5 w-5 mr-2 text-gov-blue" />
                    Parámetros del Proyecto
                </h3>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Área a Construir (m2)</label>
                  <input 
                    type="number" 
                    value={area || ''} 
                    onChange={(e) => setArea(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xl font-bold focus:ring-4 focus:ring-gov-blue/10 focus:border-gov-blue transition-all"
                    placeholder="Ingrese el área en m2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Estrato Social</label>
                    <select 
                        value={estrato} 
                        onChange={(e) => setEstrato(Number(e.target.value))}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold"
                    >
                        {[1,2,3,4,5,6].map(e => <option key={e} value={e}>Estrato {e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Uso del Suelo</label>
                    <select 
                        value={uso} 
                        onChange={(e) => setUso(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold"
                    >
                        <option>Residencial</option>
                        <option>Comercial</option>
                        <option>Institucional</option>
                        <option>Industrial</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start">
                    <Info className="h-4 w-4 text-blue-500 mr-3 mt-1 shrink-0" />
                    <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                        El cálculo utiliza los factores (i) de impacto social y (j) de área según el Decreto 1077 de 2015. El cargo fijo se liquida al radicar y el variable antes de la expedición.
                    </p>
                </div>
              </div>

              {/* Card de Resumen con actualización visual */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 flex flex-col justify-between relative">
                <div className="absolute top-4 right-4 animate-pulse">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-6 tracking-tighter">Resumen de Liquidación</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Cargo Fijo (Cf):</span>
                            <span className="font-bold text-slate-700 transition-all">{formatCurrency(totals.cargoFijo)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Cargo Variable (Cv):</span>
                            <span className="font-bold text-slate-700 transition-all">{formatCurrency(totals.cargoVariable)}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-4 border-t border-slate-200">
                            <span className="text-slate-500">Subtotal:</span>
                            <span className="font-bold text-slate-700">{formatCurrency(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">IVA (19%):</span>
                            <span className="font-bold text-slate-700">{formatCurrency(totals.iva)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t-4 border-dashed border-slate-200">
                    <div className="flex justify-between items-end mb-6">
                        <span className="text-xs font-bold text-slate-400 uppercase">Total a Pagar:</span>
                        <span className="text-3xl font-black text-gov-blue tracking-tight animate-in fade-in slide-in-from-right-2">
                            {formatCurrency(totals.total)}
                        </span>
                    </div>
                    <button 
                        onClick={() => setStep(2)}
                        disabled={area <= 0}
                        className="w-full bg-gov-blue text-white py-4 rounded-2xl font-bold shadow-xl shadow-gov-blue/20 hover:bg-blue-700 transition-all flex items-center justify-center group disabled:opacity-50 disabled:grayscale"
                    >
                        Proceder al Pago
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    {area <= 0 && <p className="text-[10px] text-center text-slate-400 mt-2 italic font-medium">Ingrese un área para habilitar el pago</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-md mx-auto py-8 animate-in zoom-in-95 duration-300">
                <h3 className="text-xl font-bold text-center mb-8">Seleccione su Medio de Pago</h3>
                <div className="space-y-4">
                    <div className="border-2 border-gov-blue bg-blue-50 p-6 rounded-2xl flex items-center justify-between cursor-pointer">
                        <div className="flex items-center">
                            <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4">
                                <img src="https://www.pse.com.co/o/pse-theme/images/logo-pse.png" alt="PSE" className="h-8" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">PSE</p>
                                <p className="text-xs text-slate-500">Pagos Seguros en Línea</p>
                            </div>
                        </div>
                        <div className="h-5 w-5 rounded-full border-4 border-gov-blue bg-white"></div>
                    </div>

                    <div className="border-2 border-slate-100 p-6 rounded-2xl flex items-center justify-between opacity-50 cursor-not-allowed">
                         <div className="flex items-center">
                            <CreditCard className="h-10 w-10 text-slate-400 mr-4" />
                            <div>
                                <p className="font-bold text-slate-800">Tarjeta de Crédito</p>
                                <p className="text-xs text-slate-500">Próximamente disponible</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <button 
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-2xl flex items-center justify-center"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5 mr-3" />
                                Conectando con banco...
                            </>
                        ) : (
                            `Pagar ${formatCurrency(totals.total)}`
                        )}
                    </button>
                    <button onClick={() => setStep(1)} className="w-full mt-4 text-sm font-bold text-slate-400">Regresar al cálculo</button>
                </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12 animate-in zoom-in duration-500">
                <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-900">¡Pago Confirmado!</h2>
                <p className="text-slate-500 mt-2">Su transacción ha sido procesada con éxito.</p>
                
                <div className="mt-8 p-6 bg-slate-50 rounded-2xl max-w-sm mx-auto border border-slate-200">
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-400 font-bold uppercase">Referencia:</span>
                        <span className="font-mono font-bold text-slate-800">{transactionId}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold uppercase">Valor:</span>
                        <span className="font-bold text-gov-blue">{formatCurrency(totals.total)}</span>
                    </div>
                </div>

                <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                        onClick={generateReceiptPDF}
                        className="flex items-center justify-center px-8 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Comprobante PDF
                    </button>
                    <button 
                        onClick={() => window.location.hash = '#/radicar'}
                        className="flex items-center justify-center px-8 py-3 bg-gov-blue text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all"
                    >
                        Ir a Radicación de Proyecto
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeePayment;
