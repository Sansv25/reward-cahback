# PRD — Web Generator Docx "Reward Cashback"

## 1. Latar Belakang
Setiap periode transfer, tim menerima data reward cashback dari excel dalam bentuk teks tab-separated (hasil copy-paste), lalu harus dipindahkan manual ke template Word (.docx) dengan format tabel tertentu (judul biru, header kolom kuning, sel agen di-merge kalau punya lebih dari 1 user). Proses manual ini butuh web app agar cepat dan konsisten.

## 2. Tujuan
Web app statis (client-side, tanpa backend) yang menerima paste data mentah dari excel, menampilkan preview tabel sesuai format resmi, lalu meng-export-nya jadi file .docx yang siap dipakai — dengan header/judul yang tetap bisa diedit di Word setelah di-download.

## 3. Struktur Data Output
Kolom tabel (urutan tetap):
1. NAMA AGEN
2. JUMLAH USER
3. NAMA USER
4. ID PERMOHONAN — label kolom ini bisa diganti user jadi "ID PLN" atau teks lain (lihat 5.1)
5. PROMO
6. NO E WALLET
7. NOMINAL TF
8. BUKTI TF

**Aturan merge cell per grup agen:**
- Kalau `JUMLAH USER` suatu agen = N (N > 1), maka kolom NAMA AGEN, JUMLAH USER, PROMO, NO E WALLET, NOMINAL TF, dan BUKTI TF di-merge vertikal (rowspan = N) untuk seluruh baris user agen tsb.
- Kolom NAMA USER dan ID PERMOHONAN tetap terpisah per baris (tidak di-merge).
- Kalau JUMLAH USER = 1, baris agen tsb tidak perlu merge (rowspan = 1 seperti biasa).

**Baris TOTAL:** baris terakhir, seluruh kolom di-merge jadi 1 label "TOTAL" (rata tengah) + 1 sel nominal total (hasil SUM semua NOMINAL TF), background kuning bold — kolom BUKTI TF pada baris TOTAL dikosongkan.

## 4. Alur Pengguna (User Flow)
1. User membuka web app.
2. User isi **Judul/Header Periode** (field teks bebas, contoh: "REWARD CASHBACK USER DAN SALES FORCE MITRA PENJUALAN ICONNET PERIODE TRANSFER 4 SEPTEMBER 2026 (BATCH 1)").
3. User pilih/isi **label kolom ID** (default "ID PERMOHONAN", bisa diganti manual jadi "ID PLN" dsb).
4. User paste data mentah (tab-separated, hasil copy dari excel) ke textarea — boleh menyertakan baris judul lama dan baris header kolom lama dari excel asal (akan diabaikan otomatis, lihat 5.2), atau cukup baris data + TOTAL saja.
5. User klik **"Proses Data"** → app mem-parsing teks jadi struktur tabel (grouping per agen + hitung ulang total) dan menampilkan tabel hasil parsing langsung di halaman (editable read-only, bukan popup) supaya user bisa cek cepat.
6. User upload **1 foto bukti transfer** (opsional) via input file — foto ini mewakili seluruh batch (bukan per user).
7. User klik **"Preview"** → muncul **popup/modal** menampilkan tabel final persis seperti akan terlihat di file Word (warna, merge cell, font), termasuk foto bukti TF kalau sudah diupload.
8. Dari popup preview, user bisa **tutup popup untuk edit lagi**, atau klik **"Download .docx"**.
9. File .docx ter-generate dan otomatis ter-download ke device user.

## 5. Detail Fungsional

### 5.1 Header/judul tetap editable
- Field "Judul/Header Periode" di web app adalah teks biasa, bukan gambar.
- Saat generate docx, teks judul ini ditulis sebagai run teks biasa (bold, putih, center) di dalam sel tabel — BUKAN di-render sebagai gambar/screenshot. Dengan begitu, setelah file .docx dibuka di Word, user tetap bisa klik dan edit langsung teks judulnya.
- Label kolom ID (poin 5.3) juga diperlakukan sama: teks biasa yang editable.

### 5.2 Parsing data mentah
- Input diproses per baris, dipisah oleh tab (`\t`).
- App mendeteksi & mengabaikan baris yang cocok dengan pola judul lama / header kolom lama dari excel asal (baris pertama yang sel-nya cuma 1 kolom terisi panjang, atau baris yang persis berisi "NAMA AGEN", "JUMLAH USER", dst di excel asal) — supaya user tidak perlu bersihkan manual sebelum paste.
- Baris berikutnya dianggap baris data selama kolom pertama (NAMA AGEN) ATAU kolom ketiga (NAMA USER) terisi.
- Baris yang kolom pertamanya "TOTAL" (case-insensitive) dianggap baris akhir data, nominalnya diabaikan (dihitung ulang oleh app, bukan dipakai apa adanya) — lihat 5.4.
- **Grouping agen:** baris dengan NAMA AGEN terisi = baris pertama grup baru. Baris-baris berikutnya yang NAMA AGEN-nya kosong (sampai jumlah baris kosong = JUMLAH USER - 1) digabung ke grup yang sama.
- Kolom PROMO, NO E WALLET, NOMINAL TF, BUKTI TF diambil dari baris pertama tiap grup (baris-baris lanjutan grup tsb dibiarkan kosong di data mentah, sesuai contoh input).

