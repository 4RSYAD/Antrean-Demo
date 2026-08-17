import React from 'react';
import {
  LayoutDashboard,
  Clock,
  Wrench,
  Sparkles,
  Tv,
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Droplets,
  Sun,
  Moon,
  ShieldCheck,
  Layers,
  FileText,
  Settings,
  LogIn,
  LogOut,
  Users,
  UserCheck
} from 'lucide-react';
import { UserRole, AdminView, CustomerView, AuthUser } from '../types.ts';

interface SidebarProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentView: string;
  setCurrentView: (view: any) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (val: boolean) => void;
  waitingCount: number;
  waitingPaymentCount: number;
  authUser: AuthUser | null;
  onNavigateToLogin: () => void;
  onLogout: () => void;
  isSupabaseConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  setRole,
  currentView,
  setCurrentView,
  isDarkMode,
  setIsDarkMode,
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileDrawerOpen,
  setMobileDrawerOpen,
  waitingCount,
  waitingPaymentCount,
  authUser,
  onNavigateToLogin,
  onLogout
}) => {
  const isExpanded = !sidebarCollapsed || mobileDrawerOpen;

  const handleNavClick = (viewName: AdminView | CustomerView) => {
    setCurrentView(viewName);
    setMobileDrawerOpen(false);
  };

  const currentRole = authUser?.is_logged_in ? authUser.role : (role || 'pelanggan');

  const getRoleLabel = () => {
    switch (currentRole) {
      case 'admin':
        return 'Menu Administrator';
      case 'kasir':
        return 'Menu Petugas Kasir';
      case 'operator':
        return 'Menu Operator Pit';
      case 'pengguna':
        return 'Menu Pengguna';
      default:
        return 'Menu Pelanggan';
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileDrawerOpen && (
        <div
          id="mobile-drawer-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden no-print"
        />
      )}

      <aside
        id="app-sidebar"
        className={`no-print fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-[#0F121C] border-r border-slate-200 dark:border-[#23293D] transition-all duration-300 flex flex-col ${
          mobileDrawerOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-[#23293D] h-16 shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white font-black shadow-md shrink-0">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            {isExpanded && (
              <div className="truncate">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  Antrean
                </h1>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  Sistem Cuci Kendaraan
                </span>
              </div>
            )}
          </div>

          <button
            id="btn-toggle-collapse"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#161A28] text-slate-500 dark:text-slate-400 transition cursor-pointer"
            title={sidebarCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            id="btn-close-mobile-drawer"
            onClick={() => setMobileDrawerOpen(false)}
            className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#161A28] text-slate-500 dark:text-slate-400 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items Separated by Role */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {isExpanded && <span>{getRoleLabel()}</span>}
          </div>

          {/* ADMIN ROLE MENUS */}
          {currentRole === 'admin' && (
            <>
              <SidebarItem
                id="nav-dashboard"
                icon={<LayoutDashboard className="w-4 h-4 shrink-0" />}
                label="Dashboard Utama"
                active={currentView === 'dashboard'}
                onClick={() => handleNavClick('dashboard')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-queues"
                icon={<Clock className="w-4 h-4 shrink-0" />}
                label="Menu Antrean & Kasir"
                active={currentView === 'queues'}
                onClick={() => handleNavClick('queues')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-pit"
                icon={<Wrench className="w-4 h-4 shrink-0" />}
                label="Operator Pit Bay"
                active={currentView === 'pit'}
                onClick={() => handleNavClick('pit')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-pit-manage"
                icon={<Layers className="w-4 h-4 shrink-0" />}
                label="Kelola Pit Bay"
                active={currentView === 'pit_manage'}
                onClick={() => handleNavClick('pit_manage')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-services"
                icon={<Sparkles className="w-4 h-4 shrink-0" />}
                label="Layanan & Harga"
                active={currentView === 'services'}
                onClick={() => handleNavClick('services')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-reports"
                icon={<FileText className="w-4 h-4 shrink-0" />}
                label="Laporan & Rekap"
                active={currentView === 'reports'}
                onClick={() => handleNavClick('reports')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-users"
                icon={<Users className="w-4 h-4 shrink-0" />}
                label="Manajemen Pengguna"
                active={currentView === 'users'}
                onClick={() => handleNavClick('users')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-settings"
                icon={<Settings className="w-4 h-4 shrink-0" />}
                label="Pengaturan & Supabase"
                active={currentView === 'settings'}
                onClick={() => handleNavClick('settings')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-tv"
                icon={<Tv className="w-4 h-4 shrink-0" />}
                label="Layar Ruang Tunggu"
                active={currentView === 'tv'}
                onClick={() => handleNavClick('tv')}
                collapsed={!isExpanded}
              />
            </>
          )}

          {/* KASIR ROLE MENUS */}
          {currentRole === 'kasir' && (
            <>
              <SidebarItem
                id="nav-queues"
                icon={<Clock className="w-4 h-4 shrink-0" />}
                label="Menu Antrean & Kasir"
                active={currentView === 'queues'}
                onClick={() => handleNavClick('queues')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-dashboard"
                icon={<LayoutDashboard className="w-4 h-4 shrink-0" />}
                label="Dashboard Antrean"
                active={currentView === 'dashboard'}
                onClick={() => handleNavClick('dashboard')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-reports"
                icon={<FileText className="w-4 h-4 shrink-0" />}
                label="Laporan Transaksi"
                active={currentView === 'reports'}
                onClick={() => handleNavClick('reports')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-tv"
                icon={<Tv className="w-4 h-4 shrink-0" />}
                label="Layar Ruang Tunggu"
                active={currentView === 'tv'}
                onClick={() => handleNavClick('tv')}
                collapsed={!isExpanded}
              />
            </>
          )}

          {/* OPERATOR ROLE MENUS */}
          {currentRole === 'operator' && (
            <>
              <SidebarItem
                id="nav-pit"
                icon={<Wrench className="w-4 h-4 shrink-0" />}
                label="Operator Pit Bay"
                active={currentView === 'pit'}
                onClick={() => handleNavClick('pit')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-tv"
                icon={<Tv className="w-4 h-4 shrink-0" />}
                label="Layar Ruang Tunggu"
                active={currentView === 'tv'}
                onClick={() => handleNavClick('tv')}
                collapsed={!isExpanded}
              />
            </>
          )}

          {/* PENGGUNA (LOGGED IN USER) & GUEST (VISITOR) MENUS */}
          {(currentRole === 'pengguna' || !authUser?.is_logged_in) && (
            <>
              <SidebarItem
                id="nav-check"
                icon={<Search className="w-4 h-4 shrink-0" />}
                label="Cek Antrean Saya"
                active={currentView === 'check'}
                onClick={() => handleNavClick('check')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-register"
                icon={<PlusCircle className="w-4 h-4 shrink-0" />}
                label="Ambil Antrean Baru"
                active={currentView === 'register'}
                onClick={() => handleNavClick('register')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-tv-customer"
                icon={<Tv className="w-4 h-4 shrink-0" />}
                label="Layar Ruang Tunggu"
                active={currentView === 'tv'}
                onClick={() => handleNavClick('tv')}
                collapsed={!isExpanded}
              />
            </>
          )}
        </nav>

        {/* User Account Footer (When Logged In) */}
        {authUser?.is_logged_in ? (
          <div className="p-3 border-t border-slate-200 dark:border-[#23293D] bg-slate-50 dark:bg-[#08090E]/60">
            {isExpanded ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                      {authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="truncate text-left">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {authUser.name}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 capitalize font-bold">
                        {authUser.role === 'pengguna'
                          ? 'Pengguna Terdaftar'
                          : authUser.role === 'admin'
                          ? 'Administrator'
                          : authUser.role === 'kasir'
                          ? 'Petugas Kasir'
                          : 'Operator Pit'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                    title="Keluar / Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex justify-center p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          /* Login button for guest users when not logged in */
          <div className="p-3 border-t border-slate-200 dark:border-[#23293D] bg-slate-50 dark:bg-[#08090E]/60">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className={`w-full py-2 ${
                isExpanded ? 'px-3 justify-center' : 'justify-center p-2'
              } bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition flex items-center space-x-2 shadow-xs cursor-pointer`}
              title="Masuk / Login Akun"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {isExpanded && <span>Masuk / Login</span>}
            </button>
          </div>
        )}

        {/* Footer Dark/Light Toggle */}
        <div className="p-3 border-t border-slate-200 dark:border-[#23293D]">
          <button
            id="btn-theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center ${
              isExpanded ? 'justify-between px-3.5 py-2.5' : 'justify-center p-2.5'
            } bg-slate-100 dark:bg-[#161A28] hover:bg-slate-200 dark:hover:bg-[#1E2336] text-slate-800 dark:text-slate-200 rounded-xl transition text-xs font-semibold cursor-pointer`}
          >
            <div className="flex items-center space-x-2.5">
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              {isExpanded && <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>}
            </div>
            {isExpanded && (
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-bold">
                {isDarkMode ? 'DARK' : 'LIGHT'}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

interface SidebarItemProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
  badge?: number;
  badgeColor?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  id,
  icon,
  label,
  active,
  onClick,
  collapsed,
  badge,
  badgeColor = 'bg-amber-500 text-slate-950 font-black'
}) => {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`w-full flex items-center ${
        collapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
      } rounded-xl transition font-semibold text-xs cursor-pointer ${
        active
          ? 'bg-emerald-600 text-white font-bold shadow-sm'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161A28] hover:text-slate-950 dark:hover:text-white'
      }`}
      title={collapsed ? label : undefined}
    >
      <div className="flex items-center space-x-3 min-w-0">
        {icon}
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
      {!collapsed && typeof badge === 'number' && badge > 0 && (
        <span className={`px-2 py-0.5 text-[10px] font-mono font-extrabold rounded-full ${badgeColor} shrink-0`}>
          {badge}
        </span>
      )}
    </button>
  );
};
