// عناصر الواجهة
const uploadEl = document.getElementById("upload");
const downloadEl = document.getElementById("download");
const uploadFinalEl = document.getElementById("upload-final");
const qualityEl = document.getElementById("quality");
const statusEl = document.getElementById("status");
const timerEl = document.getElementById("timer");
const connectionTypeEl = document.getElementById("connection-type");
const currentTimeEl = document.getElementById("current-time");
const timezoneEl = document.getElementById("timezone");

// إعداد الوقت الحالي والمنطقة
function تحديث_الوقت() {
  const الآن = new Date();
  currentTimeEl.textContent = الآن.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  timezoneEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
}
تحديث_الوقت();

// نوع الاتصال (محاكاة)
connectionTypeEl.textContent = navigator.connection?.effectiveType || "غير معروف";

// تأثير بصري للعداد
function تحديث_العداد(نسبة) {
  const الدائرة = document.querySelector(".ring-fill");
  const الحد_الأقصى = 440;
  const القيمة = Math.min(نسبة, 100);
  const الإزاحة = الحد_الأقصى - (القيمة / 100) * الحد_الأقصى;
  الدائرة.style.strokeDashoffset = الإزاحة;
}

// تأثير بصري عند تحديث النتائج
function تمييز_النتيجة(العنصر) {
  العنصر.style.transition = "background 0.3s ease";
  العنصر.style.background = "#dff9fb";
  setTimeout(() => {
    العنصر.style.background = "";
  }, 600);
}

// بدء الاختبار
function ابدأ_الاختبار() {
  إعادة_الاختبار();
  statusEl.textContent = "📡 جاري قياس السرعة...";
  let الوقت = 10;
  let سرعة_التحميل = 0;
  let سرعة_الرفع = 0;

  const مؤقت = setInterval(() => {
    الوقت--;
    timerEl.textContent = `⏱ الوقت المتبقي: ${الوقت} ثانية`;

    // محاكاة السرعة بتدرج واقعي
    سرعة_التحميل += Math.random() * 4 + 1;
    سرعة_الرفع += Math.random() * 1.5 + 0.5;

    downloadEl.textContent = سرعة_التحميل.toFixed(2);
    uploadEl.textContent = سرعة_الرفع.toFixed(2);

    تحديث_العداد(سرعة_الرفع * 4);
    تمييز_النتيجة(downloadEl);
    تمييز_النتيجة(uploadEl);

    if (الوقت <= 0) {
      clearInterval(مؤقت);
      statusEl.textContent = "✅ تم القياس بنجاح";
      timerEl.textContent = "";

      uploadFinalEl.textContent = سرعة_الرفع.toFixed(2);
      تحليل_الجودة(سرعة_التحميل, سرعة_الرفع, 10);
    }
  }, 1000);
}

// تحليل جودة الاتصال بناءً على التحميل والرفع والزمن
function تحليل_الجودة(تحميل, رفع, زمن) {
  const متوسط = (تحميل + رفع) / 2;
  const كفاءة = متوسط / زمن;
  let الجودة = "ضعيف";
  let اللون = "#d62828";

  if (كفاءة > 3) {
    الجودة = "ممتاز";
    اللون = "#2a9d8f";
  } else if (كفاءة > 1.5) {
    الجودة = "جيد";
    اللون = "#f4a261";
  }

  qualityEl.textContent = `📊 جودة الاتصال: ${الجودة}`;
  qualityEl.style.color = اللون;
  تمييز_النتيجة(qualityEl);
}

// إعادة الاختبار
function إعادة_الاختبار() {
  uploadEl.textContent = "0.00";
  downloadEl.textContent = "--";
  uploadFinalEl.textContent = "--";
  qualityEl.textContent = "جودة الاتصال: --";
  qualityEl.style.color = "#219ebc";
  statusEl.textContent = "اضغط على الزر لبدء الاختبار";
  timerEl.textContent = "";
  تحديث_العداد(0);
}

// نسخ النتيجة
function نسخ_النتيجة() {
  const نص = `📥 تحميل: ${downloadEl.textContent} Mbps\n📤 رفع: ${uploadFinalEl.textContent} Mbps\n${qualityEl.textContent}`;
  navigator.clipboard.writeText(نص);
  alert("✅ تم نسخ النتيجة إلى الحافظة");
}

// مشاركة النتيجة (محاكاة)
function مشاركة_النتيجة() {
  alert("📤 ميزة المشاركة غير مفعلة حاليًا");
}
