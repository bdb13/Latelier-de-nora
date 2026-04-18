// --- CONFIGURATION EMAILJS ---
const EMAILJS_SERVICE_ID = "service_x7f97zd";
const EMAILJS_PUBLIC_KEY = "4gDY60-yYSsIDN7sU";
const TEMPLATE_NOUVELLE_COMMANDE = "template_uejzl8o";
const TEMPLATE_CHANGEMENT_STATUT = "template_91s0ptq";

if (typeof emailjs !== 'undefined') { emailjs.init(EMAILJS_PUBLIC_KEY); }

let panier = JSON.parse(localStorage.getItem('panierNora')) || [];
let utilisateurConnecte = JSON.parse(localStorage.getItem('utilisateurActuelNora')) || null;
let commandes = []; // Depuis MongoDB
let utilisateurs = []; // Depuis MongoDB

// --- GESTION ACCÈS & AUTH ---
function verifierAccesPages() {
    const pageActuelle = window.location.pathname;
    if ((pageActuelle.includes("suivi.html") || pageActuelle.includes("commande.html")) && !utilisateurConnecte) {
        window.location.href = "connexion.html";
    }
    if (pageActuelle.includes("admin.html") && (!utilisateurConnecte || utilisateurConnecte.email !== "latelierdenora.stg@gmail.com")) {
        window.location.href = "index.html";
    }
}
verifierAccesPages();

function toggleSousMenu(e) {
    e.preventDefault();
    const dropdown = e.target.nextElementSibling;
    if (dropdown && dropdown.classList.contains('dropdown-content')) {
        dropdown.classList.toggle('show-sous-menu');
    }
}

function mettreAJourInterfaceAuth() {
    const blocMenu = document.getElementById('menu-auth-dynamique');
    if (!blocMenu) return;
    if (utilisateurConnecte) {
        let prenom = utilisateurConnecte.nom.split(' ')[0];
        let menuAdmin = utilisateurConnecte.email === "latelierdenora.stg@gmail.com" 
            ? `<a href="admin.html" style="color: red; font-weight: bold;">⚙️ Espace Admin</a>` : '';
        
        blocMenu.innerHTML = `
            <div class="menu-profil">
                <button class="bouton-profil" onclick="toggleSousMenu(event)">👤 ${prenom} ▼</button>
                <div class="dropdown-content">
                    <a href="suivi.html">📦 Mes commandes</a>
                    <a href="#" onclick="seDeconnecter()">🚪 Déconnexion</a>
                    <a href="#" onclick="supprimerMonCompte()" style="color: #c0392b; border-top: 1px solid #f0f0f0; font-size: 0.9rem;">❌ Supprimer mon compte</a>
                    ${menuAdmin}
                </div>
            </div>`;
    } else {
        blocMenu.innerHTML = `<a href="connexion.html" class="bouton-profil">Connexion</a>`;
    }
}

function seDeconnecter() { localStorage.removeItem('utilisateurActuelNora'); window.location.href = "index.html"; }

function supprimerMonCompte() {
    if (confirm("⚠️ Êtes-vous sûr de vouloir supprimer votre compte définitivement ? Cette action est irréversible.")) {
        fetch(`/api/utilisateurs/${utilisateurConnecte.email}`, { method: 'DELETE' })
        .then(() => { localStorage.removeItem('utilisateurActuelNora'); alert("Votre compte a bien été supprimé. À bientôt !"); window.location.href = "index.html"; });
    }
}