### 5.3 Normalisasi nominal
- Nilai NOMINAL TF di data mentah bisa datang dalam berbagai format ("Rp301,200", "Rp 152.200", "402,500", "150.000").
- App membersihkan semua karakter non-digit dari tiap nilai, ambil angka murni, lalu format ulang konsisten untuk ditampilkan & ditulis ke docx dengan format **"Rp X.XXX.XXX"** (titik sebagai pemisah ribuan, gaya umum Indonesia) — *asumsi ini bisa diganti kalau user mau format lain, tinggal ubah 1 fungsi formatter di kode.*
- Nominal TOTAL di baris terakhir dihitung ulang oleh app (SUM semua nominal per grup agen), tidak mengambil apa adanya dari teks yang dipaste, supaya selalu akurat walau ada typo di data asal.

### 5.4 Styling docx (mengikuti referensi lama)
- Baris judul: 1 baris, merge semua kolom (8 kolom), background `#4472C4`, teks putih, bold, rata tengah.
- Baris header kolom: background `#FFFF00`, teks hitam, bold, rata tengah, tinggi baris cukup untuk 2 baris teks kalau label panjang.
- Baris data: teks normal, rata tengah untuk kolom angka/ID, rata kiri untuk nama.
- Baris TOTAL: background `#FFFF00`, bold, kolom pertama sampai kolom NOMINAL TF di-merge jadi label "TOTAL" (rata tengah) + sel nominal total.
- Lebar kolom mengikuti proporsi tabel referensi (lihat file referensi yang sudah diupload user).

### 5.5 Foto bukti TF (1 foto per batch)
- Satu file gambar (jpg/png) diupload lewat input file biasa.
- Di tabel hasil (preview & docx), foto ini dimasukkan ke kolom BUKTI TF dengan cara **merge seluruh baris data (rowspan = total baris data)** jadi satu sel besar berisi gambar tsb (bukan diulang tiap baris) — karena cuma ada 1 bukti transfer untuk seluruh batch.
- Gambar di-resize otomatis biar muat proporsional di lebar kolom BUKTI TF (max-width kolom, aspect ratio dijaga).
- Kalau user tidak upload foto, kolom BUKTI TF tetap ada tapi kosong (blank cell, bukan error).

### 5.6 Preview popup
- Tombol "Preview" membuka modal/dialog (overlay di atas halaman) berisi render tabel HTML yang meniru tampilan docx final (warna, merge cell, font, gambar bukti TF).
- Preview bersifat **read-only** (untuk cek visual sebelum download) — kalau ada yang salah, user tutup popup dan edit lagi di form/textarea utama, lalu proses ulang.
- Modal punya tombol "Tutup" dan tombol "Download .docx" (supaya user bisa langsung download dari popup preview kalau sudah oke).

### 5.7 Export ke .docx
- Menggunakan library JS `docx` (https://www.npmjs.com/package/docx, ada build browser/UMD via CDN) untuk membangun dokumen Word asli secara client-side — tabel, merge cell (rowSpan/columnSpan), shading warna sel, dan gambar (ImageRun) semua didukung native oleh library ini tanpa backend.
- Hasil dokumen di-generate ke Blob lalu di-trigger download otomatis (nama file contoh: `Reward_Cashback_<judul-singkat>.docx`).

## 6. Non-Fungsional
- 100% static, tanpa server/backend, bisa langsung di-host di GitHub Pages.
- Native HTML/CSS/JS, tanpa framework dan tanpa build step (langsung `<script>` tag untuk library `docx` via CDN).
- Data yang dipaste & judul terakhir disimpan ke `localStorage` supaya tidak hilang kalau tab ke-refresh tidak sengaja (foto TIDAK disimpan ke localStorage, cukup di memory session, mengikuti pola project sejenis sebelumnya).

## 7. Asumsi yang Perlu Dikonfirmasi Ulang
- Format nominal output "Rp X.XXX.XXX" (titik ribuan) — silakan koreksi kalau maunya format lain.
- Foto bukti TF ditaruh sebagai 1 sel besar (merge seluruh baris) di kolom BUKTI TF — bukan diletakkan terpisah di luar tabel.
- Baris judul & header lama dari excel asal (kalau ikut kepaste) otomatis diabaikan oleh parser.

## 8. Di Luar Cakupan (Out of Scope)
- Tidak ada backend/database — semua proses di browser.
- Tidak ada multi-batch dalam 1 file (1 sesi = 1 judul periode = 1 file docx).
- Tidak ada fitur riwayat/log export sebelumnya.
