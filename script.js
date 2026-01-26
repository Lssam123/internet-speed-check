// عناصر أساسية من الـ DOM
const canvas = document.getElementById("canvas");
const linksLayer = document.getElementById("linksLayer");
const analyzeBtn = document.getElementById("analyzeBtn");
const connectModeBtn = document.getElementById("connectModeBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const resultsDiv = document.getElementById("results");
const modeIndicator = document.getElementById("modeIndicator");

const pingSourceSelect = document.getElementById("pingSource");
const pingTargetSelect = document.getElementById("pingTarget");
const pingBtn = document.getElementById("pingBtn");
const pingResult = document.getElementById("pingResult");

// مودال خصائص الجهاز
const deviceModal = document.getElementById("deviceModal");
const closeModalBtn = document.getElementById("closeModal");
const modalDeviceIdSpan = document.getElementById("modalDeviceId");
const modalDeviceTypeSpan = document.getElementById("modalDeviceType");
const modalIpInput = document.getElementById("modalIp");
const modalVlanInput = document.getElementById("modalVlan");
const modalLabelInput = document.getElementById("modalLabel");
const saveDevicePropsBtn = document.getElementById("saveDeviceProps");

// نموذج بيانات داخلي
let devices = [];      // {id, type, x, y, ip, vlan, label}
let links = [];        // {id, fromId, toId}
let deviceCounter = 1;

// وضع التوصيل
let connectMode = false;
let selectedDeviceId = null;
let firstDeviceForLink = null;

// تفعيل السحب من قائمة الأجهزة
document.querySelectorAll(".device").forEach(device => {
    device.addEventListener("dragstart", e => {
        e.dataTransfer.setData("type", device.dataset.type);
    });
});

// السماح بالإفلات على اللوحة
canvas.addEventListener("dragover", e => e.preventDefault());

// عند الإفلات: إنشاء جهاز جديد
canvas.addEventListener("drop", e => {
    const type = e.dataTransfer.getData("type");
    if (!type) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    createDevice(type, x, y);
    refreshPingDropdowns();
});

// إنشاء جهاز جديد
function createDevice(type, x, y) {
    const id = "D" + deviceCounter++;
    const label = defaultLabelForType(type) + "-" + id;

    const device = {
        id,
        type,
        x,
        y,
        ip: "",
        vlan: "",
        label
    };
    devices.push(device);
    renderDevices();
}

// تسمية افتراضية حسب النوع
function defaultLabelForType(type) {
    switch (type) {
        case "router": return "RTR";
        case "switch": return "SW";
        case "pc": return "PC";
        case "firewall": return "FW";
        default: return "DEV";
    }
}

// رسم الأجهزة والروابط
function renderDevices() {
    // مسح كل الأجهزة من اللوحة
    canvas.querySelectorAll(".device-node").forEach(n => n.remove());

    devices.forEach(device => {
        const node = document.createElement("div");
        node.className = "device-node";
        node.style.left = device.x + "px";
        node.style.top = device.y + "px";
        node.dataset.id = device.id;

        const inner = document.createElement("div");
        inner.className = "device-node-inner";
        if (device.id === selectedDeviceId) {
            inner.classList.add("selected");
        }

        const icon = document.createElement("div");
        icon.className = "icon " + iconClassForType(device.type);
        icon.textContent = iconTextForType(device.type);

        const label = document.createElement("div");
        label.className = "label";
        label.textContent = device.label || device.id;

        const ip = document.createElement("div");
        ip.className = "ip";
        ip.textContent = device.ip ? device.ip + (device.vlan ? " | VLAN " + device.vlan : "") : "بدون IP";

        inner.appendChild(icon);
        inner.appendChild(label);
        inner.appendChild(ip);
        node.appendChild(inner);
        canvas.appendChild(node);

        // أحداث النقر
        node.addEventListener("click", () => onDeviceClick(device.id));
        // سحب الجهاز داخل اللوحة (تحريك)
        makeNodeDraggable(node, device.id);
    });

    renderLinks();
}

// أيقونة حسب النوع
function iconClassForType(type) {
    switch (type) {
        case "router": return "router-icon";
        case "switch": return "switch-icon";
        case "pc": return "pc-icon";
        case "firewall": return "fw-icon";
        default: return "";
    }
}

function iconTextForType(type) {
    switch (type) {
        case "router": return "R";
        case "switch": return "S";
        case "pc": return "PC";
        case "firewall": return "FW";
        default: return "?";
    }
}

// جعل الجهاز قابل للتحريك داخل اللوحة
function makeNodeDraggable(node, id) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    node.addEventListener("mousedown", e => {
        // لا نسحب إذا ضغط على المودال أو خارج اللوحة
        if (e.button !== 0) return;
        isDragging = true;
        const rect = node.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);

        function onMouseMove(ev) {
            if (!isDragging) return;
            const x = ev.clientX - canvasRect.left - offsetX + node.offsetWidth / 2;
            const y = ev.clientY - canvasRect.top - offsetY + node.offsetHeight / 2;

            const dev = devices.find(d => d.id === id);
            if (!dev) return;
            dev.x = Math.max(30, Math.min(canvasRect.width - 30, x));
            dev.y = Math.max(30, Math.min(canvasRect.height - 30, y));
            renderDevices();
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        }
    });
}

