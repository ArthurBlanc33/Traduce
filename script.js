// Initialisation du slider Swiper
const swiper = new Swiper('.swiper', {
    // Options
    direction: 'horizontal',
    loop: false, // On ne veut pas revenir au début après la fin
});

// --- CONFIG SUPABASE ---
const SUPABASE_URL = 'https://dcguumzcbybbbnnrodmu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZ3V1bXpjYnliYmJubnJvZG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MjIwMjEsImV4cCI6MjA2ODI5ODAyMX0.ua8gsFijlwUHGnByYGTKVE0Bsaje22oRtV0vWK5K0Vk';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// --- PARTIE TRADUCTION (PAGE 1) ---

// Fonction de traduction directe via l'API MyMemory
async function traduire(text, source = "fr", target = "en") {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.responseData.translatedText;
}

// Sélection des éléments HTML
const inputText = document.getElementById('input-text');
const translateBtn = document.getElementById('translate-btn');
const outputText = document.getElementById('output-text');
const cardsContainer = document.getElementById('cards-container');

// Événement au clic sur le bouton traduire
translateBtn.addEventListener('click', async () => {
    const textToTranslate = inputText.value.trim();
    if (!textToTranslate) return alert('Veuillez entrer du texte à traduire.');

    outputText.textContent = "Traduction en cours...";
    try {
        const translatedText = await traduire(textToTranslate, "fr", "en");
        outputText.textContent = translatedText;

        await saveWord(textToTranslate, translatedText);
        await displaySavedWords();
    } catch (e) {
        console.error(e);
        outputText.textContent = "Erreur de traduction";
    }
});


// --- PARTIE CARTES (PAGE 2) ---

// Fonction pour récupérer les mots sauvegardés depuis le localStorage
async function getSavedWords() {
    const { data, error } = await supabase
        .from('words')
        .select('*')
        .order('id', { ascending: false });
    return data || [];
}

// Fonction pour sauvegarder un nouveau mot
async function saveWord(original, translated) {
    await supabase
        .from('words')
        .insert([{ original, translated }]);
}

// Fonction pour afficher les cartes
async function displaySavedWords() {
    const words = await getSavedWords();
    cardsContainer.innerHTML = '';

    if (words.length === 0) {
        cardsContainer.innerHTML = '<p>Aucune carte pour le moment. Traduisez un mot pour commencer !</p>';
        return;
    }

    words.forEach((word) => {
        const card = document.createElement('div');
        card.classList.add('card');

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <div class="translated-word" style="font-size:1.3em;font-weight:bold;color:#007aff;">${word.translated}</div>
                </div>
                <div class="card-back">
                    <div class="original-word" style="font-size:1.3em;font-weight:bold;color:#333;">${word.original}</div>
                </div>
            </div>
            <button class="delete-card-btn">×</button>
        `;

        const deleteBtn = card.querySelector('.delete-card-btn');
        let longPressTimer;
        let isLongPress = false;

        // Clic simple : retourne la carte (affiche le mot en français)
        card.addEventListener('click', (e) => {
            if (!isLongPress && !deleteBtn.classList.contains('show')) {
                card.classList.toggle('flipped');
            }
            isLongPress = false;
        });

        // Appui long (desktop)
        card.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                isLongPress = false;
                longPressTimer = setTimeout(() => {
                    isLongPress = true;
                    card.classList.add('show-delete');
                    deleteBtn.classList.add('show');
                }, 800);
            }
        });
        card.addEventListener('mouseup', () => clearTimeout(longPressTimer));
        card.addEventListener('mouseleave', () => clearTimeout(longPressTimer));

        // Appui long (mobile)
        card.addEventListener('touchstart', () => {
            isLongPress = false;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                card.classList.add('show-delete');
                deleteBtn.classList.add('show');
            }, 800);
        });
        card.addEventListener('touchend', () => clearTimeout(longPressTimer));

        // Bouton supprimer
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteWord(word.id);
        });

        cardsContainer.appendChild(card);
    });
}

// Fonction pour supprimer un mot sauvegardé
async function deleteWord(id) {
    await supabase
        .from('words')
        .delete()
        .eq('id', id);
    displaySavedWords();
}

// Écoute l'événement de changement de slide pour rafraîchir les cartes
// C'est utile si l'utilisateur ajoute plusieurs mots sans changer de page
swiper.on('slideChange', function () {
  if (swiper.activeIndex === 1) { // L'index 1 est notre deuxième page (celle des cartes)
    displaySavedWords();
  }
});

// Cacher le bouton supprimer si on clique ailleurs
document.addEventListener('click', (e) => {
    document.querySelectorAll('.card').forEach(card => {
        const deleteBtn = card.querySelector('.delete-card-btn');
        if (!card.contains(e.target)) {
            card.classList.remove('show-delete');
            if (deleteBtn) deleteBtn.classList.remove('show');
        }
    });
});

// Afficher les cartes une première fois au chargement de la page
displaySavedWords();

