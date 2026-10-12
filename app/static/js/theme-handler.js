// theme-handler.js - Управление светлой/тёмной темой в КодРулит

// Немедленное применение темы до рендера страницы (предотвращение белой вспышки)
(function applyInitialTheme() {
    try {
        const saved = localStorage.getItem('coderulit-theme');
        const theme = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
    } catch (e) {
        // Защита при ограниченном доступе к localStorage
    }
})();

function themeHandler() {
    const currentTheme = localStorage.getItem('coderulit-theme') ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    return {
        theme: currentTheme,

        setTheme(val) {
            this.theme = val;
            try {
                localStorage.setItem('coderulit-theme', val);
            } catch (e) {}
            document.documentElement.setAttribute('data-theme', val);
            document.documentElement.classList.toggle('dark', val === 'dark');
        },

        toggleTheme() {
            this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
        },

        initTheme() {
            // Применяем актуальную тему
            document.documentElement.setAttribute('data-theme', this.theme);
            document.documentElement.classList.toggle('dark', this.theme === 'dark');

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
