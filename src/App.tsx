import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardAdminView } from './components/DashboardAdminView.tsx';
import { AdminQueuesView } from './components/AdminQueuesView.tsx';
import { AdminPitView } from './components/AdminPitView.tsx';
import { AdminPitManageView } from './components/AdminPitManageView.tsx';
import { AdminServicesView } from './components/AdminServicesView.tsx';
import { AdminReportsView } from './components/AdminReportsView.tsx';
import { AdminUsersView } from './components/AdminUsersView.tsx';
import { AdminSettingsView } from './components/AdminSettingsView.tsx';
import { CustomerCheckView } from './components/CustomerCheckView.tsx';
import { CustomerRegisterView } from './components/CustomerRegisterView.tsx';
import { TVDisplayView } from './components/TVDisplayView.tsx';
import { LoginView } from './components/LoginView.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { ReceiptModal } from './components/ReceiptModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { CashierAddModal } from './components/CashierAddModal.tsx';
import { Toast } from './components/Toast.tsx';

import {
  QueueItem,
  ServiceItem,
  PitItem,
  StoreSettings,
  AppUser,
  UserRole,
  AdminView,
  CustomerView,
  ToastNotification,
  ConfirmModalData,
  MotorType,
  QueueStatus,
  AuthUser,
  EmailNotificationType
} from './types.ts';

import {
  INITIAL_QUEUES,
  INITIAL_SERVICES,
  INITIAL_PITS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  STORAGE_KEYS,
  loadStoredData,
  saveStoredData
} from './utils/storage.ts';

