class MazeTechnique {
    constructor() {
        this.hasPlugAndSocket = true;
        this.oneOnly = true; // Only one maze per puzzle due to space constraints
        this.priority = 100; // Mazes should go first as they are space-intensive
    }
    apply(panel, generator) {

        if (panel.hasMaze) return;
        panel.hasMaze = true;
        console.log(`maze added to panel ${panel.index}`, panel);
        let GRID_X = randBetween(5, 7);
        let GRID_Y = randBetween(5, 6); // Cap at 6 to always leave at least one row for buffer
        if (GRID_X % 2 === 0) GRID_X--;
        if (GRID_Y % 2 === 0) GRID_Y--;

        const { maze, entrance, deadEnds } = this.generateMaze(GRID_X, GRID_Y);
        const mazeColor = generator.getRandomColor(0.5);
        const size = 1;

        // Reserve the entire maze area in the grid to prevent other techs from spawning in gaps
        for (let gy = 0; gy < GRID_Y; gy++) {
            for (let gx = 0; gx < GRID_X; gx++) {
                panel.grid[gy][gx] = true;
            }
        }

        const mazeElements = [];
        const sockets = [];

        // Identify exit and dead ends for socket placement
        for (let y = 0; y < GRID_Y; y++) {
            for (let x = 0; x < GRID_X; x++) {
                const shape = maze[y][x] ?? '_';
                if (shape === 'r') {
                    const wall = new BuildElement('rectangle');
                    wall.setSize(size);
                    wall.x = x;
                    wall.y = y;
                    wall.color = mazeColor;
                    wall.elevation = '+';
                    panel.addElement(wall, false, 'Maze Wall');
                } else if (shape === 'X') {
                    sockets.push({ x, y, isMainExit: true });
                } else if (shape === 'O') {
                    // This is the entrance, we'll handle the ball later
                } else if (shape === '_') {
                    mazeElements.push({ x, y });
                }
            }
        }

        // Get difficulty-based limits
        const diff = DIFFICULTY_SETTINGS[PUZZLE_CONFIG.DIFFICULTY] || DIFFICULTY_SETTINGS[2];
        const maxSockets = diff.maxMazeSockets || 2;

        // Randomly pick a few dead ends to become extra sockets
        // numExtraSockets is maxSockets - 1 because sockets array already has the main exit
        const numExtraSockets = randBetween(0, Math.min(maxSockets - 1, deadEnds.length));
        const shuffledDeadEnds = [...deadEnds].sort(() => Math.random() - 0.5);
        for (let i = 0; i < numExtraSockets; i++) {
            sockets.push({ x: shuffledDeadEnds[i].x, y: shuffledDeadEnds[i].y, isMainExit: false });
        }

        // Ensure at least one socket is required ('-')
        let requiredFound = false;

        sockets.forEach((s, idx) => {
            const socket = new BuildElement('circle');
            socket.setSize(size);
            socket.x = s.x;
            socket.y = s.y;

            // Randomize if required or decoy
            // Main exit is more likely to be required. 
            // We must ensure at least one is required.
            let isRequired = randBetween(0, 1) === 0;
            if (s.isMainExit && !requiredFound && idx === sockets.length - 1) {
                isRequired = true; // Safety to ensure at least one
            }
            if (idx === sockets.length - 1 && !requiredFound) {
                isRequired = true;
            }

            if (isRequired) requiredFound = true;

            socket.elevation = '-'; // All sockets are visually sunken

            // Randomize method: '=' (size) or '#' (color)
            const useColorMatch = randBetween(0, 1) === 0;
            socket.method = useColorMatch ? '#' : '=';

            if (useColorMatch) {
                socket.color = generator.getRandomColor(0.7); // High chance of theme color for sockets
            } else {
                socket.color = generator.getRandomColor(0.5); // 50% chance of theme color
            }

            if (!isRequired) {
                socket.targetState = 9; // Internal flag for decoy (optional satisfaction)
            }

            socket.placed = true;
            panel.addElement(socket, true, isRequired ? 'Maze Socket' : 'Maze Decoy');

            // Generate matching ball
            const ball = new BuildElement('circle');
            ball.setSize(size);
            ball.color = socket.color;
            ball.elevation = '+';
            ball.method = 'drag';

            // First ball at entrance, subsequent balls at random passage locations
            if (idx === 0) {
                ball.x = entrance.x;
                ball.y = entrance.y;
            } else if (mazeElements.length > 0) {
                const passageIdx = randBetween(0, mazeElements.length - 1);
                const pos = mazeElements.splice(passageIdx, 1)[0];
                ball.x = pos.x;
                ball.y = pos.y;
            } else {
                ball.x = s.x;
                ball.y = s.y;
            }

            if (panel.index === 0 || randBetween(0, 1) === 0) {
                generator.setPlug(ball);
            } else {
                panel.addElement(ball, true, 'Maze Ball');
            }
        });

        // Register a virtual coverable element if there are any passages left
        if (mazeElements.length > 0) {
            const gapPos = mazeElements[randBetween(0, mazeElements.length - 1)];
            panel.coverableElements.push({
                id: `gap-${gapPos.x}-${gapPos.y}`,
                elementString: `r 1x1 ${gapPos.x}x${gapPos.y}- 0 0 none`,
                gridWidth: 1,
                gridHeight: 1,
                x: gapPos.x,
                y: gapPos.y,
                elevation: '-',
                hasRemote: false,
                type: 'r'
            });
        }

        // Buffer Zone
        const bufferY = GRID_Y;
        if (bufferY < 8) {
            for (let bx = 0; bx < GRID_X; bx++) {
                panel.grid[bufferY][bx] = true;
            }
        }
    }

