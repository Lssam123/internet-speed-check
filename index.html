const downloadEl = document.getElementById("download");
const uploadFinalEl = document.getElementById("upload-final");
const qualityEl = document.getElementById("quality");
const currentTimeEl = document.getElementById("current-time");
const timezoneEl = document.getElementById("timezone");
const ledEl = document.getElementById("led");

// تحديث الوقت والمنطقة الزمنية
function تحديث_الوقت() {
  const الآن = new Date();
  currentTimeEl.textContent = الآن.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  timezoneEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
}
تحديث_الوقت();

// تحليل جودة الاتصال وتحديث اللمبة (مثال يدوي)
function تحليل_جودة(تحميل, رفع, زمن) {
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
