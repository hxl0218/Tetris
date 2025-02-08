const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

context.scale(BLOCK_SIZE, BLOCK_SIZE);

// 创建游戏区域矩阵
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// 绘制方块
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = 'red';
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

// 创建玩家对象
const player = {
    pos: { x: 5, y: 0 },
    matrix: null,
    score: 0,
};

// 方块形状
const tetrominoes = [
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]], // T
    [[1, 1], [1, 1]],                   // O
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]], // S
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]], // Z
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]], // L
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]], // J
    [[1, 1, 1, 1], [0, 0, 0, 0]],      // I
];

// 随机生成一个方块
function createPiece() {
    const index = Math.floor(Math.random() * tetrominoes.length);
    return tetrominoes[index];
}

// 初始化玩家方块
player.matrix = createPiece();

// 绘制游戏区域
function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

// 合并方块到游戏区域
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// 碰撞检测
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// 消除满行
function arenaSweep(arena) {
    let rowCount = 1;
    let soundPlayed = false; // 标记是否播放了音效
    outer: for (let y = arena.length - 1; y > 0; y--) {
        for (let x = 0; x < arena[y].length; x++) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        y++;
        player.score += rowCount * 10;
        rowCount *= 2;

        // 播放消除音效
        if (!soundPlayed) {
            const clearSound = document.getElementById('clearSound');
            clearSound.currentTime = 0; // 重置音效播放时间
            clearSound.play(); // 播放音效
            soundPlayed = true; // 标记音效已播放
        }
    }
}

// 玩家下落
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep(arena);
    }
    dropCounter = 0;
}

// 重置玩家方块
function playerReset() {
    player.matrix = createPiece();
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
    }
}

// 玩家移动
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

// 旋转方块
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

// 旋转矩阵
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// 初始化游戏区域
const arena = createMatrix(COLS, ROWS);

// 游戏循环
let dropCounter = 0;
let dropInterval = 1000;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

// 键盘控制
document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'ArrowUp') {
        playerRotate(1);
    }
});

let lastTime = 0;
update();
// ...（前面的代码保持不变）

// 绑定按钮事件
document.getElementById('leftBtn').addEventListener('click', () => playerMove(-1));
document.getElementById('rightBtn').addEventListener('click', () => playerMove(1));
document.getElementById('rotateBtn').addEventListener('click', () => playerRotate(1));
document.getElementById('downBtn').addEventListener('click', () => playerDrop());

// 手机端触摸支持（防止长按触发菜单）
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 阻止默认行为（如长按菜单）
        button.click();     // 触发点击事件
    });
});