require('dotenv').config()

const express = require('express')
const session = require('express-session')
const mongoose = require('mongoose')
const passport = require('passport')
const { Strategy: LocalStrategy } = require('passport-local')
const path = require('path')

const User = require('./models/User')
const {
    addRandomTile,
    clearTopRow,
    createGame,
    hasMoves,
    move,
} = require('./game/engine')

const PORT = Number(process.env.PORT || 3000)
const DEMO_MODE = process.env.DEMO_MODE === 'true'
const CLEAR_ROW_COST = 50
const demoPlayer = { username: 'demo', highscore: 0, coins: 0 }

function requireUser(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'authentication_required' })
    next()
}

function ensureGame(req) {
    if (!req.session.game) req.session.game = createGame()
    return req.session.game
}

async function getPlayer(req) {
    if (DEMO_MODE) return demoPlayer
    return User.findById(req.user._id)
}

async function savePlayer(player) {
    if (!DEMO_MODE) await player.save()
}

function publicState(game, player, extra = {}) {
    return {
        board: game.board,
        score: game.score,
        highscore: player.highscore || 0,
        coins: player.coins || 0,
        gameOver: !hasMoves(game.board),
        ...extra,
    }
}

function buildApp() {
    const app = express()
    const sessionSecret = process.env.SESSION_SECRET || (DEMO_MODE ? 'local-demo-session' : '')
    if (!sessionSecret) throw new Error('SESSION_SECRET is required')

    app.set('view engine', 'ejs')
    if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)
    app.use(express.static(path.join(__dirname, 'public')))
    app.use(express.urlencoded({ extended: false }))
    app.use(express.json({ limit: '20kb' }))
    app.use(session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
        },
    }))

    passport.use(new LocalStrategy(User.authenticate()))
    passport.serializeUser(User.serializeUser())
    passport.deserializeUser(User.deserializeUser())
    app.use(passport.initialize())
    app.use(passport.session())

    if (DEMO_MODE) {
        app.use((req, _res, next) => {
            req.user = demoPlayer
            next()
        })
    }

    app.get('/', (req, res) => {
        res.render(path.join(__dirname, 'public', 'index.ejs'), { user: req.user, demoMode: DEMO_MODE })
    })

    app.get('/game', (req, res) => {
        if (!req.user) return res.redirect('/')
        res.sendFile(path.join(__dirname, 'public', 'game.html'))
    })

    app.get('/register', (req, res) => {
        if (req.user) return res.redirect('/')
        res.sendFile(path.join(__dirname, 'public', 'register.html'))
    })

    app.get('/login', (req, res) => {
        if (req.user) return res.redirect('/')
        res.sendFile(path.join(__dirname, 'public', 'login.html'))
    })

    app.post('/register', (req, res, next) => {
        const username = String(req.body.username || '').trim()
        const password = String(req.body.password || '')
        if (username.length < 3 || password.length < 8) {
            return res.status(400).send('Имя должно содержать минимум 3 символа, пароль — минимум 8.')
        }
        User.register(new User({ username }), password, error => {
            if (error) return next(error)
            passport.authenticate('local')(req, res, () => res.redirect('/'))
        })
    })

    app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (_req, res) => {
        res.redirect('/')
    })

    app.get('/logout', (req, res, next) => {
        req.logout(error => {
            if (error) return next(error)
            res.redirect('/')
        })
    })

    app.get('/leaderboard', async (_req, res, next) => {
        try {
            const users = DEMO_MODE
                ? [demoPlayer]
                : await User.find({}).sort({ highscore: -1 }).limit(20).lean()
            res.render(path.join(__dirname, 'public', 'leaderboard.ejs'), { users })
        } catch (error) {
            next(error)
        }
    })

    app.get('/api/game', requireUser, async (req, res, next) => {
        try {
            const player = await getPlayer(req)
            res.json(publicState(ensureGame(req), player))
        } catch (error) {
            next(error)
        }
    })

    app.post('/api/game/new', requireUser, async (req, res, next) => {
        try {
            req.session.game = createGame()
            const player = await getPlayer(req)
            res.json(publicState(req.session.game, player))
        } catch (error) {
            next(error)
        }
    })

    app.post('/api/game/move', requireUser, async (req, res, next) => {
        try {
            const direction = String(req.body.direction || '')
            if (!['up', 'down', 'left', 'right'].includes(direction)) {
                return res.status(400).json({ error: 'invalid_direction' })
            }

            const game = ensureGame(req)
            const result = move(game.board, direction)
            const player = await getPlayer(req)

            if (result.moved) {
                game.board = addRandomTile(result.board)
                game.score += result.scoreDelta
                const coinsEarned = result.scoreDelta > 0
                    ? Math.max(1, Math.floor(result.scoreDelta / 16))
                    : 0
                player.coins = Math.max(0, Number(player.coins || 0) + coinsEarned)
                player.highscore = Math.max(Number(player.highscore || 0), game.score)
                await savePlayer(player)
                return res.json(publicState(game, player, { moved: true, coinsEarned }))
            }

            res.json(publicState(game, player, { moved: false, coinsEarned: 0 }))
        } catch (error) {
            next(error)
        }
    })

    app.post('/api/game/clear-row', requireUser, async (req, res, next) => {
        try {
            const game = ensureGame(req)
            const player = await getPlayer(req)
            if (Number(player.coins || 0) < CLEAR_ROW_COST) {
                return res.status(409).json({ error: 'not_enough_coins' })
            }
            player.coins -= CLEAR_ROW_COST
            game.board = clearTopRow(game.board)
            await savePlayer(player)
            res.json(publicState(game, player))
        } catch (error) {
            next(error)
        }
    })

    app.use((error, _req, res, _next) => {
        console.error(error)
        res.status(500).json({ error: 'internal_error' })
    })

    return app
}

async function start() {
    if (!DEMO_MODE) {
        const mongoUri = process.env.MONGODB_URI
        if (!mongoUri) throw new Error('MONGODB_URI is required')
        await mongoose.connect(mongoUri)
    }
    const app = buildApp()
    app.listen(PORT, () => {
        console.log(`2048 server: http://localhost:${PORT}${DEMO_MODE ? ' (demo)' : ''}`)
    })
}

if (require.main === module) {
    start().catch(error => {
        console.error(error.message)
        process.exit(1)
    })
}

module.exports = { buildApp, start }
