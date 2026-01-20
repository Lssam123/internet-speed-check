// ضع مفتاح الـ API الخاص بك هنا (على جهازك فقط)
const API_KEY = "752490cbad0d484688a0f70c8bea6c79"; // ← استبدله بمفتاحك

// كلمات مشبوهة في الروابط
const suspiciousWords = [
    "cheap", "discount", "free", "sale", "replica", "fake", "outlet",
    "limited", "offer", "90off", "70off", "deal"
];

// امتدادات تعتبر أكثر خطورة (مثال)
const riskyTlds = [
    ".xyz", ".top", ".buzz", ".click", ".shop", ".club", ".info", ".store"
];

// بدء الفحص مع المؤثرات
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

    // تشغيل التحليل الحقيقي
    runAnalysis(url)
        .then(result => {
            showResult(result);
        })
        .catch(err => {
            console.error(err);
            alert("حدث خطأ أثناء الفحص. حاول مرة أخرى.");
        })
        .finally(() => {
            loadingBox.style.display = "none";
            scanBtn.disabled = false;
        });
}

// تحليل الرابط بالكامل
async function runAnalysis(url) {
    const domain = getDomainFromUrl(url);
    if (!domain) {
        throw new Error("رابط غير صالح");
    }

    let totalScore = 0;
    let details = [];

    // 1) HTTPS
    const httpsUsed = isHttps(url);
    if (httpsUsed) {
        totalScore += 20;
        details.push("✅ يستخدم HTTPS (اتصال مشفر بينك وبين الموقع).");
    } else {
        details.push("⚠ لا يستخدم HTTPS، وهذا يقلل من الأمان.");
    }

    // 2) كلمات مشبوهة
    const hasSusp = hasSuspiciousWords(url);
    if (!hasSusp) {
        totalScore += 15;
        details.push("✅ لا يحتوي الرابط كلمات تسويقية/مريبة بشكل واضح.");
    } else {
        details.push("⚠ الرابط يحتوي كلمات تسويقية/مريبة (مثل discount, free, sale...).");
    }

    // 3) امتداد الدومين
    const risky = isRiskyTld(domain);
    if (!risky) {
        totalScore += 15;
        details.push("✅ امتداد الدومين يبدو طبيعيًا.");
    } else {
        details.push("⚠ امتداد الدومين من الأنواع كثيرة الاستخدام في الاحتيال.");
    }

    // 4) عمر الدومين من WHOIS API
    let ageYears = 0;
    try {
        const whois = await fetchDomainInfo(domain);

        // حاول التقاط تاريخ الإنشاء من أكثر من مكان محتمل
        let createdDate =
            whois.createdDate ||
            (whois.whoisRecord && whois.whoisRecord.createdDate) ||
            (whois.domain && whois.domain.createdDate) ||
            null;

        ageYears = getDomainAgeYears(createdDate);

        if (ageYears >= 3) {
            totalScore += 30;
            details.push(`✅ عمر الدومين تقريبًا ${ageYears.toFixed(1)} سنة (جيد).`);
        } else if (ageYears >= 1) {
            totalScore += 20;
            details.push(`⚠ عمر الدومين تقريبًا ${ageYears.toFixed(1)} سنة (متوسط).`);
        } else if (ageYears > 0) {
            totalScore += 5;
            details.push(`⚠ عمر الدومين أقل من سنة (${ageYears.toFixed(1)}). المواقع الجديدة تحتاج حذرًا.`);
        } else {
            details.push("⚠ لم يتمكن النظام من تحديد عمر الدومين بدقة.");
        }
    } catch (e) {
        console.error(e);
        details.push("⚠ تعذر جلب بيانات WHOIS. تم الاعتماد على التحليل المحلي فقط.");
    }

    // 5) طول الدومين
    if (domain.length <= 20) {
        totalScore += 10;
        details.push("✅ طول الدومين معقول وبسيط.");
    } else {
        details.push("⚠ الدومين طويل نسبيًا، وهذا أحيانًا يستخدم في الاحتيال.");
    }

    // 6) عدد الأرقام في الدومين
    const digitsCount = (domain.match(/[0-9]/g) || []).length;
    if (digitsCount <= 3) {
        totalScore += 10;
        details.push("✅ الدومين لا يحتوي أرقامًا كثيرة.");
    } else {
        details.push("⚠ الدومين يحتوي أرقامًا كثيرة، وهذا أحيانًا علامة على محاولة تقليد.");
    }

    // ضبط الدرجة بين 0 و 100
    if (totalScore < 0) totalScore = 0;
    if (totalScore > 100) totalScore = 100;

    // مستوى الثقة
    let levelText = "";
    let levelColor = "";

    if (totalScore >= 80) {
        levelText = "المتجر يبدو موثوقًا بدرجة عالية (مع ضرورة التحقق من التقييمات دائمًا).";
        levelColor = "#4caf50";
    } else if (totalScore >= 50) {
        levelText = "المتجر متوسط الموثوقية. يُفضّل الحذر والتحقق من وسائل الدفع والتقييمات.";
        levelColor = "#ffc107";
    } else {
        levelText = "المتجر مشبوه. لا يُنصح بالشراء قبل التأكد بشكل قوي من المصدر.";
        levelColor = "#f44336";
    }

    return {
        url,
        score: totalScore,
        levelText,
        levelColor,
        details
    };
}

// عرض النتيجة في الواجهة
function showResult(result) {
    const resultBox = document.getElementById("resultBox");
    const scoreEl = document.getElementById("scoreValue");
    const trustEl = document.getElementById("trustLevel");
    const detailsList = document.getElementById("detailsList");

    scoreEl.textContent = `${result.score} / 100`;
    trustEl.textContent = result.levelText;
    trustEl.style.color = result.levelColor;

    detailsList.innerHTML = "";
    result.details.forEach(d => {
        const li = document.createElement("li");
        li.textContent = d;
        detailsList.appendChild(li);
    });

    resultBox.style.display = "block";
}

// ====== دوال مساعدة ======

// استخراج الدومين من الرابط
function getDomainFromUrl(url) {
    try {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
        const u = new URL(url);
        return u.hostname;
    } catch (e) {
        return null;
    }
}

// فحص HTTPS
function isHttps(url) {
    return url.trim().toLowerCase().startsWith("https://");
}

// كلمات مشبوهة
function hasSuspiciousWords(url) {
    const lower = url.toLowerCase();
    return suspiciousWords.some(w => lower.includes(w));
}

// امتداد خطير
function isRiskyTld(domain) {
    const lower = domain.toLowerCase();
    return riskyTlds.some(tld => lower.endsWith(tld));
}

// حساب عمر الدومين بالسنوات
function getDomainAgeYears(createdDateStr) {
    if (!createdDateStr) return 0;
    const created = new Date(createdDateStr);
    if (isNaN(created.getTime())) return 0;

    const now = new Date();
    const diffMs = now - created;
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return diffYears;
}

// استدعاء WHOIS API
async function fetchDomainInfo(domain) {
    // عدّل الـ endpoint حسب الخدمة اللي تستخدمها فعليًا
    const url = `https://api.whoisfreaks.com/v1.0/whois?apiKey=${API_KEY}&domainName=${domain}&whoisRecordType=all`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("خطأ في الاتصال بـ WHOIS API");
    }
    const data = await res.json();
    return data;
}
