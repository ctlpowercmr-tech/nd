class DistributeurApp {
    constructor() {
        this.panier = [];
        this.produits = [];
        this.transactionEnCours = null;
        this.timerExpiration = null;
        this.API_URL = CONFIG.API_URL;
        this.estConnecte = false;
        
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
            if (response.ok) {
                this.estConnecte = true;
                this.mettreAJourStatutConnexion(true);
                return true;
            }
            throw new Error('Serveur non disponible');
        } catch (error) {
            this.estConnecte = false;
            this.mettreAJourStatutConnexion(false);
            return false;
        }
    }
    
    mettreAJourStatutConnexion(connecte) {
        const statusElement = document.querySelector('.status-online');
        if (statusElement) {
            if (connecte) {
                statusElement.innerHTML = '<i class="fas fa-wifi"></i><span>En ligne</span>';
                statusElement.style.background = 'rgba(16, 185, 129, 0.2)';
            } else {
                statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i><span>Hors ligne</span>';
                statusElement.style.background = 'rgba(239, 68, 68, 0.2)';
            }
        }
    }
    
    async chargerProduits() {
        try {
            const response = await fetch(`${this.API_URL}/api/produits`);
            const result = await response.json();
            
            if (result.success) {
                this.produits = result.produits;
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
            card.dataset.categorie = produit.categorie;
            card.innerHTML = `
                <div class="produit-image">
                    <i class="fas fa-wine-bottle"></i>
                </div>
                <div class="produit-nom">${produit.nom}</div>
                <div class="produit-marque">${produit.marque}</div>
                <div class="produit-prix">${produit.prix} FCFA</div>
                <div class="produit-taille">${produit.taille}</div>
            `;
            
            card.addEventListener('click', () => this.ajouterAuPanier(produit));
            grid.appendChild(card);
        });
        
        this.setupFiltres();
    }
    
    setupFiltres() {
        document.querySelectorAll('.filtre-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filtre-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const categorie = e.target.dataset.categorie;
                this.filtrerProduits(categorie);
            });
        });
    }
    
    filtrerProduits(categorie) {
        const produits = document.querySelectorAll('.produit-card');
        produits.forEach(produit => {
            if (categorie === 'all' || produit.dataset.categorie === categorie) {
                produit.style.display = 'block';
            } else {
                produit.style.display = 'none';
            }
        });
    }
    
    ajouterAuPanier(produit) {
        if (this.panier.length >= 2) {
            this.jouerAudio('error');
            this.afficherNotification('❌ Maximum 2 boissons autorisées', 'error');
            return;
        }
        
        if (this.panier.find(item => item.id === produit.id)) {
            this.jouerAudio('error');
            this.afficherNotification('❌ Cette boisson est déjà sélectionnée', 'error');
            return;
        }
        
        this.panier.push(produit);
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
        this.jouerAudio('selection');
        
        // Animation de sélection
        const cards = document.querySelectorAll('.produit-card');
        cards.forEach(card => {
            if (card.querySelector('.produit-nom').textContent === produit.nom) {
                card.classList.add('selected');
                setTimeout(() => card.classList.remove('selected'), 2000);
            }
        });
    }
    
    retirerDuPanier(produitId) {
        this.panier = this.panier.filter(item => item.id !== produitId);
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
    }
    
    mettreAJourPanier() {
        const panierItems = document.getElementById('panier-items');
        const nombreArticles = document.getElementById('nombre-articles');
        const totalPanier = document.getElementById('total-panier');
        
        if (this.panier.length === 0) {
            panierItems.innerHTML = `
                <div class="panier-vide">
                    <i class="fas fa-cart-arrow-down"></i>
                    <p>Votre panier est vide</p>
                    <small>Sélectionnez jusqu'à 2 boissons</small>
                </div>
            `;
        } else {
            panierItems.innerHTML = '';
            this.panier.forEach(produit => {
                const item = document.createElement('div');
                item.className = 'item-panier';
                item.innerHTML = `
                    <div class="item-info">
                        <div class="item-image">
                            <i class="fas fa-wine-bottle"></i>
                        </div>
                        <div class="item-details">
                            <h4>${produit.nom}</h4>
                            <div class="item-prix">${produit.prix} FCFA</div>
                        </div>
                    </div>
                    <button class="btn-retirer" onclick="distributeur.retirerDuPanier(${produit.id})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                panierItems.appendChild(item);
            });
        }
        
        const total = this.panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);
        nombreArticles.textContent = `${this.panier.length} article(s)`;
        totalPanier.textContent = `${total} FCFA`;
    }
    
    mettreAJourBoutons() {
        const btnVider = document.getElementById('btn-vider');
        const btnPayer = document.getElementById('btn-payer');
        
        btnVider.disabled = this.panier.length === 0;
        btnPayer.disabled = this.panier.length === 0 || !this.estConnecte;
    }
    
    setupEventListeners() {
        document.getElementById('btn-vider').addEventListener('click', () => this.viderPanier());
        document.getElementById('btn-payer').addEventListener('click', () => this.demarrerPaiement());
        document.getElementById('btn-fermer-paiement').addEventListener('click', () => this.fermerPaiement());
    }
    
    viderPanier() {
        this.panier = [];
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
        this.afficherNotification('🛒 Panier vidé', 'info');
    }
    
    async demarrerPaiement() {
        if (!this.estConnecte) {
            this.afficherNotification('❌ Impossible de se connecter au serveur', 'error');
            return;
        }
        
        const total = this.panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);
        
        try {
            const response = await fetch(`${this.API_URL}/api/transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    montant: total,
                    boissons: this.panier,
                    methodePaiement: 'QR Code'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.transactionEnCours = result.transaction;
                this.afficherQRCode(result.transaction);
                this.demarrerTimerExpiration();
                this.jouerMessageVocal(TEXTE_VOCAL.selection);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.afficherNotification(`❌ ${error.message}`, 'error');
        }
    }
    
    afficherQRCode(transaction) {
        const paiementSection = document.getElementById('paiement-section');
        const qrCodeElement = document.getElementById('qr-code');
        const transactionIdElement = document.getElementById('transaction-id');
        const montantTransactionElement = document.getElementById('montant-transaction');
        
        paiementSection.style.display = 'flex';
        
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
            qrCodeElement.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #000;">
                    <h3>ID: ${transaction.id}</h3>
                    <p>Montant: ${transaction.montant} FCFA</p>
                    <p>Utilisez cet ID dans l'application</p>
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
        statutElement.innerHTML = '<div class="statut-content"><span>❌ Transaction expirée</span></div>';
        statutElement.className = 'statut-paiement error';
    }
    
    async verifierStatutTransaction() {
        if (!this.transactionEnCours || !this.estConnecte) return;
        
        try {
            const response = await fetch(`${this.API_URL}/api/transaction/${this.transactionEnCours.id}`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                const transaction = result.transaction;
                const statutElement = document.getElementById('statut-paiement');
                
                if (transaction.statut === 'paye') {
                    statutElement.innerHTML = '<div class="statut-content"><span>✅ Paiement réussi! Distribution en cours...</span></div>';
                    statutElement.className = 'statut-paiement success';
                    
                    this.jouerMessageVocal(TEXTE_VOCAL.paiementReussi);
                    this.chargerSolde();
                    
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
    
    fermerPaiement() {
        if (this.transactionEnCours) {
            fetch(`${this.API_URL}/api/transaction/${this.transactionEnCours.id}/annuler`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
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
    
    jouerMessageVocal(message) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = 'fr-FR';
            utterance.rate = 1.0;
            speechSynthesis.speak(utterance);
        }
    }
    
    jouerAudio(type) {
        const audio = document.getElementById(`audio-${type}`);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio non joué:', e));
        }
    }
    
    afficherNotification(message, type = 'info') {
        // Créer une notification toast
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        if (type === 'error') {
            notification.style.background = 'var(--danger)';
        } else if (type === 'success') {
            notification.style.background = 'var(--success)';
        } else {
            notification.style.background = 'var(--primary)';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    getToken() {
        return localStorage.getItem('distributeur_token') || '';
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    window.distributeur = new DistributeurApp();
});
