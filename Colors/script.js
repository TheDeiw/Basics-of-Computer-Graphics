// Отримання посилань на елементи DOM
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const loadImgBtn = document.getElementById("loadImgBtn");
const fileInput = document.getElementById("fileInput");
const toggleModeBtn = document.getElementById("toggleModeBtn");
const applyModBtn = document.getElementById("applyModBtn");
const checkDiffBtn = document.getElementById("checkDiffBtn");
const saveImgBtn = document.getElementById("saveImgBtn");

const pixelHSL = document.getElementById("pixelHSL");
const pixelCMYK = document.getElementById("pixelCMYK");
const colorPreview = document.getElementById("colorPreview");

// Змінні додатку
let originalImageData = null;
let currentImageData = null; // зберігає поточний стан зображення
let isHSLMode = true; // true – відображення в HSL, false – в CMYK

// Налаштування полотна
canvas.width = window.innerWidth * 0.65;
canvas.height = window.innerHeight * 0.97;

// --- Функції конвертації кольорів ---
// Перетворення RGB -> HSL
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h,
        s,
        l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return [h, s, l]; // h у [0,1]
}

// Перетворення HSL -> RGB
function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
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
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Перетворення RGB -> CMYK
function rgbToCmyk(r, g, b) {
    let rPrime = r / 255;
    let gPrime = g / 255;
    let bPrime = b / 255;
    let k = 1 - Math.max(rPrime, gPrime, bPrime);
    let c = k === 1 ? 0 : (1 - rPrime - k) / (1 - k);
    let m = k === 1 ? 0 : (1 - gPrime - k) / (1 - k);
    let y = k === 1 ? 0 : (1 - bPrime - k) / (1 - k);
    return [c, m, y, k];
}

// Перетворення CMYK -> RGB
function cmykToRgb(c, m, y, k) {
    let r = 255 * (1 - c) * (1 - k);
    let g = 255 * (1 - m) * (1 - k);
    let b = 255 * (1 - y) * (1 - k);
    return [Math.round(r), Math.round(g), Math.round(b)];
}

// --- Отримати ImageData з полотна ---
function getImageData() {
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// --- Відобразити ImageData на полотні ---
function putImageData(imageData) {
    ctx.putImageData(imageData, 0, 0);
}

// --- Завантаження зображення ---
loadImgBtn.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
        // Масштабування зображення відповідно до розмірів полотна:
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        originalImageData = getImageData();
        // Початково currentImageData рівне оригінальному
        currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    };
    img.src = URL.createObjectURL(file);
});

// --- Перемикання режиму відображення ---
// Якщо режим HSL – відобразити зображення, де кожен піксель перетворено з RGB в HSL з подальшим зворотнім перетворенням (для демонстрації)
// Якщо режим CMYK – аналогічно, з використанням перетворення через RGB->CMYK->RGB
toggleModeBtn.addEventListener("click", () => {
    if (!currentImageData) return alert("Спочатку завантажте зображення!");
    let newData = ctx.createImageData(currentImageData);
    for (let i = 0; i < currentImageData.data.length; i += 4) {
        let r = currentImageData.data[i];
        let g = currentImageData.data[i + 1];
        let b = currentImageData.data[i + 2];

        if (isHSLMode) {
            // Перетворення: RGB -> HSL -> RGB (без зміни – для демонстрації режиму)
            let [h, s, l] = rgbToHsl(r, g, b);
            [r, g, b] = hslToRgb(h, s, l);
        } else {
            // Перетворення: RGB -> CMYK -> RGB
            let [c, m, y, k] = rgbToCmyk(r, g, b);
            [r, g, b] = cmykToRgb(c, m, y, k);
        }
        newData.data[i] = r;
        newData.data[i + 1] = g;
        newData.data[i + 2] = b;
        newData.data[i + 3] = currentImageData.data[i + 3];
    }
    putImageData(newData);
    isHSLMode = !isHSLMode;
    toggleModeBtn.textContent = isHSLMode ? "Перемкнути режим (HSL / CMYK)" : "Перемкнути режим (CMYK / HSL)";
});

