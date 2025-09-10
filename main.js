import markdownIt from 'https://cdn.skypack.dev/markdown-it';
import markdownItAnchor from 'https://cdn.skypack.dev/markdown-it-anchor';
import markdownItTableOfContents from 'https://cdn.skypack.dev/markdown-it-table-of-contents';

const CONTENT_TEMPLATE_ROUTE = "/templates/content.html";
const WIDTH_SMALL = 992;

const routes = {
    "404": {
        template: "/templates/404.html",
        content: ""
    },
    "" : {
        template: "/templates/home.html",
        content: ""
    },
    "home" : {
        template: "/templates/home.html",
        content: ""
    },
    "campagne" : {
        template: "/templates/campagne.html",
        content: "/content/campagne/"
    },
    "tesori": {
        template: "/templates/tesori.html",
        content: "/content/tesori/"
    },
    "bestiario": {
        template: "/templates/bestiario.html",
        content: "/content/bestiario/"
    },
    "mondi" : {
        template: "/templates/mondi.html",
        content: "/content/mondi/"
    }
}

let oldHash = '';
let currentHash = '';

function splitHash (hash) {
    const splitHash = hash.substring(1).split("#", 3);
    return {
        sectionHash: splitHash[0] || '',
        mdFileHash: splitHash[1] || '',
        scrollHash: splitHash[2] || '',
    }
}

function isContentHash (splitHash) {
    return splitHash.mdFileHash !== '';
}

function isScrollHash (splitHash) {
    return splitHash.scrollHash !== '';
}

function refreshActiveNav (section) {
    document.querySelectorAll(".nav-link").forEach(linkElement => {
        linkElement.classList.remove('active');
        linkElement.classList.add('inactive');
        if (linkElement.getAttribute('href').substring(1) == section) {
            linkElement.classList.add('active');
            linkElement.classList.remove('inactive');
        }
    });
}

async function loadSection (section) {
    const contentElement = document.getElementById("content");
    const route = routes[section] || routes["404"];

    try {
        const html = await fetch(route.template).then((response) => response.text());
        contentElement.innerHTML = html;

        document.onclick = (e) => {
            const contentCard = e.target.closest('[data-content]');
            if (contentCard) {
                e.preventDefault();
                const filename = contentCard.getAttribute('data-content');
                const hash = `#${section}#${filename}`;
                window.location.hash = hash;
            }
        };

        refreshActiveNav(section);
    } catch (error) {
        console.error('Error loading template:', error);
        const html404 = await fetch(routes["404"].template).then((response) => response.text());
        contentElement.innerHTML = html404;
        refreshActiveNav(null);
    }
}

async function loadMarkdownPage (section, filename) {
    const filePath = `${routes[section].content}/${filename}`;
    const contentElement = document.getElementById("content");

    try {
        const html = await fetch(CONTENT_TEMPLATE_ROUTE).then((response) => response.text());
        contentElement.innerHTML = html;

        const mdFileContent = await fetch(filePath)
            .then((response) => response.text());
        
        const md = markdownIt({
            html: true,
            breaks: true,
        });

        md.use(markdownItAnchor);

        md.use(markdownItTableOfContents, {
            containerClass: "toc",
            includeLevel: [1, 2, 3],
        });

        const parsedHtml = md.render(mdFileContent);
        document.getElementById("markdown-content").innerHTML = parsedHtml;

        const tocElement = document.querySelector('.toc');
        const sidebarContent = document.getElementById('sidebar-content');

        if (tocElement && sidebarContent) {
            const tocClone = tocElement.cloneNode(true);
            sidebarContent.innerHTML = '';
            sidebarContent.appendChild(tocClone);

            tocElement.remove();
        }

        const sidebarButtonOpen = document.getElementById("sidebar-button-open");
        const sidebarButtonClose = document.getElementById("sidebar-button-close");
        const sidebar = document.getElementById('sidebar');

        if (sidebarButtonOpen) {
            sidebarButtonOpen.onclick = () => {
                sidebar.classList.remove('w3-sidebar');
                sidebar.style.display = 'block';
                sidebarButtonOpen.style.display = 'none';
            };
        }

        if (sidebarButtonClose) {
            sidebarButtonClose.onclick = () => {
                if (window.innerWidth <= WIDTH_SMALL) {
                    sidebar.classList.remove('w3-sidebar');
                    sidebar.style.display = 'none';
                    sidebarButtonOpen.style.display = 'block';
                }
            };
        }

        const sidebarToc = sidebarContent.querySelector('.toc');
        if (sidebarToc) {
            sidebarToc.onclick = (e) => {
                e.preventDefault();
                const tocElement = e.target.closest('[href]');
                if (tocElement) {
                    const tocItem = tocElement.getAttribute('href');
                    window.location.hash = `#${section}#${filename}${tocItem}`;

                    if (window.innerWidth <= WIDTH_SMALL) {
                        sidebar.classList.remove('w3-sidebar');
                        sidebar.style.display = 'none';
                        sidebarButtonOpen.style.display = 'block';
                    }
                }
            };
        }

        window.onresize = () => {
            if (window.innerWidth <= WIDTH_SMALL) {
                sidebar.classList.remove('w3-sidebar');
                sidebar.style.display = 'none';
                sidebarButtonOpen.style.display = 'block';
            } else {
                sidebar.classList.add('w3-sidebar');
                sidebar.style.display = 'block';
                sidebarButtonOpen.style.display = 'none';
            }
        };

        if (window.innerWidth <= WIDTH_SMALL) {
            sidebar.classList.remove('w3-sidebar');
            sidebar.style.display = 'none';
            sidebarButtonOpen.style.display = 'block';
        } else {
            sidebar.classList.add('w3-sidebar');
            sidebar.style.display = 'block';
            sidebarButtonOpen.style.display = 'none';
        }

        refreshActiveNav(section);

    } catch (error) {
        console.error('Error loading template:', error);
        const html404 = await fetch(routes["404"].template).then((response) => response.text());
        contentElement.innerHTML = html404;
        refreshActiveNav(null);
    }
}

const route = (event) => {
    event.preventDefault();
    window.history.pushState({}, "", event.target.href);
    handleURL();
}

const handleURL = async () => {
    oldHash = currentHash;
    currentHash = window.location.hash;
    const oldHashSplit = splitHash(oldHash);
    const hash = splitHash(currentHash);

    const section = hash.sectionHash;

    if (currentHash === '' || oldHashSplit.sectionHash !== hash.sectionHash || oldHashSplit.mdFileHash !== hash.mdFileHash) {
        
        if (!isContentHash(hash)) {
            loadSection(section);
        } else {
            await loadMarkdownPage(section, hash.mdFileHash);
        }
    }

    if (isScrollHash(hash)) {
        const scrollHash = hash.scrollHash;
        let elementToScrollTo = document.getElementById(scrollHash);

        if (!elementToScrollTo) return;
        
        elementToScrollTo.scrollIntoView({ behavior: 'smooth' });
    }
}

document.addEventListener('DOMContentLoaded', (e) => {
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
        link.addEventListener('click', route);
    });

    window.onhashchange = handleURL;
    
    handleURL();
});