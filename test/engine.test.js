const test = require('node:test')
const assert = require('node:assert/strict')

const { addRandomTile, clearTopRow, hasMoves, mergeLine, move } = require('../game/engine')

test('merges every tile only once', () => {
    assert.deepEqual(mergeLine([2, 2, 2, 2]), {
        line: [4, 4, 0, 0],
        scoreDelta: 8,
    })
})

test('moves a board to the left and returns server-side score', () => {
    const board = [
        [2, 0, 2, 2],
        [0, 0, 0, 0],
        [4, 4, 8, 8],
        [2, 4, 8, 16],
    ]

    const result = move(board, 'left')

    assert.deepEqual(result.board[0], [4, 2, 0, 0])
    assert.deepEqual(result.board[2], [8, 16, 0, 0])
    assert.equal(result.scoreDelta, 28)
    assert.equal(result.moved, true)
})

test('adds a tile to a deterministic empty cell', () => {
    const board = Array.from({ length: 4 }, () => Array(4).fill(0))
    const randomValues = [0, 0]
    const result = addRandomTile(board, () => randomValues.shift())

    assert.equal(result[0][0], 2)
    assert.equal(board[0][0], 0)
})

test('detects a board without legal moves', () => {
    const board = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
    ]

    assert.equal(hasMoves(board), false)
})

test('clears the top row without mutating the board', () => {
    const board = Array.from({ length: 4 }, () => [2, 4, 8, 16])
    const result = clearTopRow(board)

    assert.deepEqual(result[0], [0, 0, 0, 0])
    assert.deepEqual(board[0], [2, 4, 8, 16])
})
