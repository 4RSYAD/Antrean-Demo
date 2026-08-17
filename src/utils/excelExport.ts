import { QueueItem, ServiceItem, PitItem, StoreSettings } from '../types.ts';

export interface ExcelExportOptions {
  storeSettings?: StoreSettings;
  periodLabel: string;
  filterDescription?: string;
  totalOmsetPaid: number;
  totalPendingPayment: number;
  kecilTotalOmset: number;
  besarTotalOmset: number;
  mobilTotalOmset: number;
  paidCount: number;
  pendingCount: number;
}

function escapeXml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatDateTimeIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    // If it's just time like "09:15"
    if (/^\d{2}:\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\./g, ':');
  } catch {
    return dateStr;
  }
}

export function exportQueuesToExcel(
  items: QueueItem[],
  services: ServiceItem[],
  pits: PitItem[],
  options: ExcelExportOptions,
  filename: string
) {
  const storeName = options.storeSettings?.nama_usaha || 'Antrean Cuci Kendaraan';
  const storeTagline = options.storeSettings?.tagline || 'Sistem Manajemen & Rekap Transaksi Kasir';
  const storeAddress = options.storeSettings?.alamat || '';
  const storePhone = options.storeSettings?.telepon || '';
  const exportTime = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const getItemAmount = (q: QueueItem) => {
    if (q.total_biaya) return q.total_biaya;
    const srv = services.find((s) => s.id === q.layanan_id);
    if (!srv) return 0;
    if (q.tipe_motor === 'mobil') {
      return srv.harga_mobil || srv.harga_besar || srv.harga || 0;
    }
    return q.tipe_motor === 'besar'
      ? srv.harga_besar || srv.harga || 0
      : srv.harga_kecil || srv.harga || 0;
  };

  const getVehicleLabel = (type: string) => {
    if (type === 'mobil') return 'Mobil';
    if (type === 'besar') return 'Motor Besar';
    return 'Motor Kecil';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Menunggu Antrean';
      case 'washing':
        return 'Sedang Dicuci';
      case 'waiting_payment':
        return 'Selesai Cuci (Belum Bayar)';
      case 'done':
        return 'Selesai & Lunas';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  // Generate XML Content for Excel Spreadsheet 2003 (.xls)
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Laporan Transaksi Cuci Kendaraan</Title>
  <Subject>Rekap Transaksi &amp; Keuangan</Subject>
  <Author>${escapeXml(storeName)}</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <!-- Header Title -->
  <Style ss:ID="AppTitle">
   <Font ss:FontName="Segoe UI" ss:Size="16" ss:Bold="1" ss:Color="#047857"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="AppSubtitle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Italic="1" ss:Color="#475569"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#334155"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="MetaValue">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#0F172A"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <!-- KPI Styles -->
  <Style ss:ID="KpiHeaderGreen">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
   </Borders>
  </Style>
  <Style ss:ID="KpiValueGreen">
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#064E3B"/>
   <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
   </Borders>
  </Style>
  <Style ss:ID="KpiHeaderBlue">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#1E40AF"/>
   <Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
   </Borders>
  </Style>
  <Style ss:ID="KpiValueBlue">
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#1E3A8A"/>
   <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
   </Borders>
  </Style>
  <Style ss:ID="KpiHeaderAmber">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#92400E"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
   </Borders>
  </Style>
  <Style ss:ID="KpiValueAmber">
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#78350F"/>
   <Interior ss:Color="#FFFBEB" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FDE68A"/>
   </Borders>
  </Style>
  <!-- Table Columns Header -->
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#059669" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#047857"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>
   </Borders>
  </Style>
  <!-- Data Rows -->
  <Style ss:ID="RowEven">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#1E293B"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="RowOdd">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#1E293B"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="RowEvenCenter">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#1E293B"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="RowOddCenter">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#1E293B"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="RowEvenCurrency">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#047857"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="RowOddCurrency">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#047857"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <!-- Total Summary -->
  <Style ss:ID="TotalLabel">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#064E3B"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#059669"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#059669"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#059669"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#059669"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalValue">
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#064E3B"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#059669"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#059669"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#059669"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#059669"/>
   </Borders>
  </Style>
 </Styles>

 <Worksheet ss:Name="Laporan Cuci Kendaraan">
  <Table ss:DefaultRowHeight="20">
   <!-- Column Widths -->
   <Column ss:Width="35"/>  <!-- No -->
   <Column ss:Width="95"/>  <!-- ID Transaksi -->
   <Column ss:Width="80"/>  <!-- No. Antrean -->
   <Column ss:Width="130"/> <!-- Nama Pelanggan -->
   <Column ss:Width="95"/>  <!-- Kategori Kendaraan -->
   <Column ss:Width="160"/> <!-- Layanan Cuci -->
   <Column ss:Width="110"/> <!-- Pit Bay -->
   <Column ss:Width="105"/> <!-- Waktu Pendaftaran -->
   <Column ss:Width="105"/> <!-- Waktu Selesai -->
   <Column ss:Width="105"/> <!-- Waktu Bayar -->
   <Column ss:Width="120"/> <!-- Status Antrean -->
   <Column ss:Width="100"/> <!-- Status Bayar -->
   <Column ss:Width="100"/> <!-- Kasir / Petugas -->
   <Column ss:Width="110"/> <!-- Biaya (Rp) -->

   <!-- Row 1: Title -->
   <Row ss:Height="26">
    <Cell ss:MergeAcross="13" ss:StyleID="AppTitle">
     <Data ss:Type="String">${escapeXml(storeName.toUpperCase())} - LAPORAN &amp; REKAP TRANSAKSI</Data>
    </Cell>
   </Row>

   <!-- Row 2: Tagline / Description -->
   <Row ss:Height="18">
    <Cell ss:MergeAcross="13" ss:StyleID="AppSubtitle">
     <Data ss:Type="String">${escapeXml(storeTagline)}${storeAddress ? ` | ${escapeXml(storeAddress)}` : ''}${storePhone ? ` | Telp: ${escapeXml(storePhone)}` : ''}</Data>
    </Cell>
   </Row>

   <!-- Row 3: Blank -->
   <Row ss:Height="10"/>

   <!-- Row 4: Meta info (Period & Generated Date) -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="MetaLabel"><Data ss:Type="String">Periode Laporan:</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(options.periodLabel)}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaLabel"><Data ss:Type="String">Waktu Export:</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(exportTime)} WIB</Data></Cell>
   </Row>

   <!-- Row 5: Meta info (Filter description & Total Data) -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="MetaLabel"><Data ss:Type="String">Filter Kategori:</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(options.filterDescription || 'Semua Data')}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaLabel"><Data ss:Type="String">Total Data:</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="MetaValue"><Data ss:Type="String">${items.length} Kendaraan (${options.paidCount} Lunas, ${options.pendingCount} Belum Bayar)</Data></Cell>
   </Row>

   <!-- Row 6: Blank -->
   <Row ss:Height="12"/>

   <!-- Row 7: KPI Header -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="2" ss:StyleID="KpiHeaderGreen"><Data ss:Type="String">TOTAL OMSET LUNAS</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiHeaderGreen"><Data ss:Type="String">MOTOR KECIL</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiHeaderAmber"><Data ss:Type="String">MOTOR BESAR</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiHeaderBlue"><Data ss:Type="String">MOBIL</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiHeaderAmber"><Data ss:Type="String">BELUM BAYAR (PENDING)</Data></Cell>
   </Row>

   <!-- Row 8: KPI Values -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="2" ss:StyleID="KpiValueGreen"><Data ss:Type="Number">${options.totalOmsetPaid}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiValueGreen"><Data ss:Type="Number">${options.kecilTotalOmset}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiValueAmber"><Data ss:Type="Number">${options.besarTotalOmset}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiValueBlue"><Data ss:Type="Number">${options.mobilTotalOmset}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiValueAmber"><Data ss:Type="Number">${options.totalPendingPayment}</Data></Cell>
   </Row>

   <!-- Row 9: Blank -->
   <Row ss:Height="15"/>

   <!-- Row 10: Table Header -->
   <Row ss:Height="26">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">No</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">ID Transaksi</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">No. Antrean</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Nama Pelanggan</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Kategori</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Layanan Cuci</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Pit Bay</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Waktu Masuk</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Waktu Selesai</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Waktu Bayar</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Status Cuci</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Status Bayar</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Kasir / Petugas</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Biaya (Rp)</Data></Cell>
   </Row>`;

  // Data rows
  let grandTotal = 0;
  items.forEach((item, index) => {
    const isOdd = index % 2 === 1;
    const rowStyle = isOdd ? 'RowOdd' : 'RowEven';
    const rowCenterStyle = isOdd ? 'RowOddCenter' : 'RowEvenCenter';
    const rowCurrencyStyle = isOdd ? 'RowOddCurrency' : 'RowEvenCurrency';

    const srv = services.find((s) => s.id === item.layanan_id);
    const pit = pits.find((p) => p.id === item.pit_id);
    const price = getItemAmount(item);
    grandTotal += price;

    const trxId = `TRX-${item.id.replace('q-', '').slice(-6).toUpperCase()}`;
    const vehicleLabel = getVehicleLabel(item.tipe_motor);
    const serviceName = srv ? srv.nama_layanan : '-';
    const pitName = pit ? pit.nama_pit : '-';
    const queueStatus = getStatusLabel(item.status);
    const paymentStatus = item.is_paid ? 'LUNAS' : 'BELUM BAYAR';
    const cashierName = item.cashier_name || (item.is_paid ? 'Kasir' : '-');

    xml += `
   <Row ss:Height="21">
    <Cell ss:StyleID="${rowCenterStyle}"><Data ss:Type="Number">${index + 1}</Data></Cell>
    <Cell ss:StyleID="${rowCenterStyle}"><Data ss:Type="String">${escapeXml(trxId)}</Data></Cell>
    <Cell ss:StyleID="${rowCenterStyle}"><Data ss:Type="String">${escapeXml(item.nomor_antrian)}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(item.nama_pemohon)}</Data></Cell>
    <Cell ss:StyleID="${rowCenterStyle}"><Data ss:Type="String">${escapeXml(vehicleLabel)}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(serviceName)}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(pitName)}</Data></Cell>
    <Cell ss:StyleID="${rowCenterStyle}"><Data ss:Type="String">${escapeXml(formatDateTimeIndo(item.created_at))}</Data></Cell>
    <Cell ss:StyleID="${rowCenterStyle}"><Data ss:Type="String">${escapeXml(formatDateTimeIndo(item.completed_at || item.washed_at))}</Data></Cell>
    <Cell ss:StyleID="${rowCenterStyle}"><Data ss:Type="String">${escapeXml(formatDateTimeIndo(item.paid_at))}</Data></Cell>
    <Cell ss:StyleID="${rowCenterStyle}"><Data ss:Type="String">${escapeXml(queueStatus)}</Data></Cell>
    <Cell ss:StyleID="${rowCenterStyle}"><Data ss:Type="String">${escapeXml(paymentStatus)}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(cashierName)}</Data></Cell>
    <Cell ss:StyleID="${rowCurrencyStyle}"><Data ss:Type="Number">${price}</Data></Cell>
   </Row>`;
  });

  // Empty row message if no data
  if (items.length === 0) {
    xml += `
   <Row ss:Height="24">
    <Cell ss:MergeAcross="13" ss:StyleID="RowEvenCenter">
     <Data ss:Type="String">Tidak ada data transaksi pada periode filter yang dipilih.</Data>
    </Cell>
   </Row>`;
  }

  // Total Footer Row
  xml += `
   <Row ss:Height="24">
    <Cell ss:MergeAcross="12" ss:StyleID="TotalLabel">
     <Data ss:Type="String">TOTAL KESELURUHAN (SEMUA TRANSAKSI TERFILTER):</Data>
    </Cell>
    <Cell ss:StyleID="TotalValue">
     <Data ss:Type="Number">${grandTotal}</Data>
    </Cell>
   </Row>
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Layout x:Orientation="Landscape"/>
    <Header x:Margin="0.3"/>
    <Footer x:Margin="0.3"/>
    <PageMargins x:Bottom="0.75" x:Left="0.7" x:Right="0.7" x:Top="0.75"/>
   </PageSetup>
   <Print>
    <ValidPrinterInfo/>
    <PaperSizeIndex>9</PaperSizeIndex>
    <HorizontalResolution>600</HorizontalResolution>
    <VerticalResolution>600</VerticalResolution>
   </Print>
   <Selected/>
   <Panes>
    <Pane>
     <Number>3</Number>
     <ActiveRow>0</ActiveRow>
     <ActiveCol>0</ActiveCol>
    </Pane>
   </Panes>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  // Trigger File Download
  const blob = new Blob([xml], {
    type: 'application/vnd.ms-excel;charset=utf-8'
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename.endsWith('.xls') || filename.endsWith('.xlsx') ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
