let board;
let score;
let size = 4;

window.onload = function() {
    newGame();
    loadBestScore();
    document.getElementById('new-game-button').addEventListener('click', newGame);
    document.addEventListener('keydown', handleKey);
};

function newGame() {
    board = [];
    for (let i = 0; i < size; i++) {
        board[i] = [];
        for (let j = 0; j < size; j++) {
            board[i][j] = 0;
        }
    }

    score = 0;
    updateScore();
    addRandomTile();
    addRandomTile();
    updateBoardView();
}

function handleKey(e) {
    let boardChanged = false;
    if (e.key == 'ArrowRight') {
        boardChanged = moveRight();
    } else if (e.key == 'ArrowLeft') {
        boardChanged = moveLeft();
    } else if (e.key == 'ArrowUp') {
        boardChanged = moveUp();
    } else if (e.key == 'ArrowDown') {
        boardChanged = moveDown();
    }

    if (boardChanged) {
        addRandomTile();
        updateBoardView();
        updateScore();
        saveScore();
        updateBestScore();
    }
}

function addRandomTile() {
    let emptyCells = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (board[i][j] == 0) {
                emptyCells.push({x: i, y: j});
            }
        }
    }
    let randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    let randomNumber = (Math.random() > 0.5) ? 2 : 4;
    board[randomCell.x][randomCell.y] = randomNumber;
}

function moveRight() {
    let boardChanged = false;
    for (let i = 0; i < size; i++) {
        for (let j = size - 2; j >= 0; j--) {
            if (board[i][j] !== 0) {
                let col = j;
                while (col + 1 < size) {
                    if (board[i][col + 1] === 0) {
                        board[i][col + 1] = board[i][col];
                        board[i][col] = 0;
                        col++;
                        boardChanged = true;
                    } else if (board[i][col] == board[i][col + 1]) {
                        board[i][col + 1] *= 2;
                        score += board[i][col + 1];
                        board[i][col] = 0;
                        boardChanged = true;
                        break;
                    } else {
                        break;
                    }
                }
            }
        }
    }
    return boardChanged;
}

function moveLeft() {
    let boardChanged = false;
    for (let i = 0; i < size; i++) {
        for (let j = 1; j < size; j++) {
            if (board[i][j] !== 0) {
                let col = j;
                while (col - 1 >= 0) {
                    if (board[i][col - 1] === 0) {
                        board[i][col - 1] = board[i][col];
                        board[i][col] = 0;
                        col--;
                        boardChanged = true;
                    } else if (board[i][col] == board[i][col - 1]) {
                        board[i][col - 1] *= 2;
                        score += board[i][col - 1];
                        board[i][col] = 0;
                        boardChanged = true;
                        break;
                    } else {
                        break;
                    }
                }
            }
        }
    }
    return boardChanged;
}

function moveUp() {
    let boardChanged = false;
    for (let j = 0; j < size; j++) {
        for (let i = 1; i < size; i++) {
            if (board[i][j] !== 0) {
                let row = i;
                while (row - 1 >= 0) {
                    if (board[row - 1][j] === 0) {
                        board[row - 1][j] = board[row][j];
                        board[row][j] = 0;
                        row--;
                        boardChanged = true;
                    } else if (board[row][j] == board[row - 1][j]) {
                        board[row - 1][j] *= 2;
                        score += board[row - 1][j];
                        board[row][j] = 0;
                        boardChanged = true;
                        break;
                    } else {
                        break;
                    }
                }
            }
        }
    }
    return boardChanged;
}

function moveDown() {
    let boardChanged = false;
    for (let j = 0; j < size; j++) {
        for (let i = size - 2; i >= 0; i--) {
            if (board[i][j] !== 0) {
                let row = i;
                while (row + 1 < size) {
                    if (board[row + 1][j] === 0) {
                        board[row + 1][j] = board[row][j];
                        board[row][j] = 0;
                        row++;
                        boardChanged = true;
                    } else if (board[row][j] == board[row + 1][j]) {
                        board[row + 1][j] *= 2;
                        score += board[row + 1][j];
                        board[row][j] = 0;
                        boardChanged = true;
                        break;
                    } else {
                        break;
                    }
                }
            }
        }
    }
    return boardChanged;
}

function updateScore() {
    document.querySelector('.score-container').innerText = "Score: " + score;
}

function saveScore() {
    window.localStorage.setItem('2048-score', score);
}

function loadScore() {
    score = window.localStorage.getItem('2048-score') || 0;
    updateScore();
}

function updateBestScore() {
    let bestScore = window.localStorage.getItem('2048-best-score') || 0;
    if (score > bestScore) {
        window.localStorage.setItem('2048-best-score', score);
        document.querySelector('.best-container').innerText = "Best: " + score;
    }
}

function loadBestScore() {
    let bestScore = window.localStorage.getItem('2048-best-score') || 0;
    document.querySelector('.best-container').innerText = "Best: " + bestScore;
}

function updateBoardView() {
    let grid = document.querySelector('.grid-container');
    grid.innerHTML = '';
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let cell = document.createElement('div');
            cell.innerText = board[i][j] == 0 ? '' : board[i][j];
            cell.classList.add('grid-cell');
            if (board[i][j] !== 0) cell.classList.add('value-' + board[i][j]);
            grid.appendChild(cell);
        }
    }
}
