import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, BookOpen } from 'lucide-react';
import { consultRegulatoryChat } from '../services/geminiService';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

const RegulatoryChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: '**Modo Funcionario Activado.**\n\nSoy su asistente jurídico-técnico para la validación de proyectos bajo el Decreto 555 de 2021. Puedo ayudarle a verificar índices, usos del suelo permitidos por UPZ/UPL o requisitos documentales específicos.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await consultRegulatoryChat(userMsg.text);
      const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Error consultando normativa.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-[700px] border border-slate-300">
      <div className="bg-brand-dark p-4 text-white flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6 text-gov-blue" />
            <div>
            <h2 className="font-semibold text-sm uppercase tracking-wider">Mesa de Ayuda Normativa</h2>
            <p className="text-xs text-slate-400">Uso Exclusivo Funcionarios Curaduría</p>
            </div>
        </div>
        <span className="bg-blue-900 text-xs px-2 py-1 rounded border border-blue-700">v2.1 POT 555</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-white border border-slate-200 text-slate-800 shadow-sm' 
                : 'bg-brand-dark text-slate-200 shadow-md'
            }`}>
              <div className="flex items-center space-x-2 mb-2 opacity-60 text-xs border-b border-opacity-20 pb-1 border-gray-500">
                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                <span className="uppercase font-bold">{msg.role === 'user' ? 'Revisor' : 'Sistema IA'}</span>
                <span>{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-brand-dark p-3 rounded-lg shadow-md flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-gov-blue rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-gov-blue rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-gov-blue rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Consulte un artículo o requisito (ej: Artículo 45 aislamiento posterior)..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-brand-dark focus:border-transparent text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bg-brand-dark text-white p-1.5 rounded-md hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegulatoryChat;