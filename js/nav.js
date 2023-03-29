const defaultSpec = {
    type: "languageSpecification",
    supportedLanguages: [{ shortDesc: "En", longDesc: "English", priority: 999 }, { shortDesc: "Ro", longDesc: "Română", priority: 35 }],
    module: "Com.Cool.Namespace",
    translatorClass: "LanguageManager",
    labels: {
        Hello: { En: "Hello", Ro: "Salut" },
        World: { En: "World", Ro: "Lume" },
        Missing: { En: "Missing" }
    }
};

function toggleMobileMenu() {
    const dropdown = document.getElementById('nav_menu_mobile');
    if (dropdown.classList.contains('visible')) {
        dropdown.classList.remove('visible');
    } else {
        dropdown.classList.add('visible');
    }
}

function navigateToSection(aSection) {
    toggleMobileMenu();
    location.href = aSection;
}

var activeSection = '';

function getPosition(element) {
    var clientRect = element.getBoundingClientRect();
    return {
        height: clientRect.height,
        top: clientRect.top + document.body.scrollTop
    };
}


function onScroll() {
    const pageSections = {
        'home': getPosition(document.getElementById('home')),
        'about': getPosition(document.getElementById('about')),
        'generator': getPosition(document.getElementById('generator'))
    };

    var lookup = 'home';
    var lookupSection = pageSections[lookup];
    var lookupDistance = Math.abs(0 + lookupSection.top);
    for (var section in pageSections) {
        var currentDistance = Math.abs(0 + pageSections[section].top);
        if (currentDistance < lookupDistance) {
            lookup = section;
            lookupSection = pageSections[section];
            lookupDistance = currentDistance;
        }
    }
    if (activeSection != lookup) {
        activeSection = lookup;
        changeActiveMenu(activeSection);
    }
}

function changeActiveMenu(section) {
    const menu_map = {
        'home': 'home_menu',
        'about': 'about_menu',
        'generator': 'generator_menu'
    };
    for (var key in menu_map) {
        var element = document.getElementById(menu_map[key]);
        element.classList = [];
        if (key === section) {
            element.classList = 'active';
        }
    }
}


window.addEventListener('scroll', onScroll)
window.addEventListener('load', onScroll)
