const downloadEl = document.getElementById("download");
const uploadFinalEl = document.getElementById("upload-final");
const qualityEl = document.getElementById("quality");
const connectionTypeEl = document.getElementById("connection-type");
const currentTimeEl = document.getElementById("current-time");
const timezoneEl = document.getElementById("timezone");
const ispEl = document.getElementById("isp");
const yearEl = document.getElementById("year");
const ledEl = document.getElementById("led");

// الوقت والمنطقة
function تحديث_الوقت() {
  const الآن = new Date();
  currentTimeEl.textContent = الآن.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  timezoneEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
  yearEl.textContent = الآن.getFullYear();
}
تحديث_الوقت();

// نوع الاتصال
connectionTypeEl.textContent = navigator.connection?.effectiveType || "غير معروف";

// مزود الخدمة
function جلب_مزود_الخدمة() {
  fetch("https://ipinfo.io/json?token=e217c8f34c0cfe")
    .then(response => response.json())
    .then(data => {
      ispEl.textContent = data.org || "غير معروف";
    })
    .catch(() => {
      ispEl.textContent = "غير متاح";
    });
}
جلب_مزود_الخدمة();

// الرسم البياني
const ctx = document.getElementById("speedChart").getContext("2d");
const speedChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "تحميل",
      data: [],
      borderColor: "#00b4d8",
      backgroundColor: "rgba(0, 180, 216, 0.1)",
      tension: 0.4,
    }],
  },
  options: {
    responsive: true,
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Mbps" } },
      x: { title: { display: true, text: "الثواني" } },
    },
  },
});

// قياس التحميل الحقيقي
async function قياس_سرعة_التحميل() {
  const رابط = "https://speed.hetzner.de/20MB.bin";
  const حجم_ميجا = 20;
  const البداية = performance.now();

  try {
    const response = await fetch(`${رابط}?nocache=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      mode: "cors"
    });

    if (!response.ok) throw new Error("فشل التحميل");

    await response.blob();
    const النهاية = performance.now();
    const الزمن = (النهاية - البداية) / 1000;
    const السرعة = (حجم_ميجا * 8) / الزمن;
    return { السرعة: السرعة.toFixed(2), الزمن: الزمن.toFixed(1) };
  } catch (error) {
    console.error("خطأ في التحميل:", error);
    return null;
  }
}

// بدء الاختبار
async function ابدأ_الاختبار() {
  إعادة_الاختبار();
  const النتيجة = await قياس_سرعة_التحميل();

  if (النتيجة) {
    const سرعة = parseFloat(النتيجة.السرعة);
    const زمن = parseFloat(النتيجة.الزمن);

    downloadEl.textContent = سرعة;
    uploadFinalEl.textContent = "0.00";
    تحليل_الجودة(سرعة, 0, زمن);

    for (let i = 1; i <= زمن; i++) {
      speedChart.data.labels.push(i);
      speedChart.data.datasets[0].data.push((سرعة / زمن * i).toFixed(2));
    }
    speedChart.update();
  } else {
    downloadEl.textContent = "تعذر القياس";
    uploadFinalEl.textContent = "--";
    qualityEl.textContent = "جودة الاتصال: غير متاحة";
    ledEl.className = "status-led bad";
  }
}

// تحليل الجودة وتغيير اللمبة
function تحليل_الجودة(تحميل, رفع, زمن) {
  const متوسط = (تحميل + رفع) / 2;
  const كفاءة = متوسط / زمن;
  let الجودة = "ضعيف";
  let اللون = "#e74c3c";
  let ledClass = "bad";

  if (كفاءة > 3) {
    الجودة = "ممتاز";
    اللون = "#2ecc71";
    ledClass = "good";
  } else if (كفاءة > 1.5) {
    الجودة = "جيد";
    اللون = "#f4a261";
    ledClass = "good";
  }

  qualityEl.textContent = `جودة الاتصال: ${الجودة}`;
  qualityEl.style.color = اللون;
  ledEl.className = `status-led ${ledClass}`;
}

// إعادة الاختبار
function إعادة_الاختبار() {
  downloadEl.textContent = "--";
  uploadFinalEl.textContent = "--";
  qualityEl.textContent = "جودة الاتصال: --";
  qualityEl.style.color = "#ccc";
  ledEl.className = "status-led";
  speedChart.data.labels = [];
  speedChart.data.datasets[0].data = [];
  speedChart.update();
}

// نسخ ومشاركة
function نسخ_النتيجة() {
  const نص = `سرعة التحميل: ${downloadEl.textContent} Mbps\nسرعة الرفع: ${uploadFinalEl.textContent} Mbps\n${qualityEl.textContent}`;
  navigator.clipboard.writeText(نص);
  alert("تم نسخ النتيجة إلى الحافظة");
}

function مشاركة_النتيجة() {
  alert("ميزة المشاركة غير مفعلة حاليًا");
}