// رسم الروابط (الكابلات) باستخدام SVG
function renderLinks() {
    linksLayer.innerHTML = "";
    links.forEach(link => {
        const from = devices.find(d => d.id === link.fromId);
        const to = devices.find(d => d.id === link.toId);
        if (!from || !to) return;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", from.x);
        line.setAttribute("y1", from.y);
        line.setAttribute("x2", to.x);
        line.setAttribute("y2", to.y);
        line.setAttribute("stroke", "#90a4ae");
        line.setAttribute("stroke-width", "3");
        line.setAttribute("stroke-linecap", "round");
        linksLayer.appendChild(line);
    });
}

// عند الضغط على جهاز
function onDeviceClick(id) {
    if (connectMode) {
        handleConnectModeClick(id);
    } else {
        selectedDeviceId = id;
        openDeviceModal(id);
    }
    renderDevices();
}

// وضع التوصيل: اختيار جهازين لرسم كابل
function handleConnectModeClick(id) {
    if (!firstDeviceForLink) {
        firstDeviceForLink = id;
        modeIndicator.textContent = "الوضع الحالي: اختيار جهاز ثانٍ للتوصيل...";
    } else if (firstDeviceForLink === id) {
        firstDeviceForLink = null;
        modeIndicator.textContent = "الوضع الحالي: وضع التوصيل (اختر جهازين مختلفين)";
    } else {
        // إنشاء رابط
        const exists = links.some(
            l =>
                (l.fromId === firstDeviceForLink && l.toId === id) ||
                (l.fromId === id && l.toId === firstDeviceForLink)
        );
        if (!exists) {
            links.push({
                id: "L" + firstDeviceForLink + "-" + id,
                fromId: firstDeviceForLink,
                toId: id
            });
        }
        firstDeviceForLink = null;
        modeIndicator.textContent = "الوضع الحالي: وضع التوصيل (اختر جهازين للتوصيل)";
        renderDevices();
    }
}

// فتح نافذة خصائص الجهاز
function openDeviceModal(id) {
    const dev = devices.find(d => d.id === id);
    if (!dev) return;

    modalDeviceIdSpan.textContent = dev.id;
    modalDeviceTypeSpan.textContent = typeArabicName(dev.type);
    modalIpInput.value = dev.ip || "";
    modalVlanInput.value = dev.vlan || "";
    modalLabelInput.value = dev.label || "";

    deviceModal.style.display = "flex";
}

// إغلاق المودال
closeModalBtn.addEventListener("click", () => {
    deviceModal.style.display = "none";
});

window.addEventListener("click", e => {
    if (e.target === deviceModal) {
        deviceModal.style.display = "none";
    }
});

// حفظ خصائص الجهاز
saveDevicePropsBtn.addEventListener("click", () => {
    const id = modalDeviceIdSpan.textContent;
    const dev = devices.find(d => d.id === id);
    if (!dev) return;

    dev.ip = modalIpInput.value.trim();
    dev.vlan = modalVlanInput.value.trim();
    dev.label = modalLabelInput.value.trim() || dev.label;

    deviceModal.style.display = "none";
    renderDevices();
    refreshPingDropdowns();
});

