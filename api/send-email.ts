import { Resend } from 'resend';

function formatRupiah(amount: number): string {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
}

function getVehicleLabel(type?: string): string {
  if (type === 'mobil') return 'Mobil';
  if (type === 'besar') return 'Motor Besar (Maxi/Moge)';
  return 'Motor Kecil / Reguler';
}

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

function generateSimpleEmailHtml(payload: any): { subject: string; html: string; text: string } {
  const { type, queue, service, pit, storeSettings, customNotes } = payload;
  const storeName = storeSettings?.nama_usaha || 'Sistem Antrean Cuci Kendaraan';
  const customerName = queue?.nama_pemohon || 'Pelanggan';
  const queueNo = queue?.nomor_antrian || '-';
  const serviceName = service?.nama_layanan || 'Paket Cuci Kendaraan';
  const pitName = pit?.nama_pit || 'Area Pit Cuci';
  const vehicleLabel = getVehicleLabel(queue?.tipe_motor);
  const costStr = formatRupiah(queue?.total_biaya || 0);

  let subject = `[${storeName}] Update Antrean #${queueNo}`;
  let title = 'Informasi Antrean Kendaraan';
  let message = `Nomor antrean Anda adalah <strong>${queueNo}</strong>.`;

  if (type === 'ticket_created') {
    subject = `[${storeName}] Tiket Antrean #${queueNo} Berhasil Dibuat`;
    title = 'Tiket Antrean Terdaftar';
    message = `Halo <strong>${customerName}</strong>, tiket antrean cuci kendaraan Anda telah berhasil dibuat. Silakan bersantai di ruang tunggu.`;
  } else if (type === 'upcoming_call') {
    subject = `[${storeName}] Persiapan! Antrean #${queueNo} Sebentar Lagi Dipanggil`;
    title = 'Persiapan Masuk Pit';
    message = `Halo <strong>${customerName}</strong>, nomor antrean Anda (<strong>${queueNo}</strong>) sudah mendekati giliran berikutnya. Mohon bersiap menuju area cuci.`;
  } else if (type === 'calling_pit') {
    subject = `[${storeName}] PANGGILAN! Antrean #${queueNo} Silakan Masuk ke ${pitName}`;
    title = `Silakan Masuk ke ${pitName}`;
    message = `Halo <strong>${customerName}</strong>, giliran Anda telah tiba! Silakan bawa kendaraan Anda masuk ke <strong>${pitName}</strong>.`;
  } else if (type === 'completed_paid') {
    subject = `[${storeName}] Selesai & Lunas: Kwitansi Digital #${queueNo}`;
    title = 'Pencucian Selesai & Pembayaran Diterima';
    message = `Halo <strong>${customerName}</strong>, pencucian kendaraan Anda telah selesai dan pembayaran telah lunas. Terima kasih atas kunjungan Anda!`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>${subject}</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; color: #1f2937;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="background: #10b981; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800;">${storeName}</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">${title}</p>
          </div>
          <div style="padding: 24px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-weight: 800; font-size: 20px; padding: 8px 20px; border-radius: 9999px;">
                #${queueNo}
              </span>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #374151;">${message}</p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280;">Nama:</span>
                <strong>${customerName}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280;">Kendaraan:</span>
                <strong>${vehicleLabel}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280;">Layanan:</span>
                <strong>${serviceName}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280;">Total Biaya:</span>
                <strong style="color: #059669;">${costStr}</strong>
              </div>
            </div>
            ${customNotes ? `<p style="font-size: 12px; color: #6b7280; font-style: italic;">Catatan: ${customNotes}</p>` : ''}
          </div>
          <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
            ${storeName} &bull; Email dikirim otomatis oleh Sistem Antrean Cuci Kendaraan.
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html, text: `${title}: ${message} (Nomor Antrean: ${queueNo}, Layanan: ${serviceName}, Biaya: ${costStr})` };
}

export default async function handler(req: any, res: any) {
  // CORS Headers
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
    // Parse body safely
    let parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch {
        // use raw
      }
    }

    if (!parsedBody || typeof parsedBody !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Format request body tidak valid atau kosong.'
      });
    }

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
      customHtml,
      customText
    } = parsedBody;

    const rawRecipient = to || queue?.email;
    if (!rawRecipient) {
      return res.status(400).json({
        success: false,
        error: 'Email tujuan (recipient email) tidak valid atau belum diisi.'
      });
    }

    const toList: string[] = Array.isArray(rawRecipient)
      ? rawRecipient.map((e: any) => String(e).trim()).filter((e: string) => e.includes('@'))
      : [String(rawRecipient).trim()].filter((e: string) => e.includes('@'));

    if (toList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Format alamat email tujuan tidak valid.'
      });
    }

    // Determine API Key priority:
    // 1. apiKeyOverride (from request)
    // 2. storeSettings.resend_api_key (from app database)
    // 3. process.env.RESEND_API_KEY (from Vercel environment)
    const apiKey =
      apiKeyOverride ||
      storeSettings?.resend_api_key ||
      process.env.RESEND_API_KEY;

    if (!apiKey || !String(apiKey).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Kunci RESEND_API_KEY belum dikonfigurasi. Harap masukkan API Key di menu Pengaturan Admin > Notifikasi Email Resend, atau di Environment Variables Vercel.'
      });
    }

    const rawFrom =
      fromEmailOverride ||
      storeSettings?.resend_from_email ||
      process.env.RESEND_FROM_EMAIL;
    const fromEmail = sanitizeSenderEmail(rawFrom, storeSettings?.nama_usaha);

    let subject = customSubject;
    let html = customHtml;
    let text = customText || '';

    if (!html) {
      const generated = generateSimpleEmailHtml({
        type,
        queue,
        service,
        pit,
        storeSettings,
        customNotes
      });
      subject = subject || generated.subject;
      html = generated.html;
      text = text || generated.text;
    }

    if (!subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Subject dan isi konten email wajib ada.'
      });
    }

    // Initialize Resend Client
    const resend = new Resend(String(apiKey).trim());

    const response = await resend.emails.send({
      from: fromEmail,
      to: toList,
      subject: subject,
      html: html,
      text: text || undefined
    });

    if (response.error) {
      console.error('[Resend Error Response]', response.error);
      let friendlyMsg = response.error.message || 'Gagal mengirim email via Resend';
      if (response.error.name === 'validation_error') {
        if (response.error.message?.toLowerCase().includes('testing emails to your own email')) {
          friendlyMsg = `[Resend Sandbox] Domain pengujian (onboarding@resend.dev) hanya dapat mengirim ke email akun Resend terdaftar Anda. Untuk mengirim ke semua email, verifikasi domain Anda di resend.com/domains. (${response.error.message})`;
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

    return res.status(200).json({
      success: true,
      data: response.data,
      message: `Email notifikasi berhasil dikirim ke ${toList.join(', ')}`
    });
  } catch (err: any) {
    console.error('[Serverless Handler Exception]', err);
    return res.status(500).json({
      success: false,
      error: `Kesalahan pada Serverless Function: ${err?.message || 'Internal error'}`
    });
  }
}
