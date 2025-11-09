class DistributeurFuturiste {
    constructor() {
        this.panier = [];
        this.transactionEnCours = null;
        this.timerExpiration = null;
        this.API_URL = CONFIG.API_URL;
        this.estConnecte = false;
        this.produits = [];
        
        this.init();
    }
    
    async init() {
        await this.testerConnexionServeur();
        await this.chargerProduits();
        this.chargerSolde();
        this.setupEventListeners();
        
        setInterval(() => this.verifierStatutTransaction(), 2000);
        setInterval(() => this.testerConnexionServeur(), 30000);
    }
    
    async testerConnexionServeur() {
        try {
            const response = await fetch(`${this.API_URL}/api/health`);
            const result = await response.json();
            
            if (result.success) {
                this.estConnecte = true;
                console.log('✅ Serveur connecté');
                return true;
            }
        } catch (error) {
            console.error('❌ Erreur connexion serveur:', error);
            this.estConnecte = false;
            return false;
        }
    }
    
    async chargerProduits() {
        try {
            const response = await fetch(`${this.API_URL}/api/produits`);
            const result = await response.json();
            
            if (result.success) {
                this.produits = result.data;
                this.afficherProduits();
            }
        } catch (error) {
            console.error('Erreur chargement produits:', error);
        }
    }
    
    afficherProduits() {
        const grid = document.getElementById('produits-grid');
        grid.innerHTML = '';
        
        this.produits.forEach(produit => {
            const card = document.createElement('div');
            card.className = 'produit-card';
            card.innerHTML = `
                <div class="produit-image">
                    ${this.getEmojiProduit(produit.nom)}
                </div>
                <div class="produit-info">
                    <div class="produit-nom">${produit.nom}</div>
                    <div class="produit-prix">${produit.prix} FCFA</div>
                    <div class="produit-stock">Stock: ${produit.stock}</div>
                </div>
            `;
            
            card.addEventListener('click', () => this.ajouterAuPanier(produit));
            grid.appendChild(card);
        });
    }
    
    getEmojiProduit(nom) {
        const emojis = {
            'Coca-Cola': '🥤',
            'Pepsi': '🥤',
            'Fanta': '🍊',
            'Sprite': '💚',
            'Malta': '🍺',
            'Orangina': '🍊',
            'Ice Tea': '🍃',
            'Schweppes': '💫'
        };
        
        for (const [key, emoji] of Object.entries(emojis)) {
            if (nom.includes(key)) return emoji;
        }
        return '🥤';
    }
    
    ajouterAuPanier(produit) {
        if (this.panier.length >= 2) {
            this.parler("Vous ne pouvez sélectionner que 2 produits maximum");
            return;
        }
        
        const existant = this.panier.find(item => item.id === produit.id);
        if (existant) {
            existant.quantite += 1;
        } else {
            this.panier.push({
                ...produit,
                quantite: 1
            });
        }
        
        this.parler("Produit sélectionné avec succès");
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
    }
    
    retirerDuPanier(produitId) {
        this.panier = this.panier.filter(item => item.id !== produitId);
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
    }
    
    mettreAJourPanier() {
        const panierItems = document.getElementById('panier-items');
        const totalElement = document.getElementById('total-panier');
        const counter = document.getElementById('counter');
        
        counter.textContent = this.panier.length;
        
        if (this.panier.length === 0) {
            panierItems.innerHTML = `
                <div class="panier-vide">
                    <div class="empty-icon">📭</div>
                    <p>Aucun produit sélectionné</p>
                </div>
            `;
        } else {
            panierItems.innerHTML = '';
            this.panier.forEach(item => {
                const element = document.createElement('div');
                element.className = 'item-panier';
                element.innerHTML = `
                    <div class="item-info">
                        <div class="item-quantite">${item.quantite}</div>
                        <div class="item-nom">${item.nom}</div>
                    </div>
                    <div class="item-prix">${item.prix * item.quantite} FCFA</div>
                    <button class="btn-retirer" onclick="distributeur.retirerDuPanier(${item.id})">✕</button>
                `;
                panierItems.appendChild(element);
            });
        }
        
        const total = this.panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
        totalElement.textContent = total;
    }
    
    mettreAJourBoutons() {
        const btnPayer = document.getElementById('btn-payer');
        btnPayer.disabled = this.panier.length === 0 || !this.estConnecte;
    }
    
    setupEventListeners() {
        document.getElementById('btn-payer').addEventListener('click', () => this.demarrerPaiement());
        document.getElementById('btn-reset').addEventListener('click', () => this.reinitialiser());
        document.getElementById('annuler-paiement').addEventListener('click', () => this.annulerPaiement());
    }
    
    async demarrerPaiement() {
        if (!this.estConnecte) {
            this.parler("Impossible de se connecter au serveur");
            return;
        }
        
        const total = this.panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
        
        try {
            const response = await fetch(`${this.API_URL}/api/transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    produits: this.panier
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.transactionEnCours = result.data;
                this.afficherQRCode(result.data);
                this.demarrerTimerExpiration();
                this.parler("Veuillez scanner le QR code avec votre téléphone ou utiliser cet ID de transaction");
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.parler("Erreur de connexion au serveur");
        }
    }
    
    afficherQRCode(transaction) {
        const paiementSection = document.getElementById('paiement-section');
        const qrCodeElement = document.getElementById('qr-code');
        const transactionIdElement = document.getElementById('transaction-id');
        const montantTransactionElement = document.getElementById('montant-transaction');
        
        paiementSection.style.display = 'block';
        paiementSection.scrollIntoView({ behavior: 'smooth' });
        
        transactionIdElement.textContent = transaction.id;
        montantTransactionElement.textContent = `${transaction.montant} FCFA`;
        
        // Générer QR code
        qrCodeElement.innerHTML = '';
        const qrData = JSON.stringify({
            transactionId: transaction.id,
            montant: transaction.montant,
            apiUrl: this.API_URL
        });
        
        try {
            const qr = qrcode(0, 'L');
            qr.addData(qrData);
            qr.make();
            qrCodeElement.innerHTML = qr.createImgTag(4);
        } catch (error) {
            console.error('Erreur QR code:', error);
            qrCodeElement.innerHTML = `
                <div style="text-align: center; color: black; padding: 20px;">
                    <h3>ID: ${transaction.id}</h3>
                    <p>Montant: ${transaction.montant} FCFA</p>
                </div>
            `;
        }
    }
    
    demarrerTimerExpiration() {
        if (this.timerExpiration) clearInterval(this.timerExpiration);
        
        let tempsRestant = 600;
        const timerElement = document.getElementById('expiration-timer');
        
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
        statutElement.innerHTML = '<span>❌ Transaction expirée</span>';
        statutElement.className = 'statut-paiement error';
    }
    
    async verifierStatutTransaction() {
        if (!this.transactionEnCours) return;
        
        try {
            const response = await fetch(`${this.API_URL}/api/transaction/${this.transactionEnCours.id}`);
            const result = await response.json();
            
            if (result.success) {
                const transaction = result.data;
                const statutElement = document.getElementById('statut-paiement');
                
                if (transaction.statut === 'paye') {
                    statutElement.innerHTML = '<span>✅ Paiement réussi! Distribution en cours...</span>';
                    statutElement.className = 'statut-paiement success';
                    
                    this.parler("Paiement réussi! Votre commande sera prête dans 4 secondes");
                    await this.chargerSolde();
                    
                    if (this.timerExpiration) clearInterval(this.timerExpiration);
                    
                    setTimeout(() => {
                        this.reinitialiserApresPaiement();
                    }, 4000);
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
        
        document.getElementById('paiement-section').style.display = 'none';
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
    }
    
    reinitialiser() {
        this.panier = [];
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
    }
    
    async annulerPaiement() {
        if (this.transactionEnCours) {
            try {
                await fetch(`${this.API_URL}/api/transaction/${this.transactionEnCours.id}/annuler`, {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Erreur annulation:', error);
            }
        }
        
        if (this.timerExpiration) clearInterval(this.timerExpiration);
        this.reinitialiserApresPaiement();
    }
    
    async chargerSolde() {
        try {
            const response = await fetch(`${this.API_URL}/api/solde/distributeur`);
            const result = await response.json();
            
            if (result.success) {
                document.getElementById('solde-distributeur').textContent = result.solde;
            }
        } catch (error) {
            console.error('Erreur chargement solde:', error);
        }
    }
    
    parler(message) {
        // Notification visuelle
        const notification = document.getElementById('vocal-notification');
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
        
        // Synthèse vocale
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = 'fr-FR';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            speechSynthesis.speak(utterance);
        }
    }
}

// Initialisation
const distributeur = new DistributeurFuturiste();
