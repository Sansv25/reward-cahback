# AI Execution Brief — Reward Cashback Generator

> Brief ini untuk dieksekusi langsung di Google Antigravity (AI IDE). Baca juga `PRD_Reward_Cashback_Generator.md` (spesifikasi lengkap) dan `RULES_Reward_Cashback_Generator.md` (batasan teknis wajib) sebelum mulai coding.

## Ringkasan Tugas
Buat web app statis (native HTML/CSS/JS, tanpa build) yang:
1. Menerima input: judul periode (teks), label kolom ID (teks, default "ID PERMOHONAN"), data mentah tab-separated (textarea), dan 1 foto bukti transfer (upload, opsional).
2. Mem-parsing data mentah jadi tabel terstruktur dengan grouping per agen (merge cell untuk agen dengan JUMLAH USER > 1).
3. Menampilkan preview lewat popup/modal sebelum export.
4. Meng-generate & men-download file `.docx` yang mereplikasi format tabel resmi (judul biru, header kolom kuning, merge cell, foto bukti TF, baris TOTAL) — dengan judul/header tetap berupa teks editable, bukan gambar.

## Urutan Eksekusi yang Disarankan
1. **Setup dasar**: buat `index.html` + `style.css` dengan form input (judul, label ID, textarea data, upload foto) dan area tombol (Proses Data, Preview, Download).
2. **Parsing engine** (`app.js`): implementasikan `parseRawInput(text)` sesuai aturan grouping & normalisasi nominal di PRD §5.2–5.3. Test manual dulu pakai 2 contoh data yang sudah ada (lihat "Data Uji" di bawah) sebelum lanjut ke UI rendering.
3. **Render tabel hasil parsing** langsung di halaman (bukan popup) supaya user bisa cek cepat setelah klik "Proses Data".
4. **Modal Preview**: render ulang tabel yang sama (styling final: warna, merge cell, gambar) ke dalam `<dialog>`/overlay, dipicu tombol "Preview".
5. **Generator docx** (`docxGenerator.js`): pakai library `docx` via CDN, bangun `Document` dengan `Table`/`TableRow`/`TableCell` sesuai struktur merge di PRD §3 dan styling di PRD §5.4, sisipkan gambar bukti TF sesuai §5.5, lalu `Packer.toBlob()` + trigger download.
6. **Persistensi ringan**: simpan judul, label ID, dan teks mentah ke `localStorage` (bukan foto).
7. **QA manual**: jalankan dengan kedua contoh data uji di bawah, bandingkan hasil docx dengan file referensi yang sudah ada, pastikan merge cell & total sesuai.

## Data Uji (pakai persis untuk testing)

**Contoh 1:**
```
GITA PRABANDARI 	2	NI MADE ERNA KURNIAWATI	A15102608170035	PAHE 1 TAHUN	087849915681 	 Rp301,200 	
		KOMANG PRADNYA MAHESWARI	A15102608040021				
I MADE BUDIARTA 	1	KADEK ERIK NURIAWAN SH	A15102608250026	PAHE 1 TAHUN	12401001960534	 Rp102,500 	
Nabilla Rahmadani Debora 	1	I NYOMAN BUDI ARTIKA	A15102608210062	PAHE 1 TAHUN	'085718792544	 Rp152,200 	
TOTAL						 Rp555,900 	
```
Judul: `REWARD CASHBACK USER DAN SALES FORCE MITRA PENJUALAN ICONNET PERIODE TRANSFER 4 SEPTEMBER 2026 (BATCH 1)`
Label kolom ID: `ID PERMOHONAN`
Hasil yang diharapkan: 3 grup agen, grup pertama (GITA PRABANDARI) merge 2 baris, total = Rp 555.900.

**Contoh 2 (kasus grup lebih besar, label kolom beda):**
```
Anom Darjito Nurprahtono 	4	TOKO SERBA 35	A15112608290033	BIZ 1	  0041725430/ BNI  	402,500	 
		MILA FHASION	A15112608280026				
		TOKO ARINA	A15112608240062				
		TOKO PEDELI SEMBAKO BERKAH	A15112608230016				
Herlin satriani 	2	TOKO RISKI	A15112608270003	BIZ 1	 BCA 2020170193 	202,500	 
		HAJI LALU JALALUDIN	A15112608260081				
EGA APRIADI	1	PT WAHANA DEWATA ADIDAYA (QJMOTOR BALI)	A15102608050068	BIZ 1	 087849915681 - Gopay 	101,200	 
kadek oktapiani 	1	PANDE PUTU NGURAH SAPUTRA WIGUNA	A15102608270488	BIZ 6	 Mandiri 1450012330458 	200,000	 
I KETUT PARTA	3	RICKO HAMZAH	A15102608270487	BIZ 1	 085737340600 ( ovo) 	300,000	 
		HIMATUL MUIZAH	A15102608270483				
		IKLIMAH	A15102608270480				
I NYOMAN AGUS WISNAWA	1	PLN ULP KUTA	A15102609030055	BIZ 1	 BANK BNI 1820076004 	102,500	 
Lalu Surya Febriana putra 	4	M.MUNADI	A15112608250011	BIZ 1	 BCA - 2320446671 	402,500	 
		UD. ATHA JAYA	A15112607290012	BIZ 1			
		UD SASTRO KUSUMO	A15112608200208	BIZ 1			
		CV IKRAM	A15112608230013	BIZ 1			
Khairil Ansyori , ST	1	NASARUDIN	A15112608310029	BIZ 1 	 Dana/085339042080 	101,000	 
TOTAL						 Rp1,812,200
```
Judul: `REWARD CASHBACK VOUCHER CW ICONNET BIZ PERIODE TRANSFER 4 September 2026`
Label kolom ID: `ID PLN`
Hasil yang diharapkan: 8 grup agen (grup terbesar 4 user: Anom Darjito Nurprahtono & Lalu Surya Febriana Putra), total = Rp 1.812.200. Perhatikan baris "UD. ATHA JAYA" dkk yang punya PROMO "BIZ 1" tertulis di data tapi kolom itu ikut ter-merge dari baris pertama grup — parser harus tetap ambil PROMO dari baris pertama grup saja (abaikan kalau di baris lanjutan ada teks nyasar di kolom yang seharusnya kosong/merge).

## Definition of Done
- [ ] Form input lengkap (judul, label ID, textarea, upload foto) berfungsi.
- [ ] Parsing kedua data uji di atas menghasilkan grouping & total yang benar (lihat "Hasil yang diharapkan").
- [ ] Preview popup menampilkan tabel dengan merge cell & warna sesuai referensi.
- [ ] Download menghasilkan file .docx yang bisa dibuka di Word, dengan judul & label kolom yang masih bisa diedit langsung di Word.
- [ ] Berjalan sebagai static site murni (buka `index.html` langsung / GitHub Pages), tanpa error console.
