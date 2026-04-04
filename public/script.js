// --- CONFIGURATION EMAILJS ---
const EMAILJS_SERVICE_ID = "service_u4rqr1l";
const EMAILJS_PUBLIC_KEY = "4gDY60-yYSsIDN7sU";
const TEMPLATE_NOUVELLE_COMMANDE = "template_uejzl8o";
const TEMPLATE_CHANGEMENT_STATUT = "template_91s0ptq";

if (typeof emailjs !== 'undefined') { emailjs.init(EMAILJS_PUBLIC_KEY); }

let panier = JSON.parse(localStorage.getItem('panierNora')) || [];
let utilisateurConnecte = JSON.parse(localStorage.getItem('utilisateurActuelNora')) || null;
let commandes = []; 
let utilisateurs = []; 

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

function seDeconnecter() { 
    localStorage.removeItem('utilisateurActuelNora'); 
    window.location.href = "index.html"; 
}

function supprimerMonCompte() {
    if (confirm("⚠️ Êtes-vous sûr de vouloir supprimer votre compte définitivement ? Cette action est irréversible.")) {
        fetch(`/api/utilisateurs/${utilisateurConnecte.email}`, { method: 'DELETE' })
        .then(() => {
            localStorage.removeItem('utilisateurActuelNora');
            alert("Votre compte a bien été supprimé. À bientôt !");
            window.location.href = "index.html";
        });
    }
}

function motDePasseOublie() {
    let emailSaisi = prompt("🔒 Réinitialisation : \nVeuillez entrer l'adresse email de votre compte :");
    if (!emailSaisi) return;
    emailSaisi = emailSaisi.trim();

    if (emailSaisi === "latelierdenora.stg@gmail.com") {
        alert("⚠️ Le mot de passe administrateur est bloqué par sécurité.");
        return;
    }

    let user = utilisateurs.find(u => u.email === emailSaisi);
    if (!user) return alert("❌ Aucun compte trouvé.");

    let telSaisi = prompt("📱 Confirmez votre numéro de téléphone :");
    if (telSaisi && telSaisi.replace(/\s/g, '') === user.tel.replace(/\s/g, '')) {
        let nouveauMdp = prompt("✅ Entrez votre nouveau mot de passe :");
        if (nouveauMdp && nouveauMdp.length >= 4) {
            fetch(`/api/utilisateurs/${emailSaisi}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mdp: nouveauMdp })
            }).then(() => {
                alert("✨ Mot de passe modifié !");
                location.reload();
            });
        }
    } else { alert("❌ Numéro incorrect."); }
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
        
        if (utilisateurs.find(u => u.email === email)) return alert("Cet email est déjà utilisé.");
        
        fetch('/api/utilisateurs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, tel, email, mdp })
        }).then(() => {
            localStorage.setItem('utilisateurActuelNora', JSON.stringify({nom, tel, email}));
            window.location.href = "index.html";
        });
    });
}

function switchForm(v) {
    document.getElementById('bloc-connexion').style.display = v ? 'block' : 'none'; 
    document.getElementById('bloc-inscription').style.display = v ? 'none' : 'block';
}

// --- FONCTIONS EMAILS ---
async function envoyerMailCommande(commande) {
    if (typeof emailjs === 'undefined') return;
    const templateParams = {
        to_name: commande.nom, to_email: commande.emailClient, admin_email: "latelierdenora.stg@gmail.com",
        order_id: commande.id, total: commande.total.toFixed(2),
        date: new Date(commande.date).toLocaleDateString('fr-FR'),
        articles: commande.articles.map(a => `${a.quantite}x ${a.nom}`).join(', '),
        notes: commande.notes
    };
    await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_NOUVELLE_COMMANDE, templateParams);
    templateParams.to_email = "latelierdenora.stg@gmail.com"; templateParams.to_name = "Nora";
    await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_NOUVELLE_COMMANDE, templateParams);
}

async function envoyerMailStatut(commande) {
    if (typeof emailjs === 'undefined') return;
    let texteStatut = commande.statut === 'preparation' ? "est maintenant en préparation" : "est prête !";
    return emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_CHANGEMENT_STATUT, { 
        to_name: commande.nom, 
        to_email: commande.emailClient, 
        order_id: commande.id, 
        statut_label: texteStatut 
    });
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

// --- COMMANDE ---
const formCmd = document.getElementById('form-commande');
if (formCmd) {
    formCmd.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!utilisateurConnecte) return alert("❌ Connectez-vous.");
        
        const numCommande = "NORA-" + Math.floor(10000 + Math.random() * 90000);
        const nouvelleCommande = { 
            id: numCommande, nom: document.getElementById('nom').value, 
            emailClient: utilisateurConnecte.email, tel: document.getElementById('telephone').value, 
            total: calculerTotal(), methode: document.querySelector('input[name="recuperation"]:checked').value, 
            adresse: document.getElementById('adresse')?.value || "Retrait Stand", 
            date: document.getElementById('date-retrait').value, 
            notes: document.getElementById('notes-commande')?.value || "", 
            articles: [...panier], statut: 'recu' 
        };
        
        const res = await fetch('/api/commandes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nouvelleCommande)
        });

        if (res.ok) {
            localStorage.removeItem('panierNora');
            await envoyerMailCommande(nouvelleCommande);
            alert(`✅ Confirmée ! N° ${numCommande}`);
            window.location.href = "suivi.html";
        }
    });
}

// ✨ LA FONCTION CORRIGÉE POUR LE STATUT ✨
async function changerStatut(idCmd, nouveauStatut) {
    const cmd = commandes.find(c => c.id === idCmd);
    if (!cmd) return;

    const res = await fetch(`/api/commandes/${idCmd}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveauStatut })
    });

    if (res.ok) {
        cmd.statut = nouveauStatut;
        if (nouveauStatut !== 'recu') {
            alert("⏳ Envoi du mail au client... ne fermez pas la page.");
            await envoyerMailStatut(cmd); // On ATTEND que l'email soit parti
            alert("📧 Client informé avec succès !");
        }
        location.reload(); // On ne recharge qu'APRÈS l'envoi
    }
}

async function chargerDonneesServeur() {
    try {
        const resCmd = await fetch('/api/commandes');
        commandes = await resCmd.json();
        const resUsr = await fetch('/api/utilisateurs');
        utilisateurs = await resUsr.json();
    } catch (err) { console.log(err); }
}

function setupMobileMenu() {
    const header = document.querySelector('.header-fin');
    const nav = document.querySelector('.header-fin nav');
    if (header && nav && !document.querySelector('.hamburger')) {
        const burgerBtn = document.createElement('button');
        burgerBtn.className = 'hamburger'; burgerBtn.innerHTML = '☰';
        header.insertBefore(burgerBtn, nav);
        burgerBtn.addEventListener('click', () => {
            nav.classList.toggle('mobile-open');
            burgerBtn.innerHTML = nav.classList.contains('mobile-open') ? '✕' : '☰';
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await chargerDonneesServeur();
    mettreAJourCompteur();
    setupMobileMenu(); 
    if (document.getElementById('contenu-panier')) afficherPanier();
});
