/*
 ██████  ██       ██████  ██████   █████  ██      ███████
██       ██      ██    ██ ██   ██ ██   ██ ██      ██
██   ███ ██      ██    ██ ██████  ███████ ██      ███████
██    ██ ██      ██    ██ ██   ██ ██   ██ ██           ██
 ██████  ███████  ██████  ██████  ██   ██ ███████ ███████
*/

const GRID_WIDTH = 60;
const GRID_HEIGHT = 60;
const MAX_ROOMS = 20;
const ROOM_SIZE_RANGE = [5, 15];
const BOSS_GRID_WIDTH = 14;
const BOSS_GRID_HEIGHT = 14;
const DARKNESS_RANGE = 5;
const DISPLAY_GRID_WIDTH = 60;
const DISPLAY_GRID_HEIGHT = 40;
const WALL = -1;
const PATH = 0;
const PLAYER = 1;
const HEALTH = 2;
const WEAPON = 3;
const ENEMY = 4;
const BOSS = 5;
const KEY = 6;
const STAIRWAY = 7;
const KEY_PIECES_REQUIRED = 3;

/*
██████   █████  ███    ██ ██████  ██ ███    ██ ████████
██   ██ ██   ██ ████   ██ ██   ██ ██ ████   ██    ██
██████  ███████ ██ ██  ██ ██   ██ ██ ██ ██  ██    ██
██   ██ ██   ██ ██  ██ ██ ██   ██ ██ ██  ██ ██    ██
██   ██ ██   ██ ██   ████ ██████  ██ ██   ████    ██
*/

const getRandomInt = (min, max) => {
	// return random integer between min and max inclusive

	min = Math.ceil(min);
	max = Math.floor(max);
	return min + Math.floor(Math.random() * (max - min + 1));
};

/*
 ██████  ██████  ██ ██████
██       ██   ██ ██ ██   ██
██   ███ ██████  ██ ██   ██
██    ██ ██   ██ ██ ██   ██
 ██████  ██   ██ ██ ██████
*/

const createEmptyGrid = (width, height) => {
	// return a grid with dimensions width by height

	// initialize grid
	const grid = [];

	// add columns to grid
	for (let i = 0; i < height; i++) {
		grid.push([]);

		// add rows to grid
		for (let j = 0; j < width; j++) {
			grid[i].push(-1);
		}
	}

	return grid;
};

/*
███    ███  █████  ██████
████  ████ ██   ██ ██   ██
██ ████ ██ ███████ ██████
██  ██  ██ ██   ██ ██
██      ██ ██   ██ ██
*/

