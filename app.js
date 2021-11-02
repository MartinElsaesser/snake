// [
// 	[0,0,0,x,0],
// 	[0,d,r,d,0],
// 	[0,d,u,d,0],
// 	[0,r,u,d,0],
// 	[0,0,0,d,0]
// ]

function resize(canvas) {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

class Grid {
	constructor(canvas) {
		this.canvas = canvas;
		this.squareSize = 50;
		this.apple = {}
		this.widthSquares = 0;
		this.heightSquares = 0;
	}
	paint(ctx) {
		this.widthSquares = Math.round(this.canvas.width / this.squareSize) + 1;
		this.heightSquares = Math.round(this.canvas.height / this.squareSize) + 1;

		if (!this.apple.gridX) {
			let gridX = randInt(0, this.widthSquares - 1);
			let gridY = randInt(0, this.heightSquares - 1);
			this.apple = {
				gridX,
				gridY,
				x: gridX * this.squareSize,
				y: gridY * this.squareSize,
			}
		}

		ctx.save();
		for (var heightCount = 0; heightCount < this.heightSquares; heightCount++) {
			for (var widthCount = 0; widthCount < this.widthSquares; widthCount++) {
				if (this.apple.gridX === widthCount && this.apple.gridY === heightCount) {
					ctx.fillStyle = "red";
				} else {
					ctx.fillStyle = "#000";
				}
				ctx.fillRect(this.squareSize * widthCount, this.squareSize * heightCount, this.squareSize, this.squareSize);
			}
		}
		ctx.restore();
	}
	setNewApple() {
		let gridX = randInt(0, this.widthSquares - 1);
		let gridY = randInt(0, this.heightSquares - 1);
		this.apple = {
			gridX,
			gridY,
			x: gridX * this.squareSize,
			y: gridY * this.squareSize,
		}
	}
}

class Display {
	constructor(canvas) {
		this.canvas = canvas;
		this.score = 0;
	}
	paint(ctx) {
		ctx.save();
		ctx.fillStyle = 'white';
		ctx.font = '40px sans-serif';
		ctx.fillText(`Score: ${this.score}`, 10, 50);
		ctx.restore();
	}
	increaseScore() {
		this.score++;
	}
	reset() {
		this.score = 0;
	}
}


function minmax(num, min, max) {
	const MIN = min;
	const MAX = max;
	return Math.min(Math.max(num, MIN), MAX)
}

function randInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ctg(x) { return 1 / Math.tan(x); }

class Snake {
	constructor(startPos, canvas) {
		this.canvas = canvas;
		this.travelledDistance = 0;
		this.squareSize = 50;
		this.tailLength = 5;
		this.tail = [];
		this.headPos = startPos;
		this.headDirection = [
			{ speedX: -1, speedY: 0, type: "left" }
		];
		this.color = "#2ce82f";
		this.gameEnd = false;
	}
	paint(ctx) {
		if (this.gameEnd) return false;
		let direction = this.headDirection[0];
		let queuedDirections = this.headDirection.length > 1;
		let xDistance = direction.speedX;
		let yDistance = direction.speedY;

		this.headPos.x += xDistance;
		this.headPos.y += yDistance;
		this.travelledDistance += (Math.abs(xDistance) + Math.abs(yDistance));


		// check if head is over grid cell --> move to next direction
		let distanceToGridCellX = this.headPos.x % this.squareSize
		let distanceToGridCellY = this.headPos.y % this.squareSize
		let isOverGridCell = distanceToGridCellX === 0 && distanceToGridCellY === 0;
		if (isOverGridCell && queuedDirections) {
			this.headDirection.shift();
		}


		// check for wrapping
		if (this.headPos.x > this.canvas.width) {
			this.headPos.x = -this.squareSize;
		} else if (this.headPos.x + this.squareSize < 0) {
			this.headPos.x = this.canvas.width;
		}
		if (this.headPos.y > this.canvas.height) {
			this.headPos.y = -this.squareSize;
		} else if (this.headPos.y + this.squareSize < 0) {
			this.headPos.y = this.canvas.height; // if screen is e.g. 682 px is Over grid check does not work
		}

		// handle tail movement
		this.tail.unshift({ x: this.headPos.x, y: this.headPos.y });

		while (this.travelledDistance > this.tailLength * this.squareSize) {
			this.tail.pop();
			this.travelledDistance -= 1;
		}

		// head
		ctx.save();
		ctx.fillStyle = this.color;
		// render
		ctx.fillRect(this.headPos.x, this.headPos.y, this.squareSize, this.squareSize);
		ctx.restore();

		// tail
		ctx.save();
		ctx.fillStyle = this.color;
		//render
		for (var i = 0; i < this.tail.length; i++) {
			let squ = this.tail[i]
			ctx.fillRect(squ.x, squ.y, this.squareSize, this.squareSize);
		}
		ctx.restore();

		const data = { x: this.headPos.x, y: this.headPos.y, squareSize: this.squareSize };
		const snakeMovedEvent = new CustomEvent('snake-moved', { detail: data });
		document.dispatchEvent(snakeMovedEvent);

		// check for game end

		for (var i = 5; i < this.tail.length; i++) {
			let tail = this.tail[i];
			let xDifference = Math.abs(Math.round(tail.x - this.headPos.x));
			let yDifference = Math.abs(Math.round(tail.y - this.headPos.y));
			if (xDifference === 0 && yDifference === 0) {
				this.gameEnd = true;
				const snakeDiedEvent = new CustomEvent('snake-died', { detail: data });
				document.dispatchEvent(snakeDiedEvent);
				return false;
			}
		}
		return true;
	}
	move(direction) {
		let opposites = {
			"right": "left",
			"left": "right",
			"up": "down",
			"down": "up",
		}
		let lastDirection = this.headDirection[this.headDirection.length - 1];
		if (opposites[direction] !== lastDirection.type && lastDirection !== direction) {
			let speedX = 0, speedY = 0;
			switch (direction) {
				case "right":
					speedX = 1;
					break;
				case "left":
					speedX = -1;
					break;
				case "up":
					speedY = -1;
					break;
				case "down":
					speedY = 1;
			}
			this.headDirection.push({ speedX, speedY, type: direction });
		}
	}
	grow() {
		this.tailLength += 1;
	}
	reset() {
		this.tailLength = 5;
		this.tail = [];
		this.gameEnd = false;
		this.travelledDistance = 0;
	}
}


let initDraw = function (canvas) {
	// https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
	let isRunning = false;
	let ctx = canvas.getContext("2d");
	let shapes = [];


	function update() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (var i = 0; i < shapes.length; i++) {
			shapes[i].paint(ctx, 10);
		}
		if (isRunning) requestAnimationFrame(update);
	}

	function start() {
		isRunning = true;
		requestAnimationFrame(update);
	}

	function stop() {
		isRunning = false;
	}

	function addShape(shape) {
		shapes.push(shape);
	}

	return {
		start,
		stop,
		addShape
	}
};


