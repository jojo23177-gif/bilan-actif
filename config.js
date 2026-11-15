/* ------------------------------------------------------------------
   RÉGLAGES DU SITE — le seul fichier à modifier au quotidien.
   ------------------------------------------------------------------ */
window.SITE = {

  // "pilote"     → séance offerte (phase de test)
  // "commercial" → séance payante
  mode: "pilote",

  prix: 69, // en euros, affiché en mode commercial

  // Lien Calendly de ton événement « Bilan Actif » (60 min).
  // Exemple : "https://calendly.com/ton-nom/bilan-actif"
  // Tant qu'il est vide, le site passe en « demande de créneau » manuelle.
  calendly: "https://calendly.com/plati_nus/bilan-actif",

  // Mode commercial : lien de paiement Stripe (Payment Link), proposé juste
  // après le choix du créneau. Exemple : "https://buy.stripe.com/xxxx"
  stripe: "",

  // Réservation manuelle (utilisée si le lien Calendly est vide)
  formEndpoint: "",  // URL Formspree / Web3Forms (optionnel)
  email: "",         // ton email pro : sert de secours (ouvre l'app mail du visiteur)

  instagram: "",     // ex. "https://instagram.com/toncompte"

  annulationHeures: 24, // délai d'annulation / report sans frais
  recapHeures: 48,      // délai d'envoi du récapitulatif

  carte: "05424ED0137", // carte professionnelle d'éducateur sportif

  // Tes photos : dépose-les dans /images puis indique le chemin.
  // Un emplacement vide est simplement masqué : la page reste propre.
  //   hero    → portrait vertical 4:5, 2000 × 2500 px (visage dans la moitié droite)
  //   figure  → geste de profil, vertical 2:3, 1600 × 2400 px
  //             (les repères 1-2-3 de la figure se règlent dans index.html)
  //   apropos → portrait face caméra, vertical 4:5, 1600 × 2000 px
  photos: {
    hero: "images/hero.jpg",      // PROVISOIRE : capture basse définition
    figure: "images/figure.jpg",  // PROVISOIRE : capture basse définition
    apropos: "images/apropos.jpg"
  }
};

/* Aperçu rapide sans toucher au fichier : ajoute ?mode=commercial à l'URL */
(function () {
  var m = new URLSearchParams(location.search).get("mode");
  if (m === "pilote" || m === "commercial") window.SITE.mode = m;
  document.documentElement.setAttribute("data-mode", window.SITE.mode);
  document.documentElement.classList.add("js");
})();
