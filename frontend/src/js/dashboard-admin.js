document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/preva.html';
        return;
    }

    const btnLogout  = document.getElementById('btn-logout');
    const btnRefresh = document.getElementById('btn-refresh');
    const tableBody  = document.getElementById('table-body');
    let chartInstance = null;

    // ─── Logout ─────────────────────────────────────────────────────────────
    btnLogout.addEventListener('click', () => {
        Swal.fire({
            title: 'Konfirmasi Keluar',
            text: 'Anda yakin ingin mengakhiri sesi admin?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Ya, Keluar',
            cancelButtonText: 'Batal',
            customClass: {
                popup: 'rounded-3xl shadow-2xl border border-gray-100 font-outfit',
                confirmButton: 'rounded-xl font-semibold py-3 px-6',
                cancelButton: 'rounded-xl font-semibold py-3 px-6'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('adminToken');
                window.location.href = '/preva.html';
            }
        });
    });

    btnRefresh.addEventListener('click', loadData);

    // ─── Load Data ───────────────────────────────────────────────────────────
    async function loadData() {
        tableBody.innerHTML = `<tr><td colspan="9" class="px-6 py-16 text-center text-gray-400">
            <i class="ph ph-spinner animate-spin text-4xl mb-3 mx-auto text-brand-500 block"></i>
            <p class="font-medium text-gray-500">Memuat data...</p>
        </td></tr>`;

        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // Ambil data pasien dan stats secara paralel
            const [dataRes, statsRes] = await Promise.all([
                fetch('/api/admin/data', { headers }),
                fetch('/api/admin/stats', { headers })
            ]);

            if (dataRes.status === 401 || dataRes.status === 403) {
                localStorage.removeItem('adminToken');
                window.location.href = '/preva.html';
                return;
            }

            const dataResult  = await dataRes.json();
            const statsResult = await statsRes.json();

            if (statsResult.success) {
                updateCharts(statsResult.data);
            }

            if (dataResult.success) {
                window.patientData = dataResult.data;
                renderTable(dataResult.data);
            } else {
                throw new Error(dataResult.message);
            }

        } catch (error) {
            console.error('Error fetching admin data:', error);
            tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-12 text-rose-500 font-medium">
                Gagal memuat data. Periksa koneksi server.<br>
                <span class="text-xs text-gray-400">${error.message}</span>
            </td></tr>`;
        }
    }

    // ─── Update Charts & Stats Cards ────────────────────────────────────────
    function updateCharts(stats) {
        document.getElementById('stat-low').textContent  = stats.lowRisk  || 0;
        document.getElementById('stat-pre').textContent  = stats.medium   || 0;
        document.getElementById('stat-high').textContent = stats.highRisk || 0;

        const ctx = document.getElementById('predictionChart').getContext('2d');
        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Risiko Rendah', 'Risiko Sedang', 'Risiko Tinggi'],
                datasets: [{
                    data: [stats.lowRisk || 0, stats.medium || 0, stats.highRisk || 0],
                    backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { family: "'Outfit', sans-serif", size: 13, weight: '500' }
                        }
                    }
                },
                cutout: '75%'
            }
        });
    }

    // ─── Render Table ────────────────────────────────────────────────────────
    function renderTable(data) {
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-16 text-gray-400 font-medium">Belum ada data pasien yang tersimpan.</td></tr>`;
            return;
        }

        const genderLabel = { Female: 'Wanita', Male: 'Pria', Other: 'Lainnya' };

        let rows = '';
        data.forEach((item, index) => {
            const date = new Date(item.timestamp).toLocaleDateString('id-ID', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            const gender = genderLabel[item.gender] || item.gender || '—';
            const usia   = item.age ? `${item.age} thn` : '—';
            const bmi    = item.bmi ? parseFloat(item.bmi).toFixed(1) : '—';
            const hba1c  = item.HbA1c_level ? `${item.HbA1c_level}%` : '—';
            const prob   = item.probability != null ? `${(item.probability * 100).toFixed(1)}%` : '—';

            let statusBadge = '';
            const rl = String(item.risk_level || '');
            if (rl === 'Rendah') {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">🟢 Rendah</span>`;
            } else if (rl === 'Sedang') {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">🟡 Sedang</span>`;
            } else if (rl === 'Tinggi') {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">🔴 Tinggi</span>`;
            } else {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">${rl || '—'}</span>`;
            }

            rows += `
                <tr class="hover:bg-gray-50/80 transition-colors group">
                    <td class="px-8 py-4 text-sm text-gray-500 whitespace-nowrap">${date}</td>
                    <td class="px-6 py-4 font-bold text-gray-900">${item.FullName || 'Anonymous'}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">${gender}</td>
                    <td class="px-6 py-4 text-sm text-gray-600 font-medium">${usia}</td>
                    <td class="px-6 py-4 text-sm text-gray-600 font-medium">${bmi}</td>
                    <td class="px-6 py-4 text-sm text-gray-600 font-medium">${hba1c}</td>
                    <td class="px-6 py-4 text-sm font-semibold text-slate-700">${prob}</td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-8 py-4 text-center">
                        <button onclick="window.showDetailModal(${index})"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95">
                            <i class="ph-bold ph-eye"></i> Detail
                        </button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = rows;
    }

    // ─── Detail Modal ────────────────────────────────────────────────────────
    window.showDetailModal = (index) => {
        if (!window.patientData) return;
        const item = window.patientData[index];
        if (!item) return;

        const rl = String(item.risk_level || '');
        let statusHtml = '';
        if (rl === 'Rendah')
            statusHtml = `<div class="bg-emerald-50 text-emerald-600 border border-emerald-200 px-6 py-2.5 rounded-2xl font-bold text-lg inline-flex items-center gap-2 mb-6"><i class="ph-fill ph-check-circle text-xl"></i> Risiko Rendah</div>`;
        else if (rl === 'Sedang')
            statusHtml = `<div class="bg-amber-50 text-amber-600 border border-amber-200 px-6 py-2.5 rounded-2xl font-bold text-lg inline-flex items-center gap-2 mb-6"><i class="ph-fill ph-warning-circle text-xl"></i> Risiko Sedang (Prediabetes)</div>`;
        else
            statusHtml = `<div class="bg-rose-50 text-rose-600 border border-rose-200 px-6 py-2.5 rounded-2xl font-bold text-lg inline-flex items-center gap-2 mb-6"><i class="ph-fill ph-heart-break text-xl"></i> Risiko Tinggi (Diabetes)</div>`;

        const smokeMap = {
            never: 'Tidak pernah', 'No Info': 'Tidak ada info',
            current: 'Perokok aktif', former: 'Mantan perokok',
            ever: 'Pernah merokok', 'not current': 'Tidak merokok saat ini'
        };
        const genderLabel = { Female: 'Wanita', Male: 'Pria', Other: 'Lainnya' };

        const f = (label, value) => `
            <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <p class="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">${label}</p>
                <p class="text-gray-900 font-semibold text-sm">${value ?? '—'}</p>
            </div>
        `;

        const prob = item.probability != null ? `${(item.probability * 100).toFixed(2)}%` : '—';
        const probBarColor = rl === 'Tinggi' ? '#f43f5e' : rl === 'Sedang' ? '#f59e0b' : '#10b981';
        const probBarWidth = item.probability != null ? (item.probability * 100).toFixed(1) : 0;

        const htmlContent = `
            <div class="text-left font-outfit">
                <div class="text-center">${statusHtml}</div>

                <!-- Probability Bar -->
                <div class="mb-6 p-4 bg-slate-50 rounded-xl">
                    <div class="flex justify-between text-sm font-medium text-slate-600 mb-2">
                        <span>Probabilitas Risiko AI</span>
                        <span class="font-bold" style="color:${probBarColor}">${prob}</span>
                    </div>
                    <div style="background:#e2e8f0;border-radius:999px;height:10px;overflow:hidden">
                        <div style="width:${probBarWidth}%;height:10px;background:${probBarColor};border-radius:999px;transition:width 1s ease"></div>
                    </div>
                </div>

                <h4 class="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Informasi Diri</h4>
                <div class="grid grid-cols-2 gap-3 mb-4">
                    ${f('Nama Pasien', item.FullName || 'Anonymous')}
                    ${f('Jenis Kelamin', genderLabel[item.gender] || item.gender)}
                    ${f('Usia', item.age ? `${item.age} tahun` : '—')}
                    ${f('Riwayat Merokok', smokeMap[item.smoking_history] || item.smoking_history || '—')}
                </div>

                <h4 class="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Parameter Klinis AI</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    ${f('BMI', item.bmi ? `${parseFloat(item.bmi).toFixed(1)}` : '—')}
                    ${f('HbA1c Level', item.HbA1c_level ? `${item.HbA1c_level}%` : '—')}
                    ${f('Glukosa Darah', item.blood_glucose_level ? `${item.blood_glucose_level} mg/dL` : '—')}
                    ${f('Hipertensi', item.hypertension == 1 ? 'Ya' : 'Tidak')}
                    ${f('Penyakit Jantung', item.heart_disease == 1 ? 'Ya' : 'Tidak')}
                    ${f('Hasil Prediksi AI', item.prediction || '—')}
                </div>
            </div>
        `;

        Swal.fire({
            title: 'Detail Laporan Skrining',
            html: htmlContent,
            width: '700px',
            showCloseButton: true,
            showConfirmButton: false,
            background: '#f8fafc',
            customClass: {
                popup: 'rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 font-outfit p-4 md:p-8',
                title: 'font-bold text-gray-900 text-2xl pt-2 mb-4',
                closeButton: 'text-gray-400 hover:text-rose-500 transition-colors focus:outline-none mt-2 mr-2'
            },
            backdrop: 'rgba(15, 23, 42, 0.6) backdrop-blur-md'
        });
    };

    // Initial load
    loadData();
});