// --- Модифікація яскравості (luminance) для пікселів, які належать до magenta ---
// Ми будемо шукати пікселі, де hue (у просторі HSL) близький до 300° (з допуском 15°)
applyModBtn.addEventListener("click", () => {
    if (!currentImageData) return alert("Спочатку завантажте зображення!");
    const modFactor = parseFloat(
        prompt("Введіть коефіцієнт зміни яскравості (наприклад, 0.8 для зниження або 1.2 для підвищення):", "1.0")
    );
    if (isNaN(modFactor)) return alert("Невірне значення!");
    // Створюємо копію поточних даних
    let newData = ctx.createImageData(currentImageData);
    for (let i = 0; i < currentImageData.data.length; i += 4) {
        let r = currentImageData.data[i];
        let g = currentImageData.data[i + 1];
        let b = currentImageData.data[i + 2];
        // Отримуємо HSL
        let [h, s, l] = rgbToHsl(r, g, b);
        // h у діапазоні [0,1] – перетворимо в градуси
        let hueDegrees = h * 360;
        // Якщо піксель знаходиться в межах magenta (приблизно 300° ±15°), застосуємо модифікацію яскравості
        if (Math.abs(hueDegrees - 300) <= 15) {
            l = Math.max(0, Math.min(1, l * modFactor));
            [r, g, b] = hslToRgb(h, s, l);
        }
        newData.data[i] = r;
        newData.data[i + 1] = g;
        newData.data[i + 2] = b;
        newData.data[i + 3] = currentImageData.data[i + 3];
    }
    currentImageData = newData;
    putImageData(currentImageData);
});

// --- Обчислення різниці між оригінальним та поточним зображенням ---
checkDiffBtn.addEventListener("click", () => {
    if (!originalImageData || !currentImageData) return alert("Завантажте зображення!");
    let diff = 0;
    for (let i = 0; i < originalImageData.data.length; i += 4) {
        let dr = Math.abs(originalImageData.data[i] - currentImageData.data[i]);
        let dg = Math.abs(originalImageData.data[i + 1] - currentImageData.data[i + 1]);
        let db = Math.abs(originalImageData.data[i + 2] - currentImageData.data[i + 2]);
        diff += (dr + dg + db) / 3;
    }
    let avgDiff = diff / (originalImageData.data.length / 4);
    let percentage = ((avgDiff / 255) * 100).toFixed(2);
    alert(`Середня різниця: ${avgDiff.toFixed(2)}\nВідсоток змін: ${percentage}%`);
});

// --- Збереження зображення ---
saveImgBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "modified_image.png";
    link.href = canvas.toDataURL();
    link.click();
});

// --- Відображення інформації про піксель під курсором ---
// При наведенні миші на полотно – показ значень кольору в просторах HSL та CMYK
canvas.addEventListener("mousemove", (e) => {
    if (!currentImageData) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    const index = (y * canvas.width + x) * 4;
    const r = currentImageData.data[index];
    const g = currentImageData.data[index + 1];
    const b = currentImageData.data[index + 2];

    // Обчислення HSL
    let [h, s, l] = rgbToHsl(r, g, b);
    // Перетворення h у градуси
    let hDeg = (h * 360).toFixed(0);
    pixelHSL.textContent = `HSL: [${hDeg}°, ${s.toFixed(2)}, ${l.toFixed(2)}]`;

    // Обчислення CMYK
    let [c, m, yk, k] = rgbToCmyk(r, g, b);
    pixelCMYK.textContent = `CMYK: [${c.toFixed(2)}, ${m.toFixed(2)}, ${yk.toFixed(2)}, ${k.toFixed(2)}]`;

    // Оновлюємо прев'ю кольору
    colorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
});
