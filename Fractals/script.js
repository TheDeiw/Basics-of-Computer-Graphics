// Отримання посилань на елементи DOM
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const fractalSelect = document.getElementById("fractalSelect");
const paramsPanel = document.getElementById("paramsPanel");
const drawBtn = document.getElementById("drawBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");
const loadImgBtn = document.getElementById("loadImgBtn");
const fileInput = document.getElementById("fileInput");

// Розміри канвасу
canvas.width = window.innerWidth * 0.65;
canvas.height = window.innerHeight * 0.97;
const width = canvas.width;
const height = canvas.height;

// Центр канвасу
const centerX = width / 2;
const centerY = height / 2;

// Змінні для масштабування (сніжинка)
let scale = 1; // поточний масштаб
const scaleFactor = 1.1; // коефіцієнт зуму
const minScale = 0.5;
const maxScale = 5;
const step = 50; // крок поділок для осей у сніжинці

// Для tg(z²)+c режиму використовуємо фіксований масштаб (без зуму)
const fixedScale = 1;

// Функції перетворення координат
function toAxisX(canvasX) {
    return (canvasX - centerX) / scale;
}
function toAxisY(canvasY) {
    return (centerY - canvasY) / scale;
}
function toCanvasX(axisX) {
    return centerX + axisX * scale;
}
function toCanvasY(axisY) {
    return centerY - axisY * scale;
}

// --- Малювання осей ---
function drawArrow(x1, y1, x2, y2) {
    const arrowLength = 10 / scale;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "#ffffff33";
    ctx.lineWidth = 1 / scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowLength * Math.cos(angle - Math.PI / 6), y2 - arrowLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - arrowLength * Math.cos(angle + Math.PI / 6), y2 - arrowLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = "#ffffff33";
    ctx.fill();
}

function drawAxes() {
    // Очищаємо всю область перед малюванням осей
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    ctx.strokeStyle = "#ffffff33";
    ctx.fillStyle = "#ffffff33";
    ctx.lineWidth = 1 / scale;

    // Малюємо осі з використанням drawArrow
    drawArrow(-centerX / scale, 0, centerX / scale, 0); // горизонтальна вісь
    drawArrow(0, centerY / scale, 0, -centerY / scale); // вертикальна вісь

    ctx.font = `${12 / scale}px Arial`;
    ctx.fillText("X", (centerX - 20) / scale, -10 / scale);
    ctx.fillText("Y", 5 / scale, (-centerY + 20) / scale);

    // Поділки для осей
    for (let x = step; x < centerX / scale; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, -5 / scale);
        ctx.lineTo(x, 5 / scale);
        ctx.stroke();
        ctx.fillText(x, x - 10 / scale, 15 / scale);

        ctx.beginPath();
        ctx.moveTo(-x, -5 / scale);
        ctx.lineTo(-x, 5 / scale);
        ctx.stroke();
        ctx.fillText(-x, -x - 15 / scale, 15 / scale);
    }
    for (let y = step; y < centerY / scale; y += step) {
        ctx.beginPath();
        ctx.moveTo(-5 / scale, -y);
        ctx.lineTo(5 / scale, -y);
        ctx.stroke();
        ctx.fillText(y, 10 / scale, -y + 5 / scale);

        ctx.beginPath();
        ctx.moveTo(-5 / scale, y);
        ctx.lineTo(5 / scale, y);
        ctx.stroke();
        ctx.fillText(-y, 10 / scale, y + 5 / scale);
    }
    ctx.restore();
    markZero();
}

function markZero() {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(0, 0, 5 / scale, 0, Math.PI * 2);
    ctx.fillStyle = "#0a1f1f";
    ctx.fill();
    ctx.font = `${10 / scale}px Arial`;
    ctx.fillText("0", 10 / scale, 10 / scale);
    ctx.restore();
}

// --- Малювання tg(z²)+c ---
// Для цього режиму використовуємо фіксований масштаб (fixedScale) і відображаємо осі посередині канвасу
function drawTgFractal() {
    const cReal = parseFloat(document.getElementById("cReal").value);
    const cImag = parseFloat(document.getElementById("cImag").value);
    const maxIterations = parseInt(document.getElementById("iterations").value);
    const scaleFractal = parseFloat(document.getElementById("scaleFractal").value);

    // Встановлення діапазону комплексної площини
    const reStart = -scaleFractal;
    const reEnd = scaleFractal;
    const imStart = -scaleFractal;
    const imEnd = scaleFractal;

    const imageData = ctx.createImageData(width, height);

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const re = reStart + (x / width) * (reEnd - reStart);
            const im = imStart + (y / height) * (imEnd - imStart);
            let z = { re, im };
            let iteration = 0;

            while (iteration < maxIterations) {
                let zRe2 = z.re * z.re - z.im * z.im;
                let zIm2 = 2 * z.re * z.im;

                const denom = Math.cos(zRe2) * Math.cosh(zIm2);
                if (denom === 0) break;
                let tanRe = (Math.sin(zRe2) * Math.cosh(zIm2)) / denom;
                let tanIm = (Math.cos(zRe2) * Math.sinh(zIm2)) / denom;

                z = {
                    re: tanRe + cReal,
                    im: tanIm + cImag,
                };

                if (z.re * z.re + z.im * z.im > 4) break;
                iteration++;
            }

            const pixelIndex = (y * width + x) * 4;
            // HSL для кольорової палітри
            if (iteration === maxIterations) {
                imageData.data[pixelIndex + 0] = 0;
                imageData.data[pixelIndex + 1] = 0;
                imageData.data[pixelIndex + 2] = 0;
            } else {
                const hue = (360 * iteration) / maxIterations;
                const rgb = hslToRgb(hue / 360, 1, 0.5);
                imageData.data[pixelIndex + 0] = rgb.r;
                imageData.data[pixelIndex + 1] = rgb.g;
                imageData.data[pixelIndex + 2] = rgb.b;
            }
            imageData.data[pixelIndex + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);

    // Малюємо осі Re та Im (без зумування)
    drawFixedAxes();
}

