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

function startScan() {
    const url = document.getElementById("urlInput").value.trim();
    const scanBtn = document.getElementById("scanBtn");
    const loadingBox = document.getElementById("loadingBox");
    const resultBox = document.getElementById("resultBox");

    if (!url) {
        alert("الرجاء إدخال رابط المتجر");
        return;
    }

    resultBox.style.display = "none";
    scanBtn.disabled = true;
    loadingBox.style.display = "block";

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

async function runAnalysis(url) {
    const domain = getDomainFromUrl(url);
    if (!domain) throw new Error("رابط غير صالح");

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

    // 4) WHOIS + DNS + عمر الدومين
    let ageYears = 0;
    let dnsSummary = "--";
    let dnsNote = "";
    try {
        const whois = await fetchDomainInfo(domain);

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

        // DNS (Nameservers)
        let nameservers =
            whois.nameServers ||
            (whois.whoisRecord && whois.whoisRecord.nameServers) ||
            (whois.domain && whois.domain.nameServers) ||
            null;

        if (Array.isArray(nameservers) && nameservers.length > 0) {
            dnsSummary = nameservers.slice(0, 2).join(", ");
            dnsNote = "تم العثور على خوادم DNS.";
            details.push(`ℹ خوادم DNS: ${nameservers.join(", ")}`);
        } else if (nameservers && typeof nameservers === "string") {
            dnsSummary = nameservers;
            dnsNote = "تم العثور على خوادم DNS.";
            details.push(`ℹ خوادم DNS: ${nameservers}`);
        } else {
            dnsSummary = "غير متوفر";
            dnsNote = "لم يتم العثور على معلومات DNS واضحة.";
            details.push("⚠ لم يتم العثور على معلومات DNS واضحة.");
        }

    } catch (e) {
        console.error(e);
        details.push("⚠ تعذر جلب بيانات WHOIS/DNS. تم الاعتماد على التحليل المحلي فقط.");
        dnsSummary = "غير متوفر";
        dnsNote = "تعذر جلب بيانات DNS.";
    }

    // 5) سرعة الموقع (زمن الاستجابة)
    let speedMs = null;
    let speedLabel = "--";
    let speedNote = "";
    try {
        const start = performance.now();
        // طلب بسيط لقياس الزمن (قد يتأثر بـ CORS لكن الزمن يُقاس)
        await fetch(url, { method: "GET", mode: "no-cors" });
        const end = performance.now();
        speedMs = end - start;

        if (speedMs <= 800) {
            totalScore += 10;
            speedLabel = `${Math.round(speedMs)} ms`;
            speedNote = "استجابة سريعة نسبيًا.";
            details.push(`✅ زمن استجابة الموقع تقريبًا ${Math.round(speedMs)} مللي ثانية (سريع).`);
        } else if (speedMs <= 2000) {
            totalScore += 5;
            speedLabel = `${Math.round(speedMs)} ms`;
            speedNote = "استجابة متوسطة.";
            details.push(`⚠ زمن استجابة الموقع تقريبًا ${Math.round(speedMs)} مللي ثانية (متوسط).`);
        } else {
            speedLabel = `${Math.round(speedMs)} ms`;
            speedNote = "استجابة بطيئة.";
            details.push(`⚠ زمن استجابة الموقع تقريبًا ${Math.round(speedMs)} مللي ثانية (بطيء).`);
        }
    } catch (e) {
        console.error(e);
        speedLabel = "غير متوفر";
        speedNote = "تعذر قياس سرعة الموقع (قد يكون محمي أو يمنع الطلبات المباشرة).";
        details.push("⚠ تعذر قياس سرعة الموقع.");
    }

    // 6) الروابط الداخلية (محاولة مبسطة)
    let linksCount = null;
    let linksLabel = "--";
    let linksNote = "";
    try {
        // ملاحظة: CORS قد يمنع قراءة المحتوى، لذلك نستخدم محاولة بسيطة
        const resp = await fetch(url, { method: "GET" });
        const text = await resp.text();
        const matches = text.match(/<a\s+[^>]*href=/gi) || [];
        linksCount = matches.length;

        linksLabel = `${linksCount} رابط`;
        if (linksCount > 200) {
            linksNote = "عدد كبير من الروابط، قد يكون الموقع مزدحمًا أو معقدًا.";
            details.push(`⚠ يحتوي الموقع على عدد كبير من الروابط الداخلية (${linksCount}).`);
        } else if (linksCount > 20) {
            linksNote = "عدد روابط داخلي طبيعي.";
            details.push(`✅ يحتوي الموقع على عدد مناسب من الروابط الداخلية (${linksCount}).`);
        } else {
            linksNote = "عدد الروابط قليل نسبيًا.";
            details.push(`⚠ يحتوي الموقع على عدد قليل من الروابط الداخلية (${linksCount}).`);
        }
    } catch (e) {
        console.error(e);
        linksLabel = "غير متوفر";
        linksNote = "تعذر قراءة محتوى الصفحة (قيود CORS).";
        details.push("⚠ تعذر فحص الروابط الداخلية بسبب قيود المتصفح (CORS).");
    }

    // 7) شهادة SSL (مبسطة)
    let sslLabel = "--";
    let sslNote = "";
    if (httpsUsed) {
        sslLabel = "موجودة";
        sslNote = "الموقع يستخدم HTTPS، مما يعني وجود شهادة SSL.";
        details.push("✅ الموقع يستخدم شهادة SSL (بشكل عام).");
    } else {
        sslLabel = "غير موجودة";
        sslNote = "لا يوجد HTTPS، مما يعني عدم وجود شهادة SSL فعّالة.";
        details.push("⚠ لا توجد شهادة SSL فعّالة (لا يوجد HTTPS).");
    }

    // ضبط الدرجة بين 0 و 100
    if (totalScore < 0) totalScore = 0;
    if (totalScore > 100) totalScore = 100;

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
        details,
        dnsSummary,
        dnsNote,
        speedLabel,
        speedNote,
        linksLabel,
        linksNote,
        sslLabel,
        sslNote
    };
}

