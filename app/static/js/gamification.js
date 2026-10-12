// gamification.js - Управление ежедневными заданиями и достижениями КодРулит

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.CodeRulitGamification = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const DAILY_TASKS_POOL = [
        {
            id: 'no_crashes',
            title: '3 маршрута без столкновений',
            desc: 'Пройди уровни без единого столкновения с обочиной',
            reward: '+50 ОП',
            target: 3
        },
        {
            id: 'turns_master',
            title: 'Идеальный поворот',
            desc: 'Используй команды поворота («направо» / «налево») 10 раз',
            reward: '+30 ОП',
            target: 10
        },
        {
            id: 'forward_drive',
            title: 'Полный вперед',
            desc: 'Выполни 15 команд движения «вперед» по трассе',
            reward: '+35 ОП',
            target: 15
        },
        {
            id: 'if_sensor',
            title: 'Логический маневр',
            desc: 'Примени условие с датчиком «если спереди_свободно» 4 раза',
            reward: '+40 ОП',
            target: 4
        },
        {
            id: 'loops_count',
            title: 'Мастер повторов',
            desc: 'Примени цикл со счетчиком «сделать N раз» в 5 заданиях',
            reward: '+45 ОП',
            target: 5
        },
        {
            id: 'while_loop',
            title: 'Умный цикл',
            desc: 'Используй условный цикл «пока» в 3 алгоритмах',
            reward: '+50 ОП',
            target: 3
        },
        {
            id: 'all_sensors',
            title: 'Круговой обзор',
            desc: 'Используй боковые сенсоры («слева» или «справа») 4 раза',
            reward: '+40 ОП',
            target: 4
        },
        {
            id: 'theory_pro',
            title: 'Знаток теории',
            desc: 'Ответь правильно на 3 теоретических вопроса без ошибок',
            reward: '+30 ОП',
            target: 3
        },
        {
            id: 'clean_streak',
            title: 'Точная серия',
            desc: 'Добейся непрерывной серии из 5 верных ответов',
            reward: '+55 ОП',
            target: 5
        },
        {
            id: 'finish_lesson',
            title: 'Шаг к мастерству',
            desc: 'Заверши любой обучающий урок от старта до финиша',
            reward: '+60 ОП',
            target: 1
        },
        {
            id: 'fill_blanks',
            title: 'Архитектор кода',
            desc: 'Заполни пропуски в коде в 5 интерактивных заданиях',
            reward: '+35 ОП',
            target: 5
        },
        {
            id: 'blocks_builder',
            title: 'Сборщик блоков',
            desc: 'Собери 6 программ с помощью визуальных блоков команд',
            reward: '+40 ОП',
            target: 6
        },
        {
            id: 'compact_code',
            title: 'Лаконичный код',
            desc: 'Пройди 4 маршрута с компактным алгоритмом до 5 строк',
            reward: '+45 ОП',
            target: 4
        },
        {
            id: 'reverse_turn',
            title: 'Маневр уклонения',
            desc: 'Соверши 6 поворотов налево для объезда препятствий',
            reward: '+30 ОП',
            target: 6
        },
        {
            id: 'xp_hunter',
            title: 'Охотник за опытом',
            desc: 'Заработай 150 очков опыта за решение заданий',
            reward: '+50 ОП',
            target: 150
        },
        {
            id: 'speedy_solver',
            title: 'Уверенный старт',
            desc: 'Успешно заверши первые 3 задачи в текущем уроке',
            reward: '+35 ОП',
            target: 3
        },
        {
            id: 'drift_master',
            title: 'Мастер дрифта',
            desc: 'Выполни 8 маневров поворота направо по часовой стрелке',
            reward: '+35 ОП',
            target: 8
        },
        {
            id: 'precision_route',
            title: 'Точный маршрут',
            desc: 'Доедь точно до клетки финиша в 4 заездах подряд',
            reward: '+45 ОП',
            target: 4
        }
    ];

    const ACHIEVEMENTS_DEF = [
        {
            id: 'algorithmMaster',
            title: 'Гроссмейстер алгоритмов',
            desc: 'Пройди 15 маршрутов без единой ошибки и столкновения',
            icon: 'workspace_premium',
            reward: '+200 ОП',
            max: 15
        },
        {
            id: 'cycleArchitect',
            title: 'Архитектор циклов',
            desc: 'Используй конструкцию «А пока Б» в 10 лабиринтах',
            icon: 'all_inclusive',
            reward: '+150 ОП',
            max: 10
        },
        {
            id: 'navigatorSense',
            title: 'Чутьё навигатора',
            desc: 'Примени все 4 датчика («спереди», «сзади», «слева», «справа»)',
            icon: 'radar',
            reward: '+120 ОП',
            max: 4
        },
        {
            id: 'codeOptimizer',
            title: 'Оптимизатор кода',
            desc: 'Реши 8 уровней с кодом не длиннее 5 строк',
            icon: 'bolt',
            reward: '+250 ОП',
            max: 8
        },
        {
            id: 'streakMaster',
            title: 'Стальная выдержка',
            desc: 'Серия из 7 верных ответов подряд',
            icon: 'local_fire_department',
            reward: '+300 ОП',
            max: 7
        }
    ];

    function getTodayDateString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getDailyTasksForDate(dateStr) {
        // Детерминированный генератор случайных чисел Mulberry32 на основе даты
        let seed = 0;
        for (let i = 0; i < dateStr.length; i++) {
            seed = ((seed << 5) - seed) + dateStr.charCodeAt(i);
            seed |= 0;
        }

        function random() {
            seed |= 0;
            seed = seed + 0x6D2B79F5 | 0;
            let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }

        const indices = DAILY_TASKS_POOL.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            const tmp = indices[i];
            indices[i] = indices[j];
            indices[j] = tmp;
        }

        return indices.slice(0, 3).map(idx => {
            const t = DAILY_TASKS_POOL[idx];
            return {
                id: t.id,
                title: t.title,
                desc: t.desc,
                reward: t.reward,
                target: t.target,
                current: 0
            };
        });
    }

    function loadDailyTasks() {
        const today = getTodayDateString();
        const savedDate = localStorage.getItem('dailyTasksDate');
        const savedTasksRaw = localStorage.getItem('dailyTasks');

        if (savedDate === today && savedTasksRaw) {
            try {
                const parsed = JSON.parse(savedTasksRaw);
                if (Array.isArray(parsed) && parsed.length === 3) {
                    return parsed;
                }
            } catch (e) {
                console.error('Failed to parse saved daily tasks:', e);
            }
        }

        // Новый день или первый вход: выбираем 3 свежих случайных задания для сегодняшней даты
        const freshTasks = getDailyTasksForDate(today);
        localStorage.setItem('dailyTasksDate', today);
        localStorage.setItem('dailyTasks', JSON.stringify(freshTasks));
        return freshTasks;
    }

    function loadAchievements() {
        const isNewAccount = !localStorage.getItem('userName');
        let saved = {};
        if (!isNewAccount) {
            try {
                saved = JSON.parse(localStorage.getItem('achievementsProgress') || '{}');
            } catch (e) {
                saved = {};
            }
        }
        const maxStreak = parseInt(localStorage.getItem('maxStreak') || '0', 10);

        return ACHIEVEMENTS_DEF.map(ach => {
            let current = 0;
            if (ach.id === 'streakMaster') {
                current = maxStreak;
            } else {
                current = typeof saved[ach.id] === 'number' ? saved[ach.id] : 0;
            }
            return {
                ...ach,
                current: Math.min(current, ach.max)
            };
        });
    }

    function updateDailyTaskProgress(taskId, delta) {
        const tasks = loadDailyTasks();
        let updated = false;
        for (const t of tasks) {
            if (t.id === taskId) {
                t.current = Math.min(t.target, (t.current || 0) + delta);
                updated = true;
            }
        }
        if (updated) {
            localStorage.setItem('dailyTasks', JSON.stringify(tasks));
        }
        return tasks;
    }

    function updateAchievementProgress(achId, delta) {
        let saved = {};
        try {
            saved = JSON.parse(localStorage.getItem('achievementsProgress') || '{}');
        } catch (e) {
            saved = {};
        }
        saved[achId] = (saved[achId] || 0) + delta;
        localStorage.setItem('achievementsProgress', JSON.stringify(saved));
    }

    function initNewAccount() {
        const initialAch = {
            algorithmMaster: 0,
            cycleArchitect: 0,
            navigatorSense: 0,
            codeOptimizer: 0
        };
        localStorage.setItem('achievementsProgress', JSON.stringify(initialAch));

        const today = getTodayDateString();
        const freshTasks = getDailyTasksForDate(today);
        localStorage.setItem('dailyTasksDate', today);
        localStorage.setItem('dailyTasks', JSON.stringify(freshTasks));
    }

    function resetAccountProgress() {
        localStorage.removeItem('userName');
        localStorage.removeItem('streak');
        localStorage.removeItem('maxStreak');
        localStorage.removeItem('completedLessons');
        localStorage.removeItem('userXp');
        localStorage.removeItem('achievementsProgress');
        localStorage.removeItem('dailyTasks');
        localStorage.removeItem('dailyTasksDate');
        window.location.reload();
    }

    function recordTaskSuccess(params) {
        const { task, instructions, streak, stepIndex } = params || {};

        updateAchievementProgress('algorithmMaster', 1);
        updateDailyTaskProgress('no_crashes', 1);
        updateDailyTaskProgress('precision_route', 1);

        if (stepIndex !== undefined && stepIndex < 3) {
            updateDailyTaskProgress('speedy_solver', 1);
        }

        if (task) {
            if (task.type === 'theory') {
                updateDailyTaskProgress('theory_pro', 1);
            } else if (task.type === 'fill_blank') {
                updateDailyTaskProgress('fill_blanks', 1);
            } else if (task.type === 'blocks') {
                updateDailyTaskProgress('blocks_builder', 1);
            }
        }

        if (Array.isArray(instructions)) {
            let turnCount = 0;
            let leftTurns = 0;
            let rightTurns = 0;
            let forwards = 0;
            let hadSensor = false;
            let hadWhile = false;
            let hadLoop = false;

            const scan = (items) => {
                for (const item of items) {
                    if (item.type === 'action') {
                        const c = (item.cmd || '').toLowerCase();
                        if (c.includes('направо')) { turnCount++; rightTurns++; }
                        if (c.includes('налево')) { turnCount++; leftTurns++; }
                        if (c.includes('вперед')) { forwards++; }
                    } else if (item.type === 'if') {
                        hadSensor = true;
                        if (item.action) {
                            const a = item.action.toLowerCase();
                            if (a.includes('направо')) { turnCount++; rightTurns++; }
                            if (a.includes('налево')) { turnCount++; leftTurns++; }
                            if (a.includes('вперед')) { forwards++; }
                        }
                    } else if (item.type === 'while') {
                        hadWhile = true;
                        if (item.body) scan(item.body);
                    } else if (item.type === 'repeat' || item.type === 'if_repeat') {
                        hadLoop = true;
                        if (item.body) scan(item.body);
                    }
                }
            };
            scan(instructions);

            if (turnCount > 0) updateDailyTaskProgress('turns_master', turnCount);
            if (leftTurns > 0) updateDailyTaskProgress('reverse_turn', leftTurns);
            if (rightTurns > 0) updateDailyTaskProgress('drift_master', rightTurns);
            if (forwards > 0) updateDailyTaskProgress('forward_drive', forwards);

            if (hadSensor) {
                updateAchievementProgress('navigatorSense', 1);
                updateDailyTaskProgress('if_sensor', 1);
                updateDailyTaskProgress('all_sensors', 1);
            }
            if (hadWhile) {
                updateAchievementProgress('cycleArchitect', 1);
                updateDailyTaskProgress('while_loop', 1);
            }
            if (hadLoop) {
                updateDailyTaskProgress('loops_count', 1);
            }
            if (instructions.length <= 5) {
                updateAchievementProgress('codeOptimizer', 1);
                updateDailyTaskProgress('compact_code', 1);
            }
        }

        if (streak >= 5) {
            updateDailyTaskProgress('clean_streak', 5);
        }
    }

    function recordLessonFinish(earnedXp) {
        updateDailyTaskProgress('finish_lesson', 1);
        if (earnedXp > 0) {
            updateDailyTaskProgress('xp_hunter', earnedXp);
        }
    }

    return {
        DAILY_TASKS_POOL,
        ACHIEVEMENTS_DEF,
        getTodayDateString,
        getDailyTasksForDate,
        loadDailyTasks,
        loadAchievements,
        updateDailyTaskProgress,
        updateAchievementProgress,
        initNewAccount,
        resetAccountProgress,
        recordTaskSuccess,
        recordLessonFinish
    };
}));
