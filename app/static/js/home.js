function homeApp() {
    return {
        ...(typeof themeHandler === 'function' ? themeHandler() : {}),
        activeTab: 'home',
        streak: parseInt(localStorage.getItem('streak') || '0', 10),
        maxStreak: parseInt(localStorage.getItem('maxStreak') || '0', 10),
        completedLessons: parseInt(localStorage.getItem('completedLessons') || '0', 10),
        userName: localStorage.getItem('userName') || '',
        userXp: parseInt(localStorage.getItem('userXp') || '0', 10),
        isOnboarding: !localStorage.getItem('userName'),
        onboardingStep: 0,
        introTutorialModalOpen: false,
        moduleResultModalOpen: false,
        inputName: '',
        settingsModalOpen: false,
        editUserNameInput: '',
        nameSavedAlert: false,
        dailyTasks: [],
        achievementsList: [],
        currentLessonStep: 0,
        currentLessonTotalSteps: 10,

        init() {
            if (typeof this.initTheme === 'function') {
                this.initTheme();
            }
            this.refreshGamification();
            this.$watch('settingsModalOpen', (val) => {
                if (val) {
                    this.editUserNameInput = this.userName || '';
                    this.nameSavedAlert = false;
                }
            });
        },

        refreshGamification() {
            this.streak = parseInt(localStorage.getItem('streak') || '0', 10);
            this.maxStreak = parseInt(localStorage.getItem('maxStreak') || '0', 10);
            this.completedLessons = parseInt(localStorage.getItem('completedLessons') || '0', 10);
            this.userXp = parseInt(localStorage.getItem('userXp') || '0', 10);
            const lessonKey = this.completedLessons >= 4 ? 'revision' : (this.completedLessons + 1).toString();
            const savedStep = parseInt(localStorage.getItem('savedStep_' + lessonKey) || '0', 10);
            this.currentLessonStep = Math.max(0, Math.min(10, isNaN(savedStep) ? 0 : savedStep));
            if (window.CodeRulitGamification) {
                this.dailyTasks = window.CodeRulitGamification.loadDailyTasks();
                this.achievementsList = window.CodeRulitGamification.loadAchievements();
            }
        },

        get completedDailyTasksCount() {
            return (this.dailyTasks || []).filter(t => (t.current || 0) >= t.target).length;
        },

        get completedAchievementsCount() {
            return (this.achievementsList || []).filter(a => (a.current || 0) >= a.max).length;
        },

        get userLevel() {
            return Math.max(1, Math.floor(this.userXp / 200) + 1);
        },

        get hasStartedLesson() {
            return this.completedLessons > 0;
        },

        get remainingLessonsCount() {
            return Math.max(0, 4 - this.completedLessons);
        },

        get currentLessonProgressPercent() {
            return Math.round((this.currentLessonStep / this.currentLessonTotalSteps) * 100);
        },

        get currentLessonName() {
            const names = ['Базовое движение', 'Цикл со счетчиком', 'Условия', 'Условный цикл'];
            if (this.completedLessons >= 4) return 'Повторение (Ревизия)';
            return names[this.completedLessons] || 'Базовое движение';
        },

        completeOnboarding() {
            const trimmed = (this.inputName || '').trim();
            const name = trimmed || 'Водитель';
            this.userName = name;
            localStorage.setItem('userName', name);
            if (!localStorage.getItem('streak')) localStorage.setItem('streak', '0');
            if (!localStorage.getItem('maxStreak')) localStorage.setItem('maxStreak', '0');
            if (!localStorage.getItem('completedLessons')) localStorage.setItem('completedLessons', '0');
            if (!localStorage.getItem('userXp')) localStorage.setItem('userXp', '0');

            ['1', '2', '3', '4', 'revision'].forEach(id => localStorage.removeItem('savedStep_' + id));

            if (window.CodeRulitGamification) {
                window.CodeRulitGamification.initNewAccount();
            }
            this.refreshGamification();
            this.isOnboarding = false;
            this.activeTab = 'home';
        },

        resetAccount() {
            if (window.CodeRulitGamification) {
                window.CodeRulitGamification.resetAccountProgress();
            } else {
                const theme = localStorage.getItem('coderulit-theme');
                try {
                    localStorage.clear();
                    if (theme) localStorage.setItem('coderulit-theme', theme);
                } catch (e) {
                    ['1', '2', '3', '4', 'revision'].forEach(id => localStorage.removeItem('savedStep_' + id));
                }
                window.location.reload();
            }
        },

        openSettings() {
            this.editUserNameInput = this.userName || '';
            this.nameSavedAlert = false;
            this.settingsModalOpen = true;
        },

        saveUserName() {
            const trimmed = (this.editUserNameInput || '').trim();
            if (!trimmed) return;
            this.userName = trimmed;
            localStorage.setItem('userName', trimmed);
            this.nameSavedAlert = true;
            setTimeout(() => {
                this.nameSavedAlert = false;
            }, 2000);
        }
    };
}
