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
        console.log('🚀 Initialisation du distributeur...');
        await this.testerConnexionServeur();
        await this.chargerBoissons();
        this.afficherBoissons();
        this.chargerSolde();
        this.setupEventListeners();
        
        setInterval(() => this.verifierStatutTransaction(), 2000);
        setInterval(() => this.testerConnexionServeur(), 30000);
        
        this.afficherMessageVocal('Système distributeur prêt!');
    }
    
    async testerConnexionServeur() {
        try {
            const response = await fetch(`${this.API_URL}/api/health`);
            const result = await response.json();
            
            if (result.success) {
                this.estConnecte = true;
                this.mettreAJourStatutConnexion('connecte');
                console.log('✅ Serveur connecté');
                return true;
            }
        } catch (error) {
            console.error('❌ Serveur non connecté:', error);
            this.estConnecte = false;
            this.mettreAJourStatutConnexion('erreur');
        }
        return false;
    }
    
    mettreAJourStatutConnexion(statut) {
        const element = document.getElementById('statut-connexion');
        if (!element) return;
        
        const lumiere = element.querySelector('.statut-lumiere');
        const texte = element.querySelector('span');
        
        if (statut === 'connecte') {
            lumiere.style.background = '#10b981';
            texte.textContent = 'En ligne';
        } else {
            lumiere.style.background = '#ef4444';
            texte.textContent = 'Hors ligne';
        }
    }
    
    async chargerBoissons() {
        try {
            const response = await fetch(`${this.API_URL}/api/boissons`);
            const result = await response.json();
            
            if (result.success) {
                this.boissons = result.data;
                console.log('✅ Boissons chargées:', this.boissons.length);
            } else {
                throw new Error('Erreur chargement boissons');
            }
        } catch (error) {
            console.error('Erreur chargement boissons:', error);
            // Fallback
            this.boissons = [
                {
                    id: 1,
                    nom: "Coca-Cola Original",
                    prix: 500,
                    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&h=300&fit=crop",
                    categorie: "Soda",
                    taille: "33cl",
                    promotion: false
                },
                {
                    id: 2,
                    nom: "Pepsi Max",
                    prix: 500,
                    image: "https://images.unsplash.com/photo-1624555130581-1d9cca1a1a71?w=300&h=300&fit=crop",
                    categorie: "Soda",
                    taille: "33cl",
                    promotion: false
                }
            ];
        }
    }
    
    afficherBoissons() {
        const grid = document.getElementById('boissons-grid');
        if (!grid) {
            console.error('❌ Element boissons-grid non trouvé');
            return;
        }
        
        grid.innerHTML = '';
        
        this.boissons.forEach(boisson => {
            const card = document.createElement('div');
            card.className = 'boisson-card';
            card.setAttribute('data-categorie', boisson.categorie);
            card.innerHTML = `
                ${boisson.promotion ? '<div class="promotion-badge">🔥 PROMO</div>' : ''}
                <div class="boisson-image">
                    <img src="${boisson.image}" alt="${boisson.nom}" 
                         onerror="this.src='https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop'"
                         loading="lazy">
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
            this.afficherMessageVocal('Maximum 2 boissons autorisées');
            return;
        }
        
        if (this.panier.find(item => item.id === boisson.id)) {
            this.afficherMessageVocal('Cette boisson est déjà sélectionnée');
            return;
        }
        
        this.panier.push(boisson);
        this.mettreAJourPanier();
        this.afficherMessageVocal(`${boisson.nom} ajoutée au panier`);
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
        
        if (!panierItems || !totalElement || !nombreElement || !panierFlottant) {
            console.error('❌ Éléments panier non trouvés');
            return;
        }
        
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
                    <button class="btn-retirer">✕</button>
                `;
                
                // Ajouter l'événement sur le bouton
                item.querySelector('.btn-retirer').addEventListener('click', () => {
                    this.retirerDuPanier(boisson.id);
                });
                
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
        if (btnPayer) {
            btnPayer.disabled = this.panier.length === 0 || !this.estConnecte;
        }
    }
    
    setupEventListeners() {
        // Payer
        const btnPayer = document.getElementById('btn-payer');
        if (btnPayer) {
            btnPayer.addEventListener('click', () => this.demarrerPaiement());
        }
        
        // Vider panier
        const btnVider = document.getElementById('btn-vider');
        if (btnVider) {
            btnVider.addEventListener('click', () => this.viderPanier());
        }
        
        // Fermer modal
        const btnFermer = document.getElementById('fermer-modal');
        if (btnFermer) {
            btnFermer.addEventListener('click', () => this.fermerModal());
        }
        
        // Annuler paiement
        const btnAnnuler = document.getElementById('annuler-paiement');
        if (btnAnnuler) {
            btnAnnuler.addEventListener('click', () => this.annulerPaiement());
        }
    }
    
    async demarrerPaiement() {
        if (!this.estConnecte) {
            this.afficherMessageVocal('Serveur non connecté');
            return;
        }
        
        if (this.panier.length === 0) {
            this.afficherMessageVocal('Panier vide');
            return;
        }
        
        const total = this.panier.reduce((sum, boisson) => sum + boisson.prix, 0);
        console.log('💰 Démarrage paiement:', total, 'FCFA');
        
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
            
            console.log('📤 Réponse serveur:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📄 Résultat transaction:', result);
            
            if (result.success) {
                this.transactionEnCours = result.data;
                this.afficherModalPaiement(result.data);
                this.afficherMessageVocal("Veuillez scanner le QR code avec votre téléphone");
            } else {
                throw new Error(result.error || 'Erreur inconnue');
            }
        } catch (error) {
            console.error('❌ Erreur paiement:', error);
            this.afficherMessageVocal('Erreur de connexion au serveur');
        }
    }
    
    afficherModalPaiement(transaction) {
        const modal = document.getElementById('modal-paiement');
        const qrCodeElement = document.getElementById('qr-code');
        
        if (!modal || !qrCodeElement) {
            console.error('❌ Éléments modal non trouvés');
            return;
        }
        
        document.getElementById('transaction-id').textContent = transaction.id;
        document.getElementById('montant-transaction').textContent = `${transaction.montant} FCFA`;
        
        // Générer QR code
        this.genererQRCode(transaction, qrCodeElement);
        
        modal.style.display = 'flex';
        this.demarrerTimerExpiration();
    }
    
    genererQRCode(transaction, element) {
        element.innerHTML = '';
        
        const qrData = JSON.stringify({
            transactionId: transaction.id,
            montant: transaction.montant,
            apiUrl: this.API_URL
        });
        
        console.log('🎯 Génération QR code:', qrData);
        
        try {
            // Utilisation correcte de la librairie QRCode
            QRCode.toCanvas(element, qrData, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }, function(error) {
                if (error) {
                    console.error('❌ Erreur QR code:', error);
                    // Fallback
                    element.innerHTML = `
                        <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; color: black;">
                            <h3 style="margin: 0 0 10px 0; font-size: 18px;">ID Transaction</h3>
                            <p style="font-size: 24px; font-weight: bold; margin: 0 0 10px 0; color: #667eea;">${transaction.id}</p>
                            <p style="margin: 0 0 10px 0; font-size: 16px;">Montant: ${transaction.montant} FCFA</p>
                            <p style="margin: 0; font-size: 14px; color: #666;">Entrez cet ID dans l'application</p>
                        </div>
                    `;
                } else {
                    console.log('✅ QR code généré avec succès');
                }
            });
        } catch (error) {
            console.error('❌ Erreur génération QR:', error);
            element.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; color: black;">
                    <h3 style="margin: 0 0 10px 0;">ID: ${transaction.id}</h3>
                    <p style="margin: 0;">${transaction.montant} FCFA</p>
                </div>
            `;
        }
    }
    
    fermerModal() {
        const modal = document.getElementById('modal-paiement');
        if (modal) {
            modal.style.display = 'none';
        }
        this.annulerPaiement();
    }
    
    demarrerTimerExpiration() {
        if (this.timerExpiration) clearInterval(this.timerExpiration);
        
        const timerElement = document.getElementById('expiration-timer');
        if (!timerElement) return;
        
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
        if (statutElement) {
            statutElement.innerHTML = '❌ Transaction expirée';
            statutElement.className = 'statut-paiement error';
        }
    }
    
    async verifierStatutTransaction() {
        if (!this.transactionEnCours || !this.estConnecte) return;
        
        try {
            const response = await fetch(`${this.API_URL}/api/transaction/${this.transactionEnCours.id}`);
            const result = await response.json();
            
            if (result.success && result.data.statut === 'paye') {
                const statutElement = document.getElementById('statut-paiement');
                if (statutElement) {
                    statutElement.innerHTML = '✅ Paiement réussi!';
                    statutElement.className = 'statut-paiement success';
                }
                
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
        
        if (this.timerExpiration) {
            clearInterval(this.timerExpiration);
            this.timerExpiration = null;
        }
        
        const modal = document.getElementById('modal-paiement');
        if (modal) {
            modal.style.display = 'none';
        }
        
        const statutElement = document.getElementById('statut-paiement');
        if (statutElement) {
            statutElement.className = 'statut-paiement';
            statutElement.innerHTML = '<div class="loader"></div><span>En attente de paiement...</span>';
        }
        
        this.mettreAJourPanier();
        this.chargerSolde();
        this.afficherMessageVocal('Commande livrée! Merci de votre achat.');
    }
    
    viderPanier() {
        this.panier = [];
        this.mettreAJourPanier();
        this.afficherMessageVocal('Panier vidé');
    }
    
    annulerPaiement() {
        if (this.transactionEnCours && this.estConnecte) {
            fetch(`${this.API_URL}/api/transaction/${this.transactionEnCours.id}/annuler`, {
                method: 'POST'
            }).catch(error => console.error('Erreur annulation:', error));
        }
        
        if (this.timerExpiration) {
            clearInterval(this.timerExpiration);
            this.timerExpiration = null;
        }
        
        this.reinitialiserApresPaiement();
    }
    
    async chargerSolde() {
        try {
            const response = await fetch(`${this.API_URL}/api/solde/distributeur`);
            const result = await response.json();
            
            if (result.success) {
                const soldeElement = document.getElementById('solde-distributeur');
                if (soldeElement) {
                    soldeElement.textContent = `${result.solde} FCFA`;
                }
            }
        } catch (error) {
            console.error('Erreur chargement solde:', error);
        }
    }
    
    afficherMessageVocal(message) {
        const notification = document.getElementById('notification-vocale');
        const messageElement = document.getElementById('message-vocal');
        
        if (!notification || !messageElement) {
            console.log('🔊 Message vocal:', message);
            return;
        }
        
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

// Initialisation quand la page est chargée
document.addEventListener('DOMContentLoaded', function() {
    window.distributeur = new DistributeurModerne();
});
