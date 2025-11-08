const CONFIG = {
  API_URL: 'https://ns-rzdd.onrender.com'
};

const BOISSONS = [
  { 
    id: 1, 
    nom: "Coca-Cola", 
    prix: 500, 
    icone: "🥤", 
    couleur: "#E10E02",
    description: "Boisson gazeuse rafraîchissante",
    taille: "33cl",
    image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=200&fit=crop"
  },
  { 
    id: 2, 
    nom: "Pepsi", 
    prix: 500, 
    icone: "🥤", 
    couleur: "#004B93",
    description: "Saveur unique et rafraîchissante",
    taille: "33cl",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=200&fit=crop"
  },
  { 
    id: 3, 
    nom: "Fanta Orange", 
    prix: 500, 
    icone: "🍊", 
    couleur: "#FF8C00",
    description: "Goût orange pétillant",
    taille: "33cl",
    image: "https://images.unsplash.com/photo-1624517452483-7d5dffa935e9?w=200&h=200&fit=crop"
  },
  { 
    id: 4, 
    nom: "Sprite", 
    prix: 500, 
    icone: "💚", 
    couleur: "#00FF00",
    description: "Limonade au citron clair",
    taille: "33cl",
    image: "https://images.unsplash.com/photo-1632441719959-cc5d5b164c26?w=200&h=200&fit=crop"
  },
  { 
    id: 5, 
    nom: "Coca-Cola Zéro", 
    prix: 600, 
    icone: "⚫", 
    couleur: "#000000",
    description: "Même goût, zéro sucre",
    taille: "33cl",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop"
  },
  { 
    id: 6, 
    nom: "Pepsi Max", 
    prix: 600, 
    icone: "⚫", 
    couleur: "#2D2D2D",
    description: "Maximum de goût, zéro calorie",
    taille: "33cl",
    image: "https://images.unsplash.com/photo-1603398938373-e54da0bb5e48?w=200&h=200&fit=crop"
  },
  { 
    id: 7, 
    nom: "Fanta Ananas", 
    prix: 700, 
    icone: "🍍", 
    couleur: "#FFD700",
    description: "Saveur ananas tropical",
    taille: "50cl",
    image: "https://images.unsplash.com/photo-1624517452485-a8b7aaf4989e?w=200&h=200&fit=crop"
  },
  { 
    id: 8, 
    nom: "Schweppes Tonic", 
    prix: 800, 
    icone: "💫", 
    couleur: "#FFFFFF",
    description: "Tonic classique rafraîchissant",
    taille: "33cl",
    image: "https://images.unsplash.com/photo-1549888834-3ec93abae044?w=200&h=200&fit=crop"
  },
  { 
    id: 9, 
    nom: "Orangina", 
    prix: 700, 
    icone: "🍊", 
    couleur: "#FF6B00",
    description: "Pulpe d'orange rafraîchissante",
    taille: "50cl",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=200&h=200&fit=crop"
  },
  { 
    id: 10, 
    nom: "Monster Energy", 
    prix: 1000, 
    icone: "⚡", 
    couleur: "#00FF00",
    description: "Boisson énergisante puissante",
    taille: "50cl",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&h=200&fit=crop"
  }

];
