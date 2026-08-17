import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';
import { generateEmailHtml } from './src/utils/emailTemplates.ts';
import { EmailNotificationPayload } from './src/types.ts';

function sanitizeSenderEmail(rawFrom?: string, storeName?: string): string {
  const fallbackEmail = 'notif@antrean.online';
  const cleanStoreName = (storeName || 'Antrean Cuci')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim() || 'Antrean Cuci';

  if (!rawFrom || !rawFrom.trim()) {
    return `${cleanStoreName} <${fallbackEmail}>`;
  }

  const trimmed = rawFrom.trim();

  // If already in format "Name <email@domain.com>" or Name <email@domain.com>
  const angleMatch = trimmed.match(/^([^<]*)<([^>]+)>$/);
  if (angleMatch) {
    const rawName = angleMatch[1].replace(/["']/g, '').replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    const email = angleMatch[2].trim();
    const name = rawName || cleanStoreName;
    return `${name} <${email}>`;
  }

  // If it's a plain email address e.g. "onboarding@resend.dev" or "cs@domain.com"
  if (trimmed.includes('@')) {
    return `${cleanStoreName} <${trimmed}>`;
  }

  return `${cleanStoreName} <${fallbackEmail}>`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      resendFromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    });
  });

  // Resend API Status endpoint
  app.get('/api/email/status', (req, res) => {
    res.json({
      isConfigured: Boolean(process.env.RESEND_API_KEY),
      fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    });
  });

  // Resend Send Email Endpoint
  app.post('/api/send-email', async (req, res) => {
    try {
      const {
        to,
        type,
        queue,
        service,
        pit,
        storeSettings,
        customNotes,
        apiKeyOverride,
        fromEmailOverride,
        customSubject,
        customHtml
      } = req.body as {
        to?: string | string[];
        type?: any;
        queue?: any;
        service?: any;
        pit?: any;
        storeSettings?: any;
        customNotes?: string;
        apiKeyOverride?: string;
        fromEmailOverride?: string;
        customSubject?: string;
        customHtml?: string;
      };

      const rawRecipient = to || queue?.email;
      if (!rawRecipient) {
        return res.status(400).json({
          success: false,
          error: 'Email tujuan (recipient email) tidak valid atau belum diisi.'
        });
      }

      const toList: string[] = Array.isArray(rawRecipient)
        ? rawRecipient.map((e) => String(e).trim()).filter((e) => e.includes('@'))
        : [String(rawRecipient).trim()].filter((e) => e.includes('@'));

      if (toList.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Format alamat email tujuan tidak valid.'
        });
      }

      const apiKey = apiKeyOverride || storeSettings?.resend_api_key || process.env.RESEND_API_KEY;
      if (!apiKey || !apiKey.trim()) {
        return res.status(400).json({
          success: false,
          error: 'RESEND_API_KEY belum dikonfigurasi di file environment (.env) atau Pengaturan.'
        });
      }

      const rawFrom = fromEmailOverride || storeSettings?.resend_from_email || process.env.RESEND_FROM_EMAIL;
      const fromEmail = sanitizeSenderEmail(rawFrom, storeSettings?.nama_usaha);

      // Generate HTML & Subject if not explicitly provided
      let subject = customSubject;
      let html = customHtml;
      let text = '';

      if (!html && type && queue) {
        const payload: EmailNotificationPayload = {
          to: toList[0],
          type,
          queue,
          service,
          pit,
          storeSettings,
          customNotes
        };
        const template = generateEmailHtml(payload);
        subject = subject || template.subject;
        html = template.html;
        text = template.text;
      }

      if (!subject || !html) {
        return res.status(400).json({
          success: false,
          error: 'Subject dan konten email (HTML) wajib ada.'
        });
      }

      // Initialize Resend lazily with cleaned key
      const resend = new Resend(apiKey.trim());

      const response = await resend.emails.send({
        from: fromEmail,
        to: toList,
        subject: subject,
        html: html,
        text: text || undefined
      });

      if (response.error) {
        console.error('[Resend Error]', JSON.stringify(response.error, null, 2));
        let friendlyMsg = response.error.message || 'Gagal mengirim email via Resend';
        if (response.error.name === 'validation_error') {
          if (response.error.message?.toLowerCase().includes('testing emails to your own email')) {
            friendlyMsg = `[Resend Sandbox] Domain pengujian (onboarding@resend.dev) hanya dapat mengirim ke email akun terdaftar Anda. Untuk mengirim ke semua email, silakan verifikasi domain Anda di resend.com. (${response.error.message})`;
          } else {
            friendlyMsg = `Validasi Resend gagal: ${response.error.message}`;
          }
        }
        return res.status(400).json({
          success: false,
          error: friendlyMsg,
          details: response.error
        });
      }

      console.log(`[Resend Success] Email sent to ${toList.join(', ')} (ID: ${response.data?.id})`);
      return res.json({
        success: true,
        data: response.data,
        message: `Email notifikasi berhasil dikirim ke ${toList.join(', ')}`
      });
    } catch (err: any) {
      console.error('[Server Email Exception]', err);
      const errMsg = err?.message || 'Terjadi kesalahan internal saat memproses pengiriman email';
      return res.status(500).json({
        success: false,
        error: errMsg
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
