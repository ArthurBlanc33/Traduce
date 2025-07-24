const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

app.post('/translate', async (req, res) => {
    try {
        const { q, source, target } = req.body;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${source}|${target}`;
        const response = await fetch(url);
        const data = await response.json();

        res.json({ translatedText: data.responseData.translatedText });
    } catch (err) {
        console.error('Erreur proxy:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Proxy de traduction lancé sur http://localhost:${PORT}`);
});