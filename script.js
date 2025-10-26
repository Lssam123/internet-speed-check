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

  if (download >= 50 && upload >= 20 && ping <= 50) {
    result = "ممتازة للبث والألعاب";
  } else if (download >= 20 && upload >= 5 && ping <= 100) {
    result = "جيدة للتصفح والمشاهدة";
  } else {
    result = "ضعيفة، قد تواجه بطء أو تقطع";
  }

  document.getElementById("analysis").textContent = result;
}
