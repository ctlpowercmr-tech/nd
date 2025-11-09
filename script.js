class DistributeurModerne {
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
        console.log('🚀 Initialisation Distributeur 3.0');
        await this.testerConnexionServeur();
        await this.chargerProduits();
        this.setupEventListeners();
        this.setupNavigation();
        
        setInterval(() => this.testerConnexionServeur(), 30000);
        setInterval(() => this.verifierStatutTransaction(), 2000);
        
        this.jouerMessageVocal('Système distributeur prêt. Sélectionnez vos boissons.');
    }
    
    async testerConnexionServeur() {
        try {
            const response = await fetch(`${this.API_URL}/api/health`);
            if (!response.ok) throw new Error('Serveur non disponible');
            
            const result = await response.json();
            this.estConnecte = result.status === 'OK';
            this.mettreAJourStatutConnexion(this.estConnecte ? 'connecte' : 'erreur');
            
            return this.estConnecte;
        } catch (error) {
            console.error('❌ Erreur connexion serveur:', error);
            this.estConnecte = false;
            this.mettreAJourStatutConnexion('erreur', error.message);
            return false;
        }
    }
    
    mettreAJourStatutConnexion(statut) {
        const element = document.getElementById('status-connexion');
        if (!element) return;
        
        const led = element.querySelector('.status-led');
        const text = element.querySelector('span');
        
        if (statut === 'connecte') {
            led.style.background = 'var(--cyber-green)';
            led.style.boxShadow = '0 0 10px var(--cyber-green)';
            text.textContent = 'EN LIGNE';
        } else {
            led.style.background = '#ff4757';
            led.style.boxShadow = '0 0 10px #ff4757';
            text.textContent = 'HORS LIGNE';
        }
    }
    
    async chargerProduits() {
        try {
            const response = await fetch(`${this.API_URL}/api/produits`);
            if (response.ok) {
                const result = await response.json();
                this.produits = result.data;
            } else {
                this.produits = PRODUITS_DEFAUT;
            }
        } catch (error) {
            console.error('Erreur chargement produits:', error);
            this.produits = PRODUITS_DEFAUT;
        }
        
        this.afficherProduits();
    }
    
    afficherProduits() {
        const grid = document.getElementById('produits-grid');
        grid.innerHTML = '';
        
        this.produits.forEach(produit => {
            const card = document.createElement('div');
            card.className = 'produit-card';
            card.innerHTML = `
                <div class="selection-glow"></div>
                <img src="${produit.image_url || produit.image}" alt="${produit.nom}" class="produit-image floating">
                <div class="produit-nom">${produit.nom}</div>
                <div class="produit-prix">${produit.prix} FCFA</div>
            `;
            
            card.addEventListener('click', () => this.ajouterAuPanier(produit));
            grid.appendChild(card);
        });
    }
    
    ajouterAuPanier(produit) {
        if (this.panier.length >= 2) {
            this.jouerMessageVocal('Maximum 2 produits autorisés. Veuillez finaliser votre sélection actuelle.');
            return;
        }
        
        if (this.panier.find(item => item.id === produit.id)) {
            this.jouerMessageVocal('Ce produit est déjà dans votre sélection.');
            return;
        }
        
        this.panier.push(produit);
        this.mettreAJourPanier();
        this.jouerSon('scan');
        
        if (this.panier.length === 2) {
            this.jouerMessageVocal('Sélection complète. Vous pouvez procéder au paiement.');
        }
    }
    
    retirerDuPanier(produitId) {
        this.panier = this.panier.filter(item => item.id !== produitId);
        this.mettreAJourPanier();
    }
    
    mettreAJourPanier() {
        const itemsElement = document.getElementById('panier-items');
        const totalElement = document.getElementById('total-panier');
        
        if (this.panier.length === 0) {
            itemsElement.innerHTML = '<div class="panier-vide">Aucun produit sélectionné</div>';
        } else {
            itemsElement.innerHTML = '';
            this.panier.forEach(produit => {
                const item = document.createElement('div');
                item.className = 'item-panier';
                item.innerHTML = `
                    <span>${produit.nom}</span>
                    <span>${produit.prix} FCFA</span>
                    <button onclick="distributeur.retirerDuPanier(${produit.id})" class="cyber-btn secondary" style="padding: 5px 10px; font-size: 0.8rem;">
                        ✕
                    </button>
                `;
                itemsElement.appendChild(item);
            });
        }
        
        const total = this.panier.reduce((sum, produit) => sum + produit.prix, 0);
        totalElement.textContent = total;
        
        // Mettre à jour les boutons de navigation
        this.mettreAJourNavigation();
    }
    
    setupEventListeners() {
        document.getElementById('btn-payer').addEventListener('click', () => this.demarrerPaiement());
        document.getElementById('annuler-paiement').addEventListener('click', () => this.annulerPaiement());
    }
    
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.section');
        
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetSection = button.getAttribute('data-section');
                
                // Mettre à jour les boutons
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Afficher la section
                sections.forEach(section => section.classList.remove('active'));
                document.getElementById(`${targetSection}-section`).classList.add('active');
            });
        });
    }
    
    mettreAJourNavigation() {
        const panierBtn = document.querySelector('[data-section="panier"]');
        const paiementBtn = document.querySelector('[data-section="paiement"]');
        
        if (this.panier.length > 0) {
            panierBtn.style.display = 'block';
            paiementBtn.style.display = 'block';
        } else {
            panierBtn.style.display = 'none';
            paiementBtn.style.display = 'none';
        }
    }
    
    async demarrerPaiement() {
        if (!this.estConnecte) {
            this.jouerMessageVocal('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
            return;
        }
        
        if (this.panier.length === 0) {
            this.jouerMessageVocal('Votre panier est vide. Veuillez sélectionner au moins un produit.');
            return;
        }
        
        const total = this.panier.reduce((sum, produit) => sum + produit.prix, 0);
        
        this.jouerMessageVocal(`Commande de ${total} FCFA. Veuillez scanner le QR code avec votre téléphone ou utiliser l ID de transaction.`);
        
        try {
            const response = await fetch(`${this.API_URL}/api/transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.getTokenDistributeur()
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
                
                // Aller à la section paiement
                document.querySelector('[data-section="paiement"]').click();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Erreur création transaction:', error);
            this.jouerMessageVocal('Erreur lors de la création de la transaction. Veuillez réessayer.');
        }
    }
    
    getTokenDistributeur() {
        // Pour le distributeur, on utilise un token fixe ou un système d'authentification spécial
        return 'distributeur_token_special';
    }
    
    afficherQRCode(transaction) {
        const qrCodeElement = document.getElementById('qr-code');
        const transactionIdElement = document.getElementById('transaction-id');
        const montantTransactionElement = document.getElementById('montant-transaction');
        
        transactionIdElement.textContent = transaction.id;
        montantTransactionElement.textContent = `${transaction.montant} FCFA`;
        
        // Données pour le QR code
        const qrData = JSON.stringify({
            transactionId: transaction.id,
            montant: transaction.montant,
            apiUrl: this.API_URL,
            type: 'paiement-boisson',
            timestamp: Date.now()
        });
        
        qrCodeElement.innerHTML = '';
        
        try {
            const qr = qrcode(0, 'L');
            qr.addData(qrData);
            qr.make();
            
            qrCodeElement.innerHTML = qr.createImgTag(4);
        } catch (error) {
            console.error('Erreur génération QR:', error);
            qrCodeElement.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; color: black; text-align: center;">
                    <h3 style="margin: 0 0 15px 0; color: #333;">ID TRANSACTION</h3>
                    <div style="font-size: 28px; font-weight: bold; color: #00f3ff; margin: 10px 0; font-family: Orbitron, monospace;">
                        ${transaction.id}
                    </div>
                    <p style="margin: 5px 0; color: #666;">Montant: ${transaction.montant} FCFA</p>
                    <p style="margin: 5px 0; color: #666;">Entrez cet ID dans l'application mobile</p>
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
        statutElement.innerHTML = '❌ TRANSACTION EXPIRÉE';
        statutElement.className = 'statut-paiement error';
        this.jouerMessageVocal('Transaction expirée. Veuillez recommencer votre sélection.');
    }
    
    async verifierStatutTransaction() {
        if (!this.transactionEnCours || !this.estConnecte) return;
        
        try {
            const response = await fetch(`${this.API_URL}/api/transaction/${this.transactionEnCours.id}`, {
                headers: {
                    'Authorization': 'Bearer ' + this.getTokenDistributeur()
                }
            });
            
            if (!response.ok) return;
            
            const result = await response.json();
            
            if (result.success) {
                const transaction = result.data;
                const statutElement = document.getElementById('statut-paiement');
                
                if (transaction.statut === 'paye') {
                    statutElement.innerHTML = '✅ PAIEMENT RÉUSSI';
                    statutElement.className = 'statut-paiement success';
                    
                    this.jouerSon('success');
                    this.jouerMessageVocal('Paiement réussi. Votre commande sera prête dans 4 secondes.');
                    
                    if (this.timerExpiration) clearInterval(this.timerExpiration);
                    
                    setTimeout(() => {
                        this.reinitialiserApresPaiement();
                        this.jouerMessageVocal('Commande délivrée. Merci et à bientôt !');
                    }, 4000);
                } else if (transaction.statut === 'annule') {
                    statutElement.innerHTML = '❌ TRANSACTION ANNULÉE';
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
        
        this.mettreAJourPanier();
        document.querySelector('[data-section="boissons"]').click();
        
        const statutElement = document.getElementById('statut-paiement');
        statutElement.innerHTML = '<div class="pulse-loader"></div><span>EN ATTENTE DE PAIEMENT...</span>';
        statutElement.className = 'statut-paiement';
    }
    
    annulerPaiement() {
        if (this.transactionEnCours && this.estConnecte) {
            fetch(`${this.API_URL}/api/transaction/${this.transactionEnCours.id}/annuler`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + this.getTokenDistributeur()
                }
            }).catch(console.error);
        }
        
        if (this.timerExpiration) clearInterval(this.timerExpiration);
        this.reinitialiserApresPaiement();
        this.jouerMessageVocal('Transaction annulée. Vous pouvez faire une nouvelle sélection.');
    }
    
    jouerMessageVocal(message) {
        // Utilisation de la synthèse vocale du navigateur
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = 'fr-FR';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            speechSynthesis.speak(utterance);
        }
    }
    
    jouerSon(type) {
        const audio = document.getElementById(`audio-${type}`);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio non joué:', e));
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.distributeur = new DistributeurModerne();
});