const createMap = (grid, range, maxRooms) => {
	// return grid with map including rooms of room size range onto grid

	const addRoomToGrid = (grid, {x, y, width = 1, height = 1}) => {
		// return grid with room placed onto grid

		// populate room with walkable path
		for (let i = y; i < y + height; i++) {
			for (let j = x; j < x + width; j++) {
				grid[i][j] = 0;
			}
		}

		return grid;
	};

	const isvalidRoom = (grid, {x, y, width = 1, height = 1}) => {
		// return true if room is within boundaries of grid and doesn't overlap with existing rooms, else false

		// check if room is within boundaries of grid
		if (y < 1 || y + height > grid.length - 1) {
			return false;
		}
		if (x < 1 || x + width > grid[0].length - 1) {
			return false;
		}

		// check if room overlaps with rooms already on the grid
		for (let i = y - 1; i < y + height + 1; i++) {
			for (let j = x - 1; j < x + width + 1; j++) {
				if (grid[i][j] === 0) {
					return false;
				}
			}
		}

		// room doesn't overlap with any existing rooms on grid
		return true;
	};

	const generateNeighbours = (grid, {x, y, width, height}, roomMin, roomMax) => {
		// return grid with room generated non-overlapping neighbour rooms

		const possibleRooms = [];

		// generate room to the north
		const north = {};
		north.height = getRandomInt(roomMin, roomMax);
		north.width = getRandomInt(roomMin, roomMax);
		north.x = getRandomInt(x, x + width - 1);
		north.y = y - north.height - 1;
		north.doorx = getRandomInt(north.x, Math.min(north.x + north.width, x + width) - 1);
		north.doory = y - 1;
		possibleRooms.push(north);

		// generate room to the south
		const south = {};
		south.height = getRandomInt(roomMin, roomMax);
		south.width = getRandomInt(roomMin, roomMax);
		south.x = getRandomInt(x, x + width - 1);
		south.y = y + height + 1;
		south.doorx = getRandomInt(south.x, Math.min(south.x + south.width, x + width) - 1);
		south.doory = y + height;
		possibleRooms.push(south);

		// generate room to the east
		const east = {};
		east.height = getRandomInt(roomMin, roomMax);
		east.width = getRandomInt(roomMin, roomMax);
		east.x = x + width + 1;
		east.y = getRandomInt(y, y + height - 1);
		east.doorx = east.x - 1;
		east.doory = getRandomInt(east.y, Math.min(east.y + east.height, y + height) - 1);
		possibleRooms.push(east);

		// generate room to the west
		const west = {};
		west.height = getRandomInt(roomMin, roomMax);
		west.width = getRandomInt(roomMin, roomMax);
		west.x = x - 1 - west.width;
		west.y = getRandomInt(y, y + height - 1);
		west.doorx = x - 1;
		west.doory = getRandomInt(west.y, Math.min(west.y + west.height, y + height) - 1);
		possibleRooms.push(west);

		// check if room overlaps and if not place room
		const validRooms = [];
		possibleRooms.forEach(room => {
			if (isvalidRoom(grid, room)) {
				grid = addRoomToGrid(grid, room);
				grid = addRoomToGrid(grid, {x: room.doorx, y: room.doory}, "door");
				validRooms.push(room);
			}
		});

		return {grid, validRooms};
	};

	const growMapFromSeed = (grid, seedRooms, roomMin, roomMax, maxRooms, counter = 1) => {
		// recursively generate rooms onto map as long as seed rooms exist, else return the finished map

		// if number of rooms exceeds capacity or no seed rooms left
		if (counter + seedRooms.length > maxRooms || !seedRooms.length) {
			return grid;
		}

		// generate additional rooms onto grid
		const result = generateNeighbours(grid, seedRooms.pop(), roomMin, roomMax);

		// update seedRooms and counter
		result.validRooms.forEach(room => {
			seedRooms.push(room);
		});
		counter += result.validRooms.length;

		// recursive call to add more rooms
		return growMapFromSeed(result.grid, seedRooms, roomMin, roomMax, maxRooms, counter);
	};

	// define minimum and maximum size of a room
	const [roomMin, roomMax] = range;

	// create first room
	const firstRoom = {
		x: (grid[0].length / 2) - roomMin,
		y: (grid.length / 2) - roomMin,
		height: getRandomInt(roomMin, roomMax),
		width: getRandomInt(roomMin, roomMax)
	};

	// place first room onto grid and recursively grow map from first room
	grid = addRoomToGrid(grid, firstRoom);
	return growMapFromSeed(grid, [firstRoom], roomMin, roomMax, maxRooms);
};

const createBossMap = (grid) => {
	// Given a grid, Populate entire grid with paths except edges, Return grid

	// add columns to grid
	for (let i = 1; i < grid.length - 1; i++) {
		for (let j = 1; j < grid[0].length - 1; j++) {
			grid[i][j] = 0;
		}
	}

	return grid;
};

/*
██████   ██████  ██████  ██    ██ ██       █████  ████████ ███████
██   ██ ██    ██ ██   ██ ██    ██ ██      ██   ██    ██    ██
██████  ██    ██ ██████  ██    ██ ██      ███████    ██    █████
██      ██    ██ ██      ██    ██ ██      ██   ██    ██    ██
██       ██████  ██       ██████  ███████ ██   ██    ██    ███████
*/

