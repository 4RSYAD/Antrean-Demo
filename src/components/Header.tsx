import React from 'react';
import {
  Menu,
  Volume2,
  VolumeX,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  LogIn,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { AuthUser, UserRole } from '../types.ts';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileDrawer: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  role: UserRole;
  authUser: AuthUser | null;
  onNavigateToLogin: () => void;
  isSupabaseConnected: boolean;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileDrawer,
  isMuted,
  onToggleMute,
  role,
  authUser,
  onNavigateToLogin,
  isSupabaseConnected,
  onOpenSettings
}) => {
  return (
    <header
      id="main-app-header"
      className="no-print bg-white/90 dark:bg-[#0F121C]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#23293D] px-4 md:px-6 h-14 flex items-center justify-between z-20 shrink-0 shadow-xs"
    >
      {/* Sidebar Open/Close Toggle Button */}
      <div className="flex items-center space-x-2">
        {/* Mobile Toggle */}
        <button
          id="btn-open-mobile-drawer"
          onClick={onOpenMobileDrawer}
          className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-[#161A28] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1E2336] transition cursor-pointer"
          title="Buka Menu Sidebar"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Collapse / Expand Toggle */}
        <button
          id="btn-desktop-toggle-sidebar"
          onClick={onToggleSidebar}
          className="hidden lg:flex p-2 rounded-xl bg-slate-100 dark:bg-[#161A28] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1E2336] hover:text-emerald-500 dark:hover:text-emerald-400 transition cursor-pointer"
          title={sidebarCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
          aria-label={sidebarCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <span className="text-slate-900 dark:text-white font-extrabold tracking-tight">Antrean</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-emerald-700 dark:text-emerald-400">
            {authUser?.is_logged_in
              ? authUser.role === 'admin'
                ? 'Panel Administrator'
                : authUser.role === 'kasir'
                ? 'Panel Petugas Kasir'
                : authUser.role === 'operator'
                ? 'Panel Operator Pit'
                : 'Portal Pengguna'
              : 'Portal Antrean Pelanggan'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        {/* Supabase Connection Status Badge (Clickable to Settings for admin) */}
        <button
          type="button"
          onClick={onOpenSettings}
          className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
            isSupabaseConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-slate-100 dark:bg-[#161A28] border-slate-200 dark:border-[#23293D] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1F253A]'
          }`}
          title="Status Koneksi Supabase Real-Time (Klik untuk kelola)"
        >
          <Radio
            className={`w-3.5 h-3.5 ${
              isSupabaseConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'
            }`}
          />
          <span>{isSupabaseConnected ? 'Supabase Real-Time' : 'Database Offline'}</span>
        </button>

        {/* Sound Mute Toggle */}
        <button
          id="btn-mute-toggle"
          onClick={onToggleMute}
          className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
            isMuted
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
          }`}
          title={isMuted ? 'Suara Speaker Senyap (Muted). Klik untuk aktifkan.' : 'Suara Speaker Aktif. Klik untuk bisukan.'}
          aria-label={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-500" />
          )}
        </button>

        {/* Auth / Login Button */}
        {!authUser?.is_logged_in ? (
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Masuk / Login</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate max-w-[130px]">{authUser.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono uppercase font-bold">
              {authUser.role}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
