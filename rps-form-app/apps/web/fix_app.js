const fs = require('fs');

const appTsx = `import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import DashboardMockup from './pages/DashboardMockup';
import WizardMockup from './pages/WizardMockup';
import TemplateSettingsMockup from './pages/TemplateSettingsMockup';
import { FileText, Settings, LayoutDashboard, Menu } from 'lucide-react';

function Sidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'bg-blue-800 text-white' : 'text-gray-300 hover:bg-blue-800 hover:text-white';

  return (
    <div className="w-64 bg-blue-900 text-white min-h-screen flex flex-col hidden md:flex">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight">RPS Builder</h1>
        <p className="text-blue-300 text-sm mt-1">Sistem Administrasi Akademik</p>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link to="/" className={"flex items-center px-4 py-3 rounded-lg transition-colors " + isActive('/')}>
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Dashboard
        </Link>
        <Link to="/wizard" className={"flex items-center px-4 py-3 rounded-lg transition-colors " + isActive('/wizard')}>
          <FileText className="w-5 h-5 mr-3" />
          RPS Baru
        </Link>
        <Link to="/settings" className={"flex items-center px-4 py-3 rounded-lg transition-colors " + isActive('/settings')}>
          <Settings className="w-5 h-5 mr-3" />
          Pengaturan Template
        </Link>
      </nav>
      <div className="p-6 border-t border-blue-800">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center font-bold">A</div>
          <div className="ml-3">
            <p className="text-sm font-medium">Admin Akademik</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center px-4 md:hidden">
           <Menu className="w-6 h-6 text-gray-600" />
           <h1 className="text-xl font-bold text-blue-900 ml-4">RPS Builder</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardMockup />} />
          <Route path="/wizard" element={<WizardMockup />} />
          <Route path="/settings" element={<TemplateSettingsMockup />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;`;

fs.writeFileSync('c:/xampp/htdocs/Aplikasi_Dosen/rps-form-app/apps/web/src/App.tsx', appTsx);

// Just fixing the syntax for compilation, no backticks
console.log('Fixed App.tsx');
