class Rectangle {
	constructor(x1, y1, x2, y2) {
		 this.x1 = x1;
		 this.y1 = y1;
		 this.x2 = x2;
		 this.y2 = y2;
		 this.diagonalColor = null;      // Колір діагоналі
		 this.triangleColor1 = null;     // Колір першого трикутника
		 this.triangleColor2 = null;     // Колір другого трикутника
		 this.hasCircle = false;         // Чи є описане коло
	}
}

var arrayRectangles = [];