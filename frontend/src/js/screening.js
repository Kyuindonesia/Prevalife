document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('screening-form');
  const btnSubmit = document.getElementById('btn-submit');

  // BMI Elements
  const heightInput = document.getElementById('height');
  const weightInput = document.getElementById('weight');
  const bmiResult = document.getElementById('bmi-result');
  const bmiCategory = document.getElementById('bmi-category');
  const bmiHidden = document.getElementById('bmi-hidden');

  // ─── BMI Calculation ─────────────────────────────────────────────────────
  function calculateBMI() {
    const h = parseFloat(heightInput.value);
    const w = parseFloat(weightInput.value);

    if (h > 0 && w > 0) {
      const bmi = w / ((h / 100) ** 2);
      const rounded = parseFloat(bmi.toFixed(2));
      bmiResult.textContent = rounded;
      bmiHidden.value = rounded;

      if (bmi < 18.5) {
        bmiCategory.textContent = 'Kurus (Underweight)';
        bmiCategory.className = 'px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700';
      } else if (bmi < 25) {
        bmiCategory.textContent = 'Normal';
        bmiCategory.className = 'px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700';
      } else if (bmi < 30) {
        bmiCategory.textContent = 'Kelebihan Berat (Overweight)';
        bmiCategory.className = 'px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700';
      } else {
        bmiCategory.textContent = 'Obesitas';
        bmiCategory.className = 'px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700';
      }
    } else {
      bmiResult.textContent = '0.0';
      bmiHidden.value = '';
      bmiCategory.textContent = 'Belum dihitung';
      bmiCategory.className = 'px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700';
    }
  }

  heightInput.addEventListener('input', calculateBMI);
  weightInput.addEventListener('input', calculateBMI);

  // ─── Form Submit ──────────────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validasi form bawaan HTML5
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Validasi khusus: BMI harus sudah dihitung
    const bmiVal = parseFloat(bmiHidden.value);
    if (!bmiVal || bmiVal <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'BMI belum dihitung',
        text: 'Mohon isi Tinggi dan Berat Badan untuk menghitung BMI.',
        confirmButtonColor: '#0d9488'
      });
      return;
    }

    const formData = new FormData(form);

    // Build payload sesuai dengan schema FastAPI PatientInput
    const payload = {
      nama:                formData.get('nama')              || 'Pasien',
      gender:              formData.get('gender'),
      age:                 parseFloat(formData.get('age')),
      hypertension:        parseInt(formData.get('hypertension')),
      heart_disease:       parseInt(formData.get('heart_disease')),
      smoking_history:     formData.get('smoking_history'),
      bmi:                 bmiVal,
      HbA1c_level:         parseFloat(formData.get('HbA1c_level')),
      blood_glucose_level: parseFloat(formData.get('blood_glucose_level')),
    };

    // Validasi numerik tambahan
    if (
      isNaN(payload.age) || isNaN(payload.bmi) ||
      isNaN(payload.HbA1c_level) || isNaN(payload.blood_glucose_level)
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Data tidak lengkap',
        text: 'Pastikan semua field diisi dengan benar.',
        confirmButtonColor: '#0d9488'
      });
      return;
    }

    const prevHTML = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Menganalisis...';
    btnSubmit.disabled = true;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const result = await response.json();

      if (!result.success) throw new Error(result.message || 'Prediksi gagal');

      // Simpan hasil ke localStorage untuk halaman result.html
      localStorage.setItem('screeningResult', JSON.stringify({
        name:               payload.nama,
        gender:             payload.gender,
        age:                payload.age,
        bmi:                payload.bmi,
        HbA1c_level:        payload.HbA1c_level,
        blood_glucose_level: payload.blood_glucose_level,
        hypertension:       payload.hypertension,
        heart_disease:      payload.heart_disease,
        smoking_history:    payload.smoking_history,
        prediction:         result.prediction,   // "DIABETES" | "TIDAK DIABETES"
        probability:        result.probability,  // 0.0 - 1.0
        risk_level:         result.risk_level,   // "Rendah" | "Sedang" | "Tinggi"
        date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
      }));

      Swal.fire({
        icon: 'success',
        title: 'Analisis Selesai!',
        text: 'Mengalihkan ke halaman hasil...',
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true
      }).then(() => {
        window.location.href = '/result.html';
      });

    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Terhubung',
        html: `<p>Terjadi kesalahan saat menghubungi server.</p><p class="text-xs text-slate-400 mt-2">${error.message}</p>`,
        confirmButtonColor: '#0d9488'
      });
    } finally {
      btnSubmit.innerHTML = prevHTML;
      btnSubmit.disabled = false;
    }
  });
});
