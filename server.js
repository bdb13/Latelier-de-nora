require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Autoriser la lecture du format JSON
app.use(express.json());
app.use(cors());

// Dire au serveur de rendre public ton dossier HTML/CSS
app.use(express.static(path.join(__dirname, 'public')));

// Exemple de route sécurisée (on y mettra Firebase et les emails plus tard)
app.get('/api/status', (req, res) => {
    res.json({ message: "Le serveur de L'atelier de NORA est en ligne ! 🚀" });
});

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré avec succès sur http://localhost:${PORT}`);
});