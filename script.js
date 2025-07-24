// Initialisation du slider Swiper
const swiper = new Swiper('.swiper', {
    // Options
    direction: 'horizontal',
    loop: false, // On ne veut pas revenir au début après la fin
});


// --- PARTIE TRADUCTION (PAGE 1) ---

// Utilisation de l'API LibreTranslate
const LIBRETRANSLATE_URL = 'http://localhost:3001/translate';

// Sélection des éléments HTML
const inputText = document.getElementById('input-text');
const translateBtn = document.getElementById('translate-btn');
const outputText = document.getElementById('output-text');
const cardsContainer = document.getElementById('cards-container');

// Événement au clic sur le bouton traduire
translateBtn.addEventListener('click', async () => {
    const textToTranslate = inputText.value.trim();

    if (textToTranslate === '') {
        alert('Veuillez entrer du texte à traduire.');
        return;
    }

    outputText.textContent = 'Traduction en cours...';

    try {
        const response = await fetch(LIBRETRANSLATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: textToTranslate,
                source: 'fr', // langue du texte à traduire
                target: 'en' // langue cible
            })
        });

        const data = await response.json();

        if (data.translatedText) {
            const translatedText = data.translatedText;
            outputText.textContent = translatedText;

            saveWord(textToTranslate, translatedText);
            displaySavedWords();
        } else {
            outputText.textContent = 'Erreur lors de la traduction.';
        }

    } catch (error) {
        console.error('Erreur:', error);
        outputText.textContent = 'Impossible de contacter le service de traduction.';
    }
});


// --- PARTIE CARTES (PAGE 2) ---

// Fonction pour récupérer les mots sauvegardés depuis le localStorage
function getSavedWords() {
    // JSON.parse transforme le texte en objet JavaScript
    return JSON.parse(localStorage.getItem('savedWords')) || [];
}

// Fonction pour sauvegarder un nouveau mot
function saveWord(original, translated) {
    const words = getSavedWords();
    
    // Ajoute le nouveau mot (en objet) à la liste
    words.unshift({ original, translated }); // unshift pour l'ajouter au début

    // Sauvegarde la liste mise à jour dans le localStorage (JSON.stringify transforme l'objet en texte)
    localStorage.setItem('savedWords', JSON.stringify(words));
}

// Fonction pour afficher les cartes
function displaySavedWords() {
    const words = getSavedWords();
    cardsContainer.innerHTML = '';

    if (words.length === 0) {
        cardsContainer.innerHTML = '<p>Aucune carte pour le moment. Traduisez un mot pour commencer !</p>';
        return;
    }

    words.forEach((word, index) => {
        const card = document.createElement('div');
        card.classList.add('card');

        card.innerHTML = `
            <div class="original-word">${word.original}</div>
            <div class="translated-word">${word.translated}</div>
            <button class="delete-card-btn">Supprimer</button>
        `;

        // Ajoute l'événement de suppression
        card.querySelector('.delete-card-btn').addEventListener('click', () => {
            deleteWord(index);
        });

        cardsContainer.appendChild(card);
    });
}

// Fonction pour supprimer un mot sauvegardé
function deleteWord(index) {
    const words = getSavedWords();
    words.splice(index, 1); // Supprime la carte à l'index donné
    localStorage.setItem('savedWords', JSON.stringify(words));
    displaySavedWords(); // Rafraîchit l'affichage
}

// Écoute l'événement de changement de slide pour rafraîchir les cartes
// C'est utile si l'utilisateur ajoute plusieurs mots sans changer de page
swiper.on('slideChange', function () {
  if (swiper.activeIndex === 1) { // L'index 1 est notre deuxième page (celle des cartes)
    displaySavedWords();
  }
});


// Afficher les cartes une première fois au chargement de la page
displaySavedWords();

const playBtn = document.getElementById('play-btn');

playBtn.addEventListener('click', () => {
    const words = getSavedWords();
    if (words.length === 0) {
        alert("Ajoute des cartes pour jouer !");
        return;
    }

    let score = 0;
    let current = 0;

    function askNext() {
        if (current >= words.length) {
            alert(`Jeu terminé ! Score : ${score}/${words.length}`);
            displaySavedWords();
            return;
        }

        const word = words[current];
        const userAnswer = prompt(`Traduisez en anglais : "${word.original}"`);

        if (userAnswer && userAnswer.trim().toLowerCase() === word.translated.toLowerCase()) {
            score++;
            alert("Bonne réponse !");
        } else {
            alert(`Faux ! La bonne réponse était : ${word.translated}`);
        }
        current++;
        askNext();
    }

    askNext();
});