var main = document.getElementsByClassName("main")[0];
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var counters = document.getElementsByClassName("counters")[0].getElementsByTagName("span");
var buttons = document.getElementsByClassName("menu")[0].getElementsByTagName("button");

const ROBOTS_COUNT = 20;
const ROBOT_FILL_COLOR = "#e8bc45";
const ROBOT_BORDER_COLOR = "#382d12";
const REFRESH_SPEED = 50;
const LOADED_REFRESH_SPEED = 100;

var robots = new Array(ROBOTS_COUNT);
var gridSwitch = true;


//Main method that starts the simulation
window.onload = () => {
	reset();
	initiateRobots();
	drawRobots();
}

//Initiates the robot objects and their specifications
function initiateRobots() {
	for (var i = robots.length - 1; i >= 0; i--) {
		robots[i] = {
			homeX: i*50,
			homeY: 750,
			prevX: -1,
			prevY: -1,
			goalX: 0,
			goalY: 0,
			goalRow: null,
			goalCol: null,
			x: i*50,
			y: 0,
			verticalDirection: null,
			horizontalDirection: null,
			loading: false,
			broken: null,
			collisionTargetIsLoading: false,
			speed: 50,
			fillColor: ROBOT_FILL_COLOR,
			borderColor: ROBOT_BORDER_COLOR

		}
	}
}

//Draws the squares for the robots on the canvas
function drawRobots() {
	context.beginPath();

	for (var i = robots.length - 1; i >= 0; i--) {
		context.fillStyle = robots[i].fillColor;
		context.strokeStyle = robots[i].borderColor;
		context.fillRect(robots[i].x, robots[i].y, 50, 50);
		context.strokeRect(robots[i].x, robots[i].y, 50, 50);
	}
}

//Clears the screen and draws the grid pattern when it's toggled on
function reset() {
	context.clearRect(0, 0, canvas.width, canvas.height);
	if (gridSwitch) {
		for (var i = 20; i >= 0; i--) {
			context.strokeStyle = "black";
			//Vertical lines
			context.moveTo(50*i, 0);
			context.lineTo(50*i, 850);
			context.stroke();

			//Horizontal lines
			context.moveTo(0, 50*i);
			context.lineTo(1000, 50*i);
			context.stroke();
		}
	}
}

//Executes the call robot function for all of the robots
function callAllRobots() {
	for (var i = buttons.length - 1; i >= 0; i--) {
		callRobot(i, buttons[i]);
	}
}

//Calls a robot to move towards its home station
//If the robot breaks, this function also repairs the broken robot
//If the robot has been called once and isn't broken, this function does nothing
function callRobot(index, button) {
	if (robots[index].broken == null) {
		robots[index].goalX = robots[index].homeX;
		robots[index].goalY = robots[index].homeY;

		moveRobotTo(index, button, LOADED_REFRESH_SPEED);
	} else if (!robots[index].broken) {
		//If the robot is working fine - do nothing
	} else if (robots[index].broken) {
		robots[index].broken = false;
	}
}

//Generates goal coordinates for the robot via random numbers and assigns a random color to both the robot and its home station
function createOrder(index, button) {
	let randomColor = "rgb(" + randomNumberGenerator(100, 255) + "," + randomNumberGenerator(100, 255) + "," + randomNumberGenerator(100, 255) + ")"
	robots[index].fillColor = randomColor;
	button.style.backgroundColor = randomColor;
	button.style.color = "black";

	let orderCol = randomNumberGenerator(0, 1);
	let orderRow = randomNumberGenerator(0, 15);
	let goal = document.getElementsByClassName("goals")[orderCol].getElementsByTagName("span")[orderRow];
	button.innerHTML = goal.innerHTML;

	robots[index].goalX = orderCol === 1 ? 950 : 0;
	robots[index].goalY = 50 * orderRow;
	robots[index].goalRow = orderRow;
	robots[index].goalCol = orderCol;
}

//Lets the robot unload the carried package and resets its color as well as the home station's color once the loading bar is full
function executeOrder(index, button) {
	let orderProgressBar = document.getElementsByClassName("goals")[robots[index].goalCol].getElementsByTagName("progress")[robots[index].goalRow];

	if (orderProgressBar.value != orderProgressBar.max) {
		orderProgressBar.value += 10;
		robots[index].loading = true;
	} else {
		robots[index].fillColor = ROBOT_FILL_COLOR;
		button.style.backgroundColor = "white";
		counters[index].innerHTML = parseInt(counters[index].innerHTML) + 1;
		robots[index].goalX = robots[index].homeX;
		robots[index].goalY = robots[index].homeY;
		orderProgressBar.value = 0;
		robots[index].loading = false;
	}
}

//Main loop of the simulation
//Tries to break the robot at first
//Then moves the robot with a different speed depending on its target destination
//Draws everything every X milliseconds
function moveRobotTo(index, button, speed) {
	robots[index].broken = robots[index].broken ? true : breakRobot();
	let coordinates = null;
	robots[index].verticalDirection = robots[index].y < robots[index].goalY ? 1 : robots[index].y > robots[index].goalY ? -1 : 0;
	robots[index].horizontalDirection = robots[index].x < robots[index].goalX ? 1 : robots[index].x > robots[index].goalX ? -1 : 0;
	setTimeout(() => {
		//Check if the robot is going home
		if (robots[index].goalX == robots[index].homeX && robots[index].goalY == robots[index].homeY) {
			speed = REFRESH_SPEED;
			coordinates = randomNumberGenerator(0, 1) == 1 ? moveVertically(index, button, speed) : moveHorizontally(index, button, speed);
			robots[index].x = robots[index].broken ? robots[index].x : coordinates.x;
			robots[index].y = robots[index].broken ? robots[index].y : coordinates.y;
			robots[index].borderColor = robots[index].broken ? "red" : ROBOT_BORDER_COLOR;
			button.style.borderColor = robots[index].broken ? "red" : ROBOT_BORDER_COLOR;
		//The robot isn't going home, move it to its order destination
		} else {
			speed = LOADED_REFRESH_SPEED;
			coordinates = randomNumberGenerator(0, 1) == 1 ? moveVertically(index, button, speed) : moveHorizontally(index, button, speed);
			robots[index].x = robots[index].broken ? robots[index].x : coordinates.x;
			robots[index].y = robots[index].broken ? robots[index].y : coordinates.y;
			robots[index].borderColor = robots[index].broken ? "red" : ROBOT_BORDER_COLOR;
			button.style.borderColor = robots[index].broken ? "red" : ROBOT_BORDER_COLOR;
		}
		reset();
		drawRobots();
		compareCounters(index);
		moveRobotTo(index, button, speed);
	}, speed);
}

