const FALLBACK_CATEGORY_PAGES = [
    'fashion-articles.html',
    'business-articles.html',
    'trends-articles.html',
    'culture-articles.html'
];

const CATEGORY_LABELS = {
    'fashion-articles.html': 'Fashion',
    'business-articles.html': 'Business',
    'trends-articles.html': 'Trends',
    'culture-articles.html': 'Culture'
};

const FALLBACK_SEARCH_INDEX = [
    {
        title: 'Gucci Primavera, FW26: The Internet Was Wrong',
        category: 'Fashion',
        excerpt: 'On reverence, restraint, and why the internet needs to sit down.',
        url: 'fashion-article-1.html',
        content: 'gucci primavera fw26 runway fashion internet luxury'
    },
    {
        title: 'Fashion Is Art. And That Means Nothing.',
        category: 'Fashion',
        excerpt: 'A critique of why calling fashion art often says less than people think it does.',
        url: 'fashion-article-2.html',
        content: 'fashion is art met gala costume art anna deller-yee mugler karan johar'
    },
    {
        title: 'The Loudest Thing Bottega Veneta Ever Did Was Say Nothing',
        category: 'Business',
        excerpt: 'How deleting Instagram became the most strategic move in luxury marketing.',
        url: 'business-article-1.html',
        content: 'bottega veneta instagram marketing business luxury strategy'
    },
    {
        title: 'The Bandhgala Misnamed',
        category: 'Culture',
        excerpt: "How fashion's vocabulary keeps erasing India's most formal silhouette.",
        url: 'culture-article-1.html',
        content: 'bandhgala india culture tailoring formalwear fashion vocabulary'
    },
    {
        title: 'The Dress That Rewrote the Bond Girl',
        category: 'Culture',
        excerpt: 'On Azzedine Alaïa, Grace Jones, and what happens when fashion refuses its own rules.',
        url: 'culture-article-2.html',
        content: 'dress bond girl azzedine alaia grace jones culture fashion james bond'
    },
    {
        title: 'The Shoe That Was Never Meant to Be Beautiful',
        category: 'Trends',
        excerpt: "How Maison Margiela's Tabi became fashion's most enduring act of discomfort.",
        url: 'trends-article-1.html',
        content: 'shoe tabi maison margiela trends footwear fashion'
    }
];

let searchIndexPromise;

