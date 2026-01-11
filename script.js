// حط مفتاح الـ API الخاص فيك هنا فقط على جهازك
const API_KEY = "YOUR_API_KEY_HERE"; // ← استبدله بمفتاحك

// تحليل الرابط واستخراج الدومين
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

// فحص إذا الرابط يستخدم HTTPS
function isHttps(url) {
    return url.trim().toLowerCase().startsWith("https://");
}

// كلمات خطيرة في الرابط
const suspiciousWords = [
    "cheap", "discount", "free", "sale", "replica", "fake", "outlet",
    "limited", "offer", "90off", "70off", "deal"
];

// امتدادات أقل موثوقية (كمثال فقط)
const riskyTlds = [
    ".xyz", ".top", ".buzz", ".click", ".shop", ".club", ".info", ".store"
];

// فحص كلمات مشبوهة في الرابط
function hasSuspiciousWords(url) {
    const lower = url.toLowerCase();
    return suspiciousWords.some(w => lower.includes(w));
}

// فحص امتداد الدومين
function isRiskyTld(domain) {
    const lower = domain.toLowerCase();
    return riskyTlds.some(tld => lower.endsWith(tld));
}

// حساب عمر الدومين بالسنوات من تاريخ الإنشاء
function getDomainAgeYears(createdDateStr) {
    if (!createdDateStr) return 0;
    const created = new Date(createdDateStr);
    if (isNaN(created.getTime())) return 0;

    const now = new Date();
    const diffMs = now - created;
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return diffYears;
}

// استدعاء WHOIS API لجلب معلومات الدومين
async function fetchDomainInfo(domain) {
    // مثال على whoisfreaks:
    // تأكد من أن هذا الـ endpoint متوافق مع حسابك وخطتك
    const url = `https://api.whoisfreaks.com/v1.0/whois?apiKey=${API_KEY}&domainName=${domain}&whoisRecordType=all`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("خطأ في الاتصال بـ WHOIS API");
    const data = await res.json();
    return data;
}

// تحليل المتجر وإظهار النتيجة
async function analyzeStore() {
    const input = document.getElementById("urlInput").value.trim();
    const resultBox = document.getElementById("resultBox");
    const scoreEl = document.getElementById("scoreValue");
    const levelEl = document.getElementById("trustLevel");
    const detailsList = document.getElementById("detailsList");

    // إخفاء القديم
    resultBox.style.display = "none";
    detailsList.innerHTML = "";
    scoreEl.textContent = "-- / 100";
    levelEl.textContent = "";

    if (!input) {
        alert("الرجاء إدخال رابط المتجر أولاً.");
        return;
    }

    const domain = getDomainFromUrl(input);
    if (!domain) {
        alert("الرابط غير صالح. الرجاء إدخال رابط صحيح.");
        return;
    }

    let totalScore = 0;
    let details = [];

    // 1) HTTPS
    const httpsUsed = isHttps(input);
    if (httpsUsed) {
        totalScore += 20;
        details.push("✅ يستخدم HTTPS (اتصال مشفر)");
    } else {
        details.push("⚠ لا يستخدم HTTPS (هذا يقلل من الأمان)");
    }

    // 2) كلمات مشبوهة في الرابط
    const suspicious = hasSuspiciousWords(input);
    if (!suspicious) {
        totalScore += 15;
        details.push("✅ لا يحتوي الرابط كلمات تسويقية أو مريبة بشكل واضح");
    } else {
        details.push("⚠ الرابط يحتوي كلمات تسويقية/مريبة (مثل discount, free, sale...)");
    }

    // 3) امتداد الدومين
    const risky = isRiskyTld(domain);
    if (!risky) {
        totalScore += 15;
        details.push("✅ امتداد الدومين يبدو طبيعيًا");
    } else {
        details.push("⚠ امتداد الدومين من الأنواع كثيرة الاستخدام في الاحتيال");
    }

    // 4) استخدم WHOIS API لعمر الدومين
    let ageYears = 0;
    try {
        const whois = await fetchDomainInfo(domain);

        // بناءً على شكل البيانات للخدمة التي تستخدمها
        // مثال تقريبي: whoisDomain.createdDate أو whoisRecord.createdDate
        let createdDate =
            whois.createdDate ||
            (whois.whoisRecord && whois.whoisRecord.createdDate) ||
            null;

        ageYears = getDomainAgeYears(createdDate);

        if (ageYears >= 3) {
            totalScore += 30;
            details.push(`✅ عمر الدومين تقريبًا ${ageYears.toFixed(1)} سنة (جيد)`);
        } else if (ageYears >= 1) {
            totalScore += 20;
            details.push(`⚠ عمر الدومين تقريبًا ${ageYears.toFixed(1)} سنة (متوسط)`);
        } else if (ageYears > 0) {
            totalScore += 5;
            details.push(`⚠ عمر الدومين أقل من سنة (${ageYears.toFixed(1)}). المواقع الجديدة تحتاج حذرًا.`);
        } else {
            details.push("⚠ لم يتمكن النظام من تحديد عمر الدومين بدقة.");
        }
    } catch (e) {
        console.error(e);
        details.push("⚠ حدث خطأ أثناء جلب بيانات WHOIS. الفحص سيعتمد على التحليل المحلي فقط.");
    }

    // 5) طول الدومين وتعقيده (بسيط كمثال)
    if (domain.length <= 20) {
        totalScore += 10;
        details.push("✅ طول الدومين معقول وبسيط.");
    } else {
        details.push("⚠ الدومين طويل نسبيًا، وهذا أحيانًا يستخدم في الاحتيال.");
    }

    // 6) عدم احتواء الدومين على أرقام غريبة كثيرة
    const digitsCount = (domain.match(/[0-9]/g) || []).length;
    if (digitsCount <= 3) {
        totalScore += 10;
        details.push("✅ الدومين لا يحتوي أرقامًا كثيرة.");
    } else {
        details.push("⚠ الدومين يحتوي أرقامًا كثيرة، وهذا أحيانًا علامة على محاولة تقليد.");
    }

    // ضمان أن الدرجة بين 0 و 100
    if (totalScore < 0) totalScore = 0;
    if (totalScore > 100) totalScore = 100;

    // تحديد مستوى الثقة
    let levelText = "";
    let levelClass = "";

    if (totalScore >= 80) {
        levelText = "المتجر يبدو موثوقًا بدرجة عالية (لكن دائمًا تحقّق بنفسك أيضًا).";
        levelClass = "trust-high";
    } else if (totalScore >= 50) {
        levelText = "المتجر متوسط الموثوقية. يُفضّل الحذر، والتحقق من التقييمات وطرق الدفع.";
        levelClass = "trust-medium";
    } else {
        levelText = "المتجر مشبوه. لا يُنصح بالشراء قبل التأكد بشكل قوي من المصدر.";
        levelClass = "trust-low";
    }

    // عرض النتيجة في الواجهة
    scoreEl.textContent = `${totalScore} / 100`;
    levelEl.textContent = levelText;
    levelEl.className = "level " + levelClass;

    detailsList.innerHTML = "";
    details.forEach(d => {
        const li = document.createElement("li");
        li.textContent = d;
        detailsList.appendChild(li);
    });

    resultBox.style.display = "block";
}