// Функція для малювання осей для tg(z²)+c (без трансформації)
function drawFixedAxes() {
    const scaleFractal = parseFloat(document.getElementById("scaleFractal").value);

    // Визначаємо крок міток: для scaleFractal < 1 крок зменшується пропорційно
    let step = scaleFractal >= 1 ? 1 : scaleFractal / 4;

    ctx.save();
    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";
    ctx.lineWidth = 2;

    // (Re)
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // (Im)
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Обчислюємо пікселі на одиницю для осей
    const reStart = -scaleFractal;
    const reEnd = scaleFractal;
    const pixelsPerUnit = width / (reEnd - reStart);

    // Малюємо мітки на осі Re
    for (let re = Math.ceil(reStart / step) * step; re <= reEnd; re += step) {
        if (Math.abs(re) < step / 2) continue;
        const x = centerX + re * pixelsPerUnit;
        ctx.beginPath();
        ctx.moveTo(x, centerY - 5);
        ctx.lineTo(x, centerY + 5);
        ctx.stroke();
        ctx.fillText(re.toFixed(2), x - 10, centerY + 20);
    }

    // Малюємо мітки на осі Im
    const imStart = -scaleFractal;
    const imEnd = scaleFractal;
    const pixelsPerUnitIm = height / (imEnd - imStart);
    for (let im = Math.ceil(imStart / step) * step; im <= imEnd; im += step) {
        if (Math.abs(im) < step / 2) continue;
        const y = centerY - im * pixelsPerUnitIm;
        ctx.beginPath();
        ctx.moveTo(centerX - 5, y);
        ctx.lineTo(centerX + 5, y);
        ctx.stroke();
        ctx.fillText(im.toFixed(2), centerX + 10, y + 5); // Значення мітки
    }

    // Позначення нуля в центрі
    ctx.fillText("0", centerX + 10, centerY + 20);

    // Позначення осей
    ctx.font = "18px Arial";
    ctx.fillText("Re", width - 40, centerY - 10);
    ctx.fillText("Im", centerX + 10, 20);

    ctx.restore();
}

// --- Малювання сніжинки Коха (звичайної) ---
function drawKochSnowflake(iterations, size) {
    drawAxes();
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    // Початковий трикутник
    const halfSize = size / 2;
    const heightTri = (size * Math.sqrt(3)) / 2;
    const p1 = { x: -halfSize, y: heightTri / 3 };
    const p2 = { x: halfSize, y: heightTri / 3 };
    const p3 = { x: 0, y: (-2 * heightTri) / 3 };

    ctx.strokeStyle = "#00bfff";
    ctx.lineWidth = 1 / scale;

    function kochLine(pA, pB, iter) {
        if (iter === 0) {
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
            return;
        }
        const dx = pB.x - pA.x;
        const dy = pB.y - pA.y;
        const pA1 = { x: pA.x + dx / 3, y: pA.y + dy / 3 };
        const pA2 = { x: pA.x + (2 * dx) / 3, y: pA.y + (2 * dy) / 3 };

        const angle = Math.atan2(dy, dx) - Math.PI / 3;
        const length = Math.sqrt(dx * dx + dy * dy) / 3;
        const pPeak = {
            x: pA1.x + Math.cos(angle) * length,
            y: pA1.y + Math.sin(angle) * length,
        };

        kochLine(pA, pA1, iter - 1);
        kochLine(pA1, pPeak, iter - 1);
        kochLine(pPeak, pA2, iter - 1);
        kochLine(pA2, pB, iter - 1);
    }

    kochLine(p1, p2, iterations);
    kochLine(p2, p3, iterations);
    kochLine(p3, p1, iterations);
    ctx.restore();
}

