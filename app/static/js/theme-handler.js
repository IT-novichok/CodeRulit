function themeHandler() {
    return {
        theme: localStorage.getItem('coderulit-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),

        setTheme(val) {
            this.theme = val;
            localStorage.setItem('coderulit-theme', val);
            document.documentElement.setAttribute('data-theme', val);
        },

        toggleTheme() {
            this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
        },

        init() {
            document.documentElement.setAttribute('data-theme', this.theme);
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('coderulit-theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    };
}

if (window.Alpine) {
    Alpine.data('themeHandler', themeHandler);
} else {
    document.addEventListener('alpine:init', () => {
        Alpine.data('themeHandler', themeHandler);
    });
}
