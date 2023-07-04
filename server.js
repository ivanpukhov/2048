const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Задаем статическую папку для раздачи файлов
app.use(express.static(path.join(__dirname, 'public')));

// Обработчик для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Слушаем порт
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
