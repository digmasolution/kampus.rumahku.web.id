import { useState, ReactNode, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import DashboardMockup from './pages/DashboardMockup';
import WizardMockup from './pages/WizardMockup';
import TemplateSettingsMockup from './pages/TemplateSettingsMockup';
import AdminBugReports from './pages/AdminBugReports';
import LoginPage from './pages/LoginPage';
import MeetingNotesPage from './pages/MeetingNotesPage';
import MeetingAttendanceCheckin from './pages/MeetingAttendanceCheckin';
import TodoKanbanPage from './pages/TodoKanbanPage';
import { authService, UserProfile } from './services/auth.service';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ShortcutsHelpModal } from './components/ui/ShortcutsHelpModal';
import { 
  FileText, 
  Settings, 
  LayoutDashboard, 
  Menu, 
  X, 
  GraduationCap, 
  ShieldAlert, 
  LogOut,
  BookOpen,
  CheckSquare,
  Keyboard
} from 'lucide-react';
import FeedbackButton from './components/ui/FeedbackButton';

interface SidebarProps {
  onNavClick?: () => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
}

function SidebarContent({ onNavClick, currentUser, onLogout }: SidebarProps) {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path
      ? 'bg-blue-800 text-white font-semibold'
      : 'text-gray-300 hover:bg-blue-800/60 hover:text-white';

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="flex flex-col h-full bg-blue-900 text-white">
      {/* Brand */}
      <div className="p-6 border-b border-blue-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-inner">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Dunia Kampus</h1>
            <p className="text-blue-300 text-xs font-medium">Portal Dosen - RPS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-6">
        <Link
          to="/dashboard"
          onClick={onNavClick}
          className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard')}`}
        >
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Dashboard
        </Link>
        <Link
          to="/wizard"
          onClick={onNavClick}
          className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/wizard')}`}
        >
          <FileText className="w-5 h-5 mr-3" />
          RPS Baru
        </Link>
        <Link
          to="/meetings"
          onClick={onNavClick}
          className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/meetings')}`}
        >
          <BookOpen className="w-5 h-5 mr-3 text-blue-300" />
          Catatan Rapat
        </Link>
        <Link
          to="/todos"
          onClick={onNavClick}
          className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/todos')}`}
        >
          <CheckSquare className="w-5 h-5 mr-3 text-emerald-400" />
          Todo List (Kanban)
        </Link>
        <Link
          to="/settings"
          onClick={onNavClick}
          className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/settings')}`}
        >
          <Settings className="w-5 h-5 mr-3" />
          Pengaturan Template
        </Link>

        {/* Khusus Akun Admin: Menu BVS Bug Reports */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-blue-800/60">
            <p className="px-4 text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-2">
              Hak Akses Admin
            </p>
            <Link
              to="/admin/bug-reports"
              onClick={onNavClick}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/admin/bug-reports')} bg-purple-950/40 text-purple-200 hover:bg-purple-900/60`}
            >
              <ShieldAlert className="w-5 h-5 mr-3 text-purple-400" />
              <span>Admin: Bug & Feedback</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-blue-800 space-y-2">
        {/* Keyboard Shortcuts Help Hint */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-shortcuts-help'))}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-blue-300 hover:text-white hover:bg-blue-800/60 transition text-xs"
          title="Lihat pintasan keyboard (Shift + ?)"
        >
          <Keyboard className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">Pintasan Keyboard</span>
          <kbd className="text-[10px] bg-blue-800 border border-blue-700 rounded px-1.5 py-0.5 font-mono">Shift+?</kbd>
        </button>
        <div className="flex items-center bg-blue-950/40 p-3 rounded-lg">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm shadow">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="ml-3 truncate flex-1">
            <p className="text-sm font-semibold text-white truncate">{currentUser?.name || 'Pengguna'}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-800 text-blue-200 font-semibold inline-block">
              {currentUser?.role || 'DOSEN'}
            </span>
          </div>
          <button
            onClick={onLogout}
            title="Keluar"
            className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-blue-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Layout({ 
  children, 
  currentUser, 
  onLogout 
}: { 
  children: ReactNode; 
  currentUser: UserProfile | null; 
  onLogout: () => void; 
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Register global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Desktop Sidebar */}
      <aside className="w-64 min-h-screen hidden md:block shrink-0 shadow-lg">
        <SidebarContent currentUser={currentUser} onLogout={onLogout} />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-Over Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-blue-900 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-blue-800"
            aria-label="Tutup menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <SidebarContent 
          onNavClick={() => setIsMobileMenuOpen(false)} 
          currentUser={currentUser} 
          onLogout={onLogout} 
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header with responsive hamburger */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:hidden shrink-0 border-b border-gray-200">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-blue-900 ml-3">Dunia Kampus</h1>
          </div>
          <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full">
            {currentUser?.role || 'Portal'}
          </span>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Tombol Feedback — tampil di semua halaman */}
      <FeedbackButton />

      {/* Keyboard Shortcuts Help Modal — Shift+? */}
      <ShortcutsHelpModal />
    </div>
  );
}

function ProtectedRoute({ 
  currentUser, 
  children 
}: { 
  currentUser: UserProfile | null; 
  children: ReactNode; 
}) {
  const location = useLocation();

  if (!currentUser) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  return <>{children}</>;
}

function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());

  useEffect(() => {
    // Sinkronisasi status login
    setCurrentUser(authService.getCurrentUser());
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman Depan: Login & Overview */}
        <Route 
          path="/login" 
          element={
            currentUser ? (
              <Navigate to={currentUser.role === 'ADMIN' ? '/admin/bug-reports' : '/dashboard'} replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />

        {/* Protected App Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute currentUser={currentUser}>
              <Layout currentUser={currentUser} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Navigate to={currentUser?.role === 'ADMIN' ? '/admin/bug-reports' : '/dashboard'} replace />} />
                  <Route path="/dashboard" element={<DashboardMockup />} />
                  <Route path="/wizard" element={<WizardMockup />} />
                  <Route path="/meetings" element={<MeetingNotesPage />} />
                  <Route path="/attendance-checkin" element={<MeetingAttendanceCheckin />} />
                  <Route path="/todos" element={<TodoKanbanPage />} />
                  <Route path="/settings" element={<TemplateSettingsMockup />} />
                  
                  {/* Khusus Admin */}
                  <Route 
                    path="/admin/bug-reports" 
                    element={
                      currentUser?.role === 'ADMIN' ? (
                        <AdminBugReports />
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    } 
                  />
                  
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;