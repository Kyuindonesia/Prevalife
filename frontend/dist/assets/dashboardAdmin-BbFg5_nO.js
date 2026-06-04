import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css              */document.addEventListener("DOMContentLoaded",()=>{const x=localStorage.getItem("adminToken");if(!x){window.location.href="/preva.html";return}const f=document.getElementById("btn-logout"),h=document.getElementById("btn-refresh"),d=document.getElementById("table-body");let c=null;f.addEventListener("click",()=>{Swal.fire({title:"Konfirmasi Keluar",text:"Anda yakin ingin mengakhiri sesi admin?",icon:"warning",showCancelButton:!0,confirmButtonColor:"#f43f5e",cancelButtonColor:"#94a3b8",confirmButtonText:"Ya, Keluar",cancelButtonText:"Batal",customClass:{popup:"rounded-3xl shadow-2xl border border-gray-100 font-outfit",confirmButton:"rounded-xl font-semibold py-3 px-6",cancelButton:"rounded-xl font-semibold py-3 px-6"}}).then(a=>{a.isConfirmed&&(localStorage.removeItem("adminToken"),window.location.href="/preva.html")})}),h.addEventListener("click",u);async function u(){d.innerHTML=`<tr><td colspan="9" class="px-6 py-16 text-center text-gray-400">
            <i class="ph ph-spinner animate-spin text-4xl mb-3 mx-auto text-brand-500 block"></i>
            <p class="font-medium text-gray-500">Memuat data...</p>
        </td></tr>`;const a={Authorization:`Bearer ${x}`};try{const[e,n]=await Promise.all([fetch("/api/admin/data",{headers:a}),fetch("/api/admin/stats",{headers:a})]);if(e.status===401||e.status===403){localStorage.removeItem("adminToken"),window.location.href="/preva.html";return}const t=await e.json(),s=await n.json();if(s.success&&y(s.data),t.success)window.patientData=t.data,k(t.data);else throw new Error(t.message)}catch(e){console.error("Error fetching admin data:",e),d.innerHTML=`<tr><td colspan="9" class="text-center py-12 text-rose-500 font-medium">
                Gagal memuat data. Periksa koneksi server.<br>
                <span class="text-xs text-gray-400">${e.message}</span>
            </td></tr>`}}function y(a){document.getElementById("stat-low").textContent=a.lowRisk||0,document.getElementById("stat-pre").textContent=a.medium||0,document.getElementById("stat-high").textContent=a.highRisk||0;const e=document.getElementById("predictionChart").getContext("2d");c&&c.destroy(),c=new Chart(e,{type:"doughnut",data:{labels:["Risiko Rendah","Risiko Sedang","Risiko Tinggi"],datasets:[{data:[a.lowRisk||0,a.medium||0,a.highRisk||0],backgroundColor:["#10b981","#f59e0b","#f43f5e"],borderWidth:0,hoverOffset:6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"bottom",labels:{usePointStyle:!0,padding:20,font:{family:"'Outfit', sans-serif",size:13,weight:"500"}}}},cutout:"75%"}})}function k(a){if(!a||a.length===0){d.innerHTML='<tr><td colspan="9" class="text-center py-16 text-gray-400 font-medium">Belum ada data pasien yang tersimpan.</td></tr>';return}const e={Female:"Wanita",Male:"Pria",Other:"Lainnya"};let n="";a.forEach((t,s)=>{const p=new Date(t.timestamp).toLocaleDateString("id-ID",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),o=e[t.gender]||t.gender||"—",b=t.age?`${t.age} thn`:"—",l=t.bmi?parseFloat(t.bmi).toFixed(1):"—",m=t.HbA1c_level?`${t.HbA1c_level}%`:"—",g=t.probability!=null?`${(t.probability*100).toFixed(1)}%`:"—";let r="";const i=String(t.risk_level||"");i==="Rendah"?r='<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">🟢 Rendah</span>':i==="Sedang"?r='<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">🟡 Sedang</span>':i==="Tinggi"?r='<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">🔴 Tinggi</span>':r=`<span class="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">${i||"—"}</span>`,n+=`
                <tr class="hover:bg-gray-50/80 transition-colors group">
                    <td class="px-8 py-4 text-sm text-gray-500 whitespace-nowrap">${p}</td>
                    <td class="px-6 py-4 font-bold text-gray-900">${t.FullName||"Anonymous"}</td>
                    <td class="px-6 py-4 text-sm text-gray-600">${o}</td>
                    <td class="px-6 py-4 text-sm text-gray-600 font-medium">${b}</td>
                    <td class="px-6 py-4 text-sm text-gray-600 font-medium">${l}</td>
                    <td class="px-6 py-4 text-sm text-gray-600 font-medium">${m}</td>
                    <td class="px-6 py-4 text-sm font-semibold text-slate-700">${g}</td>
                    <td class="px-6 py-4">${r}</td>
                    <td class="px-8 py-4 text-center">
                        <button onclick="window.showDetailModal(${s})"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95">
                            <i class="ph-bold ph-eye"></i> Detail
                        </button>
                    </td>
                </tr>
            `}),d.innerHTML=n}window.showDetailModal=a=>{if(!window.patientData)return;const e=window.patientData[a];if(!e)return;const n=String(e.risk_level||"");let t="";n==="Rendah"?t='<div class="bg-emerald-50 text-emerald-600 border border-emerald-200 px-6 py-2.5 rounded-2xl font-bold text-lg inline-flex items-center gap-2 mb-6"><i class="ph-fill ph-check-circle text-xl"></i> Risiko Rendah</div>':n==="Sedang"?t='<div class="bg-amber-50 text-amber-600 border border-amber-200 px-6 py-2.5 rounded-2xl font-bold text-lg inline-flex items-center gap-2 mb-6"><i class="ph-fill ph-warning-circle text-xl"></i> Risiko Sedang (Prediabetes)</div>':t='<div class="bg-rose-50 text-rose-600 border border-rose-200 px-6 py-2.5 rounded-2xl font-bold text-lg inline-flex items-center gap-2 mb-6"><i class="ph-fill ph-heart-break text-xl"></i> Risiko Tinggi (Diabetes)</div>';const s={never:"Tidak pernah","No Info":"Tidak ada info",current:"Perokok aktif",former:"Mantan perokok",ever:"Pernah merokok","not current":"Tidak merokok saat ini"},p={Female:"Wanita",Male:"Pria",Other:"Lainnya"},o=(r,i)=>`
            <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <p class="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">${r}</p>
                <p class="text-gray-900 font-semibold text-sm">${i??"—"}</p>
            </div>
        `,b=e.probability!=null?`${(e.probability*100).toFixed(2)}%`:"—",l=n==="Tinggi"?"#f43f5e":n==="Sedang"?"#f59e0b":"#10b981",m=e.probability!=null?(e.probability*100).toFixed(1):0,g=`
            <div class="text-left font-outfit">
                <div class="text-center">${t}</div>

                <!-- Probability Bar -->
                <div class="mb-6 p-4 bg-slate-50 rounded-xl">
                    <div class="flex justify-between text-sm font-medium text-slate-600 mb-2">
                        <span>Probabilitas Risiko AI</span>
                        <span class="font-bold" style="color:${l}">${b}</span>
                    </div>
                    <div style="background:#e2e8f0;border-radius:999px;height:10px;overflow:hidden">
                        <div style="width:${m}%;height:10px;background:${l};border-radius:999px;transition:width 1s ease"></div>
                    </div>
                </div>

                <h4 class="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Informasi Diri</h4>
                <div class="grid grid-cols-2 gap-3 mb-4">
                    ${o("Nama Pasien",e.FullName||"Anonymous")}
                    ${o("Jenis Kelamin",p[e.gender]||e.gender)}
                    ${o("Usia",e.age?`${e.age} tahun`:"—")}
                    ${o("Riwayat Merokok",s[e.smoking_history]||e.smoking_history||"—")}
                </div>

                <h4 class="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Parameter Klinis AI</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    ${o("BMI",e.bmi?`${parseFloat(e.bmi).toFixed(1)}`:"—")}
                    ${o("HbA1c Level",e.HbA1c_level?`${e.HbA1c_level}%`:"—")}
                    ${o("Glukosa Darah",e.blood_glucose_level?`${e.blood_glucose_level} mg/dL`:"—")}
                    ${o("Hipertensi",e.hypertension==1?"Ya":"Tidak")}
                    ${o("Penyakit Jantung",e.heart_disease==1?"Ya":"Tidak")}
                    ${o("Hasil Prediksi AI",e.prediction||"—")}
                </div>
            </div>
        `;Swal.fire({title:"Detail Laporan Skrining",html:g,width:"700px",showCloseButton:!0,showConfirmButton:!1,background:"#f8fafc",customClass:{popup:"rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 font-outfit p-4 md:p-8",title:"font-bold text-gray-900 text-2xl pt-2 mb-4",closeButton:"text-gray-400 hover:text-rose-500 transition-colors focus:outline-none mt-2 mr-2"},backdrop:"rgba(15, 23, 42, 0.6) backdrop-blur-md"})},u()});
