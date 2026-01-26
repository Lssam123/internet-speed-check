// عناصر DOM
const canvas = document.getElementById("canvas");
const linksLayer = document.getElementById("linksLayer");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const resultsDiv = document.getElementById("results");
const modeIndicator = document.getElementById("modeIndicator");

const linkFromSelect = document.getElementById("linkFrom");
const linkToSelect = document.getElementById("linkTo");
const cableTypeSelect = document.getElementById("cableType");
const createLinkBtn = document.getElementById("createLinkBtn");
const linksListDiv = document.getElementById("linksList");

const pingSourceSelect = document.getElementById("pingSource");
const pingTargetSelect = document.getElementById("pingTarget");
const pingBtn = document.getElementById("pingBtn");
const pingResult = document.getElementById("pingResult");

const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");

// مودال خصائص الجهاز
const deviceModal = document.getElementById("deviceModal");
const closeModalBtn = document.getElementById("closeModal");
const modalDeviceIdSpan = document.getElementById("modalDeviceId");
const modalDeviceTypeSpan = document.getElementById("modalDeviceType");
const modalDeviceModelSpan = document.getElementById("modalDeviceModel");
const modalIpInput = document.getElementById("modalIp");
const modalVlanInput = document.getElementById("modalVlan");
const modalLabelInput = document.getElementById("modalLabel");
const saveDevicePropsBtn = document.getElementById("saveDeviceProps");

// نموذج بيانات
let devices = [];   // {id, type, model, iconClass, x, y, ip, vlan, label}
let links = [];     // {id, fromId, toId, cableType}
let deviceCounter = 1;
let selectedDeviceId = null;

// تفعيل السحب من قائمة الأجهزة
document.querySelectorAll(".device").forEach(device => {
    device.addEventListener("dragstart", e => {
        e.dataTransfer.setData("type", device.dataset.type);
        e.dataTransfer.setData("model", device.dataset.model);
        e.dataTransfer.setData("iconClass", device.querySelector(".icon").className.replace("icon ", ""));
    });
});

// السماح بالإفلات على اللوحة
canvas.addEventListener("dragover", e => e.preventDefault());

// عند الإفلات: إنشاء جهاز جديد
canvas.addEventListener("drop", e => {
    const type = e.dataTransfer.getData("type");
    const model = e.dataTransfer.getData("model");
    const iconClass = e.dataTransfer.getData("iconClass");
    if (!type || !model) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    createDevice(type, model, iconClass, x, y);
    refreshDropdowns();
});

// إنشاء جهاز جديد
function createDevice(type, model, iconClass, x, y) {
    const id = "D" + deviceCounter++;
    const label = defaultLabelForType(type) + "-" + id;

    const device = {
        id,
        type,
        model,
        iconClass,
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
    // مسح الأجهزة
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
        icon.className = "icon " + device.iconClass;
        icon.textContent = iconTextForType(device.type, device.iconClass);

        const label = document.createElement("div");
        label.className = "label";
        label.textContent = device.label || device.id;

        const model = document.createElement("div");
        model.className = "model";
        model.textContent = device.model;

        const ip = document.createElement("div");
        ip.className = "ip";
        ip.textContent = device.ip
            ? device.ip + (device.vlan ? " | VLAN " + device.vlan : "")
            : "بدون IP";

        inner.appendChild(icon);
        inner.appendChild(label);
        inner.appendChild(model);
        inner.appendChild(ip);
        node.appendChild(inner);
        canvas.appendChild(node);

        node.addEventListener("click", () => onDeviceClick(device.id));
        makeNodeDraggable(node, device.id);
    });

    renderLinks();
    renderLinksList();
}

// نص الأيقونة حسب النوع/الإصدار
function iconTextForType(type, iconClass) {
    if (iconClass.startsWith("router")) return "R";
    if (iconClass.startsWith("switch")) return "S";
    if (iconClass.startsWith("pc")) return "PC";
    if (iconClass.startsWith("fw")) return "FW";
    switch (type) {
        case "router": return "R";
        case "switch": return "S";
        case "pc": return "PC";
        case "firewall": return "FW";
        default: return "?";
    }
}

// جعل الجهاز قابل للتحريك
function makeNodeDraggable(node, id) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    node.addEventListener("mousedown", e => {
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

// رسم الروابط (الكابلات) مع ألوان حسب نوع الكيبل
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
        line.setAttribute("stroke", cableColor(link.cableType));
        line.setAttribute("stroke-width", cableWidth(link.cableType));
        line.setAttribute("stroke-linecap", "round");
        linksLayer.appendChild(line);
    });
}