const populateMap = (grid, healthNum, enemyNum, weaponsNum, keyNum) => {
	// return grid map with all items placed onto map

	// define width and height of grid
	const width = grid[0].length;
	const height = grid.length;

	let x = 0;
	let y = 0;
	let playerPosition = null;
	let enemies = {};

	// place player onto map
	let playerPlaced = false;
	while (!playerPlaced) {
		x = getRandomInt(0, width - 1);
		y = getRandomInt(0, height - 1);
		if (grid[y][x] === 0) {
			grid[y][x] = 1;
			playerPosition = [x, y];
			playerPlaced = true;
		}
	}

	let stairwayPlaced = false;
	while (!stairwayPlaced) {
		x = getRandomInt(0, width - 1);
		y = getRandomInt(0, height - 1);
		if (grid[y][x] === 0) {
			grid[y][x] = 7;
			stairwayPlaced = true;
		}
	}

	// randomly place health items on map
	while (healthNum > 0) {
		x = getRandomInt(0, width - 1);
		y = getRandomInt(0, height - 1);
		if (grid[y][x] === 0) {
			grid[y][x] = 2;
			healthNum -= 1;
		}
	}

	// randomly place weapons on map
	while (weaponsNum > 0) {
		x = getRandomInt(0, width - 1);
		y = getRandomInt(0, height - 1);
		if (grid[y][x] === 0) {
			grid[y][x] = 3;
			weaponsNum -= 1;
		}
	}

	// randomly place enemies on map
	while (enemyNum > 0) {
		x = getRandomInt(0, width - 1);
		y = getRandomInt(0, height - 1);
		if (grid[y][x] === 0) {
			grid[y][x] = 4;
			enemyNum -= 1;
			enemies[x.toString() + "x" + y.toString()] = getRandomInt(30, 50);
		}
	}

	// randomly place key pieces on map
	while (keyNum > 0) {
		x = getRandomInt(0, width - 1);
		y = getRandomInt(0, height - 1);
		if (grid[y][x] === 0) {
			grid[y][x] = 6;
			keyNum -= 1;
		}
	}

	return {
		grid: grid,
		playerPosition: playerPosition,
		enemies: enemies
	};
};

const populateBossMap = (grid) => {
	// return grid with boss, stairway, and player

	// place boss at center of grid
	grid[Math.floor((grid.length / 2) + 1)][Math.floor((grid[0].length / 2) + 1)] = 5;
	grid[(Math.floor(grid.length / 2))][Math.floor((grid[0].length / 2))] = 5;
	grid[Math.floor((grid.length / 2) + 1)][Math.floor((grid[0].length / 2))] = 5;
	grid[Math.floor((grid.length / 2))][Math.floor((grid[0].length / 2) + 1)] = 5;

	// place player at top left corner
	grid[2][1] = 1;

	// place stairway at top left corner
	grid[1][1] = 7;

	return grid;
};

/*
████████ ██ ████████ ██      ███████
   ██    ██    ██    ██      ██
   ██    ██    ██    ██      █████
   ██    ██    ██    ██      ██
   ██    ██    ██    ███████ ███████
*/

const Title = (props) => {
	// title for game

	return (
		<div className="title">
			<h1>React Dungeon Crawler</h1>
			<h3>Find {KEY_PIECES_REQUIRED} key pieces, ascend the stairway, fight the boss!</h3>
		</div>
	);
};

/*
███████ ████████  █████  ████████ ███████
██         ██    ██   ██    ██    ██
███████    ██    ███████    ██    ███████
     ██    ██    ██   ██    ██         ██
███████    ██    ██   ██    ██    ███████
*/

const Stats = (props) => {
	// displays useful statistics for player

	return (
		<div>
			<div className="stats">
				<div className="stat"><div className="cell health inline"></div> <strong>Health:</strong> {props.health}</div>
				<div className="stat"><div className="cell weapon inline"></div> <strong>Weapon:</strong> {props.weapon}</div>
				<div className="stat"><strong>Attack:</strong> {props.weaponDamage}</div>
				<div className="stat"><strong>Level:</strong> {props.level}</div>
				<div className="stat"><strong>Next Level:</strong> {props.nextLevel}</div>
				<div className="stat"><div className="cell key inline"></div> <strong>Key Pieces Found:</strong> {props.keyPiecesFound}</div>
			</div>
		</div>
	);
};