function initSiteSearch() {
    const panel = document.getElementById('search-panel');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    const openButton = document.getElementById('searchBtn');
    const closeButton = document.getElementById('searchClose');

    if (!panel || !input || !results || !openButton || !closeButton) {
        return;
    }

    let renderToken = 0;

    const ensureSearchIndex = () => {
        if (!searchIndexPromise) {
            searchIndexPromise = buildSearchIndex();
        }

        return searchIndexPromise;
    };

    const normalize = (value) => String(value || '').toLowerCase().trim();

    const scoreArticle = (article, query) => {
        const normalizedQuery = normalize(query);
        const terms = normalizedQuery.split(/\s+/).filter(Boolean);
        const title = normalize(article.title);
        const category = normalize(article.category);
        const excerpt = normalize(article.excerpt);
        const content = normalize(article.content);

        let score = 0;

        if (title.includes(normalizedQuery)) score += 120;
        if (excerpt.includes(normalizedQuery)) score += 70;
        if (category.includes(normalizedQuery)) score += 50;
        if (content.includes(normalizedQuery)) score += 45;

        terms.forEach((term) => {
            if (title.includes(term)) score += 30;
            if (excerpt.includes(term)) score += 15;
            if (category.includes(term)) score += 12;
            if (content.includes(term)) score += 8;
        });

        return score;
    };

    const appendResult = (article, index) => {
        const item = document.createElement('a');
        item.href = article.url;
        item.className = 'search-result-item';

        const category = document.createElement('div');
        category.className = 'sri-cat';
        category.textContent = article.category;

        const title = document.createElement('div');
        title.className = 'sri-title';
        title.textContent = article.title;

        const excerpt = document.createElement('div');
        excerpt.className = 'sri-excerpt';
        excerpt.textContent = article.excerpt;

        item.append(category, title, excerpt);
        results.appendChild(item);

        requestAnimationFrame(() => {
            setTimeout(() => item.classList.add('visible'), index * 110);
        });
    };

    const renderResults = async (query) => {
        const currentToken = ++renderToken;
        const normalizedQuery = normalize(query);
        results.innerHTML = '';

        if (!normalizedQuery) {
            return;
        }

        results.innerHTML = '<p class="search-empty">Searching articles...</p>';
        const searchIndex = await ensureSearchIndex();

        if (currentToken !== renderToken) {
            return;
        }

        results.innerHTML = '';

        const matches = searchIndex
            .map((article) => ({ article, score: scoreArticle(article, normalizedQuery) }))
            .filter(({ score }) => score > 0)
            .sort((left, right) => right.score - left.score);

        if (matches.length === 0) {
            results.innerHTML = '<p class="search-empty">No relevant articles found.</p>';
            return;
        }

        matches.forEach(({ article }, index) => appendResult(article, index));
    };

    openButton.addEventListener('click', () => {
        panel.classList.add('open');
        ensureSearchIndex();
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

async function buildSearchIndex() {
    try {
        const categoryPages = await discoverCategoryPages();
        const categoryDocuments = await Promise.all(
            categoryPages.map((page) => (
                fetchDocument(page)
                    .then((doc) => ({ page, doc }))
                    .catch(() => null)
            ))
        );

        const articles = dedupeArticles(
            categoryDocuments
                .filter(Boolean)
                .flatMap(({ page, doc }) => extractArticles(doc, page))
        );

        if (!articles.length) {
            return FALLBACK_SEARCH_INDEX;
        }

        return Promise.all(articles.map(enrichArticle));
    } catch (error) {
        return FALLBACK_SEARCH_INDEX;
    }
}

async function discoverCategoryPages() {
    try {
        const blogsDocument = await fetchDocument('blogs.html');
        const discoveredPages = Array.from(
            blogsDocument.querySelectorAll('.cat-item[data-href], a[href$="-articles.html"]')
        )
            .map((element) => element.dataset.href || element.getAttribute('href'))
            .filter(Boolean);

        return uniqueStrings([...discoveredPages, ...FALLBACK_CATEGORY_PAGES]);
    } catch (error) {
        return FALLBACK_CATEGORY_PAGES;
    }
}

function extractArticles(documentToSearch, categoryPage) {
    const category = getCategoryName(documentToSearch, categoryPage);

    return Array.from(documentToSearch.querySelectorAll('.article-card'))
        .map((card) => {
            const link = card.querySelector('.article-link[href], .article-read[href]');
            const title = textFrom(card.querySelector('.article-title'));
            const excerpt = textFrom(card.querySelector('.article-excerpt'));
            const url = link ? link.getAttribute('href') : '';

            if (!title || !url) {
                return null;
            }

            return {
                title,
                category,
                excerpt,
                url,
                content: `${title} ${category} ${excerpt}`
            };
        })
        .filter(Boolean);
}

async function enrichArticle(article) {
    try {
        const articleDocument = await fetchDocument(article.url);
        const bodyText = textFrom(articleDocument.querySelector('.article-body'));
        const subtitle = textFrom(articleDocument.querySelector('.hero-subtitle'));
        const metaCategory = textFrom(articleDocument.querySelector('.meta-category, .hero-category'));

        return {
            ...article,
            category: metaCategory || article.category,
            excerpt: article.excerpt || subtitle,
            content: `${article.content} ${subtitle} ${bodyText}`
        };
    } catch (error) {
        return article;
    }
}

async function fetchDocument(url) {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
        throw new Error(`Could not load ${url}`);
    }

    const html = await response.text();
    return new DOMParser().parseFromString(html, 'text/html');
}

function getCategoryName(documentToSearch, categoryPage) {
    const fallback = CATEGORY_LABELS[categoryPage] || '';
    const title = textFrom(documentToSearch.querySelector('title')).split('—')[0].trim();
    const heading = textFrom(documentToSearch.querySelector('.page-title'))
        .replace(/\barchive\b/gi, '')
        .trim();

    return fallback || title || heading || 'Article';
}

function dedupeArticles(articles) {
    const seen = new Set();

    return articles.filter((article) => {
        const key = article.url.split('#')[0];

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function uniqueStrings(values) {
    return Array.from(new Set(values));
}

function textFrom(element) {
    return element ? element.textContent.replace(/\s+/g, ' ').trim() : '';
}
