class DistributeurFuturiste {
    constructor() {
        this.panier = [];
        this.transactionEnCours = null;
        this.timerExpiration = null;
        this.API_URL = CONFIG.API_URL;
        this.estConnecte = false;
        
        this.init();
    }
    
    async init() {
        this.mettreAJourDateHeure();
        setInterval(() => this.mettreAJourDateHeure(), 1000);
        
        await this.testerConnexionServeur();
        this.afficherBoissons();
        this.setupEventListeners();
        
        setInterval(() => this.verifierStatutTransaction(), 2000);
        setInterval(() => this.testerConnexionServeur(), 30000);
    }
    
    mettreAJourDateHeure() {
        const maintenant = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        document.getElementById('datetime').textContent = 
            maintenant.toLocaleDateString('fr-FR', options);
    }
    
    async testerConnexionServeur() {
        try {
            const response = await fetch(`${this.API_URL}/api/health`);
            const result = await response.json();
            
            if (result.success) {
                this.estConnecte = true;
                this.afficherNotification('✅ Serveur connecté', 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.estConnecte = false;
            this.afficherNotification('❌ Serveur hors ligne', 'error');
        }
    }
    
    afficherNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    afficherBoissons() {
        const grid = document.getElementById('boissons-grid');
        grid.innerHTML = '';
        
        CONFIG.BOISSONS.forEach(boisson => {
            const card = document.createElement('div');
            card.className = 'boisson-card';
            card.innerHTML = `
                <div class="boisson-image">
                    <img src="${boisson.image}" alt="${boisson.nom}" onerror="this.src='https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop'">
                </div>
                <div class="boisson-nom">${boisson.nom}</div>
                <div class="boisson-prix">${boisson.prix} FCFA</div>
            `;
            
            card.addEventListener('click', () => this.ajouterAuPanier(boisson));
            grid.appendChild(card);
        });
    }
    
    ajouterAuPanier(boisson) {
        if (this.panier.length >= 2) {
            this.afficherNotification('❌ Maximum 2 boissons autorisées', 'error');
            return;
        }
        
        if (this.panier.find(item => item.id === boisson.id)) {
            this.afficherNotification('❌ Boisson déjà sélectionnée', 'error');
            return;
        }
        
        this.panier.push(boisson);
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
        this.afficherNotification(`✅ ${boisson.nom} ajoutée`, 'success');
        
        // Message vocal simulé
        this.syntheseVocale(`Boisson ${boisson.nom} sélectionnée`);
    }
    
    retirerDuPanier(boissonId) {
        const boisson = this.panier.find(item => item.id === boissonId);
        this.panier = this.panier.filter(item => item.id !== boissonId);
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
        
        if (boisson) {
            this.afficherNotification(`❌ ${boisson.nom} retirée`, 'info');
        }
    }
    
    mettreAJourPanier() {
        const panierElement = document.getElementById('panier');
        const totalElement = document.getElementById('total-panier');
        const counterElement = document.getElementById('counter');
        
        counterElement.textContent = this.panier.length;
        
        if (this.panier.length === 0) {
            panierElement.innerHTML = `
                <div class="panier-vide">
                    <div class="empty-icon">🥤</div>
                    <p>Aucune boisson sélectionnée</p>
                </div>
            `;
        } else {
            panierElement.innerHTML = '';
            this.panier.forEach(boisson => {
                const item = document.createElement('div');
                item.className = 'item-panier';
                item.innerHTML = `
                    <div>
                        <strong>${boisson.nom}</strong>
                        <div>${boisson.prix} FCFA</div>
                    </div>
                    <button onclick="distributeur.retirerDuPanier(${boisson.id})" class="btn-retirer">✕</button>
                `;
                panierElement.appendChild(item);
            });
        }
        
        const total = this.panier.reduce((sum, boisson) => sum + boisson.prix, 0);
        totalElement.textContent = `${total} FCFA`;
    }
    
    mettreAJourBoutons() {
        const btnPayer = document.getElementById('btn-payer');
        const btnModifier = document.getElementById('btn-modifier');
        
        btnPayer.disabled = this.panier.length === 0 || !this.estConnecte;
        btnModifier.disabled = this.panier.length === 0;
    }
    
    setupEventListeners() {
        document.getElementById('btn-payer').addEventListener('click', () => this.demarrerPaiement());
        document.getElementById('btn-modifier').addEventListener('click', () => this.modifierCommande());
        document.getElementById('annuler-paiement').addEventListener('click', () => this.annulerPaiement());
    }
    
    async demarrerPaiement() {
        if (!this.estConnecte) {
            this.afficherNotification('❌ Impossible de se connecter au serveur', 'error');
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
                this.afficherQRCode(result.data);
                this.demarrerTimerExpiration();
                this.afficherNotification('✅ Transaction créée', 'success');
                
                // Message vocal
                this.syntheseVocale("Veuillez scanner le QR code avec votre téléphone ou utiliser l'ID de transaction");
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.afficherNotification(`❌ Erreur: ${error.message}`, 'error');
        }
    }
    
    afficherQRCode(transaction) {
        const paiementSection = document.getElementById('paiement-section');
        const qrCodeElement = document.getElementById('qr-code');
        const transactionIdElement = document.getElementById('transaction-id');
        const montantTransactionElement = document.getElementById('montant-transaction');
        
        paiementSection.style.display = 'block';
        transactionIdElement.textContent = transaction.id;
        montantTransactionElement.textContent = `${transaction.montant} FCFA`;
        
        const qrData = JSON.stringify({
            transactionId: transaction.id,
            montant: transaction.montant,
            apiUrl: this.API_URL,
            timestamp: Date.now()
        });
        
        qrCodeElement.innerHTML = '';
        
        try {
            const qr = qrcode(0, 'L');
            qr.addData(qrData);
            qr.make();
            qrCodeElement.innerHTML = qr.createImgTag(4);
        } catch (error) {
            qrCodeElement.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; color: black;">
                    <h3 style="margin: 0 0 10px 0;">ID Transaction:</h3>
                    <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${transaction.id}</p>
                    <p>Montant: ${transaction.montant} FCFA</p>
                    <p>Entrez cet ID dans l'application mobile</p>
                </div>
            `;
        }
        
        paiementSection.scrollIntoView({ behavior: 'smooth' });
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
        statutElement.innerHTML = '❌ Transaction expirée';
        statutElement.className = 'paiement-status error';
        this.afficherNotification('❌ Transaction expirée', 'error');
    }
    
    async verifierStatutTransaction() {
        if (!this.transactionEnCours || !this.estConnecte) return;
        
        try {
            const response = await fetch(`${this.API_URL}/api/transaction/${this.transactionEnCours.id}`);
            const result = await response.json();
            
            if (result.success) {
                const transaction = result.data;
                const statutElement = document.getElementById('statut-paiement');
                
                if (transaction.statut === 'paye') {
                    statutElement.innerHTML = '✅ Paiement réussi! Distribution en cours...';
                    statutElement.className = 'paiement-status success';
                    
                    if (this.timerExpiration) clearInterval(this.timerExpiration);
                    
                    // Message vocal
                    this.syntheseVocale("Paiement réussi! Votre commande sera prête dans 4 secondes");
                    
                    setTimeout(() => {
                        this.reinitialiserApresPaiement();
                        this.afficherNotification('🎉 Commande délivrée avec succès!', 'success');
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
        const statutElement = document.getElementById('statut-paiement');
        statutElement.className = 'paiement-status';
        statutElement.innerHTML = `
            <div class="status-loading">
                <div class="loading-spinner"></div>
                <span>En attente de paiement...</span>
            </div>
        `;
        
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
    }
    
    modifierCommande() {
        this.panier = [];
        this.mettreAJourPanier();
        this.mettreAJourBoutons();
        this.afficherNotification('🔄 Commande modifiée', 'info');
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
        this.reinitialiserApresPaiement();
        this.afficherNotification('❌ Transaction annulée', 'info');
    }
    
    syntheseVocale(message) {
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
document.addEventListener('DOMContentLoaded', function() {
    window.distributeur = new DistributeurFuturiste();
});
