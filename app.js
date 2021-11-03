function minmax(num, min, max) {
	const MIN = min;
	const MAX = max;
	return Math.min(Math.max(num, MIN), MAX)
}
function randInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Grid {
	constructor(canvas) {
		this.canvas = canvas;
		this.squareSize = 50;
		this.apple = {}
		this.widthSquares = 0;
		this.heightSquares = 0;
		this.gameEnd = false;
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
				} else if (this.gameEnd) {
					ctx.fillStyle = "#2e1d1d";
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
		this.gameEnd = false;
		this.paused = false;
	}
	paint(ctx) {
		ctx.save();
		ctx.fillStyle = 'white';
		ctx.font = '32px sans-serif';
		ctx.fillText(`Score: ${this.score}`, 10, 50);
		ctx.restore();
		ctx.save();
		if (this.gameEnd) {
			let textSize = this.canvas.width / 10;
			ctx.fillStyle = 'white';
			ctx.font = `${textSize}px sans-serif`;
			ctx.textAlign = "center";
			ctx.fillText(`YOU LOST`, this.canvas.width / 2, this.canvas.height / 2 + textSize / 2);
		} else if (this.paused) {
			let textSize = this.canvas.width / 10;
			ctx.fillStyle = 'white';
			ctx.font = `${textSize}px sans-serif`;
			ctx.textAlign = "center";
			ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2 + textSize / 2);
		}
		ctx.restore();
	}
	increaseScore() {
		this.score++;
	}
	reset() {
		this.score = 0;
	}
	pause() {
		this.paused = true;
	}
	resume() {
		this.paused = false;
	}
}
class Snake {
	constructor(canvas) {
		this.canvas = canvas;
		this.travelledDistance = 0;
		this.squareSize = 50;
		this.tailLength = 5;
		this.tail = [];
		this.headPos = {}
		this.genSnakePos();
		this.headDirection = [
			{ speedX: -1, speedY: 0, type: "left" }
		];
		this.color = "#2ce82f";
		this.gameEnd = false;
		this.paused = false;
	}
	genSnakePos() {
		let widthSquares = Math.floor(window.innerWidth / this.squareSize);
		let heightSquares = Math.floor(window.innerHeight / this.squareSize);
		let x = randInt(0, widthSquares) * this.squareSize;
		let y = randInt(0, heightSquares) * this.squareSize;
		this.headPos.x = x
		this.headPos.y = y;
	}
	paint(ctx) {
		let direction = this.headDirection[0];
		let queuedDirections = this.headDirection.length > 1;
		let xDistance = direction.speedX;
		let yDistance = direction.speedY;

		if (!this.gameEnd && !this.paused) {
			this.headPos.x += xDistance;
			this.headPos.y += yDistance;
			this.travelledDistance += (Math.abs(xDistance) + Math.abs(yDistance));
		}


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
			if (xDifference === 0 && yDifference === 0 && !this.paused && !this.gameEnd) {
				this.gameEnd = true;
				const snakeDiedEvent = new CustomEvent('snake-died', { detail: data });
				document.dispatchEvent(snakeDiedEvent);
			}
		}
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
		console.log(this.tailLength);
	}
	reset() {
		this.tailLength = 5;
		this.tail = [];
		this.gameEnd = false;
		this.travelledDistance = 0;
		this.genSnakePos();
	}
	pause() {
		this.paused = true;
	}
	resume() {
		this.paused = false;
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

function handleGesture(selector) {
	let pageWidth = window.innerWidth || document.body.clientWidth;
	let treshold = Math.max(1, Math.floor(0.01 * (pageWidth)));
	let touchstartX = 0;
	let touchstartY = 0;
	let touchendX = 0;
	let touchendY = 0;

	const limit = Math.tan(45 * 1.5 / 180 * Math.PI);
	const targetElem = document.querySelector(selector);

	targetElem.addEventListener('touchstart', function (event) {
		touchstartX = event.changedTouches[0].screenX;
		touchstartY = event.changedTouches[0].screenY;
	}, false);

	targetElem.addEventListener('touchend', function (event) {
		touchendX = event.changedTouches[0].screenX;
		touchendY = event.changedTouches[0].screenY;
		handleGesture(event);
	}, false);

	function handleGesture(e) {
		let x = touchendX - touchstartX;
		let y = touchendY - touchstartY;
		let xy = Math.abs(x / y);
		let yx = Math.abs(y / x);
		if (Math.abs(x) > treshold || Math.abs(y) > treshold) {
			let swipeDirection = "";
			if (yx <= limit) {
				if (x < 0) {
					swipeDirection = "left";
				} else {
					swipeDirection = "right";
				}
			}
			if (xy <= limit) {
				if (y < 0) {
					swipeDirection = "up";
				} else {
					swipeDirection = "down";
				}
			}
			const event = new CustomEvent("swipe", {
				detail: { swipeDirection }
			});
			targetElem.dispatchEvent(event);
		} else {
			const event = new CustomEvent("tap", { detail: { x: touchendX, y: touchendY } });
			targetElem.dispatchEvent(event);
		}
	}
}


(function main() {
	const canvas = document.querySelector("canvas");
	const pauseButton = document.querySelector("button#pause");
	handleGesture("canvas");
	let draw = initDraw(canvas);

	const grid = new Grid(canvas);
	const snake = new Snake(canvas);
	const display = new Display(canvas);

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
		pauseButton.className = "ended";
		pauseButton.innerHTML = "&#9654;";
		grid.gameEnd = true;
		display.gameEnd = true;
	});


	pauseButton.addEventListener("click", () => {
		if (pauseButton.className === "paused") {
			resumeGame();
		} else if (pauseButton.className === "") {
			pauseGame();
		} else if (pauseButton.className === "ended") {
			restartGame();
		}
	})

	canvas.addEventListener("swipe", (e) => {
		snake.move(e.detail.swipeDirection)
	});

	window.addEventListener("keydown", e => {
		switch (e.key) {
			case "ArrowUp":
			case "w":
				snake.move("up");
				break;
			case "ArrowDown":
			case "s":
				snake.move("down");
				break;
			case "ArrowLeft":
			case "a":
				snake.move("left");
				break;
			case "ArrowRight":
			case "d":
				snake.move("right");
				break;
			case "Escape":
				pauseGame();
		}
	});

	function pauseGame() {
		pauseButton.className = "paused";
		pauseButton.innerHTML = "&#9654;";
		snake.pause();
		display.pause();
	}
	function resumeGame() {
		pauseButton.className = "";
		pauseButton.innerHTML = "&#10074;&#10074;";
		snake.resume();
		display.resume();
	}
	function restartGame() {
		pauseButton.className = "";
		pauseButton.innerHTML = "&#10074;&#10074;";
		display.reset();
		snake.reset();
		grid.gameEnd = false;
		display.gameEnd = false;
	}

	function resize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	resize();
	window.addEventListener("resize", () => {
		resize();
		resumeGame();
		restartGame();
	});
})();




