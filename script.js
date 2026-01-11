// تحريك المؤشر بسلاسة
function animateNeedle(targetSpeed) {
    const needle = document.getElementById("needle");
    const speedValue = document.getElementById("speedValue");

    let current = 0;
    const maxAngle = 180; // نصف دائرة
    const maxSpeed = 100; // الحد الأعلى للسرعة

    const interval = setInterval(() => {
        if (current >= targetSpeed) {
            clearInterval(interval);
        } else {
            current += 1;
        }

        // تحويل السرعة إلى زاوية
        let angle = (current / maxSpeed) * maxAngle - 90;

        needle.style.transform = `rotate(${angle}deg)`;
        speedValue.textContent = current + " Mbps";

    }, 20);
}

// اختبار سرعة التحميل
async function startDownloadTest() {
    const testFile = "https://speed.hetzner.de/1MB.bin"; // ملف صغير للاختبار
    const startTime = performance.now();

    try {
        await fetch(testFile);
        const endTime = performance.now();

        const duration = (endTime - startTime) / 1000; // بالثواني
        const fileSize = 1 * 1024 * 1024 * 8; // 1MB بالبت

        const speedMbps = fileSize / (duration * 1024 * 1024);

        const finalSpeed = Math.min(Math.round(speedMbps), 100);

        animateNeedle(finalSpeed);

    } catch (error) {
        alert("حدث خطأ أثناء الاختبار");
    }
}
