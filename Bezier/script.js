// Налаштування канвасу та глобальних змінних
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.65;
canvas.height = window.innerHeight * 0.97;

const width = canvas.width;
const height = canvas.height;
const centerX = width / 2;
const centerY = height / 2;

// Обмеження зуму: мінімальний масштаб так, щоб по осі було не більше 200 поділок
const scaleFactor = 1.1;
const step = 10;
const minScale = centerX / 200;
const maxScale = 300 / step;
let scale = minScale;

let points = []; // контрольні точки
let movingPoint = null;
let isDragging = false;

// Поліноміальні коефіцієнти (для x та y) за матричним методом
let coefX = [];
let coefY = [];
let coefficientMatrix = [];

// --- Допоміжні функції ---
function binom(n, k) {
  if (k < 0 || k > n) return 0;
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res *= (n - i + 1) / i;
  }
  return res;
}

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
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.strokeStyle = "#fff";
  context.lineWidth = 1 / scale;
  context.stroke();

  context.beginPath();
  context.moveTo(x2, y2);
  context.lineTo(
    x2 - arrowLength * Math.cos(angle - Math.PI / 6),
    y2 - arrowLength * Math.sin(angle - Math.PI / 6)
  );
  context.lineTo(
    x2 - arrowLength * Math.cos(angle + Math.PI / 6),
    y2 - arrowLength * Math.sin(angle + Math.PI / 6)
  );
  context.closePath();
  context.fillStyle = "#fff";
  context.fill();
}

function drawAxes() {
  context.clearRect(0, 0, width, height);
  context.save();
  context.translate(centerX, centerY);
  context.scale(scale, scale);

  context.strokeStyle = "#0a1f1f";
  context.fillStyle = "#0a1f1f";
  context.lineWidth = 1 / scale;

  drawArrow(-centerX / scale, 0, centerX / scale, 0);
  drawArrow(0, centerY / scale, 0, -centerY / scale);

  context.font = `${12 / scale}px Arial`;
  context.fillText("X", (centerX - 20) / scale, -10 / scale);
  context.fillText("Y", 5 / scale, (-centerY + 20) / scale);

  for (let x = step; x < centerX / scale; x += step) {
    context.beginPath();
    context.moveTo(x, -5 / scale);
    context.lineTo(x, 5 / scale);
    context.stroke();
    context.fillText(x, x - 10 / scale, 15 / scale);

    context.beginPath();
    context.moveTo(-x, -5 / scale);
    context.lineTo(-x, 5 / scale);
    context.stroke();
    context.fillText(-x, -x - 15 / scale, 15 / scale);
  }
  for (let y = step; y < centerY / scale; y += step) {
    context.beginPath();
    context.moveTo(-5 / scale, -y);
    context.lineTo(5 / scale, -y);
    context.stroke();
    context.fillText(y, 10 / scale, -y + 5 / scale);

    context.beginPath();
    context.moveTo(-5 / scale, y);
    context.lineTo(5 / scale, y);
    context.stroke();
    context.fillText(-y, 10 / scale, y + 5 / scale);
  }
  context.restore();
  markZero();
}

function markZero() {
  context.save();
  context.translate(centerX, centerY);
  context.scale(scale, scale);
  context.beginPath();
  context.arc(0, 0, 5 / scale, 0, Math.PI * 2);
  context.fillStyle = "#0a1f1f";
  context.fill();
  context.font = `${10 / scale}px Arial`;
  context.fillText("0", 10 / scale, 10 / scale);
  context.restore();
}

// --- Обчислення матриці коефіцієнтів ---
function computeCoefficientMatrix() {
  const n = points.length - 1;
  let M = [];
  for (let p = 0; p <= n; p++) {
    M[p] = [];
    for (let i = 0; i <= n; i++) {
      if (p < i) {
        M[p][i] = 0;
      } else {
        M[p][i] = binom(n, i) * binom(n - i, p - i) * Math.pow(-1, p - i);
      }
    }
  }
  return M;
}

function updatePolynomialCoefficients() {
  if (points.length === 0) return;
  const n = points.length - 1;
  coefficientMatrix = computeCoefficientMatrix();
  coefX = [];
  coefY = [];
  for (let p = 0; p <= n; p++) {
    let sumX = 0,
      sumY = 0;
    for (let i = 0; i <= n; i++) {
      sumX += coefficientMatrix[p][i] * points[i].x;
      sumY += coefficientMatrix[p][i] * points[i].y;
    }
    coefX[p] = sumX;
    coefY[p] = sumY;
  }
  updateMatrixDisplay();
}

function updateMatrixDisplay() {
  const matrixDiv = document.getElementById("matrixBlock");
  let html = "<table>";
  for (let r = 0; r < coefficientMatrix.length; r++) {
    html += "<tr>";
    for (let c = 0; c < coefficientMatrix[r].length; c++) {
      html += `<td>${coefficientMatrix[r][c].toFixed(2)}</td>`;
    }
    html += "</tr>";
  }
  html += "</table>";
  matrixDiv.innerHTML = html;
}

// --- Обчислення точки на кривій ---
function computeCurvePoint(t) {
  if (points.length === 0) return null;
  const n = points.length - 1;
  let x = 0,
    y = 0;
  for (let p = 0; p <= n; p++) {
    x += coefX[p] * Math.pow(t, p);
    y += coefY[p] * Math.pow(t, p);
  }
  return { x, y };
}

