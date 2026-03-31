const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));
app.get('/support', (req, res) => res.sendFile(path.join(__dirname, 'public', 'support.html')));
app.get('/masterclass', (req, res) => res.sendFile(path.join(__dirname, 'public', 'masterclass.html')));
app.get('/ai-business-stack', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ai-business-stack.html')));

app.listen(PORT, () => console.log(`Point Zero AI running on port ${PORT}`));
