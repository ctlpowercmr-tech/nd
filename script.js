class DistributeurModerne {
    constructor() {
        this.panier = [];
        this.transactionEnCours = null;
        this.timerExpiration = null;
        this.API_URL = CONFIG.API_URL;
        this.estConnecte = false;
        this.boissons = [];
        
        console.log('🚀 Initialisation distributeur - URL API:', this.API_URL);
        this.init();
    }
    
    async init() {
        console.log('🔗 Test connexion serveur...');
        await this.testerConnexionServeur();
        await this.chargerBoissons();
        this.afficherBoissons();
        this.chargerSolde();
        this.setupEventListeners();
        
        // Vérifier le statut des transactions
        setInterval(() => this.verifierStatutTransaction(), 3000);
        // Vérifier la connexion périodiquement
        setInterval(() => this.testerConnexionServeur(), 15000);
        
        this.afficherMessageVocal('Système distributeur prêt');
    }
    
    async testerConnexionServeur() {
        try {
            console.log('🔄 Test connexion:', `${this.API_URL}/api/health`);
            const response = await fetch(`${this.API_URL}/api/health`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.estConnecte = true;
                this.mettreAJourStatutConnexion('connecte');
                console.log('✅ Serveur connecté');
                return true;
            } else {
                throw new Error('Réponse serveur invalide');
            }
        } catch (error) {
            console.error('❌ Erreur connexion serveur:', error.message);
            this.estConnecte = false;
            this.mettreAJourStatutConnexion('erreur');
            return false;
        }
    }
    
    mettreAJourStatutConnexion(statut) {
        let statutElement = document.getElementById('statut-connexion');
        
        if (!statutElement) {
            statutElement = document.createElement('div');
            statutElement.id = 'statut-connexion';
            statutElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 10px 15px;
                border-radius: 20px;
                font-weight: bold;
                z-index: 1000;
                backdrop-filter: blur(10px);
                font-size: 14px;
            `;
            document.body.appendChild(statutElement);
        }
        
        if (statut === 'connecte') {
            statutElement.textContent = '✅ En ligne';
            statutElement.style.background = 'rgba(16, 185, 129, 0.9)';
            statutElement.style.color = 'white';
        } else {
            statutElement.textContent = '❌ Hors ligne';
            statutElement.style.background = 'rgba(239, 68, 68, 0.9)';
            statutElement.style.color = 'white';
        }
    }
    
    async chargerBoissons() {
        try {
            console.log('📦 Chargement des boissons...');
            const response = await fetch(`${this.API_URL}/api/boissons`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.boissons = result.data;
                console.log(`✅ ${this.boissons.length} boissons chargées`);
            } else {
                throw new Error('Réponse API invalide');
            }
        } catch (error) {
            console.error('❌ Erreur chargement boissons:', error);
            // Fallback en cas d'erreur
            this.boissons = this.getBoissonsFallback();
            console.log('🔄 Utilisation des boissons de secours');
        }
    }
    
    getBoissonsFallback() {
        return [
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
            },
            {
                id: 5,
                nom: "Coca-Cola Zéro",
                prix: 500,
                image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
                categorie: "Soda",
                taille: "33cl",
                promotion: false
            },
            {
                id: 6,
                nom: "Monster Energy",
                prix: 800,
                image: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&h=400&fit=crop",
                categorie: "Energy",
                taille: "50cl",
                promotion: false
            }
        ];
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
            console.error('❌ Éléments du panier non trouvés');
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
        if (btnPayer) {
            btnPayer.disabled = this.panier.length === 0 || !this.estConnecte;
            
            if (!this.estConnecte) {
                btnPayer.title = 'Serveur non connecté';
            } else {
                btnPayer.title = '';
            }
        }
    }
    
    setupEventListeners() {
        // Bouton payer
        const btnPayer = document.getElementById('btn-payer');
        if (btnPayer) {
            btnPayer.addEventListener('click', () => this.demarrerPaiement());
        }
        
        // Bouton vider panier
        const btnVider = document.getElementById('btn-vider');
        if (btnVider) {
            btnVider.addEventListener('click', () => this.viderPanier());
        }
        
        // Bouton fermer modal
        const btnFermer = document.getElementById('fermer-modal');
        if (btnFermer) {
            btnFermer.addEventListener('click', () => this.fermerModal());
        }
        
        // Bouton annuler paiement
        const btnAnnuler = document.getElementById('annuler-paiement');
        if (btnAnnuler) {
            btnAnnuler.addEventListener('click', () => this.annulerPaiement());
        }
        
        console.log('✅ Event listeners configurés');
    }
    
    async demarrerPaiement() {
        console.log('💰 Démarrage paiement...');
        
        if (!this.estConnecte) {
            this.afficherMessageVocal('Serveur non connecté');
            return;
        }
        
        if (this.panier.length === 0) {
            this.afficherMessageVocal('Panier vide');
            return;
        }
        
        const total = this.panier.reduce((sum, boisson) => sum + boisson.prix, 0);
        console.log(`💵 Montant total: ${total} FCFA`);
        
        try {
            console.log('📤 Envoi requête transaction...');
            const response = await fetch(`${this.API_URL}/api/transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    montant: total,
                    boissons: this.panier
                })
            });
            
            console.log('📥 Réponse reçue:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('📄 Résultat transaction:', result);
            
            if (result.success) {
                this.transactionEnCours = result.data;
                this.afficherModalPaiement(result.data);
                this.afficherMessageVocal("Veuillez scanner le QR code avec votre téléphone");
            } else {
                throw new Error(result.error || 'Erreur création transaction');
            }
        } catch (error) {
            console.error('❌ Erreur paiement:', error);
            this.afficherMessageVocal('Erreur de connexion au serveur');
        }
    }
    
    afficherModalPaiement(transaction) {
        console.log('🎪 Affichage modal paiement:', transaction.id);
        
        const modal = document.getElementById('modal-paiement');
        const qrCodeElement = document.getElementById('qr-code');
        
        if (!modal || !qrCodeElement) {
            console.error('❌ Éléments modal non trouvés');
            return;
        }
        
        // Mettre à jour les informations
        document.getElementById('transaction-id').textContent = transaction.id;
        document.getElementById('montant-transaction').textContent = `${transaction.montant} FCFA`;
        
        // Générer le QR code
        this.genererQRCode(transaction, qrCodeElement);
        
        // Afficher le modal
        modal.style.display = 'flex';
        this.demarrerTimerExpiration();
    }
    
    genererQRCode(transaction, element) {
        // Nettoyer l'élément
        element.innerHTML = '';
        
        // Données à encoder dans le QR code
        const qrData = JSON.stringify({
            transactionId: transaction.id,
            montant: transaction.montant,
            apiUrl: this.API_URL,
            timestamp: Date.now()
        });
        
        console.log('📱 Génération QR code avec données:', qrData);
        
        try {
            // Utiliser la librairie QRCode de façon SYNCHRONE et SIMPLE
            const qr = QRCode(0, 'M');
            qr.addData(qrData);
            qr.make();
            
            // Créer l'image du QR code
            const qrImage = qr.createImgTag(4);
            element.innerHTML = qrImage;
            
            console.log('✅ QR code généré avec succès');
            
        } catch (error) {
            console.error('❌ Erreur génération QR code:', error);
            // Fallback: afficher l'ID de transaction
            element.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; color: black;">
                    <h3 style="margin: 0 0 10px 0; font-size: 18px;">ID Transaction</h3>
                    <p style="font-size: 24px; font-weight: bold; margin: 0 0 10px 0; color: #667eea;">${transaction.id}</p>
                    <p style="margin: 0 0 10px 0; font-size: 16px;">Montant: <strong>${transaction.montant} FCFA</strong></p>
                    <p style="margin: 0; font-size: 14px; color: #666;">Entrez cet ID dans l'application mobile</p>
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
        if (this.timerExpiration) {
            clearInterval(this.timerExpiration);
        }
        
        const timerElement = document.getElementById('expiration-timer');
        if (!timerElement) return;
        
        let tempsRestant = 600; // 10 minutes
        
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
            
            if (!response.ok) return;
            
            const result = await response.json();
            
            if (result.success && result.data.statut === 'paye') {
                const statutElement = document.getElementById('statut-paiement');
                if (statutElement) {
                    statutElement.innerHTML = '✅ Paiement réussi!';
                    statutElement.className = 'statut-paiement success';
                }
                
                this.afficherMessageVocal("Paiement réussi! Votre commande sera prête dans 4 secondes");
                
                if (this.timerExpiration) {
                    clearInterval(this.timerExpiration);
                }
                
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
            
            if (!response.ok) return;
            
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
        console.log('🔊 Message vocal:', message);
        
        const notification = document.getElementById('notification-vocale');
        const messageElement = document.getElementById('message-vocal');
        
        if (!notification || !messageElement) {
            console.error('❌ Éléments notification non trouvés');
            return;
        }
        
        messageElement.textContent = message;
        notification.style.display = 'block';
        
        // Synthèse vocale
        if ('speechSynthesis' in window) {
            // Arrêter toute parole en cours
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = 'fr-FR';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            
            speechSynthesis.speak(utterance);
        }
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Initialisation globale
let distributeur;

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - Initialisation distributeur...');
    distributeur = new DistributeurModerne();
});

// Exposer globalement pour les événements onclick
window.distributeur = distributeur;
