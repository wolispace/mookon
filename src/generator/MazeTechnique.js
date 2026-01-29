class MazeTechnique {
    constructor() {
        this.hasPlugAndSocket = true;
    }
    apply(panel, generator) {
        let GRID_X = randBetween(5, 7);
        let GRID_Y = randBetween(5, 6); // Cap at 6 to always leave at least one row for buffer
        if (GRID_X % 2 === 0) GRID_X--;
        if (GRID_Y % 2 === 0) GRID_Y--;

        const { maze, entrance } = this.generateMaze(GRID_X, GRID_Y);
        const mazeColor = randBetween(0, COLOR_NAMES.length - 1);
        const size = 1;

        const mazeElements = [];
        let exitElement = null;
        let ballElement = null;

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
                    const exit = new BuildElement('circle');
                    exit.setSize(size);
                    exit.x = x;
                    exit.y = y;
                    exit.color = 1;
                    exit.elevation = '-';
                    exit.method = '='; // ALWAYS set method to '=' for Maze Exit to ensure it's a socket
                    exit.placed = true;
                    panel.addElement(exit, true, 'Maze Exit');
                    exitElement = exit;
                } else if (shape === 'O') {
                    const ball = new BuildElement('circle');
                    ball.setSize(size);
                    ball.x = x;
                    ball.y = y;
                    ball.color = 2; // blue
                    ball.elevation = '+';
                    ball.method = 'drag';

                    // Always put the ball in the plug pool if this is the final panel (i=0)
                    // otherwise 50% chance to put the ball in the plug pool instead of on the panel
                    if (panel.index === 0 || randBetween(0, 1) === 0) {
                        ballElement = ball;
                    } else {
                        panel.addElement(ball, true, 'Maze Ball');
                        ballElement = ball;
                    }
                } else if (shape === '_') {
                    // This is an empty passage cell ("gap")
                    // Collect coordinates for optional covering, but don't add as a physical element
                    mazeElements.push({ x, y });
                }
            }
        }

        // Decide what to cover in the maze
        // We always flag the socket and ball (if on panel) as coverable.
        // We also pick ONE random gap to be coverable as a VIRTUAL element.

        // If ball became a plug, it wasn't added to panel yet
        if (ballElement && !panel.elements.some(e => e.includes(ballElement.id))) {
            generator.setPlug(ballElement);
        }

        if (mazeElements.length > 0) {
            const gapPos = mazeElements[randBetween(0, mazeElements.length - 1)];
            // Register as a virtual coverable element
            panel.coverableElements.push({
                id: `gap-${gapPos.x}-${gapPos.y}`,
                elementString: `r 1x1 ${gapPos.x}x${gapPos.y}- 0 0 none`, // virtual string for parsing if needed
                width: 1,
                height: 1,
                x: gapPos.x,
                y: gapPos.y,
                elevation: '-',
                hasRemote: false,
                type: 'r'
            });
        }

        // Buffer Zone: Reserve space in panel grid directly below the maze entrance
        // This prevents remote controllers or distractors from blocking the path.
        const bufferY = GRID_Y; // Row directly below maze
        if (bufferY < 8) {
            for (let bx = 0; bx < GRID_X; bx++) {
                panel.grid[bufferY][bx] = true;
            }
            // console.log(`%c[Technique] Maze: Reserved row ${bufferY} (cols 0-${GRID_X - 1}) as buffer zone`, 'color: #999; font-style: italic;');
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

        // BFS from entrance to find farthest internal passage for exit
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

        // Farthest internal cell as exit
        let exitY = -1, exitX = -1, maxD = -1;
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (maze[y][x] === "_" && dist[y][x] > maxD) {
                    maxD = dist[y][x];
                    exitY = y;
                    exitX = x;
                }
            }
        }

        if (exitY !== -1) {
            maze[exitY][exitX] = "X";
        }

        return { maze, entrance: { x: entranceX, y: entranceY } };
    }
}