// --- Малювання елементів ---
function drawControlPolygon() {
  if (points.length < 2) return;
  context.save();
  context.translate(centerX, centerY);
  context.scale(scale, scale);
  context.beginPath();
  context.strokeStyle = "orange";
  context.lineWidth = 1.5 / scale;
  context.moveTo(points[0].x, -points[0].y);
  for (let i = 1; i < points.length; i++) {
    context.lineTo(points[i].x, -points[i].y);
  }
  context.stroke();
  context.restore();
}

function drawControlPoints() {
  points.forEach((point, index) => {
    let cx = toCanvasX(point.x);
    let cy = toCanvasY(point.y);
    context.beginPath();
    context.arc(cx, cy, 5, 0, Math.PI * 2);
    context.fillStyle =
      index === 0 || index === points.length - 1 ? "green" : "red";
    context.fill();
    context.fillText(`P${index}`, cx + 10, cy - 10);
  });
}

function drawMatrixCurve() {
  if (points.length < 2) return;
  context.save();
  context.translate(centerX, centerY);
  context.scale(scale, scale);
  context.beginPath();
  context.strokeStyle = "lightblue";
  context.lineWidth = 3 / scale;
  let first = true;
  for (let t = 0; t <= 1; t += 0.01) {
    const pt = computeCurvePoint(t);
    if (!pt) continue;
    if (first) {
      context.moveTo(pt.x, -pt.y);
      first = false;
    } else {
      context.lineTo(pt.x, -pt.y);
    }
  }
  context.stroke();
  context.restore();
}

function drawScene() {
  drawAxes();
  drawControlPolygon();
  drawControlPoints();
  drawMatrixCurve();
}

// --- Жовті точки на кривій (відповідно до параметрів t) ---
function drawYellowCurvePoints() {
  drawScene();
  const tMin = parseFloat(document.getElementById("tMin").value);
  const tMax = parseFloat(document.getElementById("tMax").value);
  const tStep = parseFloat(document.getElementById("tStep").value);
  let pointsList = [];
  context.save();
  context.translate(centerX, centerY);
  context.scale(scale, scale);
  context.fillStyle = "yellow";
  for (let t = tMin; t <= tMax; t += tStep) {
    const pt = computeCurvePoint(t);
    if (pt) {
      context.beginPath();
      context.arc(pt.x, -pt.y, 3 / scale, 0, 2 * Math.PI);
      context.fill();
      pointsList.push(
        `t=${t.toFixed(2)}: (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`
      );
    }
  }
  context.restore();
  let html = "<ul>";
  pointsList.forEach((item) => {
    html += `<li>${item}</li>`;
  });
  html += "</ul>";
  document.getElementById("curvePoints").innerHTML = html;
}

// --- Вивід ненульових елементів матриці за номером рядка ---
function displayMatrixRow() {
  const row = parseInt(document.getElementById("matrixRow").value);
  if (!coefficientMatrix || row < 0 || row >= coefficientMatrix.length) {
    document.getElementById("matrixRowInfo").innerText =
      "Невірний номер рядка.";
    return;
  }
  let info = "";
  coefficientMatrix[row].forEach((val, col) => {
    if (Math.abs(val) > 1e-6) {
      info += `Стовпець ${col}: ${val.toFixed(2)}; `;
    }
  });
  document.getElementById("matrixRowInfo").innerText =
    info || "У рядку немає ненульових елементів.";
}

// --- Вивід контрольних точок P у текстовому вигляді ---
function showControlPoints() {
  if (points.length === 0) {
    document.getElementById("controlPointsList").innerHTML =
      "<p>Нема точок.</p>";
    return;
  }
  let html = "<ul>";
  points.forEach((point, index) => {
    html += `<li>P${index}: (${point.x.toFixed(2)}, ${point.y.toFixed(
      2
    )})</li>`;
  });
  html += "</ul>";
  document.getElementById("controlPointsList").innerHTML = html;
}

// --- Обробка подій канвасу ---
canvas.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let found = false;
    for (let point of points) {
      const px = toCanvasX(point.x);
      const py = toCanvasY(point.y);
      if (Math.hypot(px - x, py - y) < 10) {
        found = true;
        break;
      }
    }
    if (!found) {
      const newX = toAxisX(x);
      const newY = toAxisY(y);
      points.push({ x: newX, y: newY });
      updatePolynomialCoefficients();
      drawScene();
    }
  }
});
canvas.addEventListener("mousedown", (event) => {
  if (event.button === 2) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    for (let point of points) {
      const px = toCanvasX(point.x);
      const py = toCanvasY(point.y);
      if (Math.hypot(px - x, py - y) < 10) {
        movingPoint = point;
        isDragging = true;
        break;
      }
    }
  }
});
canvas.addEventListener("mousemove", (event) => {
  if (!isDragging || !movingPoint) return;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  movingPoint.x = toAxisX(x);
  movingPoint.y = toAxisY(y);
  updatePolynomialCoefficients();
  drawScene();
});
canvas.addEventListener("mouseup", (event) => {
  if (event.button === 2 && isDragging) {
    movingPoint = null;
    isDragging = false;
  }
});
canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  if (event.deltaY > 0) {
    scale /= scaleFactor;
  } else {
    scale *= scaleFactor;
  }
  if (scale < minScale) scale = minScale;
  if (scale > maxScale) scale = maxScale;
  drawScene();
});

function clearCanvas() {
  points = [];
  coefficientMatrix = [];
  coefX = [];
  coefY = [];
  document.getElementById("matrixBlock").innerHTML = "";
  document.getElementById("curvePoints").innerHTML = "";
  document.getElementById("matrixRowInfo").innerText = "";
  document.getElementById("controlPointsList").innerHTML = "";
  drawScene();
}

drawScene();