(function main() {
	const canvas = document.querySelector("canvas");
	const restartMenu = document.querySelector("#restart");
	const pauseMenu = document.querySelector("#pause");
	const restartButton = document.querySelector("#restart button");
	const resumeButton = document.querySelector("#pause button");
	let draw = initDraw(canvas);

	const grid = new Grid(canvas);
	const snake = new Snake({ x: 500, y: 100 }, canvas);
	const display = new Display();

	draw.addShape(grid);
	draw.addShape(snake);
	draw.addShape(display);
	draw.start();

	document.addEventListener("snake-moved", (e) => {
		let xDifference = Math.abs(Math.round(e.detail.x - grid.apple.x));
		let yDifference = Math.abs(Math.round(e.detail.y - grid.apple.y));
		if (xDifference <= 5 && yDifference <= 5) {
			grid.setNewApple();
			snake.grow();
			display.increaseScore();
		}
	});

	document.addEventListener("snake-died", (e) => {
		restartMenu.classList.remove("hidden");
	});

	console.log(restartButton);
	restartButton.addEventListener("click", () => {
		restartMenu.classList.add("hidden");
		display.reset();
		snake.reset();
	});

	resumeButton.addEventListener("click", () => {
		pauseMenu.classList.add("hidden");
		draw.start();
	});

	window.addEventListener("keydown", e => {
		switch (e.key) {
			case "w":
				snake.move("up");
				break;
			case "s":
				snake.move("down")
				break;
			case "a":
				snake.move("left")
				break;
			case "d":
				snake.move("right")
				break;
			case "Escape":
				draw.stop();
				pauseMenu.classList.remove("hidden");
		}
	})


	let resizeCanvas = resize.bind(this, canvas);
	resizeCanvas();
	window.addEventListener("resize", resizeCanvas);
})();




