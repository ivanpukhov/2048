let board;
let score;
let size = 4;
let lastModalShow = Date.now(); // Добавьте эту строку
let gameOver = false;
let isModal = false
window.onload = function () {
    loadBestScore();
    document.getElementById('new-game-button').addEventListener('click', newGame);
    document.addEventListener('keydown', handleKey);
    document.getElementById('clear-row-button').addEventListener('click', clearRow);
    fetchCoins()
};

function getUserCoins() {
    fetch('/coins', {
        method: 'GET'
    })
        .then(response => response.json())
        .then(data => {
            userCoins = data.coins;
        })
        .catch(error => console.error('Ошибка:', error));
}

// Вызов функции getUserCoins для получения текущего количества монет пользователя
function clearRow() {
    if (gameOver) return;

    const cost = 50; // Стоимость для очистки ряда

    // Проверяем, достаточно ли у пользователя монет для списания
    if (userCoins < cost) {
        alert('Недостаточно монет для выполнения операции');
        return;
    }

    // Вычитаем стоимость из общего количества монет пользователя
    updateCoinsPop(cost);

    // Очищаем верхний ряд (индекс 0)
    for (let j = 0; j < size; j++) {
        board[0][j] = 0;
    }

    updateBoardView();

}


function fetchCoins() {
    fetch('/coins')
        .then(response => response.json())
        .then(data => {
            const coinsElement = document.getElementById('coins');
            if (coinsElement) {
                coinsElement.textContent = data.coins;
            }
        })
        .catch(error => console.error('Ошибка:', error));
}

// Обновление количества монет пользователя
function updateCoins(amount) {
    fetch('/coins', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({amount: amount})
    })
        .then(response => response.json())
        .then(data => {
            const coinsElement = document.getElementById('coins');
            if (coinsElement) {
                coinsElement.textContent = data.coins;
            }
        })
        .catch(error => console.error('Ошибка:', error));
}

function updateCoinsPop(amount) {
    fetch('/coins-pop', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({amount: amount})
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Недостаточно монет для списания');
            }
            return response.json();
        })
        .then(data => {
            const coinsElement = document.getElementById('coins');
            if (coinsElement) {
                coinsElement.textContent = data.coins;
            }
        })
        .catch(error => {
            alert(error.message);
            console.error('Ошибка:', error);
        });
}

let modal = document.getElementById("modal");
let btn = document.getElementById("clear-row-button");
let span = document.getElementsByClassName("close")[0];

function checkEmptyCells() {
    let emptyCellsCount = 0;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (board[i][j] == 0) {
                emptyCellsCount++;
            }
        }
    }

    if (emptyCellsCount === 1 && Date.now() - lastModalShow > 30000) {
        isModal = true;
        modal.style.display = "block";
        lastModalShow = Date.now();
        setTimeout(function () {
            modal.style.display = "none";
            isModal = false;

        }, 5000);
    }
}

btn.onclick = function () {
    modal.style.display = "none";

}

span.onclick = function () {
    modal.style.display = "none";
}

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

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
    getUserCoins();

    updateBoardView();
    gameOver = false;

    document.querySelector('.game-container').classList.remove('game-over');
    document.querySelector('.game-over-message').classList.remove('show');

    document.querySelector('.game-container').classList.remove('hidden');
    document.querySelector('.score-container').classList.remove('hidden');
    document.querySelector('.header').classList.remove('center');
}

function handleKey(e) {
    if (gameOver) return;
    if (isModal) return;

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

        if (!movesAvailable()) {
            gameOver = true;
            endGame();
        }
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
    checkEmptyCells()
}

function saveScore() {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/highscore', true);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
        }
    };
    const data = JSON.stringify({score: score});
    xhr.send(data);


}

function loadScore() {
    score = window.localStorage.getItem('2048-score') || 0;
    updateScore();
}


function updateBestScore() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/highscore', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            const bestScore = response.highscore;
            document.querySelector('.best-container').innerText = "Best: " + bestScore;
        }
    };
    xhr.send();
}

function loadBestScore() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/highscore', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            const bestScore = response.highscore;
            document.querySelector('.best-container').innerText = "Best: " + bestScore;
        }
    };
    xhr.send();
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

function movesAvailable() {
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (board[i][j] === 0) {
                return true;
            }
            if (i > 0 && board[i][j] === board[i - 1][j]) {
                return true;
            }
            if (j > 0 && board[i][j] === board[i][j - 1]) {
                return true;
            }
        }
    }
    return false;
}

function endGame() {
    document.querySelector('.game-container').classList.add('game-over');
    document.querySelector('.game-over-message').classList.add('show');
    updateCoins(Math.round(score / 50))

}