// اسم عربي للنوع
function typeArabicName(type) {
    switch (type) {
        case "router": return "راوتر";
        case "switch": return "سويتش";
        case "pc": return "حاسب";
        case "firewall": return "جدار ناري";
        default: return "جهاز";
    }
}

// تبديل وضع التوصيل
connectModeBtn.addEventListener("click", () => {
    connectMode = !connectMode;
    firstDeviceForLink = null;
    if (connectMode) {
        connectModeBtn.classList.add("primary");
        modeIndicator.textContent = "الوضع الحالي: وضع التوصيل (اختر جهازين للتوصيل)";
    } else {
        connectModeBtn.classList.remove("primary");
        modeIndicator.textContent = "الوضع الحالي: سحب وإفلات الأجهزة";
    }
});

// مسح اللوحة
clearBtn.addEventListener("click", () => {
    if (!confirm("هل تريد مسح جميع الأجهزة والروابط؟")) return;
    devices = [];
    links = [];
    selectedDeviceId = null;
    firstDeviceForLink = null;
    renderDevices();
    resultsDiv.innerHTML = "";
    refreshPingDropdowns();
});

// تحليل الأمان
analyzeBtn.addEventListener("click", () => {
    const msgs = [];

    const hasRouter = devices.some(d => d.type === "router");
    const hasSwitch = devices.some(d => d.type === "switch");
    const hasFirewall = devices.some(d => d.type === "firewall");
    const pcCount = devices.filter(d => d.type === "pc").length;

    if (!hasRouter) {
        msgs.push(`<div class="err">❌ لا يوجد راوتر في الشبكة — لا يمكن توزيع الإنترنت.</div>`);
    }

    if (!hasSwitch) {
        msgs.push(`<div class="warn">⚠️ لا يوجد سويتش — الشبكة غير مكتملة من ناحية التوزيع الداخلي.</div>`);
    }

    if (!hasFirewall) {
        msgs.push(`<div class="err">❌ لا يوجد جدار ناري — الشبكة معرضة للهجمات الخارجية.</div>`);
    }

    if (pcCount > 20) {
        msgs.push(`<div class="warn">⚠️ عدد الحواسيب (${pcCount}) كبير — يفضل تقسيم الشبكة إلى VLANs.</div>`);
    }

    // فحص IP مكرر
    const ipMap = {};
    devices.forEach(d => {
        if (d.ip) {
            ipMap[d.ip] = (ipMap[d.ip] || 0) + 1;
        }
    });
    Object.keys(ipMap).forEach(ip => {
        if (ipMap[ip] > 1) {
            msgs.push(`<div class="err">❌ عنوان IP مكرر (${ip}) مستخدم في أكثر من جهاز (${ipMap[ip]} أجهزة).</div>`);
        }
    });

    // فحص VLANs
    const vlanSet = new Set(devices.filter(d => d.vlan).map(d => d.vlan));
    if (vlanSet.size > 1 && !devices.some(d => d.type === "router" || d.type === "firewall")) {
        msgs.push(`<div class="warn">⚠️ توجد عدة VLANs (${Array.from(vlanSet).join(", ")}) بدون وجود راوتر أو جدار ناري يدعم Inter-VLAN Routing.</div>`);
    }

    // فحص وجود أجهزة غير متصلة
    const isolated = devices.filter(d => !links.some(l => l.fromId === d.id || l.toId === d.id));
    if (isolated.length > 0) {
        msgs.push(`<div class="warn">⚠️ توجد أجهزة غير متصلة بالشبكة: ${isolated.map(d => d.label || d.id).join(", ")}</div>`);
    }

    if (msgs.length === 0) {
        msgs.push(`<div class="ok">✔️ لا توجد مشاكل واضحة — التصميم يبدو جيداً من ناحية أساسية.</div>`);
    }

    resultsDiv.innerHTML = msgs.join("");
});

// تحديث قوائم Ping
function refreshPingDropdowns() {
    const pcs = devices.filter(d => d.type === "pc");
    const all = devices;

    pingSourceSelect.innerHTML = "";
    pingTargetSelect.innerHTML = "";

    pcs.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = `${d.label || d.id} (${d.ip || "بدون IP"})`;
        pingSourceSelect.appendChild(opt);
    });

    all.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = `${d.label || d.id} [${typeArabicName(d.type)}]`;
        pingTargetSelect.appendChild(opt);
    });
}

