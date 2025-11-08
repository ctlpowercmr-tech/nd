class DistributeurModerne {
    constructor() {
        this.panier = [];
        this.transactionEnCours = null;
        this.timerExpiration = null;
        this.API_URL = CONFIG.API_URL;
        this.estConnecte = false;
        
        this.init();
    }
    
    async init() {
        await this.testerConnexionServeur();
        this.afficherBoissons();
        this.chargerSolde();
        this.setupEventListeners();
        
        setInterval(() => this.verifierStatutTransaction(), 2000);
        setInterval(() => this.testerConnexionServeur(), 30000);
    }
    
    async testerConnexionServeur() {
        try {
            const response = await fetch(`${this.API_URL}/api/health`);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            
            if (result.status === 'OK') {
                this.estConnecte = true;
                this.mettreAJourStatutConnexion('connecte');
                return true;
            } else {
                throw new Error('Réponse serveur invalide');
            }
        } catch (error) {
            console.error('❌ Erreur connexion serveur:', error);
            this.estConnecte = false;
            this.mettreAJourStatutConnexion('erreur', error.message);
            return false;
        }
    }
    
    mettreAJourStatutConnexion(statut, message = '') {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        if (statut === 'connecte') {
            statusDot.style.background = '#27ae60';
            statusText.textContent = 'En ligne';
        } else {
            statusDot.style.background = '#e74c3c';
            statusText.textContent = 'Hors ligne';
        }
    }
    
    afficherBoissons() {
        const grid = document.getElementById('boissons-grid');
        grid.innerHTML = '';
        
        BOISSONS.forEach(boisson => {
            const card = document.createElement('div');
            card.className = 'boisson-card';
            card.innerHTML = `
                <div class="boisson-image">
                    <img src="${boisson.image}" alt="${boisson.nom}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzQ5OGQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+${boisson.icone} ${boisson.nom.split(' ')[0]}</dGV4dD48L3N2Zz4='">
                </div>
                <div class="boisson-info">
                    <div class="boisson-nom">${boisson.nom}</div>
                    <div class="boisson-taille">${boisson.taille}</div>
                    <div class="boisson-prix">${boisson.prix} FCFA</div>
                </div>
            `;
            
            card.addEventListener('click', () => this.ajouterAuPanier(boisson));
            grid.appendChild(card);
        });
    }
    
    ajouterAuPanier(boisson) {
        if (this.panier.length >= 2) {
            this.parler('Vous ne pouvez sélectionner que 2 boissons maximum');
            return;
        }
        
        if (this.panier.find(item => item.id === boisson.id)) {
            this.parler('Cette boisson est déjà dans votre sélection');
            return;
        }
        
        this.panier.push(boisson);
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
        this.parler(`${boisson.nom} ajoutée au panier`);
    }
    
    retirerDuPanier(boissonId) {
        const boisson = this.panier.find(item => item.id === boissonId);
        this.panier = this.panier.filter(item => item.id !== boissonId);
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
        
        if (boisson) {
            this.parler(`${boisson.nom} retirée du panier`);
        }
    }
    
    viderPanier() {
        this.panier = [];
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
        this.parler('Panier vidé');
    }
    
    mettreAJourPanier() {
        const panierElement = document.getElementById('panier');
        const totalElement = document.getElementById('total-panier');
        const counterElement = document.getElementById('counter');
        
        counterElement.textContent = `${this.panier.length}/2`;
        
        if (this.panier.length === 0) {
            panierElement.innerHTML = `
                <div class="panier-vide">
                    <i class="fas fa-cart-arrow-down"></i>
                    <p>Aucune boisson sélectionnée</p>
                </div>
            `;
        } else {
            panierElement.innerHTML = '';
            this.panier.forEach(boisson => {
                const item = document.createElement('div');
                item.className = 'item-panier';
                item.innerHTML = `
                    <div class="item-info">
                        <div class="item-image">
                            <img src="${boisson.image}" alt="${boisson.nom}">
                        </div>
                        <div>
                            <div>${boisson.nom}</div>
                            <div style="font-size: 0.9rem; color: #95a5a6;">${boisson.taille}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="color: #f1c40f; font-weight: bold;">${boisson.prix} FCFA</span>
                        <button onclick="distributeur.retirerDuPanier(${boisson.id})" class="btn-retirer">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                panierElement.appendChild(item);
            });
        }
        
        const total = this.panier.reduce((sum, boisson) => sum + boisson.prix, 0);
        totalElement.textContent = `${total} FCFA`;
    }
    
    mettreAJourBoutons() {
        const btnPayer = document.getElementById('btn-payer');
        const btnVider = document.getElementById('btn-vider');
        
        btnPayer.disabled = this.panier.length === 0 || !this.estConnecte;
        btnVider.disabled = this.panier.length === 0;
        
        if (!this.estConnecte) {
            btnPayer.title = 'Serveur non connecté';
        } else {
            btnPayer.title = '';
        }
    }
    
    setupEventListeners() {
        document.getElementById('btn-payer').addEventListener('click', () => this.demarrerPaiement());
        document.getElementById('btn-vider').addEventListener('click', () => this.viderPanier());
        document.getElementById('btn-retour').addEventListener('click', () => this.retourSelection());
        document.getElementById('annuler-paiement').addEventListener('click', () => this.annulerPaiement());
    }
    
    async demarrerPaiement() {
        if (!this.estConnecte) {
            this.parler('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
            await this.testerConnexionServeur();
            return;
        }
        
        const total = this.panier.reduce((sum, boisson) => sum + boisson.prix, 0);
        
        try {
            const response = await fetch(`${this.API_URL}/api/transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    montant: total,
                    boissons: this.panier
                })
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.transactionEnCours = result.data;
                this.afficherQRCode(result.data);
                this.demarrerTimerExpiration();
                this.parler('Veuillez scanner le QR code avec votre téléphone ou utiliser cet ID de transaction');
            } else {
                throw new Error(result.error || 'Erreur lors de la création de la transaction');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.estConnecte = false;
            this.mettreAJourStatutConnexion('erreur', error.message);
            this.parler('Erreur de connexion au serveur');
        }
    }
    
    afficherQRCode(transaction) {
        const selectionSection = document.getElementById('selection-section');
        const paiementSection = document.getElementById('paiement-section');
        
        selectionSection.style.display = 'none';
        paiementSection.style.display = 'block';
        
        document.getElementById('transaction-id').textContent = transaction.id;
        document.getElementById('montant-transaction').textContent = `${transaction.montant} FCFA`;
        
        // Générer le QR code
        const qrCodeElement = document.getElementById('qr-code');
        qrCodeElement.innerHTML = '';
        
        const qrData = JSON.stringify({
            transactionId: transaction.id,
            montant: transaction.montant,
            apiUrl: this.API_URL,
            timestamp: Date.now()
        });
        
        try {
            const typeNumber = 0;
            const errorCorrectionLevel = 'L';
            const qr = qrcode(typeNumber, errorCorrectionLevel);
            qr.addData(qrData);
            qr.make();
            
            qrCodeElement.innerHTML = qr.createImgTag(4);
        } catch (error) {
            console.error('Erreur génération QR code:', error);
            qrCodeElement.innerHTML = `
                <div style="text-align: center; color: black; padding: 2rem;">
                    <h3 style="margin-bottom: 1rem;">ID Transaction:</h3>
                    <div style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem; background: #f8f9fa; padding: 1rem; border-radius: 8px;">${transaction.id}</div>
                    <p>Montant: ${transaction.montant} FCFA</p>
                    <p style="color: #666; margin-top: 1rem;">Entrez cet ID dans l'application mobile</p>
                </div>
            `;
        }
    }
    
    demarrerTimerExpiration() {
        if (this.timerExpiration) clearInterval(this.timerExpiration);
        
        const timerElement = document.getElementById('expiration-timer');
        let tempsRestant = 10 * 60;
        
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
        statutElement.innerHTML = `
            <div class="statut-content">
                <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                <span>Transaction expirée</span>
            </div>
        `;
        statutElement.className = 'statut-paiement error';
        this.parler('Transaction expirée');
    }
    
    async verifierStatutTransaction() {
        if (!this.transactionEnCours || !this.estConnecte) return;
        
        try {
            const response = await fetch(`${this.API_URL}/api/transaction/${this.transactionEnCours.id}`);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                const transaction = result.data;
                const statutElement = document.getElementById('statut-paiement');
                
                if (transaction.statut === 'paye') {
                    statutElement.innerHTML = `
                        <div class="statut-content">
                            <i class="fas fa-check-circle" style="color: #27ae60;"></i>
                            <span>Paiement réussi! Distribution en cours...</span>
                        </div>
                    `;
                    statutElement.className = 'statut-paiement success';
                    
                    await this.chargerSolde();
                    
                    if (this.timerExpiration) clearInterval(this.timerExpiration);
                    
                    this.parler('Paiement réussi! Votre commande sera prête dans 4 secondes');
                    
                    setTimeout(() => {
                        this.reinitialiserApresPaiement();
                    }, 4000);
                } else if (transaction.statut === 'annule') {
                    statutElement.innerHTML = `
                        <div class="statut-content">
                            <i class="fas fa-times-circle" style="color: #e74c3c;"></i>
                            <span>Transaction annulée</span>
                        </div>
                    `;
                    statutElement.className = 'statut-paiement error';
                    if (this.timerExpiration) clearInterval(this.timerExpiration);
                } else if (transaction.statut === 'expire') {
                    statutElement.innerHTML = `
                        <div class="statut-content">
                            <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                            <span>Transaction expirée</span>
                        </div>
                    `;
                    statutElement.className = 'statut-paiement error';
                    if (this.timerExpiration) clearInterval(this.timerExpiration);
                }
            }
        } catch (error) {
            console.error('Erreur vérification statut:', error);
        }
    }
    
    reinitialiserApresPaiement() {
        this.panier = [];
        this.transactionEnCours = null;
        this.timerExpiration = null;
        
        document.getElementById('selection-section').style.display = 'block';
        document.getElementById('paiement-section').style.display = 'none';
        
        const statutElement = document.getElementById('statut-paiement');
        statutElement.className = 'statut-paiement';
        statutElement.innerHTML = `
            <div class="statut-content">
                <div class="loader"></div>
                <span>En attente du paiement...</span>
            </div>
        `;
        
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
        
        this.parler('Merci pour votre achat! Sélectionnez de nouvelles boissons');
    }
    
    retourSelection() {
        document.getElementById('selection-section').style.display = 'block';
        document.getElementById('paiement-section').style.display = 'none';
        
        if (this.timerExpiration) {
            clearInterval(this.timerExpiration);
        }
    }
    
    async annulerPaiement() {
        if (this.transactionEnCours && this.estConnecte) {
            try {
                await fetch(`${this.API_URL}/api/transaction/${this.transactionEnCours.id}/annuler`, {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Erreur annulation:', error);
            }
        }
        
        if (this.timerExpiration) clearInterval(this.timerExpiration);
        this.retourSelection();
        this.parler('Transaction annulée');
    }
    
    async chargerSolde() {
        try {
            const response = await fetch(`${this.API_URL}/api/solde/distributeur`);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                document.getElementById('solde-distributeur').textContent = result.solde;
            }
        } catch (error) {
            console.error('Erreur chargement solde:', error);
        }
    }
    
    parler(message) {
        // Utiliser la synthèse vocale du navigateur
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = 'fr-FR';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            speechSynthesis.speak(utterance);
        }
        
        // Jouer un son d'attention
        const audio = document.getElementById('audio-scan');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
        
        console.log('🔊 Message vocal:', message);
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', function() {
    window.distributeur = new DistributeurModerne();
});
