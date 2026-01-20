function startScan() {
    const url = document.getElementById("urlInput").value.trim();
    const scanBtn = document.getElementById("scanBtn");
    const loadingBox = document.getElementById("loadingBox");
    const resultBox = document.getElementById("resultBox");

    if (!url) {
        alert("الرجاء إدخال رابط المتجر");
        return;
    }

    // إخفاء النتيجة القديمة
    resultBox.style.display = "none";

    // تعطيل الزر
    scanBtn.disabled = true;

    // إظهار شاشة التحميل
    loadingBox.style.display = "block";

    // محاكاة الفحص (3 ثواني)
    setTimeout(() => {
        loadingBox.style.display = "none";
        showResult(url);
        scanBtn.disabled = false;
    }, 3000);
}

function showResult(url) {
    const resultBox = document.getElementById("resultBox");
    const scoreEl = document.getElementById("scoreValue");
    const trustEl = document.getElementById("trustLevel");
    const detailsList = document.getElementById("detailsList");

    // نتيجة عشوائية مؤقتة (إلى أن نربط API)
    const score = Math.floor(Math.random() * 100);

    scoreEl.textContent = score + " / 100";

    if (score >= 80) {
        trustEl.textContent = "المتجر يبدو موثوقًا";
        trustEl.style.color = "#4caf50";
    } else if (score >= 50) {
        trustEl.textContent = "المتجر متوسط الموثوقية";
        trustEl.style.color = "#ffc107";
    } else {
        trustEl.textContent = "المتجر مشبوه";
        trustEl.style.color = "#f44336";
    }

    detailsList.innerHTML = `
        <li>الرابط: ${url}</li>
        <li>تحليل مبدئي: تم بنجاح</li>
        <li>سيتم إضافة تحليل WHOIS لاحقًا</li>
    `;

    resultBox.style.display = "block";
}
