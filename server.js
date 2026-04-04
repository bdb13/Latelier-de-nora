const express = require('express');
const path = require('path');
const fs = require('fs'); // Pour lire et écrire des fichiers
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Chemin vers le fichier qui va stocker les commandes
const DATA_FILE = path.join(__dirname, 'commandes.json');

// --- ROUTE 1 : RÉCUPÉRER LES COMMANDES ---
app.get('/api/commandes', (req, res) => {
    if (!fs.existsSync(DATA_FILE)) return res.json([]);
    const data = fs.readFileSync(DATA_FILE);
    res.json(JSON.parse(data));
});

// --- ROUTE 2 : ENREGISTRER UNE NOUVELLE COMMANDE ---
app.post('/api/commandes', (req, res) => {
    let commandes = [];
    if (fs.existsSync(DATA_FILE)) {
        commandes = JSON.parse(fs.readFileSync(DATA_FILE));
    }
    commandes.push(req.body);
    fs.writeFileSync(DATA_FILE, JSON.stringify(commandes, null, 2));
    res.json({ success: true });
});

// --- ROUTE 3 : SUPPRIMER UNE COMMANDE ---
app.delete('/api/commandes/:id', (req, res) => {
    if (!fs.existsSync(DATA_FILE)) return res.status(404).send();
    let commandes = JSON.parse(fs.readFileSync(DATA_FILE));
    commandes = commandes.filter(c => c.id !== req.params.id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(commandes, null, 2));
    res.json({ success: true });
});

// --- ROUTE 4 : CHANGER LE STATUT ---
app.put('/api/commandes/:id', (req, res) => {
    let commandes = JSON.parse(fs.readFileSync(DATA_FILE));
    const index = commandes.findIndex(c => c.id === req.params.id);
    if (index !== -1) {
        commandes[index].statut = req.body.statut;
        fs.writeFileSync(DATA_FILE, JSON.stringify(commandes, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).send();
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serveur de Nora lancé sur http://localhost:${PORT}`);
});
