const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 🔗 TON LIEN MONGODB (Intégré avec le bon mot de passe)
const MONGO_URI = "mongodb+srv://nora:nora123@cluster0.spqu3ym.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("☁️ Le site de Nora est connecté au coffre-fort MongoDB"))
    .catch(err => console.log("❌ Erreur de connexion :", err));

// --- MODÈLES DE DONNÉES ---
const CommandeSchema = new mongoose.Schema({
    id: String, nom: String, emailClient: String, tel: String,
    total: Number, methode: String, adresse: String,
    date: String, heure: String, notes: String, articles: Array, statut: String
});
const Commande = mongoose.model('Commande', CommandeSchema);

const UtilisateurSchema = new mongoose.Schema({
    nom: String, tel: String, email: String, mdp: String
});
const Utilisateur = mongoose.model('Utilisateur', UtilisateurSchema);

app.use(express.json());
app.use(express.static('public'));

// --- ROUTES COMMANDES ---
app.get('/api/commandes', async (req, res) => {
    try { res.json(await Commande.find()); } catch (err) { res.status(500).json(err); }
});
app.post('/api/commandes', async (req, res) => {
    try { await new Commande(req.body).save(); res.json({ success: true }); } catch (err) { res.status(500).json(err); }
});
app.put('/api/commandes/:id', async (req, res) => {
    try { await Commande.findOneAndUpdate({ id: req.params.id }, { statut: req.body.statut }); res.json({ success: true }); } catch (err) { res.status(500).json(err); }
});
app.delete('/api/commandes/:id', async (req, res) => {
    try { await Commande.findOneAndDelete({ id: req.params.id }); res.json({ success: true }); } catch (err) { res.status(500).json(err); }
});

// --- ROUTES UTILISATEURS ---
app.get('/api/utilisateurs', async (req, res) => {
    try { res.json(await Utilisateur.find()); } catch (err) { res.status(500).json(err); }
});
app.post('/api/utilisateurs', async (req, res) => {
    try { await new Utilisateur(req.body).save(); res.json({ success: true }); } catch (err) { res.status(500).json(err); }
});
app.put('/api/utilisateurs/:email', async (req, res) => {
    try { await Utilisateur.findOneAndUpdate({ email: req.params.email }, { mdp: req.body.mdp }); res.json({ success: true }); } catch (err) { res.status(500).json(err); }
});
app.delete('/api/utilisateurs/:email', async (req, res) => {
    try { await Utilisateur.findOneAndDelete({ email: req.params.email }); res.json({ success: true }); } catch (err) { res.status(500).json(err); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));
