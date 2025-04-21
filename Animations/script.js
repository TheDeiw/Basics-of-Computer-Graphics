// Ключові елементи
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const msg = document.getElementById("messageArea");
let W, H;

// Параметри руху
let ptsInit = []; // початкові вершини квадрата [[x1,y1],…]
let ptsCurr = []; // поточний стан
let dx = 0,
    dy = 0, // вектор руху
    angle = 0, // кут повороту в градусах
    unit = 50; // розмір одиничного відрізку (px)

let animId = null, // ідентифікатор анімації
    t = 0, // параметр від 0 до 1
    direction = 1; // напрямок (туди/назад)

// Параметри масштабування
const MIN_UNIT = 10; // мінімальна довжина одиничного відрізку
const MAX_UNIT = 500; // максимальна довжина одиничного відрізку
const ZOOM_FACTOR = 1.1; // коефіцієнт зуму

// Ініціалізація розмірів canvas
function resize() {
    canvas.width = window.innerWidth * 0.65;
    canvas.height = window.innerHeight * 0.97;
    W = canvas.width;
    H = canvas.height;
}
window.addEventListener("resize", () => {
    resize();
    drawAll();
});
resize();

// Обробник колеса миші для зуму
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    // Змінюємо unit залежно від напряму прокрутки
    if (e.deltaY < 0) {
        unit *= ZOOM_FACTOR;
    } else {
        unit /= ZOOM_FACTOR;
    }
    // Обмежуємо unit між MIN_UNIT та MAX_UNIT
    unit = Math.min(Math.max(unit, MIN_UNIT), MAX_UNIT);
    // Оновлюємо значення в полі вводу
    document.getElementById("unit").value = Math.round(unit);
    drawAll();
});

// Функція читання й валідації введених даних
function readInputs() {
    msg.textContent = "";

    // читаємо тільки дві діагональні точки A(x1,y1) та C(x2,y2)
    const x1 = parseFloat(document.getElementById("x1").value),
        y1 = parseFloat(document.getElementById("y1").value),
        x2 = parseFloat(document.getElementById("x2").value),
        y2 = parseFloat(document.getElementById("y2").value);

    if ([x1, y1, x2, y2].some((v) => isNaN(v))) {
        msg.textContent = "Обидві діагональні вершини мають бути числами!";
        return false;
    }

    // центр квадрата
    const cx = (x1 + x2) / 2,
        cy = (y1 + y2) / 2;
    // вектор від центру до A
    const vx = x1 - cx,
        vy = y1 - cy;
    // перпендикулярний вектор
    const ux = -vy,
        uy = vx;
    // обчислюємо вершини: A, B, C, D
    ptsInit = [
        [x1, y1],
        [cx + ux, cy + uy], // B
        [x2, y2],
        [cx - ux, cy - uy], // D
    ];

    // перевірка: площа ненульова
    if (Math.abs(polyArea(ptsInit)) < 1e-3) {
        msg.textContent = "Невалідна фігура (площа ≈ 0)";
        return false;
    }

    // читаємо параметри руху та масштаб
    dx = parseFloat(document.getElementById("dx").value) || 0;
    dy = parseFloat(document.getElementById("dy").value) || 0;
    angle = parseFloat(document.getElementById("angle").value) || 0;
    let u = parseFloat(document.getElementById("unit").value);
    if (!isNaN(u)) unit = Math.min(Math.max(u, MIN_UNIT), MAX_UNIT);
    document.getElementById("unit").value = Math.round(unit);

    // синхронізуємо поточний стан
    ptsCurr = ptsInit.slice();
    return true;
}

// Обчислення площі полігону (на перевірку виродженості)
function polyArea(pts) {
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i],
            [x2, y2] = pts[(i + 1) % pts.length];
        a += x1 * y2 - x2 * y1;
    }
    return a / 2;
}

