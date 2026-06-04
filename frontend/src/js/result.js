document.addEventListener('DOMContentLoaded', () => {
  const dataStr = localStorage.getItem('screeningResult');

  if (!dataStr) {
    alert('Data hasil skrining tidak ditemukan. Silakan isi form skrining terlebih dahulu.');
    window.location.href = '/screening.html';
    return;
  }

  const data = JSON.parse(dataStr);

  // ─── Helper ─────────────────────────────────────────────────────────────
  const genderMap = { Female: 'Wanita', Male: 'Pria', Other: 'Lainnya' };
  const smokeMap  = {
    never:       'Tidak pernah',
    'No Info':   'Tidak ada info',
    current:     'Perokok aktif',
    former:      'Mantan perokok',
    ever:        'Pernah merokok',
    'not current':'Tidak merokok saat ini'
  };

  const bmiCategory = (bmi) => {
    if (bmi < 18.5) return 'Kurus (Underweight)';
    if (bmi < 25)   return 'Normal';
    if (bmi < 30)   return 'Kelebihan Berat (Overweight)';
    return 'Obesitas';
  };

  // ─── Isi Info Pasien ─────────────────────────────────────────────────────
  document.getElementById('res-name').textContent        = data.name || '—';
  document.getElementById('res-date').textContent        = data.date || '—';
  document.getElementById('sig-date').textContent        = data.date || '';
  document.getElementById('res-gender').textContent      = genderMap[data.gender] || data.gender || '—';
  document.getElementById('res-age').textContent         = `${data.age} tahun`;
  document.getElementById('res-bmi').textContent         = `${data.bmi} (${bmiCategory(data.bmi)})`;
  document.getElementById('res-smoking').textContent     = smokeMap[data.smoking_history] || data.smoking_history || '—';
  document.getElementById('res-hba1c').textContent       = `${data.HbA1c_level}%`;
  document.getElementById('res-glucose').textContent     = `${data.blood_glucose_level} mg/dL`;
  document.getElementById('res-hypertension').textContent = data.hypertension == 1 ? 'Ya' : 'Tidak';
  document.getElementById('res-heart').textContent       = data.heart_disease == 1 ? 'Ya' : 'Tidak';

  // ─── Probability Bar ────────────────────────────────────────────────────
  const prob      = parseFloat(data.probability) || 0;
  const probPct   = (prob * 100).toFixed(1);
  const probFill  = document.getElementById('prob-bar-fill');
  const probLabel = document.getElementById('res-probability');

  probLabel.textContent = `${probPct}%`;

  // Warna bar sesuai level risiko
  let barColor = 'bg-teal-500';
  if (prob > 0.65)      barColor = 'bg-red-500';
  else if (prob >= 0.5) barColor = 'bg-yellow-500';
  probFill.className = `prob-bar-fill ${barColor}`;

  // Animasi bar setelah render
  setTimeout(() => { probFill.style.width = `${probPct}%`; }, 200);

  // ─── Hasil Klasifikasi ───────────────────────────────────────────────────
  const statusEl    = document.getElementById('res-status');
  const descEl      = document.getElementById('res-desc');
  const adviceEl    = document.getElementById('res-advice');
  const riskBadge   = document.getElementById('res-risk-badge');

  if (prob < 0.5) {
    // ── Risiko Rendah ────────────────────────────────────────────────
    riskBadge.textContent = '🟢 Tingkat Risiko: Rendah';
    riskBadge.className   = 'inline-block px-4 py-1 rounded-full text-sm font-bold mb-3 bg-teal-100 text-teal-700';
    statusEl.textContent  = 'TIDAK TERINDIKASI DIABETES';
    statusEl.className    = 'text-2xl md:text-3xl font-extrabold text-teal-600 mb-2';
    descEl.textContent    = 'Berdasarkan biomarker klinis Anda, model AI tidak mendeteksi indikasi signifikan ke arah diabetes tipe 2 saat ini.';
    adviceEl.innerHTML    = `
      <li>Pertahankan gaya hidup sehat: pola makan seimbang, olahraga rutin minimal 150 menit/minggu.</li>
      <li>Jaga berat badan ideal dan pantau kadar glukosa darah serta HbA1c secara berkala.</li>
      <li>Lakukan skrining ulang setiap 6–12 bulan sebagai langkah pencegahan.</li>
    `;
  } else if (prob >= 0.5 && prob <= 0.65) {
    // ── Risiko Sedang / Pra-Diabetes ──────────────────────────────────
    riskBadge.textContent = '🟡 Tingkat Risiko: Sedang (Pra-Diabetes)';
    riskBadge.className   = 'inline-block px-4 py-1 rounded-full text-sm font-bold mb-3 bg-yellow-100 text-yellow-700';
    statusEl.textContent  = 'POTENSI PREDIABETES (PRA-DIABETES)';
    statusEl.className    = 'text-2xl md:text-3xl font-extrabold text-yellow-600 mb-2';
    descEl.textContent    = `Probabilitas risiko Anda adalah ${probPct}%. Beberapa biomarker klinis Anda menunjukkan potensi prediabetes (pra-diabetes) yang perlu ditangani sedini mungkin.`;
    adviceEl.innerHTML    = `
      <li><b>Sangat disarankan:</b> Segera kurangi konsumsi gula berlebih dan karbohidrat sederhana (nasi putih, minuman manis, roti putih).</li>
      <li>Tingkatkan aktivitas fisik harian minimal 30 menit setiap hari.</li>
      <li>Konsultasikan ke dokter atau Puskesmas untuk pemeriksaan glukosa darah puasa (GDP) dan HbA1c secara klinis.</li>
      <li>Pantau berat badan dan targetkan penurunan 5–7% jika kelebihan berat badan.</li>
    `;
  } else {
    // ── Risiko Tinggi / Diabetes ──────────────────────────────────────
    riskBadge.textContent = '🔴 Tingkat Risiko: Tinggi';
    riskBadge.className   = 'inline-block px-4 py-1 rounded-full text-sm font-bold mb-3 bg-red-100 text-red-700';
    statusEl.textContent  = 'RISIKO TINGGI — TERINDIKASI DIABETES';
    statusEl.className    = 'text-2xl md:text-3xl font-extrabold text-red-600 mb-2';
    descEl.textContent    = `Probabilitas risiko Anda mencapai ${probPct}%. Terdapat indikasi kuat ke arah diabetes tipe 2 berdasarkan pola biomarker klinis Anda.`;
    adviceEl.innerHTML    = `
      <li><b>Wajib segera:</b> Buat janji temu dengan dokter spesialis penyakit dalam (Sp.PD) untuk diagnosis medis lengkap.</li>
      <li>Lakukan uji laboratorium komprehensif: Gula Darah Puasa (GDP), Gula Darah 2 Jam Post-Prandial (GDPP), dan HbA1c.</li>
      <li>Mulai pembatasan diet ketat terhadap makanan manis dan pantau pola makan bersama ahli gizi.</li>
      <li>Jangan tunda penanganan — prediabetes dan diabetes tipe 2 yang terdeteksi dini masih sangat dapat ditangani.</li>
    `;
  }

  // ─── Faskes Link ─────────────────────────────────────────────────────────
  const faskesBtn = document.getElementById('btn-faskes');
  if (faskesBtn) {
    const q = encodeURIComponent('puskesmas atau rumah sakit terdekat');
    faskesBtn.href = `https://www.google.com/maps/search/${q}`;
  }

  // ─── PDF Download ────────────────────────────────────────────────────────
  document.getElementById('btn-download').addEventListener('click', () => {
    const element  = document.getElementById('document-container');
    const btn      = document.getElementById('btn-download');
    const origHTML = btn.innerHTML;

    btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Memproses...';
    btn.disabled  = true;

    // Tunggu animasi bar selesai, lalu tangkap seluruh elemen
    setTimeout(() => {
      // ── Gunakan html2canvas manual agar seluruh tinggi elemen tertangkap ──
      // (bukan hanya area viewport — ini penyebab "setengah halaman" di Windows)
      html2canvas(element, {
        scale:       2,
        useCORS:     true,
        logging:     false,
        allowTaint:  true,
        scrollX:     0,
        scrollY:     0,
        x:           0,
        y:           0,
        width:       element.offsetWidth,
        height:      element.offsetHeight,   // <-- ambil SELURUH tinggi elemen
        windowWidth: element.offsetWidth,
        windowHeight: element.offsetHeight
      }).then((canvas) => {
        const { jsPDF } = window.jspdf;

        // Ukuran A4 dalam mm
        const pageW  = 210;
        const pageH  = 297;
        const margin = 10;                   // mm
        const usableW = pageW - margin * 2;  // lebar konten
        const usableH = pageH - margin * 2;  // tinggi konten per halaman

        // Hitung rasio canvas → halaman A4
        const canvasW   = canvas.width;
        const canvasH   = canvas.height;
        const ratio     = usableW / (canvasW / 2);   // /2 karena scale=2
        const imgW      = usableW;
        const imgH      = (canvasH / 2) * ratio;     // tinggi gambar dalam mm

        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

        let posY = 0;   // posisi kursor di canvas (dalam px pada skala 1x)
        let page = 0;

        while (posY < canvasH / 2) {
          if (page > 0) pdf.addPage();

          // Potong canvas sesuai halaman
          const sliceH    = Math.min(usableH / ratio, canvasH / 2 - posY);  // px (skala 1x)
          const slicePx   = sliceH * 2;   // px pada canvas (scale=2)
          const posPx     = posY * 2;

          const slice = document.createElement('canvas');
          slice.width  = canvasW;
          slice.height = slicePx;
          slice.getContext('2d').drawImage(
            canvas,
            0, posPx,          // source x, y
            canvasW, slicePx,  // source w, h
            0, 0,              // dest x, y
            canvasW, slicePx   // dest w, h
          );

          const sliceData = slice.toDataURL('image/jpeg', 0.98);
          const sliceImgH = sliceH * ratio;   // tinggi gambar irisan dalam mm

          pdf.addImage(sliceData, 'JPEG', margin, margin, imgW, sliceImgH);

          posY += sliceH;
          page++;
        }

        const filename = `Hasil_Skrining_PrevaLife_${(data.name || 'Pasien').replace(/\s+/g, '_')}.pdf`;
        pdf.save(filename);

        btn.innerHTML = origHTML;
        btn.disabled  = false;
      }).catch((err) => {
        console.error('Gagal membuat PDF:', err);
        alert('Terjadi kesalahan saat membuat PDF. Silakan coba lagi.');
        btn.innerHTML = origHTML;
        btn.disabled  = false;
      });
    }, 400);
  });
});
