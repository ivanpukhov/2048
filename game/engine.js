const BOARD_SIZE = 4
const DIRECTIONS = new Set(['up', 'down', 'left', 'right'])

function emptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0))
}

function cloneBoard(board) {
    return board.map(row => [...row])
}

function addRandomTile(board, random = Math.random) {
    const next = cloneBoard(board)
    const empty = []

    for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let column = 0; column < BOARD_SIZE; column += 1) {
            if (next[row][column] === 0) empty.push([row, column])
        }
    }

    if (empty.length === 0) return next
    const index = Math.min(empty.length - 1, Math.floor(random() * empty.length))
    const [row, column] = empty[index]
    next[row][column] = random() < 0.9 ? 2 : 4
    return next
}

function createGame(random = Math.random) {
    let board = addRandomTile(emptyBoard(), random)
    board = addRandomTile(board, random)
    return { board, score: 0 }
}

function mergeLine(line) {
    const compact = line.filter(value => value !== 0)
    const merged = []
    let scoreDelta = 0

    for (let index = 0; index < compact.length; index += 1) {
        const value = compact[index]
        if (value === compact[index + 1]) {
            const combined = value * 2
            merged.push(combined)
            scoreDelta += combined
            index += 1
        } else {
            merged.push(value)
        }
    }

    while (merged.length < BOARD_SIZE) merged.push(0)
    return { line: merged, scoreDelta }
}

function readLine(board, direction, index) {
    if (direction === 'left') return [...board[index]]
    if (direction === 'right') return [...board[index]].reverse()
    if (direction === 'up') return board.map(row => row[index])
    return board.map(row => row[index]).reverse()
}

function writeLine(board, direction, index, line) {
    const values = direction === 'right' || direction === 'down' ? [...line].reverse() : line
    if (direction === 'left' || direction === 'right') {
        board[index] = values
        return
    }
    for (let row = 0; row < BOARD_SIZE; row += 1) board[row][index] = values[row]
}

function move(board, direction) {
    if (!DIRECTIONS.has(direction)) throw new Error('Unknown direction')

    const next = cloneBoard(board)
    let scoreDelta = 0

    for (let index = 0; index < BOARD_SIZE; index += 1) {
        const result = mergeLine(readLine(board, direction, index))
        writeLine(next, direction, index, result.line)
        scoreDelta += result.scoreDelta
    }

    return {
        board: next,
        moved: JSON.stringify(next) !== JSON.stringify(board),
        scoreDelta,
    }
}

function hasMoves(board) {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let column = 0; column < BOARD_SIZE; column += 1) {
            if (board[row][column] === 0) return true
            if (board[row + 1]?.[column] === board[row][column]) return true
            if (board[row][column + 1] === board[row][column]) return true
        }
    }
    return false
}

function clearTopRow(board) {
    const next = cloneBoard(board)
    next[0] = Array(BOARD_SIZE).fill(0)
    return next
}

module.exports = {
    BOARD_SIZE,
    addRandomTile,
    clearTopRow,
    createGame,
    hasMoves,
    mergeLine,
    move,
}
