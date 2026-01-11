// تحريك المؤشر
function animateNeedle(targetSpeed) {
    const needle = document.getElementById("needle");
    const speedValue = document.getElementById("speedValue");

    let current = 0;
    const maxAngle = 180;
    const maxSpeed = 100;

    const interval = setInterval(() => {
        if (current >= targetSpeed) {
            clearInterval(interval);
        } else {
            current += 1;
        }

        let angle = (current / maxSpeed) * maxAngle - 90;

        needle.style.transform = `rotate(${angle}deg)`;
        speedValue.textContent = current + " Mbps";

    }, 15);
}

// اختبار سرعة التحميل
async function testDownload() {
    const file = "https://speed.hetzner.de/1MB.bin";
    const start = performance.now();

    await fetch(file);
    const end = performance.now();

    const duration = (end - start) / 1000;
    const size = 1 * 1024 * 1024 * 8;

    const speed = size / (duration * 1024 * 1024);
    return Math.min(Math.round(speed), 100);
}

// اختبار سرعة الرفع
async function testUpload() {
    const data = new Uint8Array(1 * 1024 * 1024);
    const start = performance.now();

    await fetch("https://httpbin.org/post", {
        method: "POST",
        body: data
    });

    const end = performance.now();
    const duration = (end - start) / 1000;

    const speed = (data.length * 8) / (duration * 1024 * 1024);
    return Math.min(Math.round(speed), 100);
}

// تشغيل الاختبار الكامل
async function startFullTest() {
    const downloadSpeed = await testDownload();
    animateNeedle(downloadSpeed);

    setTimeout(async () => {
        const uploadSpeed = await testUpload();
        animateNeedle(uploadSpeed);
    }, 3000);
}

// إعادة الاختبار
function restartTest() {
    document.getElementById("needle").style.transform = "rotate(-90deg)";
    document.getElementById("speedValue").textContent = "0 Mbps";

    setTimeout(() => {
        startFullTest();
    }, 500);
}

// يبدأ تلقائيًا عند تحميل الصفحة
window.onload = () => {
    startFullTest();
};