function showResult(result) {
    const resultBox = document.getElementById("resultBox");
    const scoreEl = document.getElementById("scoreValue");
    const trustEl = document.getElementById("trustLevel");
    const detailsList = document.getElementById("detailsList");

    const dnsCard = document.getElementById("dnsCard");
    const dnsNote = document.getElementById("dnsNote");
    const linksCard = document.getElementById("linksCard");
    const linksNote = document.getElementById("linksNote");
    const speedCard = document.getElementById("speedCard");
    const speedNote = document.getElementById("speedNote");
    const sslCard = document.getElementById("sslCard");
    const sslNote = document.getElementById("sslNote");

    scoreEl.textContent = `${result.score} / 100`;
    trustEl.textContent = result.levelText;
    trustEl.style.color = result.levelColor;

    dnsCard.textContent = result.dnsSummary;
    dnsNote.textContent = result.dnsNote;

    linksCard.textContent = result.linksLabel;
    linksNote.textContent = result.linksNote;

    speedCard.textContent = result.speedLabel;
    speedNote.textContent = result.speedNote;

    sslCard.textContent = result.sslLabel;
    sslNote.textContent = result.sslNote;

    detailsList.innerHTML = "";
    result.details.forEach(d => {
        const li = document.createElement("li");
        li.textContent = d;
        detailsList.appendChild(li);
    });

    resultBox.style.display = "block";
}

// ====== دوال مساعدة ======

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

function isHttps(url) {
    return url.trim().toLowerCase().startsWith("https://");
}

function hasSuspiciousWords(url) {
    const lower = url.toLowerCase();
    return suspiciousWords.some(w => lower.includes(w));
}

function isRiskyTld(domain) {
    const lower = domain.toLowerCase();
    return riskyTlds.some(tld => lower.endsWith(tld));
}

function getDomainAgeYears(createdDateStr) {
    if (!createdDateStr) return 0;
    const created = new Date(createdDateStr);
    if (isNaN(created.getTime())) return 0;
    const now = new Date();
    const diffMs = now - created;
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return diffYears;
}

async function fetchDomainInfo(domain) {
    const url = `https://api.whoisfreaks.com/v1.0/whois?apiKey=${API_KEY}&domainName=${domain}&whoisRecordType=all`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("خطأ في الاتصال بـ WHOIS API");
    return await res.json();
}