/*
██████   ██████  ██     ██
██   ██ ██    ██ ██     ██
██████  ██    ██ ██  █  ██
██   ██ ██    ██ ██ ███ ██
██   ██  ██████   ███ ███
*/

const Row = (props) => {
	// return row to be displayed

	const defineClass = (cell, show = false) => {
		// returns corresponding class name for cell

		if (!show) {
			return "cell";
		}

		let className = "cell";

		switch (cell) {
		case PATH:
			className += " path";
			break;
		case PLAYER:
			className += " player";
			break;
		case HEALTH:
			className += " health";
			break;
		case WEAPON:
			className += " weapon";
			break;
		case ENEMY:
			className += " enemy";
			break;
		case BOSS:
			className += " boss";
			break;
		case KEY:
			className += " key";
			break;
		case STAIRWAY:
			className += " stairway";
			break;
		default:
			className += " wall";
		}

		return className;
	};

	const row = props.row.map((cell, colIndex) => {
		/*
		returns row of cell in html with correct classes and ids
		*/

		if ((props.playerPosition[0] - (DISPLAY_GRID_WIDTH / 2) <= colIndex) && (colIndex <= props.playerPosition[0] + (DISPLAY_GRID_WIDTH / 2))) {

			// define class name for each cell
			var className = "";

			// if darkness
			if (props.darkness) {
				// if within boundaries of player visibility
				if ((props.playerPosition[0] - DARKNESS_RANGE <= colIndex) && (colIndex <= props.playerPosition[0] + DARKNESS_RANGE) && (props.playerPosition[1] - DARKNESS_RANGE <= props.rowIndex) && (props.rowIndex <= props.playerPosition[1] + DARKNESS_RANGE)) {
					className = defineClass(cell, true);
				} else {
					className = defineClass(cell);
				}
			// if map isn't hidden
			} else {
				className = defineClass(cell, true);
			}

			return <div className={className} id={colIndex.toString() + "-" + props.rowIndex.toString()} key={colIndex.toString()}></div>;
		}
	});

	// return row in html form
	return (
		<div className="row">
			{row}
		</div>
	);
};

/*
 ██████  ██████  ██ ██████
██       ██   ██ ██ ██   ██
██   ███ ██████  ██ ██   ██
██    ██ ██   ██ ██ ██   ██
 ██████  ██   ██ ██ ██████
*/

const Grid = (props) => {
	// return grid to be displayed

	const grid = props.grid.map((row, index) => {
		// return grid in html form

		if ((props.playerPosition[1] - Math.floor(DISPLAY_GRID_HEIGHT / 2) <= index) && (index <= props.playerPosition[1] + Math.floor(DISPLAY_GRID_HEIGHT / 2))) {

			return (<Row row={row} playerPosition={props.playerPosition} darkness={props.darkness} rowIndex={index} key={index}/>);
		}
	});

	// return grid in html form
	return (
		<div onKeyDown={props.handleKeyDown} className="grid">
			{grid}
		</div>
	);
};

/*
 █████  ██████  ██████
██   ██ ██   ██ ██   ██
███████ ██████  ██████
██   ██ ██      ██
██   ██ ██      ██
*/

class App extends React.Component {
	// main application for game management

	constructor(props) {
		super(props);
		this.state = this.initialState();
	}

