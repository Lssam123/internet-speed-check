const canvas = document.getElementById("canvas");
const analyzeBtn = document.getElementById("analyzeBtn");
const results = document.getElementById("results");

let devicesOnCanvas = [];

document.querySelectorAll(".device").forEach(device => {
    device.addEventListener("dragstart", e => {
        e.dataTransfer.setData("type", device.dataset.type);
        e.dataTransfer.setData("img", device.querySelector("img").src);
        e.dataTransfer.setData("name", device.querySelector("p").textContent);
    });
});

canvas.addEventListener("dragover", e => e.preventDefault());

canvas.addEventListener("drop", e => {
    const type = e.dataTransfer.getData("type");
    const img = e.dataTransfer.getData("img");
    const name = e.dataTransfer.getData("name");

    const newDevice = document.createElement("div");
    newDevice.className = "device-icon";
    newDevice.style.left = e.offsetX + "px";
    newDevice.style.top = e.offsetY + "px";

    newDevice.innerHTML = `
        <img src="${img}">
        <p>${name}</p>
    `;

    canvas.appendChild(newDevice);

    devicesOnCanvas.push(type);
});

analyzeBtn.addEventListener("click", () => {
    let output = "<h3>نتائج تحليل الأمان</h3>";

    if (!devicesOnCanvas.includes("firewall"))
        output += "❌ لا يوجد جدار ناري — الشبكة معرضة للهجمات<br>";

    if (!devicesOnCanvas.includes("router"))
        output += "❌ لا يوجد راوتر — لا يمكن توزيع الإنترنت<br>";

    if (!devicesOnCanvas.includes("switch"))
        output += "⚠️ لا يوجد سويتش — الشبكة غير مكتملة<br>";

    if (devicesOnCanvas.filter(d => d === "pc").length > 20)
        output += "⚠️ عدد الحواسيب كبير — يفضل تقسيم VLAN<br>";

    if (output === "<h3>نتائج تحليل الأمان</h3>")
        output += "✔️ الشبكة تبدو آمنة ومكتملة";

    results.innerHTML = output;
    results.style.display = "block";
});
