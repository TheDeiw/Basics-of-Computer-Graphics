const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;
const step = 20;
const width = canvas.clientWidth;
const height = canvas.clientHeight;
const x0 = width / 2;
const y0 = height / 2;

let scaleFactor = 1;
const scaleStep = 0.2;

function initCanvas() {
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
}

function drawCoordinateSystem() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const x0 = width / 2;
    const y0 = height / 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawGrid(width, height, x0, y0);
    drawAxes(width, height, x0, y0);
    drawLabels(width, height, x0, y0);
}

function drawGrid(width, height, x0, y0) {
    ctx.strokeStyle = "#29372f";
    ctx.lineWidth = 1;
    
    const scaledStep = step * scaleFactor;
    for (let x = x0; x < width; x += scaledStep) drawLine(x, 0, x, height);
    for (let x = x0; x > 0; x -= scaledStep) drawLine(x, 0, x, height);
    for (let y = y0; y < height; y += scaledStep) drawLine(0, y, width, y);
    for (let y = y0; y > 0; y -= scaledStep) drawLine(0, y, width, y);
}

function drawAxes(width, height, x0, y0) {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    drawArrow(x0, height, x0, 0); // Y-axis
    drawArrow(0, y0, width, y0);  // X-axis
}

function drawLabels(width, height, x0, y0) {
    ctx.fillStyle = "white";
    ctx.font = "15px Arial";
    ctx.fillText("X", width - 20, y0 + 15);
    ctx.fillText("Y", x0 - 18, 15);
    ctx.fillText("0", x0 - 15, y0 + 15);
    
    ctx.font = "10px Arial";
    const scaledStep = step * scaleFactor;
    for (let x = x0 + scaledStep; x < width; x += scaledStep) {
        let label = Math.floor(((x - x0) / scaledStep));
        ctx.fillText(label, x - 8, y0 - 5);
    }
    for (let x = x0 - scaledStep; x > 0; x -= scaledStep) {
        let label = Math.floor(((x - x0) / scaledStep));
        ctx.fillText(label, x - 8, y0 - 5);
    }
    for (let y = y0 - scaledStep; y > 0; y -= scaledStep) {
        let label = Math.floor(((y0 - y) / scaledStep));
        ctx.fillText(label, x0 + 5, y + 5);
    }
    for (let y = y0 + scaledStep; y < height; y += scaledStep) {
        let label = Math.floor(((y0 - y) / scaledStep));
        ctx.fillText(label, x0 + 5, y + 5);
    }
}

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawArrow(fromX, fromY, toX, toY) {
    const headLength = 12;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    drawLine(fromX, fromY, toX, toY);
    drawLine(toX, toY, toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    drawLine(toX, toY, toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
}

initCanvas();
drawCoordinateSystem();

// Функції масштабування
function zoomIn() {
    scaleFactor += scaleStep;
    updateGraph();
}

function zoomOut() {
    if (scaleFactor > scaleStep) {
        scaleFactor -= scaleStep;
        updateGraph();
    }
}

// Оновлення графіку
function updateGraph() {
    drawCoordinateSystem();
    redrawAllRectangles();
}

function redrawAllRectangles() {
    arrayRectangles.forEach(rect => {
        drawRectangleOnCanvas(rect);
        if (rect.diagonalColor) drawDiagonalOnCanvas(rect);
        if (rect.hasCircle) drawCircleOnCanvas(rect);
    });
}

function drawRectangleOnCanvas(rect) {
    let canvasX1 = x0 + rect.x1 * step * scaleFactor;
    let canvasY1 = y0 - rect.y1 * step * scaleFactor;
    let canvasX2 = x0 + rect.x2 * step * scaleFactor;
    let canvasY2 = y0 - rect.y2 * step * scaleFactor;

    let width = canvasX2 - canvasX1;
    let height = canvasY2 - canvasY1;

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(canvasX1, canvasY1, width, height);
}

function drawDiagonalOnCanvas(rect) {
    let x1Canvas = x0 + rect.x1 * step * scaleFactor;
    let y1Canvas = y0 - rect.y1 * step * scaleFactor;
    let x2Canvas = x0 + rect.x2 * step * scaleFactor;
    let y2Canvas = y0 - rect.y2 * step * scaleFactor;

    ctx.beginPath();
    ctx.moveTo(x1Canvas, y1Canvas);
    ctx.lineTo(x2Canvas, y2Canvas);
    ctx.strokeStyle = rect.diagonalColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = rect.triangleColor1;
    ctx.beginPath();
    ctx.moveTo(x1Canvas, y1Canvas);
    ctx.lineTo(x1Canvas, y2Canvas);
    ctx.lineTo(x2Canvas, y2Canvas);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rect.triangleColor2;
    ctx.beginPath();
    ctx.moveTo(x1Canvas, y1Canvas);
    ctx.lineTo(x2Canvas, y1Canvas);
    ctx.lineTo(x2Canvas, y2Canvas);
    ctx.closePath();
    ctx.fill();
}

function drawCircleOnCanvas(rect) {
    let x1Canvas = x0 + rect.x1 * step * scaleFactor;
    let y1Canvas = y0 - rect.y1 * step * scaleFactor;
    let x2Canvas = x0 + rect.x2 * step * scaleFactor;
    let y2Canvas = y0 - rect.y2 * step * scaleFactor;

    let centerX = (x1Canvas + x2Canvas) / 2;
    let centerY = (y1Canvas + y2Canvas) / 2;
    let radius = Math.sqrt(Math.pow(x2Canvas - x1Canvas, 2) + Math.pow(y2Canvas - y1Canvas, 2)) / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Оновлені функції малювання
function drawRectangle() {
    let x1 = parseFloat(document.getElementById("x1").value);
    let y1 = parseFloat(document.getElementById("y1").value);
    let x2 = parseFloat(document.getElementById("x2").value);
    let y2 = parseFloat(document.getElementById("y2").value);

    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
        alert("Будь ласка, введіть координати.");
        return;
    }

    // if (x1 > 0 || x2 > 0 || y1 < 0 || y2 < 0) {
    //     alert("Координати мають бути у другій системі координат.");
    //     return;
    // }

    let rect = new Rectangle(x1, y1, x2, y2);
    if (isRectangleInArray(rect)) {
        alert("Такий прямокутник вже існує");
        return;
    }
    
    arrayRectangles.push(rect);
    showRectangles();
    updateGraph();
}

function drawDiagonal() {
    let rect = getActiveRectangle();
    if (!rect) return;

    let selectedRect = arrayRectangles.find(r => 
        r.x1 === rect.x1 && r.y1 === rect.y1 && r.x2 === rect.x2 && r.y2 === rect.y2
    );
    if (!selectedRect) return;

    let color = document.getElementById("color").value;
    selectedRect.diagonalColor = color;
    selectedRect.triangleColor1 = getRandomColor();
    selectedRect.triangleColor2 = getRandomColor();
    updateGraph();
}


function drawCircle() {
    let rect = getActiveRectangle();
    if (!rect) return;

    let selectedRect = arrayRectangles.find(r => 
        r.x1 === rect.x1 && r.y1 === rect.y1 && r.x2 === rect.x2 && r.y2 === rect.y2
    );
    if (!selectedRect) return;

    selectedRect.hasCircle = true;
    updateGraph();
}

// Очищення полотна
function clearCanvas() {
    arrayRectangles = [];
    showRectangles();
    drawCoordinateSystem();
}

function showRectangles() {
    document.querySelector('.dataBlock').innerHTML = ""; 
    let i = 1;
    arrayRectangles.forEach(element => {
        let p = document.createElement("p");
        p.innerHTML = "Прямокутник " + i + ": (" + element.x1 + "; " + element.y1 + "), (" + element.x2 + "; " + element.y2 + ")";
        i++;
        p.addEventListener('click', function() {
            let allPs = document.querySelector('.dataBlock').querySelectorAll('p');
            allPs.forEach(p => p.classList.remove('active'));
            p.classList.add('active');
        });
        document.querySelector('.dataBlock').appendChild(p);
    });
}

function isRectangleInArray(newRect) {
    return arrayRectangles.some(rect => 
        rect.x1 === newRect.x1 && rect.y1 === newRect.y1 && rect.x2 === newRect.x2 && rect.y2 === newRect.y2
    );
}

function getActiveRectangle() {
    let activeElement = document.querySelector(".dataBlock p.active");
    if (!activeElement) return null;
    let coordsText = activeElement.innerHTML.split(": ")[1];
    let coords = coordsText.match(/-?\d+/g).map(Number);
    if (coords.length === 4) {
        return { x1: coords[0], y1: coords[1], x2: coords[2], y2: coords[3] };
    }
    return null;
}

function getRandomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}