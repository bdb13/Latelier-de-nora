const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 🔗 TON LIEN MONGODB ICI (Vérifie bien le mot de passe dans le lien !)
const MONGO_URI = "mongodb+srv://nora:nora123@cluster0.spqu3ym.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("☁️ Le site de Nora est connecté au coffre-fort MongoDB"))
    .catch(err => console.log("❌ Erreur de connexion :", err));

// Modèle de la commande (L'architecture des données)
const CommandeSchema = new mongoose.Schema({
    id: String, nom: String, emailClient: String, tel: String,
    total: Number, methode: String, adresse: String,
    date: String, notes: String, articles: Array, statut: String
});
const Commande = mongoose.model('Commande', CommandeSchema);

app.use(express.json());
app.use(express.static('public'));

// --- ROUTES API ---

// 1. Récupérer toutes les commandes
app.get('/api/commandes', async (req, res) => {
    try {
        const cmds = await Commande.find();
        res.json(cmds);
    } catch (err) { res.status(500).json(err); }
});

// 2. Enregistrer une nouvelle commande
app.post('/api/commandes', async (req, res) => {
    try {
        const nouvelle = new Commande(req.body);
        await nouvelle.save();
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

// 3. Mettre à jour un statut
app.put('/api/commandes/:id', async (req, res) => {
    try {
        await Commande.findOneAndUpdate({ id: req.params.id }, { statut: req.body.statut });
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

// 4. Supprimer une commande
app.delete('/api/commandes/:id', async (req, res) => {
    try {
        await Commande.findOneAndDelete({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));