import { announceQueueVoice, playAirportChime, setAudioMuted } from './utils/audio.ts';
import { triggerQueueEmail } from './utils/resendClient.ts';
import { getEmailTypeLabel } from './utils/emailTemplates.ts';
import {
  getSupabaseClient,
  testSupabaseConnection,
  syncQueuesFromSupabase,
  syncServicesFromSupabase,
  syncPitsFromSupabase,
  syncUsersFromSupabase,
  syncSettingsFromSupabase,
  upsertQueueToSupabase,
  deleteQueueFromSupabase,
  upsertServiceToSupabase,
  deleteServiceFromSupabase,
  upsertPitToSupabase,
  deletePitFromSupabase,
  upsertUserToSupabase,
  deleteUserFromSupabase,
  upsertSettingsToSupabase
} from './utils/supabase.ts';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return loadStoredData<boolean>(STORAGE_KEYS.THEME, true);
  });

  // Sound Mute State
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return loadStoredData<boolean>(STORAGE_KEYS.MUTED, false);
  });

  // Layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Authentication State
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = loadStoredData<AuthUser | null>(STORAGE_KEYS.AUTH_USER, null);
    return saved && saved.is_logged_in ? saved : null;
  });

  // Role and Navigation
  // Automatically restore active role and view if user is already logged in
  const [role, setRole] = useState<UserRole>(() => {
    const savedUser = loadStoredData<AuthUser | null>(STORAGE_KEYS.AUTH_USER, null);
    if (savedUser && savedUser.is_logged_in) {
      const savedRole = loadStoredData<UserRole | null>(STORAGE_KEYS.ROLE, null);
      if (savedRole) return savedRole;
      return savedUser.role === 'pengguna' ? 'pelanggan' : 'admin';
    }
    return 'pelanggan';
  });

  const [currentView, setCurrentView] = useState<AdminView | CustomerView>(() => {
    const savedUser = loadStoredData<AuthUser | null>(STORAGE_KEYS.AUTH_USER, null);
    if (savedUser && savedUser.is_logged_in) {
      const savedView = loadStoredData<AdminView | CustomerView | null>(
        STORAGE_KEYS.CURRENT_VIEW,
        null
      );
      if (savedView && savedView !== 'login') {
        return savedView;
      }
      // Fallback default view based on user role
      if (savedUser.role === 'pengguna') return 'check';
      if (savedUser.role === 'operator') return 'pit';
      if (savedUser.role === 'kasir') return 'queues';
      return 'dashboard';
    }
    return 'login';
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Primary Data State
  const [queues, setQueues] = useState<QueueItem[]>(() => {
    return loadStoredData<QueueItem[]>(STORAGE_KEYS.QUEUES, INITIAL_QUEUES);
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    return loadStoredData<ServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  });

  const [pits, setPits] = useState<PitItem[]>(() => {
    return loadStoredData<PitItem[]>(STORAGE_KEYS.PITS, INITIAL_PITS);
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    return loadStoredData<AppUser[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    return loadStoredData<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  });

  // Supabase Connection State
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  // UI Modals & Feedback
  const [receiptData, setReceiptData] = useState<QueueItem | null>(null);
  const [paymentQueueData, setPaymentQueueData] = useState<QueueItem | null>(null);
  const [isCashierAddOpen, setIsCashierAddOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData>({
    isOpen: false,
    title: '',
    message: '',
    action: null
  });
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Toast Helper
  const showToast = useCallback(
    (msg: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
      const id = Date.now().toString();
      setToast({ id, msg, type });
      setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 4000);
    },
    []
  );

  // Synchronize Dark mode class with documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveStoredData(STORAGE_KEYS.THEME, isDarkMode);
  }, [isDarkMode]);

  // Synchronize Sound Mute setting
  useEffect(() => {
    setAudioMuted(isMuted);
    saveStoredData(STORAGE_KEYS.MUTED, isMuted);
  }, [isMuted]);

  // Persist State to Local Storage
  useEffect(() => {
    saveStoredData(STORAGE_KEYS.QUEUES, queues);
  }, [queues]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.SERVICES, services);
  }, [services]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.PITS, pits);
  }, [pits]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.USERS, users);
  }, [users]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.AUTH_USER, authUser);
  }, [authUser]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.ROLE, role);
  }, [role]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.CURRENT_VIEW, currentView);
  }, [currentView]);

  // Initial Supabase Load and Real-time Subscription Setup
  useEffect(() => {
    let activeChannel: any = null;

    const setupSupabase = async () => {
      const testRes = await testSupabaseConnection();
      setIsSupabaseConnected(testRes.success);

      if (!testRes.success) return;

      // 1. Fetch live records from Supabase
      try {
        const [remoteQueues, remoteServices, remotePits, remoteUsers, remoteSettings] =
          await Promise.all([
            syncQueuesFromSupabase(),
            syncServicesFromSupabase(),
            syncPitsFromSupabase(),
            syncUsersFromSupabase(),
            syncSettingsFromSupabase()
          ]);

        if (remoteQueues && remoteQueues.length > 0) setQueues(remoteQueues);
        if (remoteServices && remoteServices.length > 0) setServices(remoteServices);
        if (remotePits && remotePits.length > 0) setPits(remotePits);
        if (remoteUsers && remoteUsers.length > 0) {
          setUsers((prevLocalUsers) => {
            const userMap = new Map<string, AppUser>();
            // Keep local users first
            prevLocalUsers.forEach((u) => userMap.set(u.email.toLowerCase(), u));
            // Merge remote users
            remoteUsers.forEach((u) => userMap.set(u.email.toLowerCase(), u));
            return Array.from(userMap.values());
          });
        }
        if (remoteSettings) setSettings(remoteSettings);
      } catch (err) {
        console.warn('Error fetching initial Supabase data', err);
      }

      // 2. Realtime Subscription Channel
      const supabase = getSupabaseClient();
      if (supabase) {
        // Clean up any stale channels before creating a new channel
        const existingChannels = supabase.getChannels();
        for (const ch of existingChannels) {
          supabase.removeChannel(ch);
        }

        const channelName = `antrean_changes_${Date.now()}`;
        activeChannel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'queues' },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setQueues((prev) => {
                  if (prev.some((q) => q.id === payload.new.id)) return prev;
                  return [payload.new as QueueItem, ...prev];
                });
              } else if (payload.eventType === 'UPDATE') {
                setQueues((prev) =>
                  prev.map((q) => (q.id === payload.new.id ? (payload.new as QueueItem) : q))
                );
              } else if (payload.eventType === 'DELETE') {
                setQueues((prev) => prev.filter((q) => q.id !== payload.old.id));
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'services' },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setServices((prev) => {
                  if (prev.some((s) => s.id === payload.new.id)) return prev;
                  return [...prev, payload.new as ServiceItem];
                });
              } else if (payload.eventType === 'UPDATE') {
                setServices((prev) =>
                  prev.map((s) => (s.id === payload.new.id ? (payload.new as ServiceItem) : s))
                );
              } else if (payload.eventType === 'DELETE') {
                setServices((prev) => prev.filter((s) => s.id !== payload.old.id));
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'pits' },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setPits((prev) => {
                  if (prev.some((p) => p.id === payload.new.id)) return prev;
                  return [...prev, payload.new as PitItem];
                });
              } else if (payload.eventType === 'UPDATE') {
                setPits((prev) =>
                  prev.map((p) => (p.id === payload.new.id ? (payload.new as PitItem) : p))
                );
              } else if (payload.eventType === 'DELETE') {
                setPits((prev) => prev.filter((p) => p.id !== payload.old.id));
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'users' },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setUsers((prev) => {
                  if (prev.some((u) => u.id === payload.new.id)) return prev;
                  return [...prev, payload.new as AppUser];
                });
              } else if (payload.eventType === 'UPDATE') {
                setUsers((prev) =>
                  prev.map((u) => (u.id === payload.new.id ? (payload.new as AppUser) : u))
                );
              } else if (payload.eventType === 'DELETE') {
                setUsers((prev) => prev.filter((u) => u.id !== payload.old.id));
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'store_settings' },
            (payload) => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                setSettings((prev) => ({
                  ...prev,
                  nama_usaha: payload.new.nama_usaha || prev.nama_usaha,
                  tagline: payload.new.tagline ?? prev.tagline,
                  alamat: payload.new.alamat ?? prev.alamat,
                  telepon: payload.new.telepon ?? prev.telepon,
                  footer_struk: payload.new.footer_struk ?? prev.footer_struk,
                  auto_voice: payload.new.auto_voice ?? prev.auto_voice
                }));
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsSupabaseConnected(true);
            }
          });
      }
    };

    setupSupabase();

    return () => {
      if (activeChannel) {
        const client = getSupabaseClient();
        client?.removeChannel(activeChannel);
      }
    };
  }, []);

  // Handle Login & Logout
  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    saveStoredData(STORAGE_KEYS.AUTH_USER, user);

    let nextRole: UserRole = 'admin';
    let nextView: AdminView | CustomerView = 'dashboard';

    if (user.role === 'pengguna') {
      nextRole = 'pelanggan';
      nextView = 'check';
      showToast(`Selamat datang ${user.name}! Akun Anda aktif sebagai Pengguna.`, 'info');
    } else if (user.role === 'operator') {
      nextRole = 'admin';
      nextView = 'pit';
      showToast(`Selamat datang ${user.name}! Anda masuk sebagai Operator Pit Bay.`, 'success');
    } else if (user.role === 'kasir') {
      nextRole = 'admin';
      nextView = 'queues';
      showToast(`Selamat datang ${user.name}! Anda masuk sebagai Petugas Kasir.`, 'success');
    } else {
      nextRole = 'admin';
      nextView = 'dashboard';
      showToast(`Selamat datang kembali, ${user.name}! (Administrator)`, 'success');
    }

    setRole(nextRole);
    setCurrentView(nextView);
    saveStoredData(STORAGE_KEYS.ROLE, nextRole);
    saveStoredData(STORAGE_KEYS.CURRENT_VIEW, nextView);
  };

  const handleLogout = () => {
    setAuthUser(null);
    setRole('pelanggan');
    setCurrentView('login');
    saveStoredData(STORAGE_KEYS.AUTH_USER, null);
    saveStoredData(STORAGE_KEYS.ROLE, 'pelanggan');
    saveStoredData(STORAGE_KEYS.CURRENT_VIEW, 'login');
    showToast('Anda telah berhasil keluar (Logout).', 'info');
  };

  const handleNavigateToLogin = () => {
    setCurrentView('login');
  };

  // Send Email Notification Handler
  const handleSendEmailNotification = async (
    type: EmailNotificationType,
    queue: QueueItem,
    options?: { silent?: boolean }
  ) => {
    if (!queue.email || !queue.email.trim()) {
      if (!options?.silent) {
        showToast('Pelanggan ini tidak mencantumkan email.', 'warning');
      }
      return;
    }

    const res = await triggerQueueEmail(type, queue, services, pits, settings);
    if (res.success) {
      const nowIso = new Date().toISOString();
      const updated: QueueItem = {
        ...queue,
        last_email_sent: type,
        last_email_sent_at: nowIso
      };
      setQueues((prev) => prev.map((q) => (q.id === queue.id ? updated : q)));
      upsertQueueToSupabase(updated);

      if (!options?.silent) {
        showToast(
          `Email ${getEmailTypeLabel(type)} berhasil dikirim ke ${queue.email}!`,
          'success'
        );
      }
    } else {
      if (res.error !== 'DISABLED') {
        showToast(`Notifikasi Email (${getEmailTypeLabel(type)}): ${res.message}`, 'warning');
      }
    }
  };

  // Add Queue
  const handleAddQueue = async (data: {
    nama_pemohon: string;
    email?: string;
    phone?: string;
    tipe_motor?: MotorType;
    layanan_id: string;
    pit_id?: string | null;
    notes?: string;
  }): Promise<QueueItem> => {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch latest live queues from Supabase if connected to avoid ticket sequence race conditions
    let liveQueuesList = queues;
    if (isSupabaseConnected) {
      try {
        const live = await syncQueuesFromSupabase();
        if (live && live.length > 0) {
          liveQueuesList = live;
        }
      } catch (err) {
        console.warn('Fallback calculating sequence from local state', err);
      }
    }

    const todayQueues = liveQueuesList.filter((q) => q.created_at && q.created_at.startsWith(today));
    const nextNumber = todayQueues.length + 1;
    const nomor_antrian = `A${String(nextNumber).padStart(3, '0')}`;

    const service = services.find((s) => s.id === data.layanan_id);
    const vehicleType = data.tipe_motor || 'kecil';
    const total_biaya = service
      ? vehicleType === 'mobil'
        ? service.harga_mobil || service.harga_besar || service.harga || 0
        : vehicleType === 'besar'
        ? service.harga_besar || service.harga || 0
        : service.harga_kecil || service.harga || 0
      : 0;

    const newQueue: QueueItem = {
      id: `q-${Date.now()}`,
      nomor_antrian,
      nama_pemohon: data.nama_pemohon,
      email: data.email ? data.email.trim() : undefined,
      phone: data.phone ? data.phone.trim() : undefined,
      tipe_motor: vehicleType,
      layanan_id: data.layanan_id,
      total_biaya,
      status: 'waiting',
      pit_id: data.pit_id || null,
      notes: data.notes || '',
      is_paid: false,
      created_at: new Date().toISOString()
    };

    // Update state immediately
    setQueues((prev) => [newQueue, ...prev.filter((q) => q.id !== newQueue.id)]);

    // Persist directly to Supabase cloud
    const savedToCloud = await upsertQueueToSupabase(newQueue);
    if (savedToCloud) {
      console.log(`[Supabase] Tiket ${nomor_antrian} berhasil disimpan ke tabel queues di Supabase Cloud.`);
    }

    // Auto-send Email Stage 1: ticket_created
    if (newQueue.email) {
      handleSendEmailNotification('ticket_created', newQueue, { silent: false });
    }

    if (settings.auto_voice && !isMuted) {
      playAirportChime();
      setTimeout(() => {
        announceQueueVoice(
          `Nomor antrean baru ${nomor_antrian} atas nama ${data.nama_pemohon} telah didaftarkan.`
        );
      }, 700);
    }

    showToast(
      `Antrean ${nomor_antrian} berhasil didaftarkan${savedToCloud ? ' (Tersimpan di Supabase Cloud)' : ''}!`,
      'success'
    );
    return newQueue;
  };

  // Update Status
  const handleUpdateStatus = (
    queueId: string,
    newStatus: QueueStatus,
    targetPitId?: string | null
  ) => {
    const queue = queues.find((q) => q.id === queueId);
    if (!queue) return;

    const updatedQueue: QueueItem = {
      ...queue,
      status: newStatus,
      pit_id: targetPitId !== undefined ? targetPitId : queue.pit_id,
      washed_at:
        newStatus === 'washing' && !queue.washed_at ? new Date().toISOString() : queue.washed_at,
      completed_at:
        (newStatus === 'done' || newStatus === 'waiting_payment' || newStatus === 'cancelled') &&
        !queue.completed_at
          ? new Date().toISOString()
          : queue.completed_at
    };

    setQueues((prev) => prev.map((q) => (q.id === queueId ? updatedQueue : q)));
    upsertQueueToSupabase(updatedQueue);

    // Auto-send Email Stage 3: calling_pit (saat masuk pit cuci)
    if (newStatus === 'washing' && updatedQueue.email) {
      handleSendEmailNotification('calling_pit', updatedQueue, { silent: false });

      // Auto-send Email Stage 2: upcoming_call (peringatan untuk antrean berikutnya yang sedang menunggu)
      const nextWaitingQueue = queues
        .filter((q) => q.id !== queueId && q.status === 'waiting')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

      if (
        nextWaitingQueue &&
        nextWaitingQueue.email &&
        nextWaitingQueue.last_email_sent !== 'upcoming_call' &&
        nextWaitingQueue.last_email_sent !== 'calling_pit'
      ) {
        handleSendEmailNotification('upcoming_call', nextWaitingQueue, { silent: false });
      }
    }

    // Auto-send Email Stage 4: completed_paid (jika status diset selesai & sudah lunas)
    if (newStatus === 'done' && updatedQueue.is_paid && updatedQueue.email) {
      handleSendEmailNotification('completed_paid', updatedQueue, { silent: false });
    }

    // Audio announcements
    if (settings.auto_voice && !isMuted) {
      if (newStatus === 'washing') {
        const pit = pits.find((p) => p.id === (targetPitId || queue.pit_id));
        const pitName = pit ? pit.nama_pit : 'area pencucian';
        playAirportChime();
        setTimeout(() => {
          announceQueueVoice(
            `Panggilan nomor antrean ${queue.nomor_antrian}, atas nama ${queue.nama_pemohon}, silakan menuju ${pitName}.`
          );
        }, 700);
      } else if (newStatus === 'done' || newStatus === 'waiting_payment') {
        playAirportChime();
        setTimeout(() => {
          announceQueueVoice(
            `Nomor antrean ${queue.nomor_antrian}, atas nama ${queue.nama_pemohon}, proses pencucian telah selesai. Silakan menuju kasir.`
          );
        }, 700);
      }
    }

    showToast(`Status antrean ${queue.nomor_antrian} diperbarui.`, 'info');
  };

  // Call Next in Pit
  const handleCallNext = (pitId: string) => {
    const pit = pits.find((p) => p.id === pitId);
    if (!pit) return;

    // Find first waiting queue matching pit or unassigned
    const nextQueue = queues
      .filter((q) => q.status === 'waiting' && (!q.pit_id || q.pit_id === pitId))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

    if (!nextQueue) {
      showToast(`Tidak ada antrean menunggu untuk ${pit.nama_pit}.`, 'warning');
      return;
    }

    handleUpdateStatus(nextQueue.id, 'washing', pitId);
    showToast(`Memanggil antrean ${nextQueue.nomor_antrian} ke ${pit.nama_pit}.`, 'success');
  };

  // Delete Queue
  const handleDeleteQueue = (queueId: string) => {
    const queue = queues.find((q) => q.id === queueId);
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Antrean',
      message: `Apakah Anda yakin ingin menghapus antrean ${queue?.nomor_antrian || ''} (${
        queue?.nama_pemohon || ''
      })? Tindakan ini tidak dapat dibatalkan.`,
      action: () => {
        setQueues((prev) => prev.filter((q) => q.id !== queueId));
        deleteQueueFromSupabase(queueId);
        setConfirmModal({ isOpen: false, title: '', message: '', action: null });
        showToast('Data antrean berhasil dihapus.', 'info');
      }
    });
  };

  // Confirm Payment
  const handleConfirmPayment = (queueId: string) => {
    const queue = queues.find((q) => q.id === queueId);
    if (!queue) return;

    const updatedQueue: QueueItem = {
      ...queue,
      status: 'done',
      is_paid: true,
      paid_at: new Date().toISOString(),
      cashier_name: authUser?.name || 'Kasir'
    };

    setQueues((prev) => prev.map((q) => (q.id === queueId ? updatedQueue : q)));
    upsertQueueToSupabase(updatedQueue);

    // Auto-send Email Stage 4: completed_paid (kwitansi lunas)
    if (updatedQueue.email) {
      handleSendEmailNotification('completed_paid', updatedQueue, { silent: false });
    }

    setPaymentQueueData(null);
    setReceiptData(updatedQueue);
    showToast(`Pembayaran antrean ${queue.nomor_antrian} berhasil dikonfirmasi!`, 'success');
  };

  // Master Pit CRUD
  const handleAddPit = (newPitData: Omit<PitItem, 'id'>) => {
    const newPit: PitItem = {
      ...newPitData,
      id: `pit-${Date.now()}`
    };
    setPits((prev) => [...prev, newPit]);
    upsertPitToSupabase(newPit);
    showToast(`Pit ${newPit.nama_pit} berhasil ditambahkan!`, 'success');
  };

  const handleUpdatePit = (id: string, updated: Partial<PitItem>) => {
    setPits((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const item = { ...p, ...updated };
          upsertPitToSupabase(item);
          return item;
        }
        return p;
      })
    );
    showToast('Data Pit berhasil diperbarui!', 'success');
  };

  const handleDeletePit = (pitId: string) => {
    const pit = pits.find((p) => p.id === pitId);
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Master Pit Bay',
      message: `Apakah Anda yakin ingin menghapus pit "${
        pit?.nama_pit || ''
      }"? Pastikan tidak ada antrean aktif pada pit ini.`,
      action: () => {
        setPits((prev) => prev.filter((p) => p.id !== pitId));
        deletePitFromSupabase(pitId);
        setConfirmModal({ isOpen: false, title: '', message: '', action: null });
        showToast('Pit berhasil dihapus.', 'info');
      }
    });
  };

  // User Management CRUD
  const handleAddUser = async (newUserData: Omit<AppUser, 'id'> & { id?: string }) => {
    const newUser: AppUser = {
      ...newUserData,
      id: newUserData.id || `usr-${Date.now()}`
    };
    setUsers((prev) => {
      const exists = prev.some(
        (u) => u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase()
      );
      if (exists) {
        return prev.map((u) =>
          u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase() ? newUser : u
        );
      }
      return [...prev, newUser];
    });
    await upsertUserToSupabase(newUser);
  };

  const handleRefreshUsers = async () => {
    try {
      const remoteUsers = await syncUsersFromSupabase();
      if (remoteUsers && remoteUsers.length > 0) {
        setUsers((prevLocalUsers) => {
          const userMap = new Map<string, AppUser>();
          prevLocalUsers.forEach((u) => userMap.set(u.email.toLowerCase(), u));
          remoteUsers.forEach((u) => userMap.set(u.email.toLowerCase(), u));
          return Array.from(userMap.values());
        });
        showToast(`Berhasil menyinkronkan ${remoteUsers.length} pengguna dari database Supabase!`, 'success');
      } else {
        showToast('Sinkronisasi selesai. Belum ada data pengguna tambahan di database.', 'info');
      }
    } catch (err: any) {
      showToast(`Gagal menyinkronkan pengguna: ${err?.message || 'Error koneksi'}`, 'error');
    }
  };

  const handleUpdateUser = (id: string, updated: Partial<AppUser>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const item = { ...u, ...updated };
          upsertUserToSupabase(item);
          return item;
        }
        return u;
      })
    );
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Pengguna',
      message: `Apakah Anda yakin ingin menghapus akun pengguna "${
        user?.name || ''
      }" (${user?.email || ''})? Tindakan ini tidak dapat dibatalkan.`,
      action: () => {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        deleteUserFromSupabase(userId);
        setConfirmModal({ isOpen: false, title: '', message: '', action: null });
        showToast('Pengguna berhasil dihapus.', 'info');
      }
    });
  };

  // Count summaries
  const waitingCount = queues.filter((q) => q.status === 'waiting').length;
  const waitingPaymentCount = queues.filter(
    (q) => q.status === 'waiting_payment' || (q.status === 'done' && !q.is_paid)
  );

  // If in login view, render clean full-screen Login & Register portal (No sidebar, no header)
  if (currentView === 'login') {
    return (
      <div className="min-h-screen w-full bg-slate-100 dark:bg-[#08090E] text-slate-800 dark:text-slate-100 overflow-y-auto">
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onBackToCustomer={() => {
            setRole('pelanggan');
            setCurrentView('check');
          }}
          isSupabaseConnected={isSupabaseConnected}
          onOpenSettings={() => setCurrentView('settings')}
          users={users}
          onRegisterUser={(newUser) => {
            handleAddUser(newUser);
            showToast(`Akun "${newUser.name}" berhasil didaftarkan!`, 'success');
          }}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onNavigateToTv={() => setCurrentView('tv')}
        />
        {/* Toast Alert */}
        <Toast toast={toast} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-[#08090E] text-slate-800 dark:text-slate-100">
      {/* Navigation Sidebar */}
      <Sidebar
        role={role}
        setRole={setRole}
        currentView={currentView}
        setCurrentView={setCurrentView}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileDrawerOpen={mobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
        waitingCount={waitingCount}
        waitingPaymentCount={waitingPaymentCount.length}
        authUser={authUser}
        onNavigateToLogin={handleNavigateToLogin}
        onLogout={handleLogout}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Header Bar */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
          isMuted={isMuted}
          onToggleMute={() => {
            const nextMuted = !isMuted;
            setIsMuted(nextMuted);
            setAudioMuted(nextMuted);
            showToast(
              nextMuted ? 'Suara speaker dibisukan (Muted).' : 'Suara speaker diaktifkan.',
              nextMuted ? 'warning' : 'info'
            );
          }}
          role={role}
          authUser={authUser}
          onNavigateToLogin={handleNavigateToLogin}
          isSupabaseConnected={isSupabaseConnected}
          onOpenSettings={() => {
            if (role !== 'admin' || !authUser?.is_logged_in) {
              handleNavigateToLogin();
            } else {
              setCurrentView('settings');
            }
          }}
        />

        {/* View Routing */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
          {/* Dashboard Overview (Admin & Kasir) */}
          {(authUser?.role === 'admin' || authUser?.role === 'kasir' || (role === 'admin' && authUser?.is_logged_in)) &&
            currentView === 'dashboard' && (
              <DashboardAdminView
                queues={queues}
                services={services}
                pits={pits}
                onDeleteQueue={handleDeleteQueue}
                onUpdateStatus={handleUpdateStatus}
                onOpenPaymentModal={(item) => setPaymentQueueData(item)}
                onPrintReceipt={(item) => setReceiptData(item)}
                searchQuery={searchQuery}
                setCurrentView={setCurrentView as (view: AdminView) => void}
                onOpenQuickAddModal={() => setIsCashierAddOpen(true)}
              />
            )}

          {/* Dedicated Queue & Cashier Menu (Admin & Kasir) */}
          {(authUser?.role === 'admin' || authUser?.role === 'kasir' || (role === 'admin' && authUser?.is_logged_in)) &&
            currentView === 'queues' && (
              <AdminQueuesView
                queues={queues}
                services={services}
                pits={pits}
                onUpdateStatus={handleUpdateStatus}
                onDeleteQueue={handleDeleteQueue}
                onOpenPaymentModal={(item) => setPaymentQueueData(item)}
                onPrintReceipt={(item) => setReceiptData(item)}
                onOpenQuickAddModal={() => setIsCashierAddOpen(true)}
                onSendEmailNotification={handleSendEmailNotification}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )}

          {/* Operational Pit Bay Console (Admin & Operator) */}
          {(authUser?.role === 'admin' || authUser?.role === 'operator' || (role === 'admin' && authUser?.is_logged_in)) &&
            currentView === 'pit' && (
              <AdminPitView
                queues={queues}
                services={services}
                pits={pits}
                onCallNext={handleCallNext}
                onUpdateStatus={handleUpdateStatus}
                onDeleteQueue={handleDeleteQueue}
                onPrintReceipt={(item) => setReceiptData(item)}
                onSendEmailNotification={handleSendEmailNotification}
              />
            )}

          {/* Master Pit CRUD Management (Admin Only) */}
          {authUser?.role === 'admin' && currentView === 'pit_manage' && (
            <AdminPitManageView
              pits={pits}
              queues={queues}
              services={services}
              onAddPit={handleAddPit}
              onUpdatePit={handleUpdatePit}
              onDeletePit={handleDeletePit}
              showToast={showToast}
            />
          )}

          {/* Services and Pricing CRUD (Admin Only) */}
          {authUser?.role === 'admin' && currentView === 'services' && (
            <AdminServicesView
              services={services}
              setServices={(newServices) => {
                setServices(newServices);
                if (typeof newServices === 'function') {
                  const resolved = newServices(services);
                  resolved.forEach((s) => upsertServiceToSupabase(s));
                } else {
                  newServices.forEach((s) => upsertServiceToSupabase(s));
                }
              }}
              showToast={showToast}
            />
          )}

          {/* Financial Reports & Transactions (Admin & Kasir) */}
          {(authUser?.role === 'admin' || authUser?.role === 'kasir') && currentView === 'reports' && (
            <AdminReportsView
              queues={queues}
              services={services}
              pits={pits}
              storeSettings={settings}
            />
          )}

          {/* User Management (Admin Only) */}
          {authUser?.role === 'admin' && currentView === 'users' && (
            <AdminUsersView
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onRefreshUsers={handleRefreshUsers}
              authUser={authUser}
              showToast={showToast}
              isSupabaseConnected={isSupabaseConnected}
            />
          )}

          {/* Business Profile, Receipt Settings & Supabase Configuration (Admin Only) */}
          {authUser?.role === 'admin' && currentView === 'settings' && (
            <AdminSettingsView
              settings={settings}
              setSettings={setSettings}
              queues={queues}
              setQueues={setQueues}
              services={services}
              setServices={setServices}
              pits={pits}
              setPits={setPits}
              users={users}
              setUsers={setUsers}
              showToast={showToast}
              isSupabaseConnected={isSupabaseConnected}
              setIsSupabaseConnected={setIsSupabaseConnected}
            />
          )}

          {/* Customer / User: Check Status */}
          {(!authUser?.is_logged_in || authUser?.role === 'pengguna') && currentView === 'check' && (
            <CustomerCheckView
              queues={queues}
              services={services}
              pits={pits}
              setCurrentView={setCurrentView as (view: CustomerView) => void}
              onPrintReceipt={(item) => setReceiptData(item)}
            />
          )}

          {/* Customer / User: Self Register */}
          {(!authUser?.is_logged_in || authUser?.role === 'pengguna') && currentView === 'register' && (
            <CustomerRegisterView
              services={services}
              onAddQueue={async (data) => {
                const created = await handleAddQueue(data);
                setCurrentView('tv');
                return created;
              }}
            />
          )}

          {/* TV Display Board for Waiting Room (Accessible to all roles) */}
          {currentView === 'tv' && (
            <TVDisplayView
              queues={queues}
              pits={pits}
              services={services}
            />
          )}
        </div>
      </main>

      {/* Cashier Quick Add Modal */}
      <CashierAddModal
        isOpen={isCashierAddOpen}
        onClose={() => setIsCashierAddOpen(false)}
        services={services}
        pits={pits}
        onAddQueue={handleAddQueue}
      />

      {/* Payment Processing Modal */}
      <PaymentModal
        queue={paymentQueueData}
        services={services}
        isOpen={!!paymentQueueData}
        onClose={() => setPaymentQueueData(null)}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Thermal Receipt Print Modal */}
      <ReceiptModal
        data={receiptData}
        services={services}
        pits={pits}
        settings={settings}
        onClose={() => setReceiptData(null)}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        data={confirmModal}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', action: null })}
      />

      {/* Toast Alert */}
      <Toast toast={toast} />
    </div>
  );
}
