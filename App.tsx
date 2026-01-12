
import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import LicenseWizard from './components/LicenseWizard';
import RegulatoryChat from './components/RegulatoryChat';
import ReviewerDashboard from './components/ReviewerDashboard';
import FeePayment from './components/FeePayment'; // Nuevo import
import { ArrowRight, CheckCircle, Clock, FileCheck } from 'lucide-react';

const HomePage: React.FC = () => (
  <div className="min-h-screen">
    {/* Hero Section */}
    <div className="relative bg-brand-dark overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-brand-dark sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Trámites urbanos</span>{' '}
                <span className="block text-gov-blue xl:inline">transparentes y ágiles</span>
              </h1>
              <p className="mt-3 text-base text-slate-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Gestiona tus licencias de construcción en Bogotá cumpliendo con el POT (Decreto 555 de 2021). Asesoría inteligente, radicación digital y seguimiento en tiempo real.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link to="/radicar" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gov-blue hover:bg-blue-600 md:py-4 md:text-lg transition-all">
                    Iniciar Radicación
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link to="/pagos" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-gov-blue bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg transition-all">
                    Pagar Expensas
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <img
          className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full opacity-40 mix-blend-overlay"
          src="https://picsum.photos/1200/800"
          alt="Bogotá Skyline"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-brand-dark opacity-90"></div>
      </div>
    </div>

    {/* Features Section */}
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-gov-blue font-semibold tracking-wide uppercase">Servicios Digitales</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Todo lo que necesitas para tu proyecto
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-gov-blue text-white">
                  <FileCheck className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-slate-900">Radicación 100% Virtual</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-slate-500">
                Sube tus planos, memorias y documentos legales sin hacer filas. Validación preliminar automática.
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-gov-blue text-white">
                  <Clock className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-slate-900">Seguimiento en Tiempo Real</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-slate-500">
                Conoce el estado exacto de tu trámite: revisión jurídica, estructural o acta de observaciones.
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-gov-blue text-white">
                  <CheckCircle className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-slate-900">Pagos Seguros Integrados</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-slate-500">
                Calcula tus expensas automáticamente según el área y estrato, y paga vía PSE sin intermediarios.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/radicar" element={
              <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <LicenseWizard />
              </div>
            } />
            <Route path="/normativa" element={
              <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <RegulatoryChat />
              </div>
            } />
            <Route path="/pagos" element={<FeePayment />} />
            <Route path="/dashboard" element={
               <ReviewerDashboard />
            } />
          </Routes>
        </main>
        
        <footer className="bg-brand-dark text-slate-300 py-12 border-t border-slate-700 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
             <div>
               <h3 className="text-white text-lg font-bold mb-4">Curaduría Digital</h3>
               <p className="text-sm">Facilitando el desarrollo urbano de Bogotá mediante tecnología y transparencia.</p>
             </div>
             <div>
               <h3 className="text-white text-lg font-bold mb-4">Enlaces de Interés</h3>
               <ul className="space-y-2 text-sm">
                 <li><a href="#" className="hover:text-white transition">Secretaría de Planeación</a></li>
                 <li><a href="#" className="hover:text-white transition">Ministerio de Vivienda</a></li>
                 <li><a href="#" className="hover:text-white transition">Consulta de Norma Urbana</a></li>
               </ul>
             </div>
             <div>
               <h3 className="text-white text-lg font-bold mb-4">Contacto</h3>
               <p className="text-sm">Bogotá D.C., Colombia</p>
               <p className="text-sm">info@curaduriadigital.gov.co</p>
             </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-slate-700 text-center text-xs">
            © {new Date().getFullYear()} Curaduría Digital Bogotá. Todos los derechos reservados.
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
