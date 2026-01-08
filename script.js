// -----------------------------------------------------
//  تشغيل جميع الاختبارات بضغطة زر واحدة
// -----------------------------------------------------
async function runAllTests() {
    loading("ip");
    loading("download");
    loading("upload");
    loading("ping");
    loading("jitter");

    getIP();
    testDownloadSpeed();
    testUploadSpeed();
    testPing();
    testJitter();
}

// -----------------------------------------------------
//  دالة عرض "جاري التحميل..." بشكل جميل
// -----------------------------------------------------
function loading(id) {
    document.getElementById(id).innerHTML = "جاري الاختبار...";
}

// -----------------------------------------------------
//  جلب عنوان الـ IP
// -----------------------------------------------------
function getIP() {
    fetch("https://api.ipify.org?format=json")
        .then(r => r.json())
        .then(d => {
            document.getElementById("ip").innerHTML = "عنوان الـ IP: " + d.ip;
        })
        .catch(() => {
            document.getElementById("ip").innerHTML = "تعذر جلب الـ IP";
        });
}

// -----------------------------------------------------
//  اختبار سرعة التحميل (دقة عالية)
// -----------------------------------------------------
async function testDownloadSpeed() {
    const files = [
        { url: "https://speed.hetzner.de/1MB.bin", size: 1 * 1024 * 1024 },
        { url: "https://speed.hetzner.de/5MB.bin", size: 5 * 1024 * 1024 },
        { url: "https://speed.hetzner.de/10MB.bin", size: 10 * 1024 * 1024 }
    ];

    try {
        let speeds = [];

        for (let file of files) {
            let start = performance.now();
            await fetch(file.url);
            let end = performance.now();

            let duration = (end - start) / 1000;
            let speedMbps = (file.size * 8) / (duration * 1024 * 1024);

            speeds.push(speedMbps);
        }

        let avg = speeds.reduce((a, b) => a + b) / speeds.length;

        document.getElementById("download").innerHTML =
            "سرعة التحميل: " + avg.toFixed(2) + " Mbps";

    } catch (e) {
        document.getElementById("download").innerHTML = "خطأ في اختبار التحميل";
    }
}

// -----------------------------------------------------
//  اختبار سرعة الرفع
// -----------------------------------------------------
async function testUploadSpeed() {
    try {
        let data = new Uint8Array(2 * 1024 * 1024); // 2MB

        let start = performance.now();
        await fetch("https://httpbin.org/post", {
            method: "POST",
            body: data
        });
        let end = performance.now();

        let duration = (end - start) / 1000;
        let speedMbps = (data.length * 8) / (duration * 1024 * 1024);

        document.getElementById("upload").innerHTML =
            "سرعة الرفع: " + speedMbps.toFixed(2) + " Mbps";

    } catch (e) {
        document.getElementById("upload").innerHTML = "خطأ في اختبار الرفع";
    }
}

// -----------------------------------------------------
//  اختبار Ping
// -----------------------------------------------------
async function testPing() {
    try {
        let start = performance.now();
        await fetch("https://www.google.com", { mode: "no-cors" });
        let end = performance.now();

        let ping = end - start;

        document.getElementById("ping").innerHTML =
            "Ping: " + ping.toFixed(0) + " ms";

    } catch (e) {
        document.getElementById("ping").innerHTML = "خطأ في اختبار Ping";
    }
}

// -----------------------------------------------------
//  اختبار Jitter
// -----------------------------------------------------
async function testJitter() {
    try {
        let pings = [];

        for (let i = 0; i < 10; i++) {
            let start = performance.now();
            await fetch("https://www.google.com", { mode: "no-cors" });
            let end = performance.now();
            pings.push(end - start);
        }

        let avg = pings.reduce((a, b) => a + b) / pings.length;

        let variance = pings
            .map(p => Math.pow(p - avg, 2))
            .reduce((a, b) => a + b) / pings.length;

        let jitter = Math.sqrt(variance);

        document.getElementById("jitter").innerHTML =
            "Jitter: " + jitter.toFixed(2) + " ms";

    } catch (e) {
        document.getElementById("jitter").innerHTML = "خطأ في اختبار Jitter";
    }
}
