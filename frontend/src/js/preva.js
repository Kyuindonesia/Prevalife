document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('admin-login-form');
    const btnLogin = document.getElementById('btn-login');

    // Check if already logged in
    if (localStorage.getItem('adminToken')) {
        window.location.href = '/dashboard-admin.html';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const prevContent = btnLogin.innerHTML;
        btnLogin.innerHTML = '<i class="ph ph-spinner animate-spin text-xl"></i> <span>Memproses...</span>';
        btnLogin.disabled = true;

        try {
            // Note: Update the URL based on your production env or use relative path
            const response = await fetch('https://prevalife.kyuhost.web.id/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                // Save token
                localStorage.setItem('adminToken', result.token);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Akses Diberikan',
                    text: 'Mengalihkan ke dashboard...',
                    showConfirmButton: false,
                    timer: 1500,
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-3xl shadow-2xl border border-gray-100',
                        title: 'font-outfit font-bold text-gray-900',
                        htmlContainer: 'font-outfit text-gray-500'
                    },
                    backdrop: `
                        rgba(17, 24, 39, 0.4)
                        backdrop-blur-sm
                    `
                }).then(() => {
                    window.location.href = '/dashboard-admin.html';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Akses Ditolak',
                    text: result.message || 'Kredensial tidak valid',
                    confirmButtonText: 'Coba Lagi',
                    buttonsStyling: false,
                    customClass: {
                        popup: 'rounded-3xl shadow-2xl border border-gray-100',
                        title: 'font-outfit font-bold text-gray-900',
                        htmlContainer: 'font-outfit text-gray-500',
                        confirmButton: 'bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors font-outfit'
                    },
                    backdrop: `
                        rgba(17, 24, 39, 0.4)
                        backdrop-blur-sm
                    `
                });
            }

        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Koneksi Terputus',
                text: 'Tidak dapat menghubungi server sistem. Silakan coba beberapa saat lagi.',
                confirmButtonText: 'Tutup',
                buttonsStyling: false,
                customClass: {
                    popup: 'rounded-3xl shadow-2xl border border-gray-100',
                    title: 'font-outfit font-bold text-gray-900',
                    htmlContainer: 'font-outfit text-gray-500',
                    confirmButton: 'bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl transition-colors font-outfit'
                },
                backdrop: `
                    rgba(17, 24, 39, 0.4)
                    backdrop-blur-sm
                `
            });
        } finally {
            btnLogin.innerHTML = prevContent;
            btnLogin.disabled = false;
        }
    });
});
