let s = new Speedtest();

function startSpeedTest() {
  const loader = '<span class="loader"></span>';
  document.getElementById("downloadSpeed").innerHTML = loader;
  document.getElementById("uploadSpeed").innerHTML = loader;
  document.getElementById("ping").innerHTML = loader;
  document.getElementById("analysis").textContent = "--";

  s.onupdate = data => {
    if (data.dlStatus) {
      const download = parseFloat(data.dlStatus).toFixed(2);
      document.getElementById("downloadSpeed").textContent = download;
    }
    if (data.ulStatus) {
      const upload = parseFloat(data.ulStatus).toFixed(2);
      document.getElementById("uploadSpeed").textContent = upload;
    }
    if (data.pingStatus) {
      const ping = parseFloat(data.pingStatus).toFixed(2);
      document.getElementById("ping").textContent = ping;
    }
  };

  s.onend = () => {
    fetchISP();
    analyzeResults();
  };

  s.start();
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

function analyzeResults() {
  const download = parseFloat(document.getElementById("downloadSpeed").textContent);
  const upload = parseFloat(document.getElementById("uploadSpeed").textContent);
  const ping = parseFloat(document.getElementById("ping").textContent);

  let result = "";
  let color = "";

  if (download >= 50 && upload >= 20 && ping <= 50) {
    result = "✅ ممتازة للبث والألعاب";
    color = "#c8e6c9";
  } else if (download >= 20 && upload >= 5 && ping <= 100) {
    result = "🟡 جيدة للتصفح والمشاهدة";
    color = "#fff9c4";
  } else {
    result = "❌ ضعيفة، قد تواجه بطء أو تقطع";
    color = "#ffcdd2";
  }

  const analysisBox = document.getElementById("analysis");
  analysisBox.textContent = result;
  analysisBox.style.backgroundColor = color;
}

function shareResults() {
  const download = document.getElementById("downloadSpeed").textContent;
  const upload = document.getElementById("uploadSpeed").textContent;
  const ping = document.getElementById("ping").textContent;
  const isp = document.getElementById("isp").textContent;
  const analysis = document.getElementById("analysis").textContent;

  const message = `📡 نتائج قياس الإنترنت:\nتحميل: ${download} Mbps\nرفع: ${upload} Mbps\nبينغ: ${ping} ms\nمزود الخدمة: ${isp}\n${analysis}`;
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}

function toggle