//Carries out the horizontal movement of the robot
function moveHorizontally(index, button) {
	let tempY = robots[index].y;
	let tempX = robots[index].x;
	//While it hasn't arrived, move it on the X axis
	if (robots[index].x != robots[index].goalX) {
		//Attempt to move in either direction horizontally
		tempX = tempX + (robots[index].speed * robots[index].horizontalDirection);
		//Check if moving will result in collision with another robot on the X axis and if it does...
		if (checkCollision(index, tempX, tempY)) {
			//Stay on the same square on the X axis
			tempX = tempX - (robots[index].speed * robots[index].horizontalDirection);
			//If you are colliding with a robot that is currently loading, wait until it is done
			if (robots[index].collisionTargetIsLoading) {
				tempX = tempX;
			} else {
				tempY = tempY - robots[index].speed;
				if (checkCollision(index, tempX, tempY)) {
					tempY = tempY + 2*robots[index].speed;
					if (checkCollision(index, tempX, tempY)) {
						tempY = tempY - robots[index].speed;
					}
				}
			}
		}
	} else if (robots[index].y != robots[index].goalY) {
		return moveVertically(index, button);
	} else if (robots[index].goalX == robots[index].homeX && robots[index].goalY == robots[index].homeY) {
		createOrder(index, button);
	} else {
		executeOrder(index, button);
	}
	return {x: tempX, y: tempY};
}

//Carries out the horizontal movement of the robot
function moveVertically(index, button) {
	let tempY = robots[index].y;
	let tempX = robots[index].x;
	robots[index].verticalDirection = robots[index].y < robots[index].goalY ? 1 : robots[index].y > robots[index].goalY ? -1 : 0;
	robots[index].horizontalDirection = robots[index].x < robots[index].goalX ? 1 : robots[index].x > robots[index].goalX ? -1 : 0;
	//While it hasn't arrived, move it on the Y axis
 	if (robots[index].y != robots[index].goalY) {
		//Attempt to move in either direction vertically
		tempY = tempY + (robots[index].speed * robots[index].verticalDirection);
		//Check if the robot is colliding with a wall or with another robot and if it is...
		if (checkCollision(index, tempX, tempY)) {
			//Stay on the same sqaure on the Y axis
			tempY = tempY - (robots[index].speed * robots[index].verticalDirection);
			//If you are colliding with a robot that is currently loading, wait until it is done
			if (robots[index].collisionTargetIsLoading) {
				tempY = tempY;
			} else {
				tempX = tempX - robots[index].speed;
				if (checkCollision(index, tempX, tempY)) {
					tempX = tempX + 2*robots[index].speed;
					if (checkCollision(index, tempX, tempY)) {
						tempX = tempX - robots[index].speed;
					}
				}
			}
		}
	} else if (robots[index].x != robots[index].goalX) {
		return moveHorizontally(index, button);
	} else if (robots[index].goalX == robots[index].homeX && robots[index].goalY == robots[index].homeY) {
		createOrder(index, button);
	} else {
		executeOrder(index, button);
	}
	return {x: tempX, y: tempY};
}

//Checks if the robot will collide with either a wall or another robot and return a boolean value
function checkCollision(index, x, y) {
	//Check if robot is out of bounds
	if (y > 750 ||
		y < 0 ||
		x > 950 ||
		x < 0) {
		return true;

	//Check if robot is colliding with another robot
	} else {
		robots[index].collisionTargetIsLoading = false;
		for (var i = robots.length - 1; i >= 0; i--) {
			if (index != i && robots[i].x == x && robots[i].y == y) {
				if (robots[i].loading) {
					robots[index].collisionTargetIsLoading = true;
				}
				return true;
			}
		}	
	}

	//No collision
	return false;
}

//A function that returns a randomly generated boolean, which determines if a robot will break
function breakRobot(){
	if (randomNumberGenerator(0, 1000000) == 79) {
		return true;
	} else {
		return false;
	}
}

//Used to determine which of the robots currently has the most orders completed and colors its deliveries counter green
function compareCounters(index) {
	let highest = index;
	for (let i = counters.length - 1; i >= 0; i--) {
		if (parseInt(counters[index].innerHTML) < parseInt(counters[i].innerHTML)) {
			highest = i;
		}

		if (i === 0 && highest === index) {
			counters[index].style.backgroundColor = "rgb(137, 173, 74)";
		} else {
			counters[index].style.backgroundColor = "transparent";
		}
	}
}

//Generates a random number between min and max
function randomNumberGenerator(min, max) {return Math.floor(Math.random() * (max - min + 1) ) + min;}

//Toggles the grid of the board
function toggleGrid() {
	gridSwitch = !gridSwitch;
	reset();
	drawRobots();
}

//https://i.imgur.com/MwQiJ5K.gifv
