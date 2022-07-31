var view = {
	// @param msg: Object responsible for updating display.
	displayMessage: function(msg) {
		// Access div tag of messageArea id using the DOM.
		var text = document.getElementById("messageArea");

		// Set text to parameter.
		text.innerHTML = msg;
	},

	// @param pos: Row and column matching the <td> element.
	displayHit: function(pos) {
		var cell = document.getElementById(pos);

		// Register position as 'hit' class, immediately adding a ship image.
		cell.setAttribute("class", "hit");
	},

	displayMiss: function(pos) {
		var cell = document.getElementById(pos);

		// Register position as 'miss' class.
		cell.setAttribute("class", "miss");
	}
};

/* Test:
	view.displayMiss("00");
	view.displayHit("31");
	view.displayMiss("40");
	view.displayMiss("25");
	view.displayHit("11");
	view.displayMessage("The message is working.");
*/

var model = {
	boardSize: 7,  // Size of the grid,
	numShips: 3,   // Number of ships on the grid.
	shipsSunk: 0,  // Number that has been sunk.
	shipLength: 3, // Span of ship (td occupied).
	
	ships: [
		// Hard-coded ship locations (testing):
			// { positions: ["10","20","30"], hits: ["", "", ""] },
			// { positions: ["43","42","41"], hits: ["", "", ""] },
			// { positions: ["55","54","53"], hits: ["", "", ""] }
		{ positions: [0,0,0], hits: ["","",""] },
		{ positions: [0,0,0], hits: ["","",""] },
		{ positions: [0,0,0], hits: ["","",""] }
	],

	// Fire at location then determine if a ship was hit.
	// @param pos: Table data to evaluate.
	fire: function(pos) {
		// Iterate through the positions of each ship to
		// determine if the coordinate occupies a position.
		for (var i = 0; i < this.numShips; i++) {
			var ship = this.ships[i];      

			// Returns -1 if position was not found.
			var index = ship.positions.indexOf(pos);

			// Coordinate pair matches ship coordinates.
			if (index >= 0) {
				ship.hits[index] = "hit";
				view.displayHit(pos);
				view.displayMessage("Hit!");
				hitSound.play();

				// Determine if a ship was sunk.
				if (this.isSunk(ship)) {
					view.displayMessage("Opposing ship is down!");
					this.shipsSunk++;
				}
				
				return true;
			}
		}

		// Position was a miss (send coordinates to function 
		// of view object that will change class to 'miss').
		view.displayMiss(pos);
		view.displayMessage("No ship was struck.");
		missSound.play();

		return false;
	},

	// @return: True if all positions are hit.
	isSunk: function(ship) {
		// Check each position of the ship.
		for (var i = 0; i < this.shipLength; i++) {
			if (ship.hits[i] !== "hit")
				return false;
		}

		// Updating number of ships remaining.
		document.getElementById("pair").innerHTML = (this.numShips - (this.shipsSunk + 1)) + " ship(s) remain.";

		return true;
	},

	// Master method to create ships array.
	generateShipPositions: function() {
		var positions;

		// Generate locations for numShips.
		for (var i = 0; i < this.numShips; i++) {
			// Generate new position until no collision.
			do {
				positions = this.generateShip();
			} while (this.collision(positions));

			// Assign a free position of ship location.
			this.ships[i].positions = positions;
		}
	},

	// Generate new set of locations for ship.
	generateShip: function() {
		// Determine if ship is along x or y axis.
		// First gen a number 0 to 1 and multiply (so
		// that it is possible to get 0 or 1, as .floor
		// rounds downwards).
		var axis = Math.floor(Math.random() * 2);
		var row, col;

		// Horizontal ship placement (x).
		if (axis === 1) {
			// The column must be restricted [0-4] as the 
			// ship length is 3 (if ship is along x-axis).
			row = Math.floor(Math.random() * this.boardSize);
			col = Math.floor(Math.random() * (this.boardSize - (this.shipLength + 1)));
		}

		// Axis generation is 0, place vertically.
		else {
			row = Math.floor(Math.random() * (this.boardSize - (this.shipLength + 1)));
			col = Math.floor(Math.random() * this.boardSize);
		}

		// New ship positions contained in empty array.
		var newShipPositions = [];

		for (var i = 0; i < this.shipLength; i++) {
			// x-axis pos added (ex: 01->02->03).
			if (axis === 1) {
				newShipPositions.push(row + "" + (col + i));
			}

			// y-axis pos added (ex: 00->10->20).
			else {
				newShipPositions.push((row + i) + "" + col);
			}
		}

		return newShipPositions;
	},

	// Checks if ship does not overlap with existing ship.
	// @param positions: Array; coordinates of new ship.
	collision: function (positions) {
		// Check each ship on the board (ships array).
		for (var i = 0; i < this.numShips; i++) {
			var ship = this.ships[i];

			for (var j = 0; j < positions.length; j++) {
				if (ship.positions.indexOf(positions[j]) >= 0) {
					return true;
				}
			}
		}

		// No collisions among coordinate pairs.
		return false;
	}
};

