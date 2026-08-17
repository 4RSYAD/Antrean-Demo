import { EmailNotificationPayload, QueueItem, ServiceItem, PitItem, StoreSettings, EmailNotificationType } from '../types.ts';

export interface SendEmailResult {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
}

export async function checkEmailStatus(): Promise<{ isConfigured: boolean; fromEmail: string }> {
  try {
    const res = await fetch('/api/email/status');
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch {
    return { isConfigured: false, fromEmail: 'onboarding@resend.dev' };
  }
}

export async function sendEmailNotification(
  payload: EmailNotificationPayload
): Promise<SendEmailResult> {
  try {
    if (!payload.to || !payload.to.includes('@')) {
      return {
        success: false,
        message: 'Pelanggan tidak memiliki alamat email yang valid.',
        error: 'Email tidak diisi'
      };
    }

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Gagal mengirim notifikasi email',
        error: data.error
      };
    }

    return {
      success: true,
      message: `Email notifikasi berhasil dikirim ke ${payload.to}`,
      data: data.data
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Koneksi ke server gagal saat mengirim email',
      error: err.message
    };
  }
}

/**
 * Helper to dispatch queue email notifications with auto-resolved service and pit objects
 */
export async function triggerQueueEmail(
  type: EmailNotificationType,
  queue: QueueItem,
  services: ServiceItem[],
  pits: PitItem[],
  storeSettings: StoreSettings,
  options?: { customNotes?: string; silent?: boolean }
): Promise<SendEmailResult> {
  if (!queue.email || !queue.email.trim()) {
    return {
      success: false,
      message: 'Antrean ini tidak memiliki data email pelanggan.',
      error: 'NO_EMAIL'
    };
  }

  // Check if store settings has email notifications enabled (default true)
  if (storeSettings.email_notifications_enabled === false) {
    return {
      success: false,
      message: 'Notifikasi email sedang dinonaktifkan di pengaturan.',
      error: 'DISABLED'
    };
  }

  const service = services.find((s) => s.id === queue.layanan_id);
  const pit = pits.find((p) => p.id === queue.pit_id);

  const payload: EmailNotificationPayload = {
    to: queue.email.trim(),
    type,
    queue,
    service,
    pit,
    storeSettings,
    customNotes: options?.customNotes
  };

  return await sendEmailNotification(payload);
}