// --- Малювання рандомізованої сніжинки Коха ---
// Додаємо перевірку: якщо параметри не змінилися, не будуємо знову
function drawRandomKochSnowflake(iterations, size) {
    // Видаляємо перевірку параметрів, щоб завжди оновлювати зображення
    drawAxes();
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    const halfSize = size / 2;
    const heightTri = (size * Math.sqrt(3)) / 2;
    const p1 = { x: -halfSize, y: heightTri / 3 };
    const p2 = { x: halfSize, y: heightTri / 3 };
    const p3 = { x: 0, y: (-2 * heightTri) / 3 };

    ctx.strokeStyle = "#00bfff";
    ctx.lineWidth = 1 / scale;

    function randomKochLine(pA, pB, iter) {
        if (iter === 0) {
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
            return;
        }
        const dx = pB.x - pA.x;
        const dy = pB.y - pA.y;
        const pA1 = { x: pA.x + dx / 3, y: pA.y + dy / 3 };
        const pA2 = { x: pA.x + (2 * dx) / 3, y: pA.y + (2 * dy) / 3 };

        // Додаємо рандомізацію
        const angle = Math.atan2(dy, dx) - Math.PI / 3 + 0.15;
        const length = (Math.sqrt(dx * dx + dy * dy) / 3) * 1.05;
        const pPeak = {
            x: pA1.x + Math.cos(angle) * length,
            y: pA1.y + Math.sin(angle) * length,
        };

        randomKochLine(pA, pA1, iter - 1);
        randomKochLine(pA1, pPeak, iter - 1);
        randomKochLine(pPeak, pA2, iter - 1);
        randomKochLine(pA2, pB, iter - 1);
    }

    randomKochLine(p1, p2, iterations);
    randomKochLine(p2, p3, iterations);
    randomKochLine(p3, p1, iterations);
    ctx.restore();
}

// --- Панель параметрів ---
function updateParamsPanel() {
    let html = "";
    const fractalType = fractalSelect.value;

    if (fractalType === "tg") {
        //html += `<h3>tg(z²)+c</h3>`;
        html += `<label for="cReal">Re(c):</label><input type="number" id="cReal" step="0.1" value="-0.5">`;
        html += `<label for="cImag">Im(c):</label><input type="number" id="cImag" step="0.1" value="0.6">`;
        html += `<label for="iterations">Кількість ітерацій:</label><input type="number" id="iterations" value="100">`;
        html += `<label for="scaleFractal">Масштаб (область):</label><input type="number" id="scaleFractal" step="0.1" value="0.7">`;
    } else if (fractalType === "koch" || fractalType === "kochRandom") {
        //html += `<h3>Сніжинка Коха</h3>`;
        html += `<label for="kochIterations">Кількість ітерацій:</label><input type="number" id="kochIterations" value="4">`;
        html += `<label for="kochSize">Довжина сторони:</label><input type="number" id="kochSize" value="1200">`;
    }
    paramsPanel.innerHTML = html;
}
fractalSelect.addEventListener("change", updateParamsPanel);
updateParamsPanel();

// --- Обробка подій кнопок ---
drawBtn.addEventListener("click", () => {
    // Очищення канвасу перед побудовою
    ctx.clearRect(0, 0, width, height);
    const fractalType = fractalSelect.value;

    if (fractalType === "tg") {
        drawTgFractal();
    } else if (fractalType === "koch") {
        const iterations = parseInt(document.getElementById("kochIterations").value);
        const size = parseFloat(document.getElementById("kochSize").value);
        drawKochSnowflake(iterations, size);
    } else if (fractalType === "kochRandom") {
        const iterations = parseInt(document.getElementById("kochIterations").value);
        const size = parseFloat(document.getElementById("kochSize").value);
        drawRandomKochSnowflake(iterations, size);
    }
});

clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, width, height);
});

saveBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "fractal.png";
    link.href = canvas.toDataURL();
    link.click();
});

loadImgBtn.addEventListener("click", () => {
    fileInput.click();
});
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
    };
    img.src = URL.createObjectURL(file);
});

// --- Масштабування сніжинки за колесиком (тільки для сніжинок) ---
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const fractalType = fractalSelect.value;
    if (fractalType === "koch" || fractalType === "kochRandom") {
        if (e.deltaY > 0) {
            scale /= scaleFactor;
        } else {
            scale *= scaleFactor;
        }
        if (scale < minScale) scale = minScale;
        if (scale > maxScale) scale = maxScale;

        // Перемалювати відповідну сніжинку
        ctx.clearRect(0, 0, width, height);
        if (fractalType === "koch") {
            const iterations = parseInt(document.getElementById("kochIterations").value);
            const size = parseFloat(document.getElementById("kochSize").value);
            drawKochSnowflake(iterations, size);
        } else if (fractalType === "kochRandom") {
            const iterations = parseInt(document.getElementById("kochIterations").value);
            const size = parseFloat(document.getElementById("kochSize").value);
            drawRandomKochSnowflake(iterations, size);
        }
    }
});

// --- Допоміжна функція HSL -> RGB ---
// Функція повертає об'єкт з властивостями r, g, b (0-255)
function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
}
