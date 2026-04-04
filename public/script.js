// --- CONFIGURATION EMAILJS ---
const EMAILJS_SERVICE_ID = "service_u4rqr1l";
const EMAILJS_PUBLIC_KEY = "4gDY60-yYSsIDN7sU";
const TEMPLATE_NOUVELLE_COMMANDE = "template_uejzl8o";
const TEMPLATE_CHANGEMENT_STATUT = "template_91s0ptq";

if (typeof emailjs !== 'undefined') { emailjs.init(EMAILJS_PUBLIC_KEY); }

let panier = JSON.parse(localStorage.getItem('panierNora')) || [];
let commandes = JSON.parse(localStorage.getItem('commandesNora')) || [];
let utilisateurs = JSON.parse(localStorage.getItem('utilisateursNora')) || [];
let utilisateurConnecte = JSON.parse(localStorage.getItem('utilisateurActuelNora')) || null;

// --- GESTION ACCÈS & AUTH ---
function verifierAccesPages() {
    const pageActuelle = window.location.pathname;
    if (pageActuelle.includes("suivi.html") && !utilisateurConnecte) window.location.href = "connexion.html";
    if (pageActuelle.includes("admin.html") && (!utilisateurConnecte || utilisateurConnecte.email !== "latelierdenora.stg@gmail.com")) {
        window.location.href = "index.html";
    }
}
verifierAccesPages();

function mettreAJourInterfaceAuth() {
    const blocMenu = document.getElementById('menu-auth-dynamique');
    if (!blocMenu) return;
    if (utilisateurConnecte) {
        let prenom = utilisateurConnecte.nom.split(' ')[0];
        let menuAdmin = utilisateurConnecte.email === "latelierdenora.stg@gmail.com" 
            ? `<a href="admin.html" style="color: red; font-weight: bold;">⚙️ Espace Admin</a>` : '';
        blocMenu.innerHTML = `
            <div class="menu-profil">
                <button class="bouton-profil">👤 ${prenom} ▼</button>
                <div class="dropdown-content">
                    <a href="suivi.html">📦 Mes commandes</a>
                    <a href="#" onclick="seDeconnecter()" style="color: #e74c3c;">🚪 Déconnexion</a>
                    ${menuAdmin}
                </div>
            </div>`;
    } else {
        blocMenu.innerHTML = `<a href="connexion.html" class="bouton-profil">Connexion</a>`;
    }
}

function seDeconnecter() { localStorage.removeItem('utilisateurActuelNora'); window.location.href = "index.html"; }

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
            window.location.href = "admin.html";
            return;
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
        const mdp = document.getElementById('mdp-inscr').value;
        if (utilisateurs.find(u => u.email === email)) return alert("Email déjà utilisé.");
        utilisateurs.push({ nom, tel, email, mdp });
        localStorage.setItem('utilisateursNora', JSON.stringify(utilisateurs));
        localStorage.setItem('utilisateurActuelNora', JSON.stringify({nom, tel, email}));
        window.location.href = "index.html";
    });
}

function switchForm(v){
    document.getElementById('bloc-connexion').style.display=v?'none':'block'; 
    document.getElementById('bloc-inscription').style.display=v?'block':'none';
}

