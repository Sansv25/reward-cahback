# Rules File — Reward Cashback Generator

Aturan wajib diikuti selama implementasi di AI IDE (Antigravity).

## Stack & Struktur File
- Native HTML/CSS/JS murni. **Dilarang** memakai framework (React/Vue) atau build tool (Vite/Webpack).
- Struktur file minimal:
  - `index.html`
  - `style.css`
  - `app.js` — logic UI, parsing, state
  - `docxGenerator.js` — logic khusus membangun & men-generate file .docx
- Library eksternal hanya lewat CDN `<script>` tag (contoh: `docx` UMD build). Jangan pakai `npm install` / `node_modules` / bundler apapun.
- Harus bisa langsung jalan dibuka sebagai file statis (`index.html`) di GitHub Pages, tanpa proses build.

## Parsing Data
- Semua logic parsing (deteksi baris judul/header lama, grouping per agen, normalisasi nominal) ditaruh di fungsi-fungsi terpisah yang gampang di-unit-test manual dari console browser (contoh: `parseRawInput(text)` mengembalikan array of group object, bukan langsung memanipulasi DOM).
- Jangan hardcode asumsi jumlah kolom = 8 di banyak tempat — definisikan urutan kolom di satu konstanta (misal `COLUMNS = [...]`) di awal file supaya gampang diubah kalau strukturnya berubah lagi di kemudian hari.
- Fungsi normalisasi nominal (`parseNominal(str) -> number` dan `formatNominal(number) -> string`) harus terpisah dan reusable, dipakai baik untuk render preview maupun untuk isi docx.

## Merge Cell
- Rowspan grup agen dihitung dari nilai `JUMLAH USER`, BUKAN dari jumlah baris kosong yang kebetulan ada di data mentah — kalau jumlah baris NAMA USER dalam satu grup tidak sama dengan JUMLAH USER, tampilkan warning ke user (jangan diam-diam salah hitung).
- Kolom yang di-merge per grup: NAMA AGEN, JUMLAH USER, PROMO, NO E WALLET, NOMINAL TF, BUKTI TF. Kolom yang TIDAK boleh di-merge: NAMA USER, ID PERMOHONAN.

## Styling & Warna
- Warna wajib pakai kode hex yang sama persis dengan referensi: judul `#4472C4` (teks putih), header kolom & TOTAL `#FFFF00` (teks hitam). Jangan pakai warna Word theme (`accent1` dsb) karena harus konsisten dilihat di aplikasi apapun.
- Teks judul & label kolom ID harus ditulis sebagai `TextRun` biasa di library `docx` (bukan gambar/`ImageRun`), supaya tetap editable setelah dibuka di Word.

## Gambar Bukti TF
- Sebelum dimasukkan ke `ImageRun`, resize gambar di canvas browser dulu (client-side) supaya ukuran file & dimensi wajar untuk ditaruh di 1 sel tabel (jangan masukkan gambar resolusi asli mentah-mentah kalau terlalu besar).
- Kalau user tidak upload gambar, jangan crash — render sel BUKTI TF kosong seperti biasa.

## Preview Popup
- Preview adalah modal/dialog native (`<dialog>` element atau div overlay position:fixed), BUKAN `window.open()` tab baru.
- Modal harus bisa ditutup (tombol close / klik area luar / tombol Escape) tanpa reload halaman dan tanpa kehilangan data yang sudah diinput di form utama.

## Penyimpanan
- Pakai `localStorage` murni (bukan IndexedDB) untuk menyimpan: judul periode terakhir, label kolom ID terakhir, dan teks mentah terakhir yang dipaste.
- Foto bukti TF TIDAK disimpan ke localStorage (cukup di variable JS session), karena base64 gambar bisa melebihi kuota localStorage.

## Penamaan File Output
- Nama file .docx hasil download mengikuti pola: `Reward_Cashback_<judul-periode-disingkat-slug>.docx` (spasi jadi underscore, karakter aneh dibuang).

## Yang Dilarang
- Jangan tambahkan fitur di luar PRD (misal: export PDF, multi-batch, backend/API) tanpa diminta eksplisit.
- Jangan ubah urutan/nama 8 kolom yang sudah ditentukan di PRD tanpa konfirmasi.