/* Test:
	model.fire("54");
	model.fire("14");

	model.fire("53");
	model.fire("13");

	model.fire("32");
	model.fire("55");
	model.fire("51");

	model.fire("24");
	model.fire("14");
	model.fire("35");
	model.fire("54");
*/

var controller = {
	guesses: 0,

	// @param guess: A0 - F6.
	processGuess: function(guess) {
		// Transform guess from alpha-numeric.
		var pos = parsePosition(guess);

		// Check if position is null.
		if (pos) {
			// Valid guess given (A0-F6).
			this.guesses++;

			// Fire at the specified position.
			var hit = model.fire(pos);

			// Check if the game has ended (all ships sunk).
			if (hit && model.shipsSunk === model.numShips) {
				view.displayMessage("The opposing battleships have sunk in " + this.guesses + " guesses.");
			}
		}
	}	
}

// @param pos: Coordinate pair of position.
// @note: Although parameter is a string, type
// conversion automatically evaluates the parameter
// as what is being compared (helper function).
function parsePosition(pos) {
	var alpha = ["A","B","C","D","E","F","G"];

	// Check for valid input (size 2; not null).
	if (pos.length !== 2 || pos === null) {
		alert("Enter [A0-F6].");
	}

	// Convert letter to number (A -> 0).
	// Get index equivalent to letter of array.
	else {
		var char = pos.charAt(0);      // Get the letter.
		var row = alpha.indexOf(char); // Handles conversion.
		var col = pos.charAt(1);       // Get the digit.

		if (isNaN(row) || isNaN(col)) {
			alert("Position is not of form 'A0' (1).");
		}

		else if (row < 0 || row >= model.boardSize || col < 0 || col >= model.boardSize) {
			alert("Position is not on the board (2).");
		}

		// Create and return string.
		else {
			return row + col;
		}
	}
		
	// Condition(s) not met.
	return null;
}

/* Test:
	console.log(parsePosition("A0"));
	console.log(parsePosition("A5"));
	console.log(parsePosition("H0"));
	console.log(parsePosition("C1"));
	console.log(parsePosition("A2"));

	controller.processGuess("A0");
	controller.processGuess("A4");
	controller.processGuess("B4");
	controller.processGuess("C0");
*/

// Runs upon loading the page.
function init() {
	var fireButton = document.getElementById("fireButton");
	fireButton.onclick = handleFireButton;

	// Allow for return key to continue guessing.
	var guessInput = document.getElementById("guessPos");
	guessInput.onkeypress = handleKeyPress;

	// Generate the ship positions.
	model.generateShipPositions();
}

function handleKeyPress(e) {
	var fireButton = document.getElementById("fireButton");

	// If return key is pressed, cause form to be clicked.
	if (e.keyCode === 13) {
		fireButton.click();
		return false;
	}
}

function handleFireButton() {
	var guessInput = document.getElementById("guessPos");
	var guess = guessInput.value;

	// Passing the guess to controller object.
	controller.processGuess(guess);

	// Clears form field to empty.
	guessInput.value = "";
}

var audio = new Audio("AudMusic.wav");
var hitSound = new Audio("AudHit.wav");
var missSound = new Audio("AudMiss.wav");

function backgroundMusic() {
	// Get the html element and add click event handler.
	var music = document.getElementById("music");
	
	// Replace or create attribute.
	music.setAttribute("", "");
	
	// If the icon is clicked, play the music.
	audio.play();
}

// Run the init after the page is loaded.
window.onload = init;


/* Todo:
	xAdd audio (sound effects).
	Add click functionality.
	Add graphic rehaul.
	Add health icons.
	Add health functionality (player).
*/

/*
	Event Handlers are functions that trigger based on conditions.
	
	function startPage() {
		alert("Event handler is functioning.");
	}

	window.onload = startPage;
*/