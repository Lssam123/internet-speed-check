// ----------------------
// معلومات الجهاز
// ----------------------
document.getElementById("device").innerHTML =
    "نوع الجهاز: " + navigator.userAgent;

document.getElementById("screen").innerHTML =
    "دقة الشاشة: " + window.screen.width + " × " + window.screen.height;

navigator.getBattery().then(battery => {
    document.getElementById("battery").innerHTML =
        "نسبة البطارية: " + (battery.level * 100).toFixed(0) + "%";
});

// ----------------------
// معلومات المتصفح
// ----------------------
document.getElementById("browser").innerHTML =
    "المتصفح: " + navigator.userAgent;

document.getElementById("language").innerHTML =
    "لغة الجهاز: " + navigator.language;

let canvas = document.createElement("canvas");
let gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

document.getElementById("webgl").innerHTML =
    "WebGL مدعوم: " + (gl ? "نعم" : "لا");

// ----------------------
// معلومات الشبكة
// ----------------------
let connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

document.getElementById("connection").innerHTML =
    "نوع الاتصال: " + connection.effectiveType;

document.getElementById("downlink").innerHTML =
    "السرعة النظرية: " + connection.downlink + " Mbps";

// ----------------------
// جلب عنوان الـ IP
// ----------------------
fetch("https://api.ipify.org?format=json")
    .then(r => r.json())
    .then(d => {
        document.getElementById("ip").innerHTML =
            "عنوان الـ IP: " + d.ip;
    });

// ----------------------
// قياس سرعة التحميل بدقة عالية
// ----------------------
async function testDownloadSpeed() {
    const files = [
        { url: "https://speed.hetzner.de/1MB.bin", size: 1 * 1024 * 1024 },
        { url: "https://speed.hetzner.de/5MB.bin", size: 5 * 1024 * 1024 },
        { url: "https://speed.hetzner.de/10MB.bin", size: 10 * 1024 * 1024 }
    ];

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

    document.getElementById("speed").innerHTML =
        "سرعة التحميل الدقيقة: " + avg.toFixed(2) + " Mbps";
}

// ----------------------
// قياس سرعة الرفع
// ----------------------
async function testUploadSpeed() {
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
}

// ----------------------
// قياس Ping المتقدم
// ----------------------
async function pingServer(url) {
    let start = performance.now();
    await fetch(url, { mode: "no-cors" });
    let end = performance.now();
    return end - start;
}

async function testPingAdvanced() {
    let servers = [
        "https://www.google.com",
        "https://1.1.1.1",
        "https://208.67.222.222"
    ];

    let results = [];

    for (let s of servers) {
        let p = await pingServer(s);
        results.push(p);
    }

    let avg = results.reduce((a, b) => a + b) / results.length;
    let min = Math.min(...results);
    let max = Math.max(...results);

    document.getElementById("ping").innerHTML =
        `متوسط Ping: ${avg.toFixed(0)} ms<br>
         أقل قيمة: ${min.toFixed(0)} ms<br>
         أعلى قيمة: ${max.toFixed(0)} ms`;
}

// ----------------------
// قياس Jitter المتقدم
// ----------------------
async function testJitterAdvanced() {
    let pings = [];

    for (let i = 0; i < 10; i++) {
        let p = await pingServer("https://www.google.com");
        pings.push(p);
    }

    let avg = pings.reduce((a, b) => a + b) / pings.length;

    let variance = pings
        .map(p => Math.pow(p - avg, 2))
        .reduce((a, b) => a + b) / pings.length;

    let jitter = Math.sqrt(variance);

    document.getElementById("jitter").innerHTML =
        "Jitter الدقيق: " + jitter.toFixed(2) + " ms";
}
