import { Resend } from 'resend';
import { generateEmailHtml } from '../src/utils/emailTemplates.ts';
import { EmailNotificationPayload } from '../src/types.ts';

function sanitizeSenderEmail(rawFrom?: string, storeName?: string): string {
  const fallbackEmail = 'notif@antrean.online';
  const cleanStoreName = (storeName || 'Antrean Cuci')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim() || 'Antrean Cuci';

  if (!rawFrom || !rawFrom.trim()) {
    return `${cleanStoreName} <${fallbackEmail}>`;
  }

  const trimmed = rawFrom.trim();
  const angleMatch = trimmed.match(/^([^<]*)<([^>]+)>$/);
  if (angleMatch) {
    const rawName = angleMatch[1].replace(/["']/g, '').replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    const email = angleMatch[2].trim();
    const name = rawName || cleanStoreName;
    return `${name} <${email}>`;
  }

  if (trimmed.includes('@')) {
    return `${cleanStoreName} <${trimmed}>`;
  }

  return `${cleanStoreName} <${fallbackEmail}>`;
}

export default async function handler(req: any, res: any) {
  // Enable CORS for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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
        error: 'RESEND_API_KEY belum dikonfigurasi di Environment Variables Vercel atau Pengaturan Toko.'
      });
    }

    const rawFrom = fromEmailOverride || storeSettings?.resend_from_email || process.env.RESEND_FROM_EMAIL;
    const fromEmail = sanitizeSenderEmail(rawFrom, storeSettings?.nama_usaha);

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

    const resend = new Resend(apiKey.trim());

    const response = await resend.emails.send({
      from: fromEmail,
      to: toList,
      subject: subject,
      html: html,
      text: text || undefined
    });

    if (response.error) {
      console.error('[Resend Vercel Error]', response.error);
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

    return res.json({
      success: true,
      data: response.data,
      message: `Email notifikasi berhasil dikirim ke ${toList.join(', ')}`
    });
  } catch (err: any) {
    console.error('[Vercel Serverless Email Exception]', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Terjadi kesalahan internal saat memproses pengiriman email di Vercel'
    });
  }
}
