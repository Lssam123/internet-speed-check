function ابدأ_الاختبار() {
  document.getElementById("status").innerText = "جاري الاختبار...";
  document.getElementById("download").innerText = "--";
  document.getElementById("upload").innerText = "0";

  let uploadSpeed = Math.random() * 50;
  let currentUpload = 0;
  const uploadDisplay = document.getElementById("upload");

  const duration = 5000; // 5 ثواني
  const steps = 100;
  const intervalTime = duration / steps;
  let step = 0;

  const interval = setInterval(() => {
    if (step >= steps) {
      clearInterval(interval);

      // سرعة التحميل بعد انتهاء الاختبار
      const downloadSpeed = (Math.random() * 100).toFixed(2);
      document.getElementById("download").innerText = downloadSpeed;
      document.getElementById("status").innerText = "تم الاختبار ✅";
    } else {
      // حركة تدريجية للعداد
      const fluctuation = Math.random() * 2 - 1; // بين -1 و +1
      currentUpload += fluctuation;
      currentUpload = Math.max(0, Math.min(currentUpload, uploadSpeed));
      uploadDisplay.innerText = currentUpload.toFixed(1);
      step++;
    }
  }, intervalTime);
}
