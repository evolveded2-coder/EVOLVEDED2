
import React from 'react';
import { Building2, CreditCard, Menu, X, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-brand-dark text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-gov-blue" />
              <span className="font-bold text-xl tracking-tight">Curaduría<span className="text-gov-blue">Digital</span></span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/') ? 'text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Inicio</Link>
              <Link to="/radicar" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/radicar') ? 'bg-gov-blue text-white' : 'bg-gov-blue/20 text-gov-blue hover:bg-gov-blue/30'}`}>Radicar Proyecto</Link>
              <Link to="/normativa" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/normativa') ? 'text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Asistente Normativo</Link>
              
              {/* Nuevo Botón Solicitado */}
              <Link to="/pagos" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors border ${isActive('/pagos') ? 'border-gov-blue bg-gov-blue/10 text-white' : 'border-slate-600 text-slate-300 hover:border-gov-blue hover:text-white'}`}>
                <CreditCard className="h-4 w-4 mr-2" />
                Calcular expensas y pagar
              </Link>

              <Link to="/dashboard" className="flex items-center hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-slate-600 text-slate-300">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Zona Funcionarios
              </Link>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium">Inicio</Link>
            <Link to="/radicar" className="block bg-gov-blue px-3 py-2 rounded-md text-base font-medium">Radicar Proyecto</Link>
            <Link to="/normativa" className="block px-3 py-2 rounded-md text-base font-medium">Asistente Normativo</Link>
            <Link to="/pagos" className="block border border-slate-600 px-3 py-2 rounded-md text-base font-medium">Calcular expensas y pagar</Link>
            <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-slate-400">Zona Funcionarios</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
