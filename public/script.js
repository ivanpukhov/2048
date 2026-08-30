const state = {
    board: Array.from({ length: 4 }, () => Array(4).fill(0)),
    score: 0,
    highscore: 0,
    coins: 0,
    gameOver: false,
    busy: false,
}

const directions = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
}

async function request(url, options = {}) {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'request_failed')
    return payload
}

function render(nextState) {
    Object.assign(state, nextState)
    const grid = document.querySelector('.grid-container')
    grid.replaceChildren()

    state.board.flat().forEach(value => {
        const cell = document.createElement('div')
        cell.className = 'grid-cell'
        if (value) {
            cell.textContent = value
            cell.classList.add(`value-${Math.min(value, 2048)}`)
        }
        grid.appendChild(cell)
    })

    document.querySelector('.score-container').textContent = `Счёт: ${state.score}`
    document.querySelector('.best-container').textContent = `Рекорд: ${state.highscore}`
    document.querySelector('#coins').textContent = state.coins
    document.querySelector('.game-over-message').classList.toggle('show', state.gameOver)
    document.querySelector('.game-container').classList.toggle('game-over', state.gameOver)
}

async function loadGame() {
    render(await request('/api/game'))
}

async function newGame() {
    if (state.busy) return
    state.busy = true
    try {
        render(await request('/api/game/new', { method: 'POST', body: '{}' }))
    } finally {
        state.busy = false
    }
}

async function move(direction) {
    if (state.busy || state.gameOver) return
    state.busy = true
    try {
        render(await request('/api/game/move', {
            method: 'POST',
            body: JSON.stringify({ direction }),
        }))
    } finally {
        state.busy = false
    }
}

async function clearRow() {
    if (state.busy || state.gameOver) return
    state.busy = true
    try {
        render(await request('/api/game/clear-row', { method: 'POST', body: '{}' }))
    } catch (error) {
        if (error.message === 'not_enough_coins') {
            window.alert('Для очистки верхнего ряда нужно 50 монет.')
        }
    } finally {
        state.busy = false
    }
}

document.addEventListener('keydown', event => {
    const direction = directions[event.key]
    if (!direction) return
    event.preventDefault()
    move(direction)
})

document.querySelector('#new-game-button').addEventListener('click', newGame)
document.querySelector('#clear-row-button').addEventListener('click', clearRow)
loadGame().catch(() => window.location.assign('/'))