// لون الكيبل
function cableColor(type) {
    switch (type) {
        case "straight": return "#1e88e5";
        case "cross": return "#f9a825";
        case "fiber": return "#8e24aa";
        case "console": return "#546e7a";
        default: return "#90a4ae";
    }
}

// سماكة الكيبل
function cableWidth(type) {
    switch (type) {
        case "fiber": return 4;
        default: return 3;
    }
}

// عند الضغط على جهاز
function onDeviceClick(id) {
    selectedDeviceId = id;
    openDeviceModal(id);
    renderDevices();
}

// فتح نافذة خصائص الجهاز
function openDeviceModal(id) {
    const dev = devices.find(d => d.id === id);
    if (!dev) return;

    modalDeviceIdSpan.textContent = dev.id;
    modalDeviceTypeSpan.textContent = typeArabicName(dev.type);
    modalDeviceModelSpan.textContent = dev.model;
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
    refreshDropdowns();
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

// تحديث القوائم (ربط + Ping)
function refreshDropdowns() {
    linkFromSelect.innerHTML = "";
    linkToSelect.innerHTML = "";
    pingSourceSelect.innerHTML = "";
    pingTargetSelect.innerHTML = "";

    devices.forEach(d => {
        const opt1 = document.createElement("option");
        opt1.value = d.id;
        opt1.textContent = `${d.label || d.id} [${typeArabicName(d.type)}]`;
        linkFromSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = d.id;
        opt2.textContent = `${d.label || d.id} [${typeArabicName(d.type)}]`;
        linkToSelect.appendChild(opt2);

        const optT = document.createElement("option");
        optT.value = d.id;
        optT.textContent = `${d.label || d.id} [${typeArabicName(d.type)}]`;
        pingTargetSelect.appendChild(optT);
    });

    // Ping المصدر: PCs فقط
    devices.filter(d => d.type === "pc").forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = `${d.label || d.id} (${d.ip || "بدون IP"})`;
        pingSourceSelect.appendChild(opt);
    });
}

// إنشاء رابط (كيبل) برمجياً
createLinkBtn.addEventListener("click", () => {
    const fromId = linkFromSelect.value;
    const toId = linkToSelect.value;
    const cableType = cableTypeSelect.value;

    if (!fromId || !toId) {
        alert("يرجى اختيار جهازين.");
        return;
    }
    if (fromId === toId) {
        alert("لا يمكن ربط الجهاز بنفسه.");
        return;
    }

    const from = devices.find(d => d.id === fromId);
    const to = devices.find(d => d.id === toId);
    if (!from || !to) return;

    // التحقق من صحة نوع الكيبل (منطق بسيط)
    if (!isCableTypeValid(from, to, cableType)) {
        alert("نوع الكيبل غير مناسب لهذا النوع من الربط (منطق تدريبي).");
        return;
    }

    const exists = links.some(
        l =>
            (l.fromId === fromId && l.toId === toId) ||
            (l.fromId === toId && l.toId === fromId)
    );
    if (exists) {
        alert("يوجد رابط مسبق بين هذين الجهازين.");
        return;
    }

    const id = "L" + fromId + "-" + toId + "-" + cableType;
    links.push({ id, fromId, toId, cableType });
    renderDevices();
});

// منطق صلاحية نوع الكيبل
function isCableTypeValid(from, to, cableType) {
    const t1 = from.type;
    const t2 = to.type;

    if (cableType === "straight") {
        // غالباً PC ↔ Switch أو Router ↔ Switch
        if (
            (t1 === "pc" && t2 === "switch") ||
            (t1 === "switch" && t2 === "pc") ||
            (t1 === "router" && t2 === "switch") ||
            (t1 === "switch" && t2 === "router")
        ) return true;
        return false;
    }

    if (cableType === "cross") {
        // Switch ↔ Switch أو PC ↔ PC
        if (
            (t1 === "switch" && t2 === "switch") ||
            (t1 === "pc" && t2 === "pc")
        ) return true;
        return false;
    }

    if (cableType === "fiber") {
        // غالباً بين Core Devices (Router ↔ Router أو Core Switch ↔ Core Switch)
        if (
            (t1 === "router" && t2 === "router") ||
            (t1 === "switch" && t2 === "switch")
        ) return true;
        return false;
    }

    if (cableType === "console") {
        // PC ↔ Router/Switch
        if (
            (t1 === "pc" && (t2 === "router" || t2 === "switch")) ||
            (t2 === "pc" && (t1 === "router" || t1 === "switch"))
        ) return true;
        return false;
    }

    return true;
}

