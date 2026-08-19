import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Wrench,
  DollarSign,
  User,
  UserCog,
  CheckCircle,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { AppUser, AppUserRole, AppUserStatus, AuthUser } from '../types.ts';

interface AdminUsersViewProps {
  users: AppUser[];
  onAddUser: (user: Omit<AppUser, 'id'>) => void;
  onUpdateUser: (id: string, updated: Partial<AppUser>) => void;
  onDeleteUser: (id: string) => void;
  onRefreshUsers?: () => Promise<void>;
  authUser: AuthUser | null;
  showToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  isSupabaseConnected: boolean;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onRefreshUsers,
  authUser,
  showToast,
  isSupabaseConnected
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppUserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AppUserStatus>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<AppUserRole>('kasir');
  const [formStatus, setFormStatus] = useState<AppUserStatus>('aktif');
  const [formPhone, setFormPhone] = useState('');
  const [formEmailVerified, setFormEmailVerified] = useState(true);

  // Password change modal
  const [resetModalUser, setResetModalUser] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Quick Role Assign Popover/Modal
  const [roleAssignUser, setRoleAssignUser] = useState<AppUser | null>(null);
  const [assignedRole, setAssignedRole] = useState<AppUserRole>('kasir');

  const openAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('admin123');
    setFormRole('kasir');
    setFormStatus('aktif');
    setFormPhone('');
    setFormEmailVerified(true);
    setIsModalOpen(true);
  };

  const openEditModal = (user: AppUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword('');
    setFormRole(user.role);
    setFormStatus(user.status);
    setFormPhone(user.phone || '');
    setFormEmailVerified(user.is_email_verified ?? true);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showToast('Nama dan Email wajib diisi!', 'warning');
      return;
    }

    if (editingUser) {
      const updatePayload: Partial<AppUser> = {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        status: formStatus,
        phone: formPhone.trim(),
        is_email_verified: formEmailVerified
      };
      if (formPassword.trim()) {
        updatePayload.password = formPassword.trim();
      }
      onUpdateUser(editingUser.id, updatePayload);
      showToast(`Data pengguna ${formName} berhasil diperbarui!`, 'success');
    } else {
      if (!formPassword.trim()) {
        showToast('Password wajib diisi untuk pengguna baru!', 'warning');
        return;
      }
      onAddUser({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        password: formPassword.trim(),
        role: formRole,
        status: formStatus,
        phone: formPhone.trim(),
        is_email_verified: formEmailVerified,
        created_at: new Date().toISOString()
      });
      showToast(`Pengguna baru ${formName} berhasil ditambahkan!`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword.trim()) return;

    onUpdateUser(resetModalUser.id, { password: newPassword.trim() });
    showToast(`Password untuk ${resetModalUser.name} berhasil diubah!`, 'success');
    setResetModalUser(null);
    setNewPassword('');
  };

  const handleQuickRoleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleAssignUser) return;

    onUpdateUser(roleAssignUser.id, { role: assignedRole });
    showToast(
      `Peran akun ${roleAssignUser.name} berhasil diubah menjadi ${
        assignedRole === 'admin'
          ? 'Administrator'
          : assignedRole === 'kasir'
          ? 'Petugas Kasir'
          : assignedRole === 'operator'
          ? 'Operator Pit Bay'
          : 'Pengguna'
      }!`,
      'success'
    );
    setRoleAssignUser(null);
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'aktif').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const kasirCount = users.filter((u) => u.role === 'kasir').length;
  const operatorCount = users.filter((u) => u.role === 'operator').length;
  const regularUsersCount = users.filter((u) => u.role === 'pengguna').length;

  const getRoleBadge = (role: AppUserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Administrator
          </span>
        );
      case 'kasir':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-3.5 h-3.5 mr-1" />
            Petugas Kasir
          </span>
        );
      case 'operator':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Wrench className="w-3.5 h-3.5 mr-1" />
            Operator Pit
          </span>
        );
      case 'pengguna':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Pengguna (Belum Ditugaskan)
          </span>
        );
    }
  };

  return (
    <div id="admin-users-view" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Manajemen Pengguna & Staf
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Kelola akun pendaftar dan berikan hak akses petugas (Kasir, Operator, Administrator)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onRefreshUsers && (
            <button
              type="button"
              id="btn-refresh-users"
              disabled={isRefreshing}
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  await onRefreshUsers();
                } finally {
                  setIsRefreshing(false);
                }
              }}
              className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161A28] dark:hover:bg-[#1E2337] text-slate-700 dark:text-slate-200 text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
              title="Sinkronkan data pengguna dengan Supabase Cloud"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
              <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
            </button>
          )}

          <button
            id="btn-add-user"
            onClick={openAddModal}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Pengguna Baru
          </button>
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-2xl bg-indigo-50/75 dark:bg-[#121626] border border-indigo-200/70 dark:border-indigo-800/40 flex items-start space-x-3 text-xs text-indigo-900 dark:text-indigo-200">
        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Alur Pendaftaran & Penugasan Petugas:</span>
          <p className="mt-0.5 text-indigo-700 dark:text-indigo-300 leading-relaxed">
            Pengguna yang mendaftar mandiri otomatis berstatus <b>Pengguna</b> dengan email terverifikasi. Untuk mengaktifkan mereka sebagai staf operasional, klik tombol <b>"Tugaskan Peran"</b> pada tabel di bawah untuk memilih peran Kasir, Operator Pit, atau Administrator.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Akun</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalUsers}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {activeUsers} Akun Aktif
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Administrator</span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{adminCount}</p>
          <span className="text-[11px] text-slate-500">Akses penuh</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Petugas Kasir</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{kasirCount}</p>
          <span className="text-[11px] text-slate-500">Kasir & Bayar</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Operator Pit</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{operatorCount}</p>
          <span className="text-[11px] text-slate-500">Panggilan cuci</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Pengguna Mandiri</span>
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{regularUsersCount}</p>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
            Siap ditugaskan
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, email, nomor HP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#151928] border border-slate-200 dark:border-[#23293D] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-[#151928] border border-slate-200 dark:border-[#23293D] rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Peran</option>
            <option value="admin">Administrator</option>
            <option value="kasir">Kasir</option>
            <option value="operator">Operator Pit</option>
            <option value="pengguna">Pengguna Mandiri</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-[#151928] border border-slate-200 dark:border-[#23293D] rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 dark:bg-[#151928] text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-[#23293D]">
              <tr>
                <th className="px-5 py-3.5">Pengguna</th>
                <th className="px-5 py-3.5">Peran Akses</th>
                <th className="px-5 py-3.5">Email Status</th>
                <th className="px-5 py-3.5">Status Akun</th>
                <th className="px-5 py-3.5">Login Terakhir</th>
                <th className="px-5 py-3.5 text-right">Aksi & Tugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1C2132]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 dark:text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Tidak ada data pengguna ditemukan.</p>
                    <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau filter.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrentLoggedUser = authUser?.email === user.email;
                  const isVerified = user.is_email_verified ?? true;
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-[#131726]/50 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl text-white font-bold flex items-center justify-center text-sm shadow-sm ${
                            user.role === 'admin'
                              ? 'bg-gradient-to-br from-purple-600 to-indigo-600'
                              : user.role === 'kasir'
                              ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                              : user.role === 'operator'
                              ? 'bg-gradient-to-br from-amber-600 to-orange-600'
                              : 'bg-gradient-to-br from-slate-600 to-slate-700'
                          }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {user.name}
                              </span>
                              {isCurrentLoggedUser && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <Mail className="w-3 h-3 mr-1 opacity-70" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-2">
                          {getRoleBadge(user.role)}
                          {/* Quick promote button for users */}
                          <button
                            type="button"
                            onClick={() => {
                              setRoleAssignUser(user);
                              setAssignedRole(user.role === 'pengguna' ? 'kasir' : user.role);
                            }}
                            className="p-1 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                            title="Ubah / Berikan Role Petugas"
                          >
                            <UserCog className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Email Verified Status */}
                      <td className="px-5 py-4 text-xs">
                        {isVerified ? (
                          <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-amber-600 dark:text-amber-400 font-semibold">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Menunggu OTP
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => {
                            const newStatus = user.status === 'aktif' ? 'nonaktif' : 'aktif';
                            onUpdateUser(user.id, { status: newStatus });
                            showToast(
                              `Status akun ${user.name} diubah menjadi ${newStatus}.`,
                              newStatus === 'aktif' ? 'success' : 'warning'
                            );
                          }}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                            user.status === 'aktif'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                          }`}
                          title="Klik untuk mengubah status"
                        >
                          {user.status === 'aktif' ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5 mr-1" />
                              Nonaktif
                            </>
                          )}
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {user.last_login ? (
                          new Date(user.last_login).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })
                        ) : (
                          <span className="text-slate-400">Belum pernah</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResetModalUser(user);
                              setNewPassword('');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-[#1A2033] transition-colors cursor-pointer"
                            title="Ubah Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-[#1A2033] transition-colors cursor-pointer"
                            title="Edit Data Pengguna"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete (Cannot delete self) */}
                          <button
                            disabled={isCurrentLoggedUser}
                            onClick={() => onDeleteUser(user.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isCurrentLoggedUser
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-[#1A2033]'
                            }`}
                            title={
                              isCurrentLoggedUser
                                ? 'Tidak dapat menghapus akun Anda sendiri'
                                : 'Hapus Pengguna'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Role Assignment Modal */}
      {roleAssignUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2436] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Tugaskan Peran Petugas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Akun: {roleAssignUser.name} ({roleAssignUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRoleAssignUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickRoleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Pilih Peran Operasional Baru
                </label>
                <div className="space-y-2">
                  <label
                    onClick={() => setAssignedRole('kasir')}
                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                      assignedRole === 'kasir'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-[#23293D] hover:bg-slate-50 dark:hover:bg-[#151928]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs">Petugas Kasir</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Membuat tiket antrean, kasir pembayaran, cetak struk
                        </div>
                      </div>
                    </div>
                    {assignedRole === 'kasir' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  </label>

                  <label
                    onClick={() => setAssignedRole('operator')}
                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                      assignedRole === 'operator'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                        : 'border-slate-200 dark:border-[#23293D] hover:bg-slate-50 dark:hover:bg-[#151928]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs">Operator Pit Bay</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Memanggil antrean ke pit, kelola status pencucian
                        </div>
                      </div>
                    </div>
                    {assignedRole === 'operator' && <CheckCircle className="w-4 h-4 text-amber-500" />}
                  </label>

                  <label
                    onClick={() => setAssignedRole('admin')}
                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                      assignedRole === 'admin'
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200'
                        : 'border-slate-200 dark:border-[#23293D] hover:bg-slate-50 dark:hover:bg-[#151928]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs">Administrator Utama</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Akses penuh manajemen, laporan keuangan, pengaturan sistem
                        </div>
                      </div>
                    </div>
                    {assignedRole === 'admin' && <CheckCircle className="w-4 h-4 text-purple-500" />}
                  </label>

                  <label
                    onClick={() => setAssignedRole('pengguna')}
                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                      assignedRole === 'pengguna'
                        ? 'border-slate-500 bg-slate-100 dark:bg-slate-800/40 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-[#23293D] hover:bg-slate-50 dark:hover:bg-[#151928]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs">Pengguna Biasa (Pelanggan)</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Hanya akses portal antrean pelanggan
                        </div>
                      </div>
                    </div>
                    {assignedRole === 'pengguna' && <CheckCircle className="w-4 h-4 text-slate-500" />}
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-[#1E2436]">
                <button
                  type="button"
                  onClick={() => setRoleAssignUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#23293D] text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#151928] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Simpan Peran Petugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2436] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Rahmawati"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151928] border border-slate-200 dark:border-[#23293D] rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Login *
                </label>
                <input
                  type="email"
                  required
                  placeholder="kasir2@antrean.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151928] border border-slate-200 dark:border-[#23293D] rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {editingUser ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Akun *'}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? '••••••••' : 'Minimal 4 karakter'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151928] border border-slate-200 dark:border-[#23293D] rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Peran (Role)
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as AppUserRole)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#151928] border border-slate-200 dark:border-[#23293D] rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  >
                    <option value="kasir">Petugas Kasir</option>
                    <option value="operator">Operator Pit</option>
                    <option value="admin">Administrator</option>
                    <option value="pengguna">Pengguna Biasa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Status Akun
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AppUserStatus)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#151928] border border-slate-200 dark:border-[#23293D] rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nomor HP / WhatsApp (Opsional)
                </label>
                <input
                  type="tel"
                  placeholder="0812-xxxx-xxxx"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151928] border border-slate-200 dark:border-[#23293D] rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-[#1E2436]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#23293D] text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#151928] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md cursor-pointer"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2.5 text-indigo-600 dark:text-indigo-400">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Ganti Kata Sandi
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Masukkan kata sandi baru untuk akun <b className="text-slate-800 dark:text-slate-200">{resetModalUser.name}</b> ({resetModalUser.email}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password baru..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151928] border border-slate-200 dark:border-[#23293D] rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetModalUser(null);
                    setNewPassword('');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#23293D] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#151928]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
