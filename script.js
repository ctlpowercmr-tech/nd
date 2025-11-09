class DistributeurModerne {
    constructor() {
        this.panier = [];
        this.transactionEnCours = null;
        this.timerExpiration = null;
        this.API_URL = CONFIG.API_URL;
        this.estConnecte = false;
        this.boissons = [];
        
        this.init();
    }
    
    async init() {
        await this.testerConnexionServeur();
        await this.chargerBoissons();
        this.afficherBoissons();
        this.chargerSolde();
        this.setupEventListeners();
        
        setInterval(() => this.verifierStatutTransaction(), 2000);
        setInterval(() => this.testerConnexionServeur(), 30000);
        
        this.afficherMessageVocal('🚀 Système distribiteur prêt!');
    }
    
    async testerConnexionServeur() {
        try {
            const response = await fetch(`${this.API_URL}/api/health`);
            const result = await response.json();
            
            if (result.status === 'OK') {
                this.estConnecte = true;
                this.mettreAJourStatutConnexion('connecte');
                return true;
            }
        } catch (error) {
            this.estConnecte = false;
            this.mettreAJourStatutConnexion('erreur');
        }
        return false;
    }
    
    mettreAJourStatutConnexion(statut) {
        const element = document.getElementById('statut-connexion');
        const lumiere = element.querySelector('.statut-lumiere');
        
        if (statut === 'connecte') {
            lumiere.style.background = '#10b981';
            element.querySelector('span').textContent = 'En ligne';
        } else {
            lumiere.style.background = '#ef4444';
            element.querySelector('span').textContent = 'Hors ligne';
        }
    }
    
    async chargerBoissons() {
        try {
            const response = await fetch(`${this.API_URL}/api/boissons`);
            const result = await response.json();
            
            if (result.success) {
                this.boissons = result.data;
            }
        } catch (error) {
            console.error('Erreur chargement boissons:', error);
            // Fallback si l'API ne répond pas
            this.boissons = [
                {
                    id: 1,
                    nom: "Coca-Cola Original",
                    prix: 500,
                    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop",
                    categorie: "Soda",
                    taille: "33cl",
                    promotion: false
                },
                {
                    id: 2,
                    nom: "Pepsi Max",
                    prix: 500,
                    image: "https://images.unsplash.com/photo-1624555130581-1d9cca1a1a71?w=400&h=400&fit=crop",
                    categorie: "Soda",
                    taille: "33cl",
                    promotion: false
                },
                {
                    id: 3,
                    nom: "Fanta Orange",
                    prix: 450,
                    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop",
                    categorie: "Soda",
                    taille: "33cl",
                    promotion: true
                },
                {
                    id: 4,
                    nom: "Sprite Citron",
                    prix: 450,
                    image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop",
                    categorie: "Soda",
                    taille: "33cl",
                    promotion: false
                }
            ];
        }
    }
    
    afficherBoissons() {
        const grid = document.getElementById('boissons-grid');
        grid.innerHTML = '';
        
        this.boissons.forEach(boisson => {
            const card = document.createElement('div');
            card.className = 'boisson-card';
            card.setAttribute('data-categorie', boisson.categorie);
            card.innerHTML = `
                ${boisson.promotion ? '<div class="promotion-badge">🔥 PROMO</div>' : ''}
                <div class="boisson-image">
                    <img src="${boisson.image}" alt="${boisson.nom}" loading="lazy">
                </div>
                <div class="boisson-nom">${boisson.nom}</div>
                <div class="boisson-categorie">${boisson.categorie}</div>
                <div class="boisson-prix">${boisson.prix} FCFA</div>
                <div class="boisson-taille">${boisson.taille}</div>
            `;
            
            card.addEventListener('click', () => this.ajouterAuPanier(boisson));
            grid.appendChild(card);
        });
        
        this.setupFiltres();
    }
    
    setupFiltres() {
        document.querySelectorAll('.filtre-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filtre-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const categorie = e.target.getAttribute('data-categorie');
                this.filtrerBoissons(categorie);
            });
        });
    }
    
    filtrerBoissons(categorie) {
        const cards = document.querySelectorAll('.boisson-card');
        cards.forEach(card => {
            if (categorie === 'tous' || card.getAttribute('data-categorie') === categorie) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    ajouterAuPanier(boisson) {
        if (this.panier.length >= 2) {
            this.afficherMessageVocal('❌ Maximum 2 boissons autorisées');
            return;
        }
        
        if (this.panier.find(item => item.id === boisson.id)) {
            this.afficherMessageVocal('⚠️ Cette boisson est déjà sélectionnée');
            return;
        }
        
        this.panier.push(boisson);
        this.mettreAJourPanier();
        this.afficherMessageVocal(`✅ ${boisson.nom} ajoutée au panier`);
    }
    
    retirerDuPanier(boissonId) {
        this.panier = this.panier.filter(item => item.id !== boissonId);
        this.mettreAJourPanier();
    }
    
    mettreAJourPanier() {
        const panierItems = document.getElementById('panier-items');
        const totalElement = document.getElementById('total-panier');
        const nombreElement = document.getElementById('nombre-boissons');
        const panierFlottant = document.getElementById('panier-flottant');
        
        if (this.panier.length === 0) {
            panierItems.innerHTML = '<div class="panier-vide">Aucune boisson sélectionnée</div>';
            panierFlottant.classList.remove('visible');
        } else {
            panierItems.innerHTML = '';
            this.panier.forEach(boisson => {
                const item = document.createElement('div');
                item.className = 'item-panier';
                item.innerHTML = `
                    <div>
                        <strong>${boisson.nom}</strong>
                        <div style="font-size: 0.9rem; color: #94a3b8;">${boisson.prix} FCFA</div>
                    </div>
                    <button class="btn-retirer" onclick="distributeur.retirerDuPanier(${boisson.id})">✕</button>
                `;
                panierItems.appendChild(item);
            });
            panierFlottant.classList.add('visible');
        }
        
        const total = this.panier.reduce((sum, boisson) => sum + boisson.prix, 0);
        totalElement.textContent = `${total} FCFA`;
        nombreElement.textContent = this.panier.length;
        
        this.mettreAJourBoutons();
    }
    
    mettreAJourBoutons() {
        const btnPayer = document.getElementById('btn-payer');
        btnPayer.disabled = this.panier.length === 0 || !this.estConnecte;
    }
    
    setupEventListeners() {
        document.getElementById('btn-payer').addEventListener('click', () => this.demarrerPaiement());
        document.getElementById('btn-vider').addEventListener('click', () => this.viderPanier());
        document.getElementById('fermer-modal').addEventListener('click', () => this.fermerModal());
        document.getElementById('annuler-paiement').addEventListener('click', () => this.annulerPaiement());
    }
    
    async demarrerPaiement() {
        if (!this.estConnecte) {
            this.afficherMessageVocal('❌ Serveur non connecté');
            return;
        }
        
        const total = this.panier.reduce((sum, boisson) => sum + boisson.prix, 0);
        
        try {
            const response = await fetch(`${this.API_URL}/api/transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    montant: total,
                    boissons: this.panier
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.transactionEnCours = result.data;
                this.afficherModalPaiement(result.data);
                this.afficherMessageVocal("Veuillez scanner le QR code avec votre téléphone ou utiliser cet ID de transaction");
            } else {
                this.afficherMessageVocal('❌ Erreur: ' + result.error);
            }
        } catch (error) {
            this.afficherMessageVocal('❌ Erreur de connexion au serveur');
        }
    }
    
    afficherModalPaiement(transaction) {
        const modal = document.getElementById('modal-paiement');
        const qrCodeElement = document.getElementById('qr-code');
        
        document.getElementById('transaction-id').textContent = transaction.id;
        document.getElementById('montant-transaction').textContent = `${transaction.montant} FCFA`;
        
        // CORRECTION: Génération QR code avec la bonne méthode
        this.genererQRCode(transaction, qrCodeElement);
        
        modal.style.display = 'flex';
        this.demarrerTimerExpiration();
    }
    
    genererQRCode(transaction, element) {
        // Nettoyer l'élément
        element.innerHTML = '';
        
        // Données à encoder
        const qrData = JSON.stringify({
            transactionId: transaction.id,
            montant: transaction.montant,
            apiUrl: this.API_URL,
            timestamp: Date.now()
        });
        
        console.log('Génération QR code avec données:', qrData);
        
        try {
            // Utiliser la librairie QRCode correctement
            QRCode.toCanvas(element, qrData, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }, function(error) {
                if (error) {
                    console.error('Erreur génération QR code:', error);
                    // Fallback: afficher l'ID
                    element.innerHTML = `
                        <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; color: black;">
                            <h3 style="margin: 0 0 10px 0;">ID Transaction</h3>
                            <p style="font-size: 24px; font-weight: bold; margin: 0;">${transaction.id}</p>
                            <p style="margin: 10px 0 0 0;">Montant: ${transaction.montant} FCFA</p>
                        </div>
                    `;
                }
            });
        } catch (error) {
            console.error('Erreur génération QR code:', error);
            // Fallback simple
            element.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; color: black;">
                    <h3 style="margin: 0 0 10px 0;">ID Transaction</h3>
                    <p style="font-size: 24px; font-weight: bold; margin: 0 0 10px 0;">${transaction.id}</p>
                    <p style="margin: 0 0 10px 0;">Montant: ${transaction.montant} FCFA</p>
                    <p style="margin: 0; font-size: 14px; color: #666;">Entrez cet ID dans l'application mobile</p>
                </div>
            `;
        }
    }
    
    fermerModal() {
        document.getElementById('modal-paiement').style.display = 'none';
        this.annulerPaiement();
    }
    
    demarrerTimerExpiration() {
        if (this.timerExpiration) clearInterval(this.timerExpiration);
        
        const timerElement = document.getElementById('expiration-timer');
        let tempsRestant = 600;
        
        this.timerExpiration = setInterval(() => {
            tempsRestant--;
            const minutes = Math.floor(tempsRestant / 60);
            const secondes = tempsRestant % 60;
            timerElement.textContent = `${minutes}:${secondes.toString().padStart(2, '0')}`;
            
            if (tempsRestant <= 0) {
                clearInterval(this.timerExpiration);
                this.transactionExpiree();
            }
        }, 1000);
    }
    
    transactionExpiree() {
        const statutElement = document.getElementById('statut-paiement');
        statutElement.innerHTML = '❌ Transaction expirée';
        statutElement.className = 'statut-paiement error';
    }
    
    async verifierStatutTransaction() {
        if (!this.transactionEnCours || !this.estConnecte) return;
        
        try {
            const response = await fetch(`${this.API_URL}/api/transaction/${this.transactionEnCours.id}`);
            const result = await response.json();
            
            if (result.success && result.data.statut === 'paye') {
                const statutElement = document.getElementById('statut-paiement');
                statutElement.innerHTML = '✅ Paiement réussi!';
                statutElement.className = 'statut-paiement success';
                
                this.afficherMessageVocal("Paiement réussi! Votre commande sera prête dans 4 secondes");
                
                if (this.timerExpiration) clearInterval(this.timerExpiration);
                
                setTimeout(() => {
                    this.reinitialiserApresPaiement();
                }, 4000);
            }
        } catch (error) {
            console.error('Erreur vérification statut:', error);
        }
    }
    
    reinitialiserApresPaiement() {
        this.panier = [];
        this.transactionEnCours = null;
        this.timerExpiration = null;
        
        const modal = document.getElementById('modal-paiement');
        modal.style.display = 'none';
        
        document.getElementById('statut-paiement').className = 'statut-paiement';
        document.getElementById('statut-paiement').innerHTML = '<div class="loader"></div><span>En attente de paiement...</span>';
        
        this.mettreAJourPanier();
        this.afficherMessageVocal('🎉 Commande livrée! Merci de votre achat.');
    }
    
    viderPanier() {
        this.panier = [];
        this.mettreAJourPanier();
        this.afficherMessageVocal('🗑️ Panier vidé');
    }
    
    annulerPaiement() {
        if (this.transactionEnCours && this.estConnecte) {
            fetch(`${this.API_URL}/api/transaction/${this.transactionEnCours.id}/annuler`, {
                method: 'POST'
            }).catch(error => console.error('Erreur annulation:', error));
        }
        
        if (this.timerExpiration) clearInterval(this.timerExpiration);
        this.reinitialiserApresPaiement();
    }
    
    async chargerSolde() {
        try {
            const response = await fetch(`${this.API_URL}/api/solde/distributeur`);
            const result = await response.json();
            
            if (result.success) {
                document.getElementById('solde-distributeur').textContent = `${result.solde} FCFA`;
            }
        } catch (error) {
            console.error('Erreur chargement solde:', error);
        }
    }
    
    afficherMessageVocal(message) {
        const notification = document.getElementById('notification-vocale');
        const messageElement = document.getElementById('message-vocal');
        
        messageElement.textContent = message;
        notification.style.display = 'block';
        
        // Synthèse vocale
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = 'fr-FR';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            speechSynthesis.speak(utterance);
        }
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Initialisation
const distributeur = new DistributeurModerne();