// عرض قائمة الروابط
function renderLinksList() {
    linksListDiv.innerHTML = "";
    if (links.length === 0) {
        linksListDiv.textContent = "لا توجد روابط حالياً.";
        return;
    }

    links.forEach(link => {
        const from = devices.find(d => d.id === link.fromId);
        const to = devices.find(d => d.id === link.toId);
        if (!from || !to) return;

        const div = document.createElement("div");
        div.className = "link-item";

        const spanInfo = document.createElement("span");
        spanInfo.textContent =
            `${from.label || from.id} ↔ ${to.label || to.id} (${cableTypeName(link.cableType)})`;

        const spanRemove = document.createElement("span");
        spanRemove.className = "link-remove";
        spanRemove.textContent = "حذف";
        spanRemove.addEventListener("click", () => {
            links = links.filter(l => l.id !== link.id);
            renderDevices();
        });

        div.appendChild(spanInfo);
        div.appendChild(spanRemove);
        linksListDiv.appendChild(div);
    });
}

// اسم نوع الكيبل
function cableTypeName(type) {
    switch (type) {
        case "straight": return "Straight-Through";
        case "cross": return "Cross-Over";
        case "fiber": return "Fiber";
        case "console": return "Console";
        default: return type;
    }
}

// مسح اللوحة
clearBtn.addEventListener("click", () => {
    if (!confirm("هل تريد مسح جميع الأجهزة والروابط؟")) return;
    devices = [];
    links = [];
    deviceCounter = 1;
    selectedDeviceId = null;
    renderDevices();
    refreshDropdowns();
    resultsDiv.innerHTML = "";
    pingResult.textContent = "";
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

    // أجهزة غير متصلة
    const isolated = devices.filter(d => !links.some(l => l.fromId === d.id || l.toId === d.id));
    if (isolated.length > 0) {
        msgs.push(`<div class="warn">⚠️ توجد أجهزة غير متصلة بالشبكة: ${isolated.map(d => d.label || d.id).join(", ")}</div>`);
    }

    if (msgs.length === 0) {
        msgs.push(`<div class="ok">✔️ لا توجد مشاكل واضحة — التصميم يبدو جيداً من ناحية أساسية.</div>`);
    }

    resultsDiv.innerHTML = msgs.join("");
});

// محاكاة Ping
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

    const reachable = isReachable(srcId, dstId);
    const sameVlanOrRouted = checkVlanReachability(src, dst);

    if (reachable && sameVlanOrRouted) {
        pingResult.textContent = `Ping ناجح من ${src.label || src.id} إلى ${dst.label || dst.id}`;
        pingResult.style.color = "#2e7d32";
    } else if (!reachable) {
        pingResult.textContent = "لا يوجد مسار فيزيائي (كيابل) بين الجهازين — فشل Ping.";
        pingResult.style.color = "#c62828";
    } else {
        pingResult.textContent = "اختلاف VLAN بدون وجود راوتر/جدار ناري مناسب — فشل Ping.";
        pingResult.style.color = "#c62828";
    }
});

// فحص وجود مسار بين جهازين
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

// فحص VLAN: نفس VLAN أو وجود راوتر/Firewall في المسار
function checkVlanReachability(src, dst) {
    if (!src.vlan || !dst.vlan || src.vlan === dst.vlan) return true;

    const routersOrFw = devices.filter(d => d.type === "router" || d.type === "firewall");
    if (routersOrFw.length === 0) return false;

    return routersOrFw.some(dev => isReachable(src.id, dev.id) && isReachable(dev.id, dst.id));
}

// حفظ التصميم
saveBtn.addEventListener("click", () => {
    const data = { devices, links, deviceCounter };
    localStorage.setItem("networkDesignUltraPro", JSON.stringify(data));
    alert("تم حفظ التصميم في المتصفح.");
});

// استرجاع التصميم
loadBtn.addEventListener("click", () => {
    const raw = localStorage.getItem("networkDesignUltraPro");
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
        refreshDropdowns();
        resultsDiv.innerHTML = "";
        pingResult.textContent = "";
        alert("تم استرجاع التصميم بنجاح.");
    } catch (e) {
        alert("حدث خطأ أثناء قراءة البيانات المحفوظة.");
    }
});

// تهيئة أولية
renderDevices();
refreshDropdowns();
modeIndicator.textContent = "الوضع: سحب الأجهزة + ربط برمجي فقط";