// --- FONCTIONS EMAILS ---
function envoyerMailCommande(commande) {
    if (typeof emailjs === 'undefined') return;
    const templateParams = {
        to_name: commande.nom, to_email: commande.emailClient, admin_email: "latelierdenora.stg@gmail.com",
        order_id: commande.id, total: commande.total.toFixed(2),
        date: new Date(commande.date).toLocaleDateString('fr-FR'),
        articles: commande.articles.map(a => `${a.quantite}x ${a.nom}`).join(', '),
        notes: commande.notes // Ajout des notes pour l'email
    };
    emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_NOUVELLE_COMMANDE, templateParams);
    templateParams.to_email = "latelierdenora.stg@gmail.com"; templateParams.to_name = "Nora";
    emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_NOUVELLE_COMMANDE, templateParams);
}
function envoyerMailStatut(commande) {
    if (typeof emailjs === 'undefined') return;
    let texteStatut = commande.statut === 'preparation' ? "est maintenant en préparation" : "est prête !";
    emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_CHANGEMENT_STATUT, { to_name: commande.nom, to_email: commande.emailClient, order_id: commande.id, statut_label: texteStatut });
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
    const conteneur = document.getElementById('contenu-panier');
    const affichageTotal = document.getElementById('total-panier');
    const btnValider = document.getElementById('btn-valider');
    if (!conteneur) return;

    if (panier.length === 0) {
        conteneur.innerHTML = "<p style='text-align:center;'>Votre panier est vide.</p>";
        if(btnValider) btnValider.style.display = 'none';
        if(affichageTotal) affichageTotal.innerText = "0.00";
        return;
    }

    let html = ''; let totalG = 0;
    panier.forEach((item, index) => {
        let st = item.prix * item.quantite; totalG += st;
        html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px solid #eee;">
            <div style="display:flex; align-items:center; gap:15px;">
                <img src="${item.image}" style="width:50px; height:50px; border-radius:5px; object-fit:cover;">
                <div><b style="color:var(--pine-green);">${item.nom}</b><br>
                <input type="number" value="${item.quantite}" min="1" onchange="modifierQte(${index}, this.value)" style="width:40px;"></div>
            </div>
            <span style="color:var(--gold-accent); font-weight:bold;">${st.toFixed(2)} €</span>
            <button onclick="supprimerArticle(${index})" style="color:red; border:none; background:none; cursor:pointer;">✕</button>
        </div>`;
    });
    conteneur.innerHTML = html;
    if(affichageTotal) affichageTotal.innerText = totalG.toFixed(2);
    if(btnValider) {
        btnValider.style.display = 'block';
        btnValider.innerText = utilisateurConnecte ? "Passer à la commande" : "Connectez-vous pour commander";
        btnValider.onclick = () => { window.location.href = utilisateurConnecte ? "commande.html" : "connexion.html"; };
    }
}
function modifierQte(i, v) { panier[i].quantite = Math.max(1, parseInt(v)||1); localStorage.setItem('panierNora', JSON.stringify(panier)); mettreAJourCompteur(); afficherPanier(); }
function supprimerArticle(i) { panier.splice(i, 1); localStorage.setItem('panierNora', JSON.stringify(panier)); mettreAJourCompteur(); afficherPanier(); }

function afficherToast(m) {
    let t = document.createElement('div'); t.className = 'toast-notification'; t.innerHTML = `✨ ${m}`;
    document.body.appendChild(t); setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3000);
}

// ==========================================
// CARTE GRATUITE (LEAFLET) ET COMMANDE
// ==========================================
let adresseValide = false; 
let map; 
let markerClient;
const centreGardanne = [43.4542, 5.4697];

function initFreeMap() {
    const mapDiv = document.getElementById('map');
    if (!mapDiv || map) return; // Ne charge qu'une fois

    map = L.map('map').setView(centreGardanne, 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

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
            let meilleurResultat = data[0];
            let minDistance = Infinity;

            for (let place of data) {
                const latLngTest = [parseFloat(place.lat), parseFloat(place.lon)];
                const distTest = map.distance(centreGardanne, latLngTest) / 1000;
                if (distTest < minDistance) {
                    minDistance = distTest;
                    meilleurResultat = place;
                }
            }

            const latLngFinal = [parseFloat(meilleurResultat.lat), parseFloat(meilleurResultat.lon)];
            const distFinal = minDistance;

            if (markerClient) map.removeLayer(markerClient);
            markerClient = L.marker(latLngFinal).addTo(map);
            map.setView(latLngFinal, 13);

            const adresseTrouvee = meilleurResultat.display_name.split(',').slice(0, 2).join(',');

            if (distFinal > 15) {
                if(errDistance) { 
                    errDistance.style.display = 'block'; 
                    errDistance.style.color = 'red'; 
                    errDistance.innerHTML = `⚠️ Trop loin : <b>${distFinal.toFixed(1)}km</b>.<br>📍 <i>Trouvé : ${adresseTrouvee}</i><br>👉 Pensez à préciser votre code postal (ex: 13120).`; 
                }
                adresseValide = false;
            } else {
                if(errDistance) { 
                    errDistance.style.display = 'block'; 
                    errDistance.style.color = 'green'; 
                    errDistance.innerHTML = `✅ Parfait ! Vous êtes à <b>${distFinal.toFixed(1)}km</b>.<br>📍 <i>Validé : ${adresseTrouvee}</i>`; 
                }
                adresseValide = true;
            }
        }
    } catch (error) { console.error("Erreur:", error); }
}

// --- SOUMISSION DE LA COMMANDE ---
const formCmd = document.getElementById('form-commande');
if (formCmd) {
    const nouvelleCommande = { 
            id: numCommande, nom: document.getElementById('nom').value, 
            emailClient: utilisateurConnecte.email, tel: document.getElementById('telephone').value, 
            total: calculerTotal(), methode: methodeChoisie, 
            adresse: methodeChoisie === 'livraison' ? adresseSaisie : "Retrait Stand", 
            date: dateChoisie, notes: notesSaisies, articles: [...panier], statut: 'recu' 
        };
        
        // 🚀 ENVOI AU SERVEUR (MONGODB)
        fetch('/api/commandes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nouvelleCommande)
        })
        .then(response => {
            if (response.ok) {
                localStorage.removeItem('panierNora');
                envoyerMailCommande(nouvelleCommande); // On garde ton EmailJS intact !
                alert(`✅ Commande confirmée ! Numéro : ${numCommande}.`);
                window.location.href = "suivi.html";
            }
        });

function changerStatut(index, nouveauStatut) {
    commandes[index].statut = nouveauStatut;
    localStorage.setItem('commandesNora', JSON.stringify(commandes));
    if (nouveauStatut !== 'recu') { envoyerMailStatut(commandes[index]); alert("📧 Client informé !"); }
    location.reload();
}

// ==========================================
// LANCEMENT GLOBAL (SÉCURITÉS RENFORCÉES)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    mettreAJourCompteur();
    if (document.getElementById('contenu-panier')) afficherPanier();

    // Remplissage infos client
    if (utilisateurConnecte && document.getElementById('form-commande')) {
        if(document.getElementById('nom')) document.getElementById('nom').value = utilisateurConnecte.nom;
        if(document.getElementById('telephone')) document.getElementById('telephone').value = utilisateurConnecte.tel;
        const totalAffiche = document.getElementById('total-commande');
        if(totalAffiche) totalAffiche.innerText = calculerTotal().toFixed(2);
    }

    // --- LE CALENDRIER BLOQUÉ À +5 JOURS (SÉCURITÉ VISUELLE ET JS) ---
    const dateInput = document.getElementById('date-retrait');
    let minDateStr = "";
    
    if (dateInput) {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 5); 
        const annee = minDate.getFullYear();
        const mois = String(minDate.getMonth() + 1).padStart(2, '0');
        const jour = String(minDate.getDate()).padStart(2, '0');
        minDateStr = `${annee}-${mois}-${jour}`;
        
        // Bloque le calendrier visuellement
        dateInput.setAttribute('min', minDateStr);
        dateInput.value = minDateStr; 

        // Vigile : Si le client bidouille la date à la main
        dateInput.addEventListener('change', (e) => {
            if (e.target.value < minDateStr) {
                alert("⚠️ Nora a besoin d'au minimum 5 jours pour préparer vos douceurs !");
                e.target.value = minDateStr; // On remet la date légale de force
            }
        });
    }

    // --- GESTION LIVRAISON & CARTE (CORRECTIF BUG D'AFFICHAGE) ---
    const inputAdresse = document.getElementById('adresse');
    const radioLivraison = document.getElementById('choix-livraison');
    const radioRetrait = document.getElementById('choix-marche');
    const blocLivraison = document.getElementById('bloc-livraison');
    const mapDiv = document.getElementById('map');
    const totalCommande = calculerTotal();

    if (inputAdresse) {
        let timer;
        inputAdresse.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => rechercherAdresse(inputAdresse.value), 1000);
        });
    }

    if (radioLivraison && radioRetrait && blocLivraison) {
        // Blocage si commande < 50€
        if (totalCommande < 50) {
            radioLivraison.disabled = true;
            radioRetrait.checked = true;
            const labelLivraison = radioLivraison.closest('label');
            if (labelLivraison) {
                labelLivraison.style.opacity = "0.5";
                if (!document.getElementById('msg-seuil')) {
                    const messageSeuil = document.createElement('span');
                    messageSeuil.id = 'msg-seuil';
                    messageSeuil.innerHTML = "<br><small style='color: #e74c3c; font-weight: bold; margin-left: 25px;'>⚠️ Minimum 50€ requis.</small>";
                    labelLivraison.appendChild(messageSeuil);
                }
            }
        }

        // Affichage de la carte et correctif "Carte Grise" de Leaflet
        radioLivraison.addEventListener('change', () => { 
            blocLivraison.style.display = 'block'; 
            if(mapDiv) { 
                mapDiv.style.display = 'block'; 
                initFreeMap(); 
                // On laisse le temps au bloc de s'ouvrir, puis on force la carte à recalculer sa taille
                setTimeout(() => { if(map) map.invalidateSize(); }, 200); 
            }
        });
        
        radioRetrait.addEventListener('change', () => { 
            blocLivraison.style.display = 'none'; 
            if(mapDiv) mapDiv.style.display = 'none';
        });
    }
});