	initialState() {
		/*
		returns initial state
		https://stackoverflow.com/questions/43554875/setting-and-resetting-states-in-react-js
		*/

		// define number of each category
		let healthNum = 5;
		let enemyNum = 10;

		// weapons list contains a list of weapons and their corresponding damage dealt
		let weaponsList = [
			["Bare Hands", 10],
			["Brass Knuckles", 15],
			["Steel Daggers", 30],
			["Battle Axe", 45],
			["Sword of Destiny", 60]
		];
		let weaponsNum = weaponsList.length - 1;
		let keyNum = KEY_PIECES_REQUIRED;

		// define grids
		let mainGrid = createMap(createEmptyGrid(GRID_WIDTH, GRID_HEIGHT), ROOM_SIZE_RANGE, MAX_ROOMS);
		let bossGrid = createBossMap(createEmptyGrid(BOSS_GRID_WIDTH, BOSS_GRID_HEIGHT));

		// populate grids
		mainGrid = populateMap(mainGrid, healthNum, enemyNum, weaponsNum, keyNum);
		bossGrid = populateBossMap(bossGrid);

		return {
			mainGrid: mainGrid.grid,
			bossGrid: bossGrid,
			mainPlayerPosition: mainGrid.playerPosition,
			bossPlayerPosition: [1, 2],
			playerHealth: 100,
			playerExperience: 0,
			playerLevel: 0,
			weaponList: weaponsList,
			weaponLevel: 0,
			weapon: weaponsList[0][0],
			weaponDamage: weaponsList[0][1],
			weaponDamageBonus: 0,
			enemies: mainGrid.enemies,
			enemyDamage: 20,
			enemyExperience: 50,
			bossHealth: 300,
			bossDamage: 50,
			darkness: true,
			bossStage: false,
			keyPiecesFound: 0
		};
	}

	componentDidMount() {
		// code to execute once app and initial state are defined

		// have webpage listen for key presses
		document.addEventListener("keydown", this.handleKeyDown.bind(this));
	}