function motDePasseOublie() {
    let emailSaisi = prompt("🔒 Réinitialisation : \nVeuillez entrer l'adresse email de votre compte :");
    if (!emailSaisi) return; emailSaisi = emailSaisi.trim();
    if (emailSaisi === "latelierdenora.stg@gmail.com") { alert("⚠️ Le mot de passe administrateur est bloqué par sécurité."); return; }

    let indexUtilisateur = utilisateurs.findIndex(u => u.email === emailSaisi);
    if (indexUtilisateur === -1) { alert("❌ Aucun compte trouvé avec cette adresse email."); return; }

    let telSaisi = prompt("📱 Par mesure de sécurité, veuillez confirmer le numéro de téléphone lié à votre compte :");
    if (telSaisi && telSaisi.replace(/\s/g, '') === utilisateurs[indexUtilisateur].tel.replace(/\s/g, '')) {
        let nouveauMdp = prompt("✅ Identité vérifiée ! \nEntrez votre nouveau mot de passe :");
        if (nouveauMdp && nouveauMdp.length >= 4) {
            fetch(`/api/utilisateurs/${emailSaisi}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mdp: nouveauMdp }) })
            .then(() => { alert("✨ Votre mot de passe a été modifié avec succès ! Vous pouvez maintenant vous connecter."); location.reload(); });
        } else { alert("❌ Le mot de passe est trop court ou a été annulé."); }
    } else { alert("❌ Numéro de téléphone incorrect. La réinitialisation a été annulée."); }
}

function toggleVisibiliteMdp(inputId, btnOeil) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        btnOeil.innerText = "🙈"; 
    } else {
        input.type = "password";
        btnOeil.innerText = "👁️"; 
    }
}

// --- CONNEXION / INSCRIPTION ---
const formConnexion = document.getElementById('form-connexion');
const formInscription = document.getElementById('form-inscription');

if (formConnexion) {
    formConnexion.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email-connexion').value.trim();
        const mdp = document.getElementById('mdp-connexion').value;

        if (email === "latelierdenora.stg@gmail.com" && mdp === "latelierdenora") {
            localStorage.setItem('utilisateurActuelNora', JSON.stringify({ nom: "Nora (Admin)", email: email }));
            window.location.href = "admin.html"; return;
        }

        const userTrouve = utilisateurs.find(u => u.email === email && u.mdp === mdp);
        if (userTrouve) {
            localStorage.setItem('utilisateurActuelNora', JSON.stringify({nom: userTrouve.nom, tel: userTrouve.tel, email: userTrouve.email}));
            window.location.href = "index.html";
        } else { alert("❌ Identifiants incorrects."); }
    });
}

if (formInscription) {
    formInscription.addEventListener('submit', (e) => {
        e.preventDefault();
        const nom = document.getElementById('nom-inscr').value.trim();
        const tel = document.getElementById('tel-inscr').value.trim();
        const email = document.getElementById('email-inscr').value.trim();
        const mdp = document.getElementById('mdp-inscr');
        const mdpConf = document.getElementById('mdp-inscr-conf');
        const msgErreur = document.getElementById('erreur-mdp');

        mdp.classList.remove('input-erreur');
        mdpConf.classList.remove('input-erreur');
        msgErreur.style.display = 'none';

        if (mdp.value !== mdpConf.value) {
            mdp.classList.add('input-erreur');
            mdpConf.classList.add('input-erreur');
            msgErreur.style.display = 'block';
            return; 
        }
        
        if (utilisateurs.find(u => u.email === email)) return alert("Cet email est déjà utilisé.");
        
        fetch('/api/utilisateurs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nom, tel, email, mdp: mdp.value }) })
        .then(() => { localStorage.setItem('utilisateurActuelNora', JSON.stringify({nom, tel, email})); window.location.href = "index.html"; });
    });
}

function switchForm(versConnexion) {
    document.getElementById('bloc-connexion').style.display = versConnexion ? 'block' : 'none'; 
    document.getElementById('bloc-inscription').style.display = versConnexion ? 'none' : 'block';
}

// --- FONCTIONS EMAILS ---
async function envoyerMailCommande(commande) {
    if (typeof emailjs === 'undefined') return;
    let texteHeure = commande.methode === 'stand' ? 'Matin (9h - 12h)' : commande.heure;
    
    const templateParams = {
        to_name: commande.nom, to_email: commande.emailClient, admin_email: "latelierdenora.stg@gmail.com",
        order_id: commande.id, total: commande.total.toFixed(2),
        date: `${new Date(commande.date).toLocaleDateString('fr-FR')} à ${texteHeure}`,
        articles: commande.articles.map(a => `${a.quantite}x ${a.nom}`).join(', '), notes: commande.notes
    };
    await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_NOUVELLE_COMMANDE, templateParams);
    templateParams.to_email = "latelierdenora.stg@gmail.com"; templateParams.to_name = "Nora";
    await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_NOUVELLE_COMMANDE, templateParams);
}

async function envoyerMailStatut(commande) {
    if (typeof emailjs === 'undefined') return;
    let texteStatut = commande.statut === 'preparation' ? "est maintenant en préparation" : "est prête !";
    return emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_CHANGEMENT_STATUT, { to_name: commande.nom, to_email: commande.emailClient, order_id: commande.id, statut_label: texteStatut });
}

// --- FONCTION WHATSAPP ---
function envoyerWhatsApp(idCmd) {
    const cmd = commandes.find(c => c.id === idCmd);
    if (!cmd) return;

    let prenom = cmd.nom.split(' ')[0];
    let texteHeure = cmd.methode === 'stand' ? 'le matin entre 9h et 12h' : `à ${cmd.heure}`;
    let dateF = new Date(cmd.date).toLocaleDateString('fr-FR');
    
    let phraseStatut = "";
    if(cmd.statut === 'recu') phraseStatut = "est bien enregistrée ! ✨";
    else if(cmd.statut === 'preparation') phraseStatut = "est maintenant en préparation... 🍪";
    else phraseStatut = "est prête ! Tu peux venir la récupérer. ✨";

    let modeTexte = cmd.methode === 'stand' ? 'Retrait au Marché' : (cmd.methode === 'maison' ? 'Retrait chez Nora' : 'Livraison');
    let message = `Coucou ${prenom} ! C'est Nora de l'Atelier. Ta commande ${cmd.id} ${phraseStatut}\n\n📅 Prévue le : ${dateF} ${texteHeure}\n📦 Mode : ${modeTexte}\n\nÀ très vite ! 👩‍🍳`;
    
    let telPropre = cmd.tel.replace(/\s/g, '');
    if (telPropre.startsWith('0')) telPropre = '33' + telPropre.substring(1);

    window.open(`https://wa.me/${telPropre}?text=${encodeURIComponent(message)}`, '_blank');
}

// --- GESTION PANIER ---
function modifierQuantiteProduit(ch) { let i = document.getElementById('qte-produit'); if(i){let n=parseInt(i.value)+ch; if(n>=1)i.value=n;} }
function ajouterDepuisProduit(n,p,im) { ajouterAuPanier(n,p,im,parseInt(document.getElementById('qte-produit')?.value || 1)); }
function ajouterAuPanier(n,p,im,q=1) { 
    let e=panier.find(i=>i.nom===n); if(e)e.quantite+=q; else panier.push({nom:n,prix:p,image:im,quantite:q});
    localStorage.setItem('panierNora', JSON.stringify(panier)); mettreAJourCompteur(); afficherToast(`${q}x ${n} ajouté(s) !`);
}
function mettreAJourCompteur() { 
    let t=0; panier.forEach(a=>t+=parseInt(a.quantite)||0); 
    let l=document.querySelector('nav a[href="panier.html"]'); if(l)l.innerHTML = t>0?`Mon Panier <span class="badge-panier">${t}</span>`:`Mon Panier`;
    mettreAJourInterfaceAuth();
}
function calculerTotal(){return panier.reduce((t,i)=>t+(i.prix*i.quantite),0);}

function afficherPanier() {
    const conteneur = document.getElementById('contenu-panier'); const affichageTotal = document.getElementById('total-panier'); const btnValider = document.getElementById('btn-valider');
    if (!conteneur) return;
    if (panier.length === 0) { conteneur.innerHTML = "<p style='text-align:center;'>Votre panier est vide.</p>"; if(btnValider) btnValider.style.display = 'none'; if(affichageTotal) affichageTotal.innerText = "0.00"; return; }
    let html = ''; let totalG = 0;
    panier.forEach((item, index) => {
        let st = item.prix * item.quantite; totalG += st;
        html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px solid #eee;"><div style="display:flex; align-items:center; gap:15px;"><img src="${item.image}" style="width:50px; height:50px; border-radius:5px; object-fit:cover;"><div><b style="color:var(--pine-green);">${item.nom}</b><br><input type="number" value="${item.quantite}" min="1" onchange="modifierQte(${index}, this.value)" style="width:40px;"></div></div><span style="color:var(--gold-accent); font-weight:bold;">${st.toFixed(2)} €</span><button onclick="supprimerArticle(${index})" style="color:red; border:none; background:none; cursor:pointer;">✕</button></div>`;
    });
    conteneur.innerHTML = html; if(affichageTotal) affichageTotal.innerText = totalG.toFixed(2);
    if(btnValider) { btnValider.style.display = 'block'; btnValider.innerText = utilisateurConnecte ? "Passer à la commande" : "Connectez-vous pour commander"; btnValider.onclick = () => { window.location.href = utilisateurConnecte ? "commande.html" : "connexion.html"; }; }
}
function modifierQte(i, v) { panier[i].quantite = Math.max(1, parseInt(v)||1); localStorage.setItem('panierNora', JSON.stringify(panier)); mettreAJourCompteur(); afficherPanier(); }
function supprimerArticle(i) { panier.splice(i, 1); localStorage.setItem('panierNora', JSON.stringify(panier)); mettreAJourCompteur(); afficherPanier(); }

function afficherToast(m) {
    let t = document.createElement('div'); t.className = 'toast-notification'; t.innerHTML = `✨ ${m}`;
    document.body.appendChild(t); setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3000);
}

// ==========================================
// CARTES, ADRESSES & HORAIRES
// ==========================================
let adresseValide = false; 
let map; let markerClient;
let mapNora; const coordNora = [43.454482, 5.487940];
const centreGardanne = [43.4542, 5.4697];

function initFreeMap() {
    const mapDiv = document.getElementById('map');
    if (!mapDiv || map) return; 
    map = L.map('map').setView(centreGardanne, 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
    L.circle(centreGardanne, { color: '#c5a059', fillColor: '#c5a059', fillOpacity: 0.15, radius: 15000 }).addTo(map);
    L.marker(centreGardanne).addTo(map).bindPopup("L'atelier de NORA").openPopup();
}

async function rechercherAdresse(query) {
    if (query.length < 5) return;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=fr&limit=5`);
        const data = await res.json();
        if (data && data.length > 0) {
            const errDistance = document.getElementById('erreur-distance');
            let meilleurResultat = data[0]; let minDistance = Infinity;
            for (let place of data) {
                const latLngTest = [parseFloat(place.lat), parseFloat(place.lon)];
                const distTest = map.distance(centreGardanne, latLngTest) / 1000;
                if (distTest < minDistance) { minDistance = distTest; meilleurResultat = place; }
            }
            const latLngFinal = [parseFloat(meilleurResultat.lat), parseFloat(meilleurResultat.lon)];
            const distFinal = minDistance;
            if (markerClient) map.removeLayer(markerClient);
            markerClient = L.marker(latLngFinal).addTo(map); map.setView(latLngFinal, 13);
            const adresseTrouvee = meilleurResultat.display_name.split(',').slice(0, 2).join(',');

            if (distFinal > 15) {
                if(errDistance) { errDistance.style.display = 'block'; errDistance.style.color = 'red'; errDistance.innerHTML = `⚠️ Trop loin : <b>${distFinal.toFixed(1)}km</b>.<br>📍 <i>Trouvé : ${adresseTrouvee}</i><br>👉 Précisez votre code postal.`; }
                adresseValide = false;
            } else {
                if(errDistance) { errDistance.style.display = 'block'; errDistance.style.color = 'green'; errDistance.innerHTML = `✅ Parfait ! <b>${distFinal.toFixed(1)}km</b>.<br>📍 <i>Validé : ${adresseTrouvee}</i>`; }
                adresseValide = true;
            }
        }
    } catch (error) { console.error(error); }
}

function genererHeuresLibres(dateChoisieStr, jourSemaine) {
    const heureSelect = document.getElementById('heure-retrait');
    if (!heureSelect) return;
    heureSelect.innerHTML = '<option value="" disabled selected>Choisissez une heure</option>';
    
    // Nouveaux jours de marché de Nora : 0=Dimanche, 2=Mardi, 5=Vendredi, 6=Samedi
    let estJourDeMarche = [0, 2, 5, 6].includes(jourSemaine);
    
    // Si c'est un jour de marché, livraison/retrait maison à partir de 14h, sinon 9h
    let heureDebut = estJourDeMarche ? 14 : 9;
    let commandesCeJour = commandes.filter(c => c.date === dateChoisieStr && c.methode !== 'stand');

    for (let h = heureDebut; h <= 19; h++) {
        ['00', '30'].forEach(min => {
            if (h === 19 && min === '30') return; 
            
            let formatHeure = `${String(h).padStart(2, '0')}:${min}`;
            let option = document.createElement('option');
            option.value = formatHeure;

            let estPris = commandesCeJour.some(c => c.heure === formatHeure);
            if (estPris) {
                option.disabled = true; option.innerText = `❌ ${formatHeure} - Indisponible`; option.style.color = "red";
            } else {
                option.innerText = `✅ ${formatHeure}`;
            }
            heureSelect.appendChild(option);
        });
    }
}

// ==========================================
// SOUMISSION DE COMMANDE -> REDIRECTION STRIPE
// ==========================================
const formCmd = document.getElementById('form-commande');
if (formCmd) {
    formCmd.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!utilisateurConnecte) return alert("❌ Vous devez être connecté pour commander.");
        if (panier.length === 0) return alert("Votre panier est vide.");

        const dateChoisie = document.getElementById('date-retrait').value;
        const minDateObj = new Date(); minDateObj.setDate(minDateObj.getDate() + 5); 
        const minDateVerification = `${minDateObj.getFullYear()}-${String(minDateObj.getMonth() + 1).padStart(2, '0')}-${String(minDateObj.getDate()).padStart(2, '0')}`;
        
        if (dateChoisie < minDateVerification) {
            return alert("⚠️ La date choisie est trop proche. L'Atelier a besoin de 5 jours minimum pour préparer votre commande.");
        }

        const methodeChoisie = document.querySelector('input[name="recuperation"]:checked').value;
        let heureChoisie = "09:00 - 12:00"; 
        
        if (methodeChoisie !== 'stand') {
            heureChoisie = document.getElementById('heure-retrait').value;
            if (!heureChoisie) return alert("⚠️ Veuillez sélectionner une heure de récupération.");
            
            let estPris = commandes.some(c => c.date === dateChoisie && c.heure === heureChoisie && c.methode !== 'stand');
            if (estPris) return alert("Désolé, ce créneau vient d'être réservé par un autre client. Veuillez choisir une autre heure.");
        }

        const adresseSaisie = document.getElementById('adresse')?.value;
        if (methodeChoisie === 'livraison' && (!adresseValide || !adresseSaisie)) {
            return alert("Veuillez saisir une adresse valide située à moins de 15km de Gardanne.");
        }

        const notesValue = document.getElementById('notes-commande')?.value.trim();
        const notesSaisies = (notesValue && notesValue !== "") ? notesValue : "Aucune précision";
        const numCommande = "NORA-" + Math.floor(10000 + Math.random() * 90000);
        
        let adresseFinale = "Retrait au Stand";
        if (methodeChoisie === 'maison') adresseFinale = document.getElementById('adresse-nora-texte').innerText.replace('Chargement de l\'adresse...', 'Retrait chez Nora');
        if (methodeChoisie === 'livraison') adresseFinale = adresseSaisie;

        // ON PRÉPARE LES DONNÉES
        const commandeAValider = { 
            id: numCommande, nom: document.getElementById('nom').value, 
            emailClient: utilisateurConnecte.email, tel: document.getElementById('telephone').value, 
            total: calculerTotal(), methode: methodeChoisie, adresse: adresseFinale, 
            date: dateChoisie, heure: heureChoisie, notes: notesSaisies, articles: [...panier], statut: 'recu' 
        };
        
        localStorage.setItem('commandeEnAttente', JSON.stringify(commandeAValider));

        const boutonValider = document.querySelector('#form-commande button[type="submit"]');
        boutonValider.innerText = "⏳ Redirection vers la banque...";
        boutonValider.disabled = true;

        try {
            const resPaiement = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    articles: panier, 
                    emailClient: utilisateurConnecte.email,
                    numCommande: numCommande 
                })
            });

            const data = await resPaiement.json();
            if (data.url) {
                window.location.href = data.url; 
            } else {
                alert("Erreur de connexion au système de paiement.");
                boutonValider.innerText = "🔒 Payer ma commande";
                boutonValider.disabled = false;
            }
        } catch (err) {
            console.error("Erreur", err);
            alert("Serveur de paiement injoignable.");
            boutonValider.innerText = "🔒 Payer ma commande";
            boutonValider.disabled = false;
        }
    });
}

async function changerStatut(indexOuId, nouveauStatut) {
    let cmd = typeof indexOuId === "number" ? commandes[indexOuId] : commandes.find(c => c.id === indexOuId);
    if (!cmd) return;
    const res = await fetch(`/api/commandes/${cmd.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut: nouveauStatut }) });
    if (res.ok) {
        cmd.statut = nouveauStatut;
        if (nouveauStatut !== 'recu') {
            alert("⏳ Envoi du mail au client... merci de patienter.");
            await envoyerMailStatut(cmd); 
            alert("📧 Client informé avec succès !");
        }
        location.reload();
    }
}