function drawAxes() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.strokeStyle = "#ffffff33";
    ctx.fillStyle = "#ffffff33";
    ctx.lineWidth = 1;

    // вісь X
    ctx.beginPath();
    ctx.moveTo(-W / 2, 0);
    ctx.lineTo(W / 2, 0);
    ctx.stroke();
    // вісь Y
    ctx.beginPath();
    ctx.moveTo(0, -H / 2);
    ctx.lineTo(0, H / 2);
    ctx.stroke();

    // мітки по X
    const countX = Math.floor(W / 2 / unit);
    for (let i = 1; i <= countX; i++) {
        const v = i * unit;
        // плюс
        ctx.beginPath();
        ctx.moveTo(v, -5);
        ctx.lineTo(v, 5);
        ctx.stroke();
        ctx.fillText(i, v + 2, 12);
        // мінус
        ctx.beginPath();
        ctx.moveTo(-v, -5);
        ctx.lineTo(-v, 5);
        ctx.stroke();
        ctx.fillText(-i, -v + 2, 12);
    }

    // мітки по Y
    const countY = Math.floor(H / 2 / unit);
    for (let i = 1; i <= countY; i++) {
        const v = i * unit;
        // +v по Y
        ctx.beginPath();
        ctx.moveTo(-5, -v);
        ctx.lineTo(5, -v);
        ctx.stroke();
        ctx.fillText(i, 8, -v + 2);
        // -v по Y
        ctx.beginPath();
        ctx.moveTo(-5, v);
        ctx.lineTo(5, v);
        ctx.stroke();
        ctx.fillText(-i, 8, v + 2);
    }

    ctx.restore();
}
// Застосування афінних перетворень: зсув + поворот навколо центра
function transformPoints(pts, frac) {
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const rad = ((angle * Math.PI) / 180) * frac;
    const cosA = Math.cos(rad),
        sinA = Math.sin(rad);
    return pts.map(([x, y]) => {
        let X = x - cx,
            Y = y - cy;
        const XR = X * cosA - Y * sinA;
        const YR = X * sinA + Y * cosA;
        return [XR + cx + dx * frac, YR + cy + dy * frac];
    });
}

// Малювання полігону
function drawPolygon(pts, style = "#00bfff") {
    if (pts.length < 2) return;
    ctx.beginPath();
    const [x0, y0] = pts[0];
    ctx.moveTo(W / 2 + x0 * unit, H / 2 - y0 * unit);
    for (let i = 1; i < pts.length; i++) {
        const [x, y] = pts[i];
        ctx.lineTo(W / 2 + x * unit, H / 2 - y * unit);
    }
    ctx.closePath();
    ctx.strokeStyle = style;
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Один крок анімації
function step() {
    t += 0.01 * direction;
    if (t > 1 || t < 0) {
        direction *= -1;
        t = Math.max(0, Math.min(1, t));
    }
    ptsCurr = transformPoints(ptsInit, t);
    drawAll();
    animId = requestAnimationFrame(step);
}

function drawAll() {
    drawAxes();
    drawPolygon(ptsInit, "gray");
    drawPolygon(ptsCurr, "#00bfff");
}

// Обробники кнопок
document.getElementById("startBtn").onclick = () => {
    if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
        document.getElementById("startBtn").textContent = "Почати";
    } else {
        if (!readInputs()) return;
        t = 0;
        direction = 1;
        ptsCurr = ptsInit.slice();
        document.getElementById("startBtn").textContent = "Зупинити";
        step();
    }
};

document.getElementById("resetBtn").onclick = () => {
    cancelAnimationFrame(animId);
    animId = null;
    document.getElementById("startBtn").textContent = "Почати";
    if (readInputs()) {
        ptsCurr = ptsInit.slice();
        drawAll();
    }
};

// Збереження матриці
// Оновлений вивід матриці з підписами
document.getElementById("saveMatrixBtn").onclick = () => {
    if (!readInputs()) return;
    const rad = (angle * Math.PI) / 180;
    const cosA = Math.cos(rad),
        sinA = Math.sin(rad);

    // Підготовка тексту з підписами
    const lines = [];
    lines.push(`Кут повороту, °: ${angle.toFixed(2)}`);
    lines.push(`Кут повороту, рад: ${rad.toFixed(4)}`);
    lines.push(`cos(α): ${cosA.toFixed(4)}, sin(α): ${sinA.toFixed(4)}`);
    lines.push(`Вектор зсуву: [dx, dy] = [${dx}, ${dy}]`);
    lines.push(`
  Афінна матриця 3×3:`);
    lines.push(`[ ${cosA.toFixed(4)}	${(-sinA).toFixed(4)}	${dx} ]`);
    lines.push(`[ ${sinA.toFixed(4)}	${cosA.toFixed(4)}	${dy} ]`);
    lines.push(`[ 0		0		1 ]`);

    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.download = "transform_matrix.txt";
    link.href = URL.createObjectURL(blob);
    link.click();
};

// Збереження зображення canvas
document.getElementById("saveImageBtn").onclick = () => {
    const link = document.createElement("a");
    link.download = "figure.png";
    link.href = canvas.toDataURL();
    link.click();
};

// Початковий малюнок при завантаженні
window.onload = () => {
    readInputs();
    ptsCurr = ptsInit.slice();
    drawAll();
};