    generateMaze(width, height) {
        // Fill with walls
        const maze = Array.from({ length: height }, () =>
            Array.from({ length: width }, () => "r")
        );

        const dirs = [
            [-1, 0], // up
            [1, 0],  // down
            [0, -1], // left
            [0, 1]   // right
        ];

        function shuffle(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = randBetween(0, i);
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        // DFS on odd cells, carving 2 steps at a time
        function carve(y, x) {
            maze[y][x] = "_";
            const shuffled = shuffle([...dirs]);
            for (const [dy, dx] of shuffled) {
                const ny = y + dy * 2;
                const nx = x + dx * 2;
                if (
                    ny >= 1 && ny < height - 1 &&
                    nx >= 1 && nx < width - 1 &&
                    maze[ny][nx] === "r"
                ) {
                    maze[y + dy][x + dx] = "_";
                    carve(ny, nx);
                }
            }
        }

        const startY = 1 + (randBetween(0, Math.floor((height - 2) / 2) - 1) * 2);
        const startX = 1 + (randBetween(0, Math.floor((width - 2) / 2) - 1) * 2);
        carve(startY, startX);

        // Choose entrance on an edge, adjacent to a passage
        let entranceY, entranceX;
        const edgeCandidates = [];

        // Only consider bottom edge for entrance
        for (let x = 1; x < width - 1; x++) {
            if (maze[height - 2][x] === "_") edgeCandidates.push([height - 1, x]);
        }

        if (edgeCandidates.length === 0) {
            // Fallback: pick a random internal passage and tunnel straight to bottom edge
            const internal = [];
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    if (maze[y][x] === "_") internal.push([y, x]);
                }
            }

            // Pick random internal point
            const [iy, ix] = internal[randBetween(0, internal.length - 1)];

            // Force tunnel to bottom
            for (let y = iy; y < height; y++) maze[y][ix] = "_";
            entranceY = height - 1; entranceX = ix;
        } else {
            [entranceY, entranceX] = edgeCandidates[randBetween(0, edgeCandidates.length - 1)];
            maze[entranceY][entranceX] = "O";
        }

        // BFS from entrance to find farthest internal passage for exit and all dead ends
        const dist = Array.from({ length: height }, () =>
            Array.from({ length: width }, () => -1)
        );
        const queue = [];
        dist[entranceY][entranceX] = 0;
        queue.push([entranceY, entranceX]);

        while (queue.length) {
            const [y, x] = queue.shift();
            for (const [dy, dx] of dirs) {
                const ny = y + dy;
                const nx = x + dx;
                if (
                    ny >= 0 && ny < height &&
                    nx >= 0 && nx < width &&
                    maze[ny][nx] === "_" &&
                    dist[ny][nx] === -1
                ) {
                    dist[ny][nx] = dist[y][x] + 1;
                    queue.push([ny, nx]);
                }
            }
        }

        // Farthest internal cell as exit, and find all other dead ends
        let exitY = -1, exitX = -1, maxD = -1;
        const deadEnds = [];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (maze[y][x] === "_") {
                    // Count passage neighbors
                    let neighbors = 0;
                    for (const [dy, dx] of dirs) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny >= 0 && ny < height && nx >= 0 && nx < width && (maze[ny][nx] === "_" || maze[ny][nx] === "O")) {
                            neighbors++;
                        }
                    }

                    // It's a dead end if it has only 1 passage neighbor
                    if (neighbors === 1) {
                        deadEnds.push({ x, y, dist: dist[y][x] });
                    }

                    if (dist[y][x] > maxD) {
                        maxD = dist[y][x];
                        exitY = y;
                        exitX = x;
                    }
                }
            }
        }

        if (exitY !== -1) {
            maze[exitY][exitX] = "X";
            // Remove the exit from deadEnds if it was included
            const exitIndex = deadEnds.findIndex(de => de.x === exitX && de.y === exitY);
            if (exitIndex !== -1) deadEnds.splice(exitIndex, 1);
        }

        return { maze, entrance: { x: entranceX, y: entranceY }, deadEnds };
    }
}