async function chargerDonneesServeur() {
    try {
        const resCmd = await fetch('/api/commandes'); if (resCmd.ok) commandes = await resCmd.json();
        const resUsr = await fetch('/api/utilisateurs'); if (resUsr.ok) utilisateurs = await resUsr.json();
    } catch (err) { console.error("Erreur serveur", err); }
}

function setupMobileMenu() {
    const header = document.querySelector('.header-fin'); const nav = document.querySelector('.header-fin nav');
    if (header && nav && !document.querySelector('.hamburger')) {
        const burgerBtn = document.createElement('button'); burgerBtn.className = 'hamburger'; burgerBtn.innerHTML = '☰';
        header.insertBefore(burgerBtn, nav);
        burgerBtn.addEventListener('click', () => { nav.classList.toggle('mobile-open'); burgerBtn.innerHTML = nav.classList.contains('mobile-open') ? '✕' : '☰'; });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await chargerDonneesServeur();
    mettreAJourCompteur(); setupMobileMenu(); 
    if (document.getElementById('contenu-panier')) afficherPanier();

    if (utilisateurConnecte && document.getElementById('form-commande')) {
        if(document.getElementById('nom')) document.getElementById('nom').value = utilisateurConnecte.nom;
        if(document.getElementById('telephone')) document.getElementById('telephone').value = utilisateurConnecte.tel;
        const totalAffiche = document.getElementById('total-commande');
        if(totalAffiche) totalAffiche.innerText = calculerTotal().toFixed(2);
    }

    const dateInput = document.getElementById('date-retrait');
    const heureInput = document.getElementById('heure-retrait');
    const adresseInput = document.getElementById('adresse');
    const blocHeure = document.getElementById('bloc-heure');
    const msgStand = document.getElementById('msg-stand');
    let minDateStr = "";
    
    if (dateInput) {
        const minDate = new Date(); minDate.setDate(minDate.getDate() + 5); 
        minDateStr = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, '0')}-${String(minDate.getDate()).padStart(2, '0')}`;
        dateInput.setAttribute('min', minDateStr);

        dateInput.addEventListener('input', (e) => {
            let valeurDate = e.target.value;
            
            if (!valeurDate) { 
                if (blocHeure) blocHeure.style.display = 'none';
                if (msgStand) msgStand.style.display = 'none';
                if (heureInput) heureInput.required = false; 
                return; 
            }

            if (valeurDate < minDateStr) { 
                e.target.value = minDateStr; 
                valeurDate = minDateStr;
            }

            let jourChoisi = new Date(valeurDate).getDay();
            let modeActuel = document.querySelector('input[name="recuperation"]:checked').value;

            // Protection Jours de Marché 
            if (modeActuel === 'stand' && ![0, 2, 5, 6].includes(jourChoisi)) {
                alert("❌ Nora n'est sur les marchés que le Mardi (Aubagne), Vendredi (Gardanne), Samedi (Plan de Cuques) et Dimanche (Gardanne).");
                e.target.value = ''; 
                if (msgStand) msgStand.style.display = 'none';
                return;
            }

            if (modeActuel === 'stand') {
                if(blocHeure) blocHeure.style.display = 'none';
                if(msgStand) msgStand.style.display = 'block';
                if(heureInput) heureInput.required = false; 
            } else {
                if(blocHeure) blocHeure.style.display = 'block';
                if(msgStand) msgStand.style.display = 'none';
                if(heureInput) heureInput.required = true; 
                genererHeuresLibres(valeurDate, jourChoisi);
            }
        });
    }

    const inputAdresse = document.getElementById('adresse');
    const radioLivraison = document.getElementById('choix-livraison');
    const radioStand = document.getElementById('choix-marche');
    const radioMaison = document.getElementById('choix-maison');
    const blocLivraison = document.getElementById('bloc-livraison');
    const blocMaison = document.getElementById('bloc-maison');
    const mapDiv = document.getElementById('map');
    const totalCommande = calculerTotal();

    if (inputAdresse) {
        let timer; inputAdresse.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => rechercherAdresse(inputAdresse.value), 1000); });
    }

    if (radioLivraison && radioStand && radioMaison) {
        if (totalCommande < 50 && radioLivraison) {
            radioLivraison.disabled = true; radioStand.checked = true;
            const labelLivraison = radioLivraison.closest('label');
            if (labelLivraison) labelLivraison.innerHTML += "<br><small style='color: #e74c3c; font-weight: bold; margin-left: 25px;'>⚠️ Minimum 50€ requis.</small>";
        }

        const resetDate = () => { 
            if (dateInput) dateInput.value = ''; 
            if (blocHeure) blocHeure.style.display = 'none'; 
            if (msgStand) msgStand.style.display = 'none'; 
            if (heureInput) heureInput.required = false; 
        };

        radioLivraison.addEventListener('change', () => { 
            if(blocLivraison) blocLivraison.style.display = 'block'; 
            if(blocMaison) blocMaison.style.display = 'none';
            if(inputAdresse) inputAdresse.required = true; 
            if(mapDiv) { mapDiv.style.display = 'block'; initFreeMap(); setTimeout(() => { if(map) map.invalidateSize(); }, 200); }
            resetDate();
        });
        
        radioStand.addEventListener('change', () => { 
            if(blocLivraison) blocLivraison.style.display = 'none'; 
            if(blocMaison) blocMaison.style.display = 'none';
            if(inputAdresse) inputAdresse.required = false; 
            if(mapDiv) mapDiv.style.display = 'none';
            resetDate();
        });

        radioMaison.addEventListener('change', () => { 
            if(blocLivraison) blocLivraison.style.display = 'none'; 
            if(blocMaison) blocMaison.style.display = 'block';
            if(inputAdresse) inputAdresse.required = false; 
            if(mapDiv) mapDiv.style.display = 'none';
            
            if(!mapNora) {
                mapNora = L.map('map-nora').setView(coordNora, 16);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(mapNora);
                L.marker(coordNora).addTo(mapNora).bindPopup("🏠 L'atelier de NORA").openPopup();
                
                fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coordNora[0]}&lon=${coordNora[1]}&format=json`)
                .then(res => res.json())
                .then(data => {
                    if(data && data.address) {
                        const route = data.address.road || data.address.pedestrian || "Chemin";
                        const city = data.address.city || data.address.town || data.address.village || "Gardanne";
                        const postcode = data.address.postcode || "13120";
                        document.getElementById('adresse-nora-texte').innerHTML = `${route}, ${postcode} ${city}`;
                    } else {
                        document.getElementById('adresse-nora-texte').innerHTML = `Gardanne (13120)`;
                    }
                }).catch(() => document.getElementById('adresse-nora-texte').innerHTML = `Gardanne (13120)`);
            } else {
                setTimeout(() => mapNora.invalidateSize(), 200);
            }
            resetDate();
        });
    }
});
