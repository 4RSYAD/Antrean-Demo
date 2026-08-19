import { EmailNotificationPayload } from '../types.ts';

export function formatRupiah(amount: number): string {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
}

export function formatDateTimeIndo(isoStr?: string): string {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoStr;
  }
}

export function getVehicleLabel(type: string): string {
  if (type === 'mobil') return 'Mobil';
  if (type === 'besar') return 'Motor Besar (Maxi/Moge)';
  return 'Motor Kecil / Reguler';
}

export function getEmailTypeLabel(type: string): string {
  switch (type) {
    case 'ticket_created':
      return 'Tiket Berhasil Dibuat';
    case 'upcoming_call':
      return 'Peringatan Mau Dipanggil';
    case 'calling_pit':
      return 'Sedang Dipanggil ke Pit';
    case 'wash_finished':
      return 'Pencucian Selesai (Ke Kasir)';
    case 'completed_paid':
      return 'Selesai & Lunas';
    default:
      return type;
  }
}

export function generateEmailHtml(payload: EmailNotificationPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const { type, queue, service, pit, storeSettings, customNotes } = payload;
  const storeName = storeSettings?.nama_usaha || 'Sistem Antrean Cuci Kendaraan';
  const storeTagline = storeSettings?.tagline || 'Cepat, Bersih & Terpercaya';
  const storeAddress = storeSettings?.alamat || '';
  const storePhone = storeSettings?.telepon || '';
  const customerName = queue.nama_pemohon || 'Pelanggan';
  const queueNo = queue.nomor_antrian || '-';
  const serviceName = service?.nama_layanan || 'Paket Cuci Kendaraan';
  const pitName = pit?.nama_pit || 'Area Pit Cuci';
  const vehicleLabel = getVehicleLabel(queue.tipe_motor);
  const costStr = formatRupiah(queue.total_biaya);

  let subject = '';
  let headline = '';
  let badgeText = '';
  let badgeBg = '#10B981';
  let badgeColor = '#ffffff';
  let mainMessage = '';
  let alertBox = '';

  switch (type) {
    case 'ticket_created':
      subject = `[${storeName}] Tiket Antrean #${queueNo} Berhasil Dibuat`;
      headline = 'Tiket Antrean Anda Berhasil Terdaftar';
      badgeText = `NOMOR ANTREAN: ${queueNo}`;
      badgeBg = '#059669';
      mainMessage = `Halo <strong>${customerName}</strong>, tiket antrean cuci kendaraan Anda telah berhasil dibuat. Silakan bersantai di ruang tunggu yang telah disediakan. Kami akan mengabari Anda ketika giliran Anda tiba.`;
      alertBox = `
        <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 14px 16px; border-radius: 8px; margin: 20px 0; color: #065F46;">
          <p style="margin: 0; font-size: 14px; font-weight: 600;">Status: <strong>Menunggu Giliran</strong></p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #047857;">Perhatikan Layar Ruang Tunggu atau tunggu panggilan dari operator kami.</p>
        </div>
      `;
      break;

    case 'upcoming_call':
      subject = `[${storeName}] Persiapan! Antrean #${queueNo} Sebentar Lagi Akan Dipanggil`;
      headline = 'Siap-Siap! Giliran Anda Sebentar Lagi';
      badgeText = `SEGERA DIPANGGIL: ${queueNo}`;
      badgeBg = '#D97706';
      mainMessage = `Halo <strong>${customerName}</strong>, nomor antrean Anda (<strong>${queueNo}</strong>) sudah mendekati giliran berikutnya. Mohon bersiap dan mendekati kendaraan atau ruang tunggu utama.`;
      alertBox = `
        <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 14px 16px; border-radius: 8px; margin: 20px 0; color: #92400E;">
          <p style="margin: 0; font-size: 14px; font-weight: 600;">Pemberitahuan Persiapan</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #B45309;">Kendaraan di depan Anda hampir selesai. Petugas akan segera memanggil nomor antrean Anda.</p>
        </div>
      `;
      break;

    case 'calling_pit':
      subject = `[${storeName}] PANGGILAN! Antrean #${queueNo} Silakan Masuk ke ${pitName}`;
      headline = `Silakan Masuk ke ${pitName}`;
      badgeText = `SEDANG DIPANGGIL: ${queueNo}`;
      badgeBg = '#2563EB';
      mainMessage = `Halo <strong>${customerName}</strong>, nomor antrean Anda (<strong>${queueNo}</strong>) saat ini <strong>SEDANG DIPANGGIL</strong>. Silakan arahkan kendaraan Anda menuju <strong>${pitName}</strong> untuk segera dilakukan proses pencucian.`;
      alertBox = `
        <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 14px 16px; border-radius: 8px; margin: 20px 0; color: #1E40AF;">
          <p style="margin: 0; font-size: 14px; font-weight: 700;">Lokasi: ${pitName}</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #1D4ED8;">Petugas operator telah siap di pit. Terima kasih atas kesabaran Anda!</p>
        </div>
      `;
      break;

    case 'wash_finished':
      subject = `[${storeName}] Pencucian Selesai! Antrean #${queueNo} Silakan Menuju Kasir`;
      headline = 'Pencucian Kendaraan Anda Telah Selesai';
      badgeText = `SELESAI DICUCI: ${queueNo}`;
      badgeBg = '#0284C7';
      mainMessage = `Halo <strong>${customerName}</strong>, kendaraan <strong>${vehicleLabel}</strong> Anda telah selesai dicuci dan dibersihkan oleh tim kami. Silakan menuju kasir untuk melakukan pembayaran dan pengambilan kendaraan.`;
      alertBox = `
        <div style="background-color: #F0F9FF; border-left: 4px solid #0284C7; padding: 14px 16px; border-radius: 8px; margin: 20px 0; color: #075985;">
          <p style="margin: 0; font-size: 14px; font-weight: 700;">Status: Selesai Dicuci & Menuju Kasir</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #0369A1;">Total Tagihan: <strong>${costStr}</strong>. Petugas kasir kami siap melayani Anda.</p>
        </div>
      `;
      break;

    case 'completed_paid':
      subject = `[${storeName}] Kwitansi Lunas & Cuci Selesai - Antrean #${queueNo}`;
      headline = 'Pencucian Selesai & Pembayaran LUNAS';
      badgeText = `LUNAS & SELESAI: ${queueNo}`;
      badgeBg = '#059669';
      mainMessage = `Halo <strong>${customerName}</strong>, terima kasih telah mempercayakan kendaraan Anda kepada kami! Proses pencucian telah <strong>SELESAI</strong> dan pembayaran Anda sebesar <strong>${costStr}</strong> telah <strong>LUNAS</strong> diverifikasi oleh kasir.`;
      alertBox = `
        <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 14px 16px; border-radius: 8px; margin: 20px 0; color: #065F46;">
          <p style="margin: 0; font-size: 14px; font-weight: 800; color: #047857;">✓ STATUS PEMBAYARAN: LUNAS (${costStr})</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #065F46;">Kendaraan Anda sudah bersih, kinclong, dan siap untuk diambil di area penyerahan kendaraan. Selamat jalan!</p>
        </div>
      `;
      break;
  }

  // Determine accurate payment status text and color based on notification type & queue state
  const isPaidVerified = type === 'completed_paid' || queue.is_paid;
  const paymentStatusText = isPaidVerified
    ? '✓ LUNAS (Sudah Dibayar)'
    : type === 'ticket_created'
    ? 'Belum Bayar (Bayar di kasir setelah selesai cuci)'
    : type === 'calling_pit'
    ? 'Belum Bayar (Menunggu proses cuci selesai)'
    : type === 'wash_finished'
    ? 'Menunggu Pembayaran di Kasir'
    : 'Belum Bayar (Silakan menuju kasir)';
  const paymentStatusColor = isPaidVerified ? '#059669' : '#D97706';

  const queueStatusLabel =
    type === 'ticket_created'
      ? 'Menunggu Giliran (Dalam Antrean)'
      : type === 'upcoming_call'
      ? 'Persiapan (Sisa 1 Antrean Sebelum Giliran Anda)'
      : type === 'calling_pit'
      ? `Sedang Dipanggil ke ${pitName}`
      : type === 'wash_finished'
      ? 'Pencucian Selesai (Menuju Kasir)'
      : 'Selesai Cuci & Kendaraan Siap Diambil';

  const paymentTimeStr = isPaidVerified
    ? formatDateTimeIndo(queue.paid_at || new Date().toISOString())
    : null;
  const cashierDisplay = isPaidVerified
    ? queue.cashier_name || 'Petugas Kasir'
    : null;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F1F5F9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06); border: 1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0F172A; padding: 30px 30px; text-align: center; color: #FFFFFF;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">
                ${storeName}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8; font-weight: 500;">
                ${storeTagline}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px 30px;">
              <!-- Badge -->
              <div style="text-align: center; margin-bottom: 18px;">
                <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; font-size: 14px; font-weight: 800; padding: 8px 18px; border-radius: 9999px; letter-spacing: 0.5px;">
                  ${badgeText}
                </span>
              </div>

              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0F172A; text-align: center;">
                ${headline}
              </h2>

              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                ${mainMessage}
              </p>

              ${alertBox}

              <!-- Detail Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px; border-collapse: separate; border-spacing: 0; background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden;">
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0; width: 40%;">Nomor Antrean</td>
                  <td style="padding: 12px 16px; font-size: 15px; color: #0F172A; font-weight: 800; border-bottom: 1px solid #E2E8F0; font-family: monospace;">${queueNo}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Status Antrean</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0F172A; font-weight: 700; border-bottom: 1px solid #E2E8F0;">${queueStatusLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Nama Pelanggan</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0F172A; font-weight: 700; border-bottom: 1px solid #E2E8F0;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Jenis Kendaraan</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0F172A; font-weight: 600; border-bottom: 1px solid #E2E8F0;">${vehicleLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Paket Layanan</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0F172A; font-weight: 600; border-bottom: 1px solid #E2E8F0;">${serviceName} ${service?.durasi_menit ? `(~${service.durasi_menit} mnt)` : ''}</td>
                </tr>
                ${
                  pit?.nama_pit
                    ? `<tr>
                        <td style="padding: 12px 16px; font-size: 13px; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Pit Ditugaskan</td>
                        <td style="padding: 12px 16px; font-size: 13px; color: #2563EB; font-weight: 700; border-bottom: 1px solid #E2E8F0;">${pitName}</td>
                      </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Total Biaya</td>
                  <td style="padding: 12px 16px; font-size: 15px; color: #059669; font-weight: 800; border-bottom: 1px solid #E2E8F0; font-family: monospace;">${costStr}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Status Pembayaran</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: ${paymentStatusColor}; font-weight: 800; border-bottom: 1px solid #E2E8F0;">
                    ${paymentStatusText}
                  </td>
                </tr>
                ${
                  paymentTimeStr
                    ? `<tr>
                        <td style="padding: 12px 16px; font-size: 13px; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Waktu Pembayaran</td>
                        <td style="padding: 12px 16px; font-size: 13px; color: #0F172A; font-weight: 600; border-bottom: 1px solid #E2E8F0;">${paymentTimeStr}</td>
                      </tr>`
                    : ''
                }
                ${
                  cashierDisplay
                    ? `<tr>
                        <td style="padding: 12px 16px; font-size: 13px; color: #64748B; font-weight: 600;">Petugas Kasir</td>
                        <td style="padding: 12px 16px; font-size: 13px; color: #0F172A; font-weight: 600;">${cashierDisplay}</td>
                      </tr>`
                    : ''
                }
              </table>

              ${
                customNotes
                  ? `<div style="margin-top: 18px; padding: 12px; background-color: #F1F5F9; border-radius: 8px; font-size: 13px; color: #475569;">
                      <strong>Catatan Tambahan:</strong> ${customNotes}
                    </div>`
                  : ''
              }

              <!-- Info Footer Note -->
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #94A3B8; text-align: center; line-height: 1.5;">
                Email ini dikirim secara otomatis oleh Sistem Antrean <strong>${storeName}</strong>.<br />
                Jika Anda memiliki pertanyaan, silakan hubungi kasir atau petugas kami langsung.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748B;">
              <p style="margin: 0 0 4px 0; font-weight: 700; color: #334155;">${storeName}</p>
              ${storeAddress ? `<p style="margin: 0 0 4px 0;">${storeAddress}</p>` : ''}
              ${storePhone ? `<p style="margin: 0 0 4px 0;">Telepon / WA: ${storePhone}</p>` : ''}
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #94A3B8;">&copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${storeName} - ${headline}
=======================================
NOMOR ANTREAN: ${queueNo}
Status Antrean: ${queueStatusLabel}
Nama: ${customerName}
Kendaraan: ${vehicleLabel}
Paket Layanan: ${serviceName}
Total Biaya: ${costStr}
Status Pembayaran: ${paymentStatusText}
${paymentTimeStr ? `Waktu Pembayaran: ${paymentTimeStr}\n` : ''}${cashierDisplay ? `Petugas Kasir: ${cashierDisplay}\n` : ''}${pit?.nama_pit ? `Pit: ${pitName}\n` : ''}
${mainMessage.replace(/<[^>]*>?/gm, '')}
=======================================
${storeName} ${storeAddress ? `| ${storeAddress}` : ''} ${storePhone ? `| ${storePhone}` : ''}
  `.trim();

  return { subject, html, text };
}
