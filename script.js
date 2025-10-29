const symbolInput = document.getElementById("symbolInput");
const widgetContainer = document.getElementById("widgetContainer");
const stockItems = document.querySelectorAll(".stock-list li");

// قائمة أسماء الشركات حسب الرموز
const الشركات = {
  "TADAWUL:2222": "أرامكو السعودية",
  "TADAWUL:2082": "أكوا باور",
  "TADAWUL:2380": "بترو رابغ",
  "TADAWUL:2030": "المصافي",
  "TADAWUL:1120": "مصرف الراجحي",
  "TADAWUL:1010": "البنك الأول",
  "TADAWUL:1060": "بنك الرياض",
  "TADAWUL:1140": "البنك السعودي الفرنسي",
  "TADAWUL:1180": "بنك البلاد",
  "TADAWUL:7010": "الاتصالات السعودية",
  "TADAWUL:7030": "زين السعودية",
  "TADAWUL:7202": "جاهز الدولية",
  "TADAWUL:7203": "علم",
  "TADAWUL:2010": "سابك",
  "TADAWUL:1301": "أسمنت العربية",
  "TADAWUL:1320": "أسمنت القصيم",
  "TADAWUL:2040": "الخزف السعودي",
  "TADAWUL:2210": "نماء للكيماويات",
  "TADAWUL:4190": "جرير",
  "TADAWUL:4003": "إكسترا",
  "TADAWUL:4260": "بدجت السعودية",
  "TADAWUL:4040": "سابتكو",
  "TADAWUL:8010": "التعاونية",
  "TADAWUL:8050": "سلامة للتأمين",
  "TADAWUL:8120": "اتحاد الخليج الأهلية"
};

// عرض السهم من الإدخال اليدوي
function عرض_السهم() {
  const الرمز = symbolInput.value.trim().toUpperCase();
  if (!الرمز.startsWith("TADAWUL:")) {
    widgetContainer.innerHTML = "<p>يرجى إدخال رمز سعودي يبدأ بـ TADAWUL:</p>";
    return;
  }
  عرض_السهم_المباشر(رمز);
}

// عرض السهم من القائمة
function عرض_السهم_المباشر(رمز) {
  symbolInput.value = رمز;
  localStorage.setItem("آخر_سهم", رمز);

  // تمييز العنصر النشط
  stockItems.forEach(item => {
    item.classList.remove("نشط");
    if (item.textContent === الشركات[رمز]) {
      item.classList.add("نشط");
    }
  });

  // عرض الأداة
  widgetContainer.innerHTML = `
    <h3>${الشركات[رمز] || "سهم غير معروف"}</h3>
    <div class="tradingview-widget-container">
      <div id="tradingview_${رمز.replace(/[^a-zA-Z0-9]/g, '')}"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js">
      {
        "symbols": [["${رمز}|1"]],
        "width": "100%",
        "height": "300",
        "locale": "ar",
        "colorTheme": "dark",
        "isTransparent": false
      }
      </script>
    </div>
  `;
}

// تحميل آخر سهم تلقائيًا عند فتح الموقع
window.addEventListener("DOMContentLoaded", () => {
  const آخر_سهم = localStorage.getItem("آخر_سهم");
  if (آخر_سهم) {
    عرض_السهم_المباشر(آخر_سهم);
  }
});