	handleKeyDown(e) {
		// handles arrow key presses

		const processAction = (grid, playerPosition, newPlayerPosition) => {
			// returns result of game sattus when player tries to move into new square

			// if player position within boundaries
			if (-1 < newPlayerPosition[0] && newPlayerPosition[0] < GRID_WIDTH && grid[newPlayerPosition[1]][newPlayerPosition[0]] !== WALL) {

				// stairway encountered
				if (grid[newPlayerPosition[1]][newPlayerPosition[0]] === STAIRWAY) {
					if (this.state.keyPiecesFound >= KEY_PIECES_REQUIRED) {
						this.setState({
							bossStage: !this.state.bossStage
						});
					}

				// boss encountered
				} else if ((grid[newPlayerPosition[1]][newPlayerPosition[0]] === BOSS) && (this.state.bossHealth > 0)) {

					// update player health after attack
					let playerHealth = this.state.playerHealth - getRandomInt(this.state.bossDamage - 20, this.state.bossDamage + 20);
					if (playerHealth < 0) playerHealth = 0;

					// update boss health after attack
					let bossHealth = this.state.bossHealth - getRandomInt(this.state.weaponDamage - 10, this.state.weaponDamage + 10);
					if (bossHealth < 0) bossHealth = 0;

					// player is dead check or boss is dead check, if so reset game
					if (playerHealth <= 0 || bossHealth <= 0) {
						(playerHealth <= 0) ? alert("You Lose!") : alert("You Win!");
						this.setState(this.initialState());
					}

					this.setState({
						playerHealth: playerHealth,
						bossHealth: bossHealth
					});

				// enemy encountered
				} else if ((grid[newPlayerPosition[1]][newPlayerPosition[0]] === ENEMY) && (this.state.enemies[newPlayerPosition[0].toString() + "x" + newPlayerPosition[1].toString()] > 0)) {

					// update enemy health after player attack
					let enemies = this.state.enemies;
					let enemyIndex = newPlayerPosition[0].toString() + "x" + newPlayerPosition[1].toString();
					enemies[enemyIndex] -= getRandomInt(this.state.weaponDamage - 5, this.state.weaponDamage + 5);

					// update player health after enemy attack
					let playerHealth = this.state.playerHealth - getRandomInt(this.state.enemyDamage - 10, this.state.enemyDamage + 10);
					if (playerHealth < 0) playerHealth = 0;

					// check if player is dead, if so reset game
					if (playerHealth <= 0) {
						alert("You Lose!");
						this.setState(this.initialState());
					}


					this.setState({
						playerHealth: playerHealth,
						enemies: enemies
					});

				// no obstacle encountered
				} else {

					// delete players current position
					grid[playerPosition[1]][playerPosition[0]] = PATH;

					// health encountered
					if (grid[newPlayerPosition[1]][newPlayerPosition[0]] === HEALTH) {
						this.setState({
							playerHealth: this.state.playerHealth + 50
						});
					}

					// weapon encountered
					if (grid[newPlayerPosition[1]][newPlayerPosition[0]] === WEAPON) {
						this.setState({
							weapon: this.state.weaponList[this.state.weaponLevel + 1][0],
							weaponDamage: this.state.weaponList[this.state.weaponLevel + 1][1] + this.state.weaponDamageBonus,
							weaponLevel: this.state.weaponLevel + 1
						});
					}

					// key piece encountered
					if (grid[newPlayerPosition[1]][newPlayerPosition[0]] === KEY) {
						this.setState({
							keyPiecesFound: this.state.keyPiecesFound + 1
						});
					}

					// dead enemy encountered
					if (grid[newPlayerPosition[1]][newPlayerPosition[0]] === ENEMY) {

						let newPlayerExperience = this.state.playerExperience + getRandomInt(25, 75);
						let newPlayerLevel = Math.floor(newPlayerExperience / 100);

						if (this.state.playerLevel != newPlayerLevel) {
							this.setState({
								weaponDamage: this.state.weaponDamage + 10,
								weaponDamageBonus: this.state.weaponDamageBonus + 10,
								playerHealth: this.state.playerHealth + 50
							});
						}

						this.setState({
							playerLevel: newPlayerLevel,
							playerExperience: newPlayerExperience
						});
					}

					// place player onto new position
					grid[newPlayerPosition[1]][newPlayerPosition[0]] = PLAYER;
					this.state.bossStage ? this.setState({bossGrid: grid, bossPlayerPosition: newPlayerPosition}) : this.setState({mainGrid: grid, mainPlayerPosition: newPlayerPosition});
				}

			}
		};

		// obtain player position and grid
		const playerPosition = this.state.bossStage ? this.state.bossPlayerPosition : this.state.mainPlayerPosition;
		var grid = this.state.bossStage ? this.state.bossGrid : this.state.mainGrid;

		// left arrow pressed
		if (e.keyCode === 37) {

			// define player position after key press
			const newPlayerPosition = [
				playerPosition[0] - 1, playerPosition[1]
			];

			// update game
			processAction(grid, playerPosition, newPlayerPosition);
		}

		// up arrow pressed
		if (e.keyCode === 38) {

			// define player position after key press
			const newPlayerPosition = [
				playerPosition[0], playerPosition[1] - 1
			];

			// update game
			processAction(grid, playerPosition, newPlayerPosition);
		}

		// right arrow pressed
		if (e.keyCode === 39) {

			const newPlayerPosition = [
				playerPosition[0] + 1, playerPosition[1]
			];

			// update game
			processAction(grid, playerPosition, newPlayerPosition);
		}

		// down arrow pressed
		if (e.keyCode === 40) {

			const newPlayerPosition = [
				playerPosition[0], playerPosition[1] + 1
			];

			// update game
			processAction(grid, playerPosition, newPlayerPosition);
		}
	}

	toggleDarkness() {
		// hides or unhides map darkness

		this.setState({
			darkness: !this.state.darkness
		});
	}

	render() {
		// returns most up to date grid

		return (
			<div>
				<Title />
				<Stats
					health={this.state.playerHealth}
					weapon={this.state.weapon}
					weaponDamage={this.state.weaponDamage}
					level={this.state.playerLevel}
					nextLevel={100 - (this.state.playerExperience % 100)}
					keyPiecesFound={this.state.keyPiecesFound}
				/>
				<Grid
					handleKeyDown={this.handleKeyDown.bind(this)}
					grid={this.state.bossStage ? this.state.bossGrid : this.state.mainGrid}
					playerPosition={this.state.bossStage ? this.state.bossPlayerPosition : this.state.mainPlayerPosition}
					darkness={this.state.darkness}
				/>
				<button
					className="darknessToggle"
					onClick={this.toggleDarkness.bind(this)}
				>
					Toggle Darkness
				</button>
			</div>
		);
	}
}

ReactDOM.render(<App/>, document.querySelector(".App"));
