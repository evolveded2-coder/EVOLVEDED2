
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BookOpen, ExternalLink, Globe } from 'lucide-react';
import { consultRegulatoryChat, ChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

interface EnhancedMessage extends ChatMessage {
  sources?: { title: string; uri: string }[];
}

const RegulatoryChat: React.FC = () => {
  const [messages, setMessages] = useState<EnhancedMessage[]>([
    {
      role: 'model',
      text: '**Asistente Normativo Bogotá (POT 555/2021) Conectado.**\n\nTengo acceso a la normativa vigente y búsqueda en tiempo real de decretos distritales. ¿Cómo puedo ayudarle?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: EnhancedMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setHasError(false);

    try {
      const response: ChatResponse = await consultRegulatoryChat(userMsg.text);
      if (response.text.includes("CONFIGURACIÓN PENDIENTE")) {
        setHasError(true);
      }
      const botMsg: EnhancedMessage = { 
        role: 'model', 
        text: response.text, 
        timestamp: new Date(),
        sources: response.sources 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setHasError(true);
      setMessages(prev => [...prev, { role: 'model', text: '⚠️ Error de conexión con el motor normativo.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[700px] border border-slate-200">
      <div className="bg-slate-900 p-5 text-white flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center space-x-3">
            <div className="bg-gov-blue p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
                <h2 className="font-bold text-sm uppercase tracking-widest">Asistente Normativo Bogotá</h2>
                <p className="text-[10px] text-slate-400 font-medium tracking-tighter uppercase">Inteligencia Urbanística V.3</p>
            </div>
        </div>
        <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${hasError ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></div>
            <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">
                {hasError ? 'Offline' : 'Online'}
            </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-gov-blue text-white' 
                : 'bg-white border border-slate-200 text-slate-800'
            }`}>
              <div className={`flex items-center space-x-2 mb-2 text-[10px] font-black uppercase tracking-widest opacity-50 ${msg.role === 'user' ? 'text-white' : 'text-slate-400'}`}>
                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                <span>{msg.role === 'user' ? 'Consultante' : 'IA Curaduría'}</span>
              </div>
              <div className="prose prose-sm max-w-none prose-slate">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center mb-2">
                    <Globe size={12} className="mr-1.5" /> Fuentes de Verificación:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((src, sIdx) => (
                      <a 
                        key={sIdx} 
                        href={src.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-[9px] font-bold text-gov-blue hover:bg-gov-blue/5 transition-colors"
                      >
                        <span className="truncate max-w-[150px]">{src.title}</span>
                        <ExternalLink size={10} className="ml-1" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-gov-blue rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gov-blue rounded-full animate-bounce delay-150"></div>
                <div className="w-1.5 h-1.5 bg-gov-blue rounded-full animate-bounce delay-300"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analizando Normativa...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ej: ¿Qué dice el POT sobre aislamientos en barrios de consolidación?"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-5 pr-14 py-4 focus:outline-none focus:ring-4 focus:ring-gov-blue/10 focus:border-gov-blue text-sm transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-3 top-2.5 bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-30 transition-all shadow-lg active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[9px] text-center text-slate-400 mt-3 font-medium uppercase tracking-tighter">
            ESTE ASISTENTE NO REEMPLAZA EL CONCEPTO JURÍDICO OFICIAL DE LA CURADURÍA.
        </p>
      </div>
    </div>
  );
};

export default RegulatoryChat;