// محاكاة Ping بسيطة
pingBtn.addEventListener("click", () => {
    const srcId = pingSourceSelect.value;
    const dstId = pingTargetSelect.value;
    pingResult.textContent = "";

    if (!srcId || !dstId) {
        pingResult.textContent = "يرجى اختيار جهاز مصدر وهدف.";
        return;
    }
    if (srcId === dstId) {
        pingResult.textContent = "لا معنى لعمل Ping على نفس الجهاز.";
        return;
    }

    const src = devices.find(d => d.id === srcId);
    const dst = devices.find(d => d.id === dstId);
    if (!src || !dst) {
        pingResult.textContent = "أجهزة غير موجودة.";
        return;
    }

    if (!src.ip || !dst.ip) {
        pingResult.textContent = "أحد الجهازين لا يملك IP — فشل Ping.";
        return;
    }

    // منطق بسيط: يجب أن يكون هناك مسار بين الجهازين عبر الروابط
    const reachable = isReachable(srcId, dstId);
    const sameVlanOrRouted = checkVlanReachability(src, dst);

    if (reachable && sameVlanOrRouted) {
        pingResult.textContent = `Ping ناجح من ${src.label || src.id} إلى ${dst.label || dst.id}`;
        pingResult.style.color = "#2e7d32";
    } else if (!reachable) {
        pingResult.textContent = "لا يوجد مسار فيزيائي (كابلات) بين الجهازين — فشل Ping.";
        pingResult.style.color = "#c62828";
    } else {
        pingResult.textContent = "اختلاف VLAN بدون وجود راوتر/جدار ناري مناسب — فشل Ping.";
        pingResult.style.color = "#c62828";
    }
});

// فحص وجود مسار بين جهازين (بحث بسيط في الرسم البياني)
function isReachable(srcId, dstId) {
    const visited = new Set();
    const queue = [srcId];

    while (queue.length > 0) {
        const current = queue.shift();
        if (current === dstId) return true;
        visited.add(current);

        const neighbors = links
            .filter(l => l.fromId === current || l.toId === current)
            .map(l => (l.fromId === current ? l.toId : l.fromId));

        neighbors.forEach(n => {
            if (!visited.has(n)) queue.push(n);
        });
    }
    return false;
}

// فحص VLAN: إذا نفس VLAN أو يوجد راوتر/Firewall بينهما
function checkVlanReachability(src, dst) {
    if (!src.vlan || !dst.vlan || src.vlan === dst.vlan) return true;

    // إذا VLAN مختلفة، نبحث عن وجود راوتر أو Firewall في المسار
    // منطق مبسط: إذا يوجد راوتر أو FW في الشبكة ومتصّل بكلا الجانبين (تقريباً)
    const routersOrFw = devices.filter(d => d.type === "router" || d.type === "firewall");
    if (routersOrFw.length === 0) return false;

    // نتحقق إن كان هناك راوتر/Firewall يمكن الوصول إليه من كلا الجهازين
    return routersOrFw.some(dev => isReachable(src.id, dev.id) && isReachable(dev.id, dst.id));
}

// حفظ التصميم في LocalStorage
saveBtn.addEventListener("click", () => {
    const data = {
        devices,
        links,
        deviceCounter
    };
    localStorage.setItem("networkDesignPro", JSON.stringify(data));
    alert("تم حفظ التصميم في المتصفح.");
});

// استرجاع التصميم
loadBtn.addEventListener("click", () => {
    const raw = localStorage.getItem("networkDesignPro");
    if (!raw) {
        alert("لا يوجد تصميم محفوظ.");
        return;
    }
    try {
        const data = JSON.parse(raw);
        devices = data.devices || [];
        links = data.links || [];
        deviceCounter = data.deviceCounter || 1;
        renderDevices();
        refreshPingDropdowns();
        resultsDiv.innerHTML = "";
        alert("تم استرجاع التصميم بنجاح.");
    } catch (e) {
        alert("حدث خطأ أثناء قراءة البيانات المحفوظة.");
    }
});

// تهيئة أولية
renderDevices();
refreshPingDropdowns();
modeIndicator.textContent = "الوضع الحالي: سحب وإفلات الأجهزة";
