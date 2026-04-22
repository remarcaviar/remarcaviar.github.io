const SEARCH_INDEX = [
    {
        title: 'Gucci Primavera, FW26: The Internet Was Wrong',
        category: 'Fashion',
        excerpt: 'On reverence, restraint, and why the internet needs to sit down.',
        url: 'fashion-article-1.html',
        keywords: ['gucci', 'primavera', 'fw26', 'runway', 'fashion', 'internet', 'luxury']
    },
    {
        title: 'The Loudest Thing Bottega Veneta Ever Did Was Say Nothing',
        category: 'Business',
        excerpt: 'How deleting Instagram became the most strategic move in luxury marketing.',
        url: 'business-article-1.html',
        keywords: ['bottega', 'veneta', 'instagram', 'marketing', 'business', 'luxury', 'strategy']
    },
    {
        title: 'The Bandhgala Misnamed',
        category: 'Culture',
        excerpt: "How fashion's vocabulary keeps erasing India's most formal silhouette.",
        url: 'culture-article-1.html',
        keywords: ['bandhgala', 'india', 'culture', 'tailoring', 'formalwear', 'fashion vocabulary']
    },
    {
        title: 'The Shoe That Was Never Meant to Be Beautiful',
        category: 'Trends',
        excerpt: "How Maison Margiela's Tabi became fashion's most enduring act of discomfort.",
        url: 'trends-article-1.html',
        keywords: ['shoe', 'tabi', 'maison margiela', 'trends', 'footwear', 'fashion']
    }
];

function initSiteSearch() {
    const panel = document.getElementById('search-panel');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    const openButton = document.getElementById('searchBtn');
    const closeButton = document.getElementById('searchClose');

    if (!panel || !input || !results || !openButton || !closeButton) {
        return;
    }

    const normalize = (value) => value.toLowerCase().trim();

    const scoreArticle = (article, query) => {
        const normalizedQuery = normalize(query);
        const terms = normalizedQuery.split(/\s+/).filter(Boolean);
        const title = normalize(article.title);
        const category = normalize(article.category);
        const excerpt = normalize(article.excerpt);
        const keywords = article.keywords.map(normalize);

        let score = 0;

        if (title.includes(normalizedQuery)) score += 120;
        if (excerpt.includes(normalizedQuery)) score += 70;
        if (category.includes(normalizedQuery)) score += 50;
        if (keywords.some((keyword) => keyword.includes(normalizedQuery))) score += 80;

        terms.forEach((term) => {
            if (title.includes(term)) score += 30;
            if (excerpt.includes(term)) score += 15;
            if (category.includes(term)) score += 12;
            if (keywords.some((keyword) => keyword.includes(term))) score += 20;
        });

        return score;
    };

    const renderResults = (query) => {
        const normalizedQuery = normalize(query);
        results.innerHTML = '';

        if (!normalizedQuery) {
            return;
        }

        const matches = SEARCH_INDEX
            .map((article) => ({ article, score: scoreArticle(article, normalizedQuery) }))
            .filter(({ score }) => score > 0)
            .sort((left, right) => right.score - left.score);

        if (matches.length === 0) {
            results.innerHTML = '<p class="search-empty">No relevant articles found.</p>';
            return;
        }

        matches.forEach(({ article }, index) => {
            const item = document.createElement('a');
            item.href = article.url;
            item.className = 'search-result-item';
            item.innerHTML = `
                <div class="sri-cat">${article.category}</div>
                <div class="sri-title">${article.title}</div>
                <div class="sri-excerpt">${article.excerpt}</div>
            `;
            results.appendChild(item);

            requestAnimationFrame(() => {
                setTimeout(() => item.classList.add('visible'), index * 110);
            });
        });
    };

    openButton.addEventListener('click', () => {
        panel.classList.add('open');
        setTimeout(() => input.focus(), 200);
    });

    closeButton.addEventListener('click', () => {
        panel.classList.remove('open');
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            panel.classList.remove('open');
        }
    });

    input.addEventListener('input', () => {
        renderResults(input.value);
    });
}
