// theme-handler.js - Управление темами оформления (6 тем daisyUI) в КодРулит

const CODERULIT_THEMES = [
    {
        id: 'light',
        name: 'Светлая',
        badge: 'Городской день',
        desc: 'Классический светлый стиль',
        icon: 'light_mode',
        isDark: false,
        colors: ['#0ea5e9', '#6366f1', '#f59e0b']
    },
    {
        id: 'dark',
        name: 'Тёмная',
        badge: 'Ночной город',
        desc: 'Глубокий ночной интерфейс',
        icon: 'dark_mode',
        isDark: true,
        colors: ['#38bdf8', '#818cf8', '#fbbf24']
    },
    {
        id: 'emerald',
        name: 'Изумруд',
        badge: 'Эко-стиль',
        desc: 'Свежие природные зелёные тона',
        icon: 'eco',
        isDark: false,
        colors: ['#66cc8a', '#ffffff', '#f0fdf4']
    },
    {
        id: 'cyberpunk',
        name: 'Киберпанк',
        badge: 'Неон и драйв',
        desc: 'Контрастный футуристичный стиль',
        icon: 'bolt',
        isDark: false,
        colors: ['#ff7598', '#ffee00', '#2a2438']
    },
    {
        id: 'nord',
        name: 'Норд',
        badge: 'Скандинавия',
        desc: 'Холодный арктический минимализм',
        icon: 'ac_unit',
        isDark: false,
        colors: ['#5e81ac', '#eceff4', '#d8dee9']
    },
    {
        id: 'sunset',
        name: 'Закат',
        badge: 'Тёплая ночь',
        desc: 'Неоновый закат и фиолетовые тени',
        icon: 'wb_twilight',
        isDark: true,
        colors: ['#ff865b', '#121c22', '#1a262f']
    }
];

// Немедленное применение темы до рендера страницы (предотвращение вспышки)
(function applyInitialTheme() {
    try {
        const saved = localStorage.getItem('coderulit-theme');
        const validTheme = CODERULIT_THEMES.some(t => t.id === saved) ? saved : null;
        const theme = validTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
        const isDark = (theme === 'dark' || theme === 'sunset');
        document.documentElement.classList.toggle('dark', isDark);
    } catch (e) {
        // Защита при ограниченном доступе к localStorage
    }
})();

function themeHandler() {
    const saved = localStorage.getItem('coderulit-theme');
    const validSaved = CODERULIT_THEMES.some(t => t.id === saved) ? saved : null;
    const currentTheme = validSaved ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const initialMeta = CODERULIT_THEMES.find(t => t.id === currentTheme) || CODERULIT_THEMES[0];

    return {
        theme: currentTheme,
        themeIcon: initialMeta.icon,
        themeName: initialMeta.name,
        themeModalOpen: false,
        themes: CODERULIT_THEMES,

        getThemeMeta(val) {
            const target = val || this.theme;
            return this.themes.find(t => t.id === target) || this.themes[0];
        },

        getThemeIcon(val) {
            return this.getThemeMeta(val).icon;
        },

        getThemeName(val) {
            return this.getThemeMeta(val).name;
        },

        setTheme(val) {
            const found = this.themes.find(t => t.id === val) || this.themes[0];
            const target = found.id;
            this.theme = target;
            this.themeIcon = found.icon;
            this.themeName = found.name;

            try {
                localStorage.setItem('coderulit-theme', target);
            } catch (e) {}

            document.documentElement.setAttribute('data-theme', target);
            const isDark = (target === 'dark' || target === 'sunset');
            document.documentElement.classList.toggle('dark', isDark);
        },

        toggleTheme() {
            // Открывает окно выбора темы
            this.themeModalOpen = true;
        },

        cycleTheme() {
            // Переключает следующую тему по списку
            const idx = this.themes.findIndex(t => t.id === this.theme);
            const nextIdx = (idx + 1) % this.themes.length;
            this.setTheme(this.themes[nextIdx].id);
        },

        initTheme() {
            this.setTheme(this.theme);

            // Подписка на системные изменения темы, если пользователь еще вручную не выбрал тему
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                    if (!localStorage.getItem('coderulit-theme')) {
                        this.setTheme(e.matches ? 'dark' : 'light');
                    }
                });
            }
        },

        init() {
            this.initTheme();
        }
    };
}

if (typeof window !== 'undefined') {
    window.themeHandler = themeHandler;

    if (window.Alpine) {
        Alpine.data('themeHandler', themeHandler);
    } else {
        document.addEventListener('alpine:init', () => {
            Alpine.data('themeHandler', themeHandler);
        });
    }
}
