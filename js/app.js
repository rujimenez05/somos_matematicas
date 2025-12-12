
// State
let allPrograms = [];
let currentSeason = 'all';
let searchTerm = '';
let visiblePrograms = [];

// DOM
const searchInput = document.getElementById('search-input');
const latestContainer = document.getElementById('latest-card-container');
const seasonsGrid = document.getElementById('seasons-grid');
const mainGridTitle = document.getElementById('main-grid-title');
const backButton = document.getElementById('back-to-home');
const modal = document.getElementById('program-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close-modal');

// Close toggle
closeModal.addEventListener('click', () => modal.classList.add('hidden'));
window.addEventListener('click', (e) => {
    if (e.target == modal) modal.classList.add('hidden');
});
backButton.addEventListener('click', () => {
    currentSeason = 'all';
    searchInput.value = '';
    searchTerm = '';
    render();
});

// Init
async function init() {
    try {
        const response = await fetch('src/data/programs.json?v=' + Date.now());
        if (!response.ok) throw new Error('Failed to load data');
        const rawData = await response.json();

        // Check data, filter hidden (client side double check)
        visiblePrograms = rawData.filter(p => !p.hidden).map(p => ({
            ...p,
            dateObj: new Date(p.date),
            seasonNum: parseInt(p.season.replace(/\D/g, '') || '0')
        }));

        // Sort latest first for Hero
        visiblePrograms.sort((a, b) => b.dateObj - a.dateObj);

        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();
            renderGrid();
        });

        render();
    } catch (error) {
        console.error("Error initializing:", error);
        latestContainer.innerHTML = '<p class="error">Error cargando los programas.</p>';
    }
}

function render() {
    renderLatest();
    renderGrid();
}

function renderLatest() {
    if (visiblePrograms.length === 0) return;
    const latest = visiblePrograms[0];
    const card = createProgramCard(latest, true);
    latestContainer.innerHTML = '';
    latestContainer.appendChild(card);
    if (window.MathJax) {
        window.MathJax.typesetPromise([latestContainer]).catch((err) => console.log(err));
    }
}

function renderGrid() {
    seasonsGrid.innerHTML = '';

    if (searchTerm) {
        mainGridTitle.textContent = "Resultados de Búsqueda";
        backButton.classList.remove('hidden');
        const matches = visiblePrograms.filter(program =>
            program.title.toLowerCase().includes(searchTerm) ||
            program.summary.toLowerCase().includes(searchTerm) ||
            (program.challenge && program.challenge.toLowerCase().includes(searchTerm)) ||
            (program.date && program.date.includes(searchTerm))
        );
        if (matches.length === 0) {
            seasonsGrid.innerHTML = '<p class="no-results">No se encontraron programas.</p>';
        } else {
            matches.forEach(p => seasonsGrid.appendChild(createProgramCard(p)));
        }
        if (window.MathJax) {
            window.MathJax.typesetPromise([seasonsGrid]).catch((err) => console.log(err));
        }
        return;
    }

    if (currentSeason === 'all') {
        mainGridTitle.textContent = "Temporadas";
        backButton.classList.add('hidden');
        renderSeasonCards();
    } else {
        mainGridTitle.textContent = currentSeason;
        backButton.classList.remove('hidden');

        const seasonEps = visiblePrograms.filter(p => p.season === currentSeason);

        // SORT ASCENDING (Oldest to Newest)
        seasonEps.sort((a, b) => {
            return parseInt(a.id) - parseInt(b.id);
        });

        seasonEps.forEach(p => seasonsGrid.appendChild(createProgramCard(p)));
        if (window.MathJax) {
            window.MathJax.typesetPromise([seasonsGrid]).catch((err) => console.log(err));
        }
    }
}

function renderSeasonCards() {
    const seasons = [...new Set(visiblePrograms.map(p => p.season))];

    // Sort Seasons ASCENDING (1, 2, 3...)
    seasons.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '') || 0);
        const numB = parseInt(b.replace(/\D/g, '') || 0);
        return numA - numB;
    });

    seasons.forEach(seasonName => {
        const count = visiblePrograms.filter(p => p.season === seasonName).length;
        const card = document.createElement('div');
        card.className = 'season-card-select';
        card.innerHTML = `<h3>${seasonName}</h3><p>${count} Programas</p>`;
        card.addEventListener('click', () => {
            currentSeason = seasonName;
            renderGrid();
            document.getElementById('seasons-section').scrollIntoView({ behavior: 'smooth' });
        });
        seasonsGrid.appendChild(card);
    });
}

function createProgramCard(program, isFeatured = false) {
    const card = document.createElement('article');
    card.className = 'program-card';
    if (isFeatured) card.classList.add('featured-card');

    card.innerHTML = `
        <div class="card-header">
            <span class="program-number">${program.title}</span>
            <span class="program-date">${program.date || 'Fecha desconocida'}</span>
        </div>
        <div class="card-body">
            <p class="program-summary line-clamp">${program.summary || 'Sin resumen disponible.'}</p>
        </div>
        <div class="card-footer">
            <button class="toggle-details">Ver Detalles</button>
        </div>
    `;

    const openModal = () => showModal(program);
    card.querySelector('.toggle-details').addEventListener('click', (e) => { e.stopPropagation(); openModal(); });
    card.addEventListener('click', openModal);
    return card;
}

function showModal(program) {
    const formattedSummary = (program.summary || 'No disponible').replace(/\n/g, '<br>');
    const formattedChallenge = (program.challenge || 'No hay reto registrado.').replace(/\n/g, '<br>');

    modalBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--primary-gold); padding-bottom: 10px; margin-bottom: 15px; padding-top: 25px;">
            <h2 style="color: var(--primary-blue); margin: 0;">${program.title}</h2>
            <span style="color: #666; font-size: 0.9rem;">Fecha de emisión: <strong>${program.date}</strong></span>
        </div>
        <h4 style="color: var(--primary-gold); margin-bottom: 20px;">${program.season}</h4>
        <div style="margin-bottom: 25px;"><strong style="display:block; margin-bottom:5px;">Resumen:</strong><p>${formattedSummary}</p></div>
        <div style="margin-bottom: 25px; background: #f9f9f9; padding: 15px; border-radius: 8px;"><strong style="display:block; margin-bottom:5px; color: var(--primary-gold);">RETO MATEMÁTICO:</strong><p>${formattedChallenge}</p></div>
        ${program.link ? `<div style="text-align: center; margin-top: 30px;"><a href="${program.link}" target="_blank" class="podcast-btn" style="padding: 15px 30px; font-size: 1.1em;">🎧 Escuchar Podcast</a></div>` : ''}
    `;
    if (window.MathJax) {
        window.MathJax.typesetPromise([modalBody]).catch((err) => console.log(err));
    }
    modal.classList.remove('hidden');
}

init();
