# Cara memasang di GitHub / Vercel

1. Ganti `index.html` repository dengan `index.html` dari folder ini.
2. Upload folder `css/` dan seluruh folder `js/` dengan struktur yang sama.
3. Jangan mengganti file SQL/database yang sudah ada.
4. Vercel akan membaca `index.html` sebagai halaman utama.
5. Setelah deploy, tes login Admin, Guru, dan Orang Tua.

Struktur wajib:
index.html
css/style.css
js/supabase.js
js/state.js
js/config.js
js/auth.js
js/utils.js
js/dashboard.js
js/siswa.js
js/spp.js
js/absensi-siswa.js
js/guru.js
js/absensi-guru.js
js/rekap-absensi.js
js/perkembangan.js
js/orangtua.js
js/export-notifikasi.js
js/app.js

`index-original-backup.html` hanya cadangan dari file yang diunggah dan tidak perlu dipanggil oleh aplikasi.
