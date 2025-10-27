function ابدأ_الاختبار() {
  document.getElementById("status").innerText = "جاري الاختبار...";

  setTimeout(() => {
    const downloadSpeed = (Math.random() * 100).toFixed(2);
    const uploadSpeed = (Math.random() * 50).toFixed(2);

    document.getElementById("download").innerText = downloadSpeed;
    document.getElementById("upload").innerText = uploadSpeed;
    document.getElementById("status").innerText = "تم الاختبار ✅";

    const canvas = document.getElementById("الرسم_البياني");
    const ctx = canvas.getContext("2d");
    canvas.width = 300;
    canvas.height = 100;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0077b6";
    ctx.fillRect(10, 100 - downloadSpeed, 50, downloadSpeed);
    ctx.fillStyle = "#00b4d8";
    ctx.fillRect(80, 100 - uploadSpeed, 50, uploadSpeed);

    ctx.fillStyle = "#000";
    ctx.font = "16px Cairo";
    ctx.fillText("تحميل", 10, 95);
    ctx.fillText("رفع", 80, 95);
  }, 2000);
}
