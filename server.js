const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(':memory:');

app.use(bodyParser.json());
app.use(express.static('public'));

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS Tests (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, questions TEXT, username TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS Results (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, testTitle TEXT, score INTEGER, createdAt TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS Users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS Statistics (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, testTitle TEXT, correctAnswers INTEGER, totalQuestions INTEGER, createdAt TEXT)");
});

app.post('/api/tests', (req, res) => {
    const { title, questions, username } = req.body;
    db.run("INSERT INTO Tests (title, questions, username) VALUES (?, ?, ?)", [title, JSON.stringify(questions), username], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID });
    });
});

app.get('/api/tests', (req, res) => {
    db.all("SELECT * FROM Tests", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get('/api/test/:id', (req, res) => {
    const testId = req.params.id;
    db.get("SELECT * FROM Tests WHERE id = ?", [testId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            row.questions = JSON.parse(row.questions);
            res.json(row);
        } else {
            res.status(404).json({ error: "Test not found" });
        }
    });
});

app.post('/api/submit-test/:id', (req, res) => {
    const testId = req.params.id;
    const { answers, username } = req.body;

    db.get("SELECT * FROM Tests WHERE id = ?", [testId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            let score = 0;
            const questions = JSON.parse(row.questions);
            questions.forEach((question, index) => {
                if (question.correctAnswer === answers[index]) {
                    score++;
                }
            });

            db.run("INSERT INTO Results (username, testTitle, score, createdAt) VALUES (?, ?, ?, ?)", [username, row.title, score, new Date().toISOString()], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                db.run("INSERT INTO Statistics (username, testTitle, correctAnswers, totalQuestions, createdAt) VALUES (?, ?, ?, ?, ?)", [username, row.title, score, questions.length, new Date().toISOString()], function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ score: score });
                });
            });
        } else {
            res.status(404).json({ error: "Test not found" });
        }
    });
});

app.get('/api/results', (req, res) => {
    const username = req.query.username;
    db.all("SELECT * FROM Results WHERE username = ?", [username], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get('/api/statistics', (req, res) => {
    const username = req.query.username;
    db.all("SELECT * FROM Statistics WHERE username = ?", [username], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    db.run("INSERT INTO Users (username, email, password) VALUES (?, ?, ?)", [username, email, password], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM Users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            res.json({ message: "Login successful", user: row });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});













