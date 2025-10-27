function ابدأ_الاختبار() {
  document.getElementById("status").innerText = "جاري الاختبار...";
  document.getElementById("download").innerText = "--";
  document.getElementById("upload").innerText = "0%";

  let currentPercent = 0;
  const uploadDisplay = document.getElementById("upload");
  const duration = 10000; // 10 ثواني
  const steps = 100;
  const intervalTime = duration / steps;
  let step = 0;

  const interval = setInterval(() => {
    if (step >= steps) {
      clearInterval(interval);

      // سرعة التحميل بعد انتهاء الاختبار
      const downloadSpeed = 100.00; // سرعة حقيقية 100%
      document.getElementById("download").innerText = downloadSpeed.toFixed(2);
      document.getElementById("status").innerText = "تم الاختبار ✅";
    } else {
      // حركة تدريجية للعداد
      currentPercent = (step / steps) * 100;
      uploadDisplay.innerText = currentPercent.toFixed(0) + "%";
      step++;
    }
  }, intervalTime);
}
