import { EmailNotificationPayload, QueueItem, ServiceItem, PitItem, StoreSettings, EmailNotificationType } from '../types.ts';
import { generateEmailHtml } from './emailTemplates.ts';

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

    // Pre-generate template HTML & subject on client
    let precalculatedSubject = '';
    let precalculatedHtml = '';
    let precalculatedText = '';
    try {
      const t = generateEmailHtml(payload);
      precalculatedSubject = t.subject;
      precalculatedHtml = t.html;
      precalculatedText = t.text;
    } catch (tmplErr) {
      console.warn('Template generation warning:', tmplErr);
    }

    const enhancedPayload = {
      ...payload,
      customSubject: precalculatedSubject,
      customHtml: precalculatedHtml,
      customText: precalculatedText,
      apiKeyOverride: payload.storeSettings?.resend_api_key,
      fromEmailOverride: payload.storeSettings?.resend_from_email
    };

    // 1. Try serverless / backend API endpoint first (/api/send-email)
    let apiError: string | null = null;
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enhancedPayload)
      });

      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        return {
          success: true,
          message: `Email notifikasi berhasil dikirim ke ${payload.to}`,
          data: data.data
        };
      }

      if (data?.error) {
        apiError = data.error;
      } else {
        apiError = `Server mengembalikan status HTTP ${response.status} (${response.statusText || 'Error'})`;
      }
    } catch (err: any) {
      apiError = err.message || 'Gagal menghubungi server endpoint';
    }

    // 2. Direct Resend API fallback if custom API Key is configured in settings
    const apiKey = payload.storeSettings?.resend_api_key;
    if (apiKey && apiKey.trim()) {
      try {
        const storeName = payload.storeSettings?.nama_usaha || 'Antrean Cuci';
        const rawFrom = payload.storeSettings?.resend_from_email || 'notif@antrean.online';
        const fromEmail = rawFrom.includes('<') ? rawFrom : `${storeName} <${rawFrom}>`;

        const directRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [payload.to.trim()],
            subject: precalculatedSubject,
            html: precalculatedHtml,
            text: precalculatedText
          })
        });

        const directData = await directRes.json().catch(() => null);
        if (directRes.ok && directData?.id) {
          return {
            success: true,
            message: `Email notifikasi berhasil dikirim via Resend ke ${payload.to}`,
            data: directData
          };
        }

        if (directData?.message) {
          return {
            success: false,
            message: directData.message,
            error: directData.message
          };
        }
      } catch (directErr: any) {
        console.warn('Direct Resend fallback failed:', directErr);
      }
    }

    return {
      success: false,
      message:
        apiError ||
        'Kunci RESEND_API_KEY belum dikonfigurasi. Silakan masukkan Resend API Key di menu Pengaturan Admin atau Environment Variables Vercel.',
      error: apiError || 'NO_API_KEY'
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
