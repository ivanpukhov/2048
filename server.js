const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const User = require('./models/User');
const path = require('path');
const bodyParser = require('body-parser');

mongoose.connect('mongodb://localhost/game', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
    res.render(path.join(__dirname, 'public', 'index.ejs'), { user: req.user });
});

app.get('/game', (req, res) => {
    if (!req.user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

app.get('/register', (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/register', (req, res) => {
    User.register(new User({ username: req.body.username, highscore: 0 }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.send(err);
        }

        passport.authenticate('local')(req, res, function () {
            req.login(req.user, function(err) {
                if (err) {
                    console.log(err);
                    return res.send(err);
                }
                res.redirect('/');
            });
        });
    });
});

app.post('/login', passport.authenticate('local'), (req, res) => {
    res.redirect('/');
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/highscore', (req, res) => {
    if (!req.user) return res.sendStatus(401); // 401 Unauthorized
    res.json({ highscore: req.user.highscore });
});

app.post('/highscore', (req, res) => {
    if (!req.user) return res.sendStatus(401); // 401 Unauthorized
    if (!req.body.score) return res.sendStatus(400); // 400 Bad Request

    User.findOne({ username: req.user.username }, function (err, user) {
        if (err) {
            console.log(err);
            return res.send(err);
        }

        if (!user) return res.sendStatus(404); // 404 Not Found

        if (req.body.score > user.highscore) {
            user.highscore = req.body.score;
            user.save(function (err) {
                if (err) {
                    console.log(err);
                    return res.send(err);
                }
                res.json({ message: 'High score updated', highscore: user.highscore });
            });
        } else {
            res.json({ message: 'Score not high enough', highscore: user.highscore });
        }
    });
});

app.get('/leaderboard', (req, res) => {
    User.find({}).sort({ highscore: -1 }).exec((err, users) => {
        if (err) {
            console.log(err);
            return res.send(err);
        }
        res.render(path.join(__dirname, 'public', 'leaderboard.ejs'), { users: users });
    });
});

// Получение количества монет пользователя
app.get('/coins', (req, res) => {
    if (!req.user) return res.sendStatus(401); // 401 Не авторизован
    res.json({ coins: req.user.coins });
});

// Обновление количества монет пользователя
app.post('/coins', (req, res) => {
    if (!req.user) return res.sendStatus(401); // 401 Не авторизован
    if (!req.body.amount) return res.sendStatus(400); // 400 Неверный запрос

    User.findOne({ username: req.user.username }, function (err, user) {
        if (err) {
            console.log(err);
            return res.send(err);
        }

        if (!user) return res.sendStatus(404); // 404 Не найдено

        // Проверяем, является ли значение coins числом
        if (isNaN(user.coins)) {
            user.coins = 0;
        }

        user.coins += req.body.amount; // Добавление нового количества к монетам пользователя
        user.save(function (err) {
            if (err) {
                console.log(err);
                return res.send(err);
            }
            res.json({ message: 'Монеты обновлены', coins: user.coins });
        });
    });
});

// Списание количества монет пользователя
app.post('/coins-pop', (req, res) => {
    if (!req.user) return res.sendStatus(401); // 401 Не авторизован
    if (!req.body.amount) return res.sendStatus(400); // 400 Неверный запрос

    User.findOne({ username: req.user.username }, function (err, user) {


        user.coins -= req.body.amount; // Списание указанного количества монет пользователя
        user.save(function (err) {
            if (err) {
                console.log(err);
                return res.send(err);
            }
            res.json({ message: 'Монеты списаны', coins: user.coins });
        });
    });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});

