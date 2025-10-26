function startSpeedTest() {
  document.getElementById("downloadSpeed").textContent = "جاري القياس...";
  document.getElementById("uploadSpeed").textContent = "جاري القياس...";
  document.getElementById("ping").textContent = "جاري القياس...";

  // محاكاة نتائج مؤقتة (يمكن استبدالها لاحقًا بمكتبة LibreSpeed)
  setTimeout(() => {
    const download = (Math.random() * 100).toFixed(2);
    const upload = (Math.random() * 50).toFixed(2);
    const ping = (Math.random() * 100).toFixed(2);

    document.getElementById("downloadSpeed").textContent = `${download}`;
    document.getElementById("uploadSpeed").textContent = `${upload}`;
    document.getElementById("ping").textContent = `${ping}`;

    fetchISP();
  }, 2000);
}

function fetchISP() {
  fetch('https://ipinfo.io/json?token=e217c8f34c0cfe')
    .then(res => res.json())
    .then(data => {
      document.getElementById("isp").textContent = data.org || "غير معروف";
    })
    .catch(() => {
      document.getElementById("isp").textContent = "فشل في جلب مزود الخدمة";
    });
}
