function lessonApp() {
    const initialStreak = parseInt(localStorage.getItem('streak') || '0', 10);
    const initialMaxStreak = parseInt(localStorage.getItem('maxStreak') || '0', 10);

    return {
        ...(typeof themeHandler === 'function' ? themeHandler() : {}),
        lessonId: '1',
        allLessonsData: null,
        lessonData: null,
        currentStepIndex: 0,
        totalSteps: 10,
        currentTask: null,
        streak: initialStreak,
        initialStreak: initialStreak,
        initialMaxStreak: initialMaxStreak,
        streakLostInLesson: false,
        isLoading: true,
        loadError: null,

        exitModalOpen: false,
        theoryModalOpen: false,
        lessonCompleted: false,

        taskStatus: 'idle',
        statusMessage: '',

        selectedOption: null,
        filledBlank: null,
        assembledBlocks: [],
        typedInput: '',

        gridSize: 5,
        gridCells: [],
        car: {
            x: 0,
            y: 0,
            dir: 0,
            angle: 0,
            startX: 0,
            startY: 0,
            startDir: 0,
            crashed: false,
            animate: false
        },
        finish: { x: 0, y: 0 },

        simulationTimer: null,

        async init() {
            if (typeof this.initTheme === 'function') {
                this.initTheme();
            }

            window.addEventListener('beforeunload', () => {
                this.handleQuit();
            });

            this.isLoading = true;
            this.loadError = null;

            const urlParams = new URLSearchParams(window.location.search);
            const lParam = urlParams.get('lesson') || '1';

            try {
                const res = await fetch('../static/data/lessons.json');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                this.allLessonsData = await res.json();
            } catch (err) {
                this.loadError = 'Не удалось загрузить данные уроков из lessons.json.';
                this.isLoading = false;
                return;
            }

            this.lessonId = (this.allLessonsData && this.allLessonsData[lParam]) ? lParam : '1';
            this.lessonData = this.allLessonsData[this.lessonId];
            this.totalSteps = this.lessonData.tasks.length;
            this.isLoading = false;

            this.loadTask(0);
        },

        loadTask(index) {
            if (this.simulationTimer) {
                clearTimeout(this.simulationTimer);
                this.simulationTimer = null;
            }

            this.currentStepIndex = index;
            this.currentTask = this.lessonData ? this.lessonData.tasks[index] : null;
            this.taskStatus = 'idle';
            this.statusMessage = '';

            this.selectedOption = null;
            this.filledBlank = null;
            this.assembledBlocks = [];
            this.typedInput = '';

            if (this.currentTask && this.currentTask.grid) {
                this.setupGrid(this.currentTask.grid);
            }
        },

        setupGrid(gridDef) {
            const size = 5;
            this.gridSize = size;
            this.finish = { x: gridDef.finish.x, y: gridDef.finish.y };

            const roadSet = new Set(gridDef.roads.map(r => `${r[0]},${r[1]}`));
            roadSet.add(`${gridDef.start.x},${gridDef.start.y}`);
            roadSet.add(`${gridDef.finish.x},${gridDef.finish.y}`);

            const cells = [];
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const key = `${x},${y}`;
                    const isRoad = roadSet.has(key);
                    const isStart = (x === gridDef.start.x && y === gridDef.start.y);
                    const isFinish = (x === gridDef.finish.x && y === gridDef.finish.y);

                    let tileSvg = 'road.svg';
                    let tileAngle = 0;

                    if (isRoad) {
                        const hasN = roadSet.has(`${x},${y - 1}`);
                        const hasS = roadSet.has(`${x},${y + 1}`);
                        const hasW = roadSet.has(`${x - 1},${y}`);
                        const hasE = roadSet.has(`${x + 1},${y}`);

                        // 1. Прямые участки
                        if (hasN && hasS) {
                            tileSvg = 'road.svg';
                            tileAngle = 0;
                        } else if (hasW && hasE) {
                            tileSvg = 'road.svg';
                            tileAngle = 90;
                        // 2. Повороты за угол (road-turn соединяет Юг и Восток при 0°)
                        } else if (hasS && hasE) {
                            tileSvg = 'road-turn.svg';
                            tileAngle = 0;
                        } else if (hasS && hasW) {
                            tileSvg = 'road-turn.svg';
                            tileAngle = 90;
                        } else if (hasN && hasW) {
                            tileSvg = 'road-turn.svg';
                            tileAngle = 180;
                        } else if (hasN && hasE) {
                            tileSvg = 'road-turn.svg';
                            tileAngle = 270;
                        // 3. Тупиковые и краевые участки (1 сосед)
                        } else if (hasN || hasS) {
                            tileSvg = 'road.svg';
                            tileAngle = 0;
                        } else if (hasW || hasE) {
                            tileSvg = 'road.svg';
                            tileAngle = 90;
                        } else {
                            tileSvg = 'road.svg';
                            tileAngle = 0;
                        }
                    }

                    cells.push({
                        x,
                        y,
                        type: isRoad ? 'road' : 'grass',
                        isStart,
                        isFinish,
                        tileSvg,
                        tileAngle
                    });
                }
            }
            this.gridCells = cells;

            this.car = {
                x: gridDef.start.x,
                y: gridDef.start.y,
                dir: gridDef.start.dir ?? 0,
                angle: (gridDef.start.dir ?? 0) * 90,
                startX: gridDef.start.x,
                startY: gridDef.start.y,
                startDir: gridDef.start.dir ?? 0,
                crashed: false,
                animate: false
            };
        },

        isCellRoad(x, y) {
            if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return false;
            const cell = this.gridCells.find(c => c.x === x && c.y === y);
            return cell && cell.type === 'road';
        },

        selectOption(optIndex) {
            if (this.taskStatus === 'running') return;
            this.selectedOption = optIndex;
            this.taskStatus = 'idle';
            this.statusMessage = '';
        },

        fillBlank(word) {
            if (this.taskStatus === 'running') return;
            this.filledBlank = word;
            this.taskStatus = 'idle';
            this.statusMessage = '';
        },

        clearBlank() {
            if (this.taskStatus === 'running') return;
            this.filledBlank = null;
            this.taskStatus = 'idle';
        },

        addBlock(word) {
            if (this.taskStatus === 'running') return;
            this.assembledBlocks.push(word);
            this.taskStatus = 'idle';
            this.statusMessage = '';
        },

        removeBlock(index) {
            if (this.taskStatus === 'running') return;
            this.assembledBlocks.splice(index, 1);
            this.taskStatus = 'idle';
        },

        clearBlocks() {
            if (this.taskStatus === 'running') return;
            this.assembledBlocks = [];
            this.taskStatus = 'idle';
            this.statusMessage = '';
        },

        runOrCheck() {
            const task = this.currentTask;
            if (!task) return;

            if (this.taskStatus === 'success') {
                this.nextStep();
                return;
            }

            if (task.type === 'theory') {
                this.checkTheory();
            } else {
                this.runGridCode();
            }
        },

        checkTheory() {
            const task = this.currentTask;
            if (this.selectedOption === null) {
                this.taskStatus = 'syntax_error';
                this.statusMessage = 'Пожалуйста, выберите один из вариантов ответа!';
                return;
            }

            if (this.selectedOption === task.correctAnswer) {
                this.taskStatus = 'success';
                this.statusMessage = 'Правильно! Отличный ответ!';
                this.streak++;
                if (window.confetti) {
                    window.confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
                }
                if (window.CodeRulitGamification) {
                    window.CodeRulitGamification.recordTaskSuccess({
                        task: this.currentTask,
                        streak: this.streak,
                        stepIndex: this.currentStepIndex
                    });
                }
            } else {
                this.taskStatus = 'fail';
                this.statusMessage = 'Не совсем так. Серия сброшена! Попробуйте еще раз.';
                this.streak = 0;
                this.streakLostInLesson = true;
                localStorage.setItem('streak', '0');
            }
        },

        runGridCode() {
            const task = this.currentTask;
            let assembledCodeString = '';

            if (task.type === 'fill_blank') {
                if (!this.filledBlank) {
                    this.taskStatus = 'syntax_error';
                    this.statusMessage = 'Подставьте слово из списка в пропуск!';
                    return;
                }
                assembledCodeString = task.template.replace('[blank]', this.filledBlank);
            } else if (task.type === 'text_input') {
                const val = (this.typedInput || '').trim();
                if (!val) {
                    this.taskStatus = 'syntax_error';
                    this.statusMessage = 'Введите команду в поле!';
                    return;
                }
                assembledCodeString = task.template.replace('[input]', val);
            } else if (task.type === 'blocks') {
                if (this.assembledBlocks.length === 0) {
                    this.taskStatus = 'syntax_error';
                    this.statusMessage = 'Добавьте хотя бы одну команду из списка!';
                    return;
                }
                assembledCodeString = this.assembledBlocks.join('\n');
            }

            const instructions = this.parseCode(assembledCodeString);

            this.car.animate = false;
            this.car.x = this.car.startX;
            this.car.y = this.car.startY;
            this.car.dir = this.car.startDir;
            this.car.angle = this.car.startDir * 90;
            this.car.crashed = false;

            this.taskStatus = 'running';
            this.statusMessage = 'Автопилот выполняет программу...';

            setTimeout(() => {
                this.car.animate = true;
            }, 50);

            this.executeSimulationSteps(instructions);
        },

        parseCode(code) {
            const lines = code.split('\n').map(l => l.trim()).filter(Boolean);
            const steps = [];

            for (const line of lines) {
                const ifMatch = line.match(/^если\s+(.+?)\s+то\s+(.+)$/i);
                if (ifMatch) {
                    const condition = ifMatch[1].trim();
                    const action = ifMatch[2].trim();

                    const innerRepeat = action.match(/^(.+?)\s+(\d+)\s+раз[а]?$/i);
                    if (innerRepeat) {
                        steps.push({
                            type: 'if_repeat',
                            condition,
                            action: innerRepeat[1].trim(),
                            count: parseInt(innerRepeat[2], 10)
                        });
                    } else {
                        steps.push({ type: 'if', condition, action });
                    }
                    continue;
                }

                const whileMatch = line.match(/^(.+?)\s+пока\s+(.+)$/i);
                if (whileMatch) {
                    const action = whileMatch[1].trim();
                    const condition = whileMatch[2].trim();
                    steps.push({ type: 'while', action, condition });
                    continue;
                }

                const repeatMatch = line.match(/^(.+?)\s+(\d+)\s+раз[а]?$/i);
                if (repeatMatch) {
                    const action = repeatMatch[1].trim();
                    const count = parseInt(repeatMatch[2], 10);
                    for (let i = 0; i < count; i++) {
                        steps.push({ type: 'action', cmd: action });
                    }
                    continue;
                }

                steps.push({ type: 'action', cmd: line });
            }

            return steps;
        },

        executeSimulationSteps(instructions) {
            let stepIndex = 0;
            const maxTotalSteps = 30;
            let totalExecuted = 0;

            const runNext = () => {
                if (this.car.crashed) {
                    this.taskStatus = 'fail';
                    this.statusMessage = 'Автомобиль съехал с дороги в траву! Серия сброшена.';
                    this.streak = 0;
                    this.streakLostInLesson = true;
                    localStorage.setItem('streak', '0');
                    return;
                }

                if (stepIndex >= instructions.length || totalExecuted >= maxTotalSteps) {
                    if (this.car.x === this.finish.x && this.car.y === this.finish.y) {
                        this.taskStatus = 'success';
                        this.statusMessage = 'Отлично! Маршрут пройден успешно!';
                        this.streak++;
                        if (window.confetti) {
                            window.confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
                        }
                        if (window.CodeRulitGamification) {
                            window.CodeRulitGamification.recordTaskSuccess({
                                task: this.currentTask,
                                instructions: instructions,
                                streak: this.streak,
                                stepIndex: this.currentStepIndex,
                                carCrashed: this.car.crashed
                            });
                        }
                    } else {
                        this.taskStatus = 'fail';
                        this.statusMessage = 'Машина не доехала до финиша. Серия сброшена. Попробуйте еще раз!';
                        this.streak = 0;
                        this.streakLostInLesson = true;
                        localStorage.setItem('streak', '0');
                    }
                    return;
                }

                const item = instructions[stepIndex];
                totalExecuted++;

                if (item.type === 'action') {
                    this.executeSingleAction(item.cmd);
                    stepIndex++;
                    this.simulationTimer = setTimeout(runNext, 380);
                } else if (item.type === 'if') {
                    const condValue = this.evaluateCondition(item.condition);
                    if (condValue) {
                        this.executeSingleAction(item.action);
                    }
                    stepIndex++;
                    this.simulationTimer = setTimeout(runNext, 380);
                } else if (item.type === 'if_repeat') {
                    const condValue = this.evaluateCondition(item.condition);
                    if (condValue) {
                        for (let k = 0; k < item.count; k++) {
                            instructions.splice(stepIndex + 1 + k, 0, { type: 'action', cmd: item.action });
                        }
                    }
                    stepIndex++;
                    this.simulationTimer = setTimeout(runNext, 100);
                } else if (item.type === 'while') {
                    const condValue = this.evaluateCondition(item.condition);
                    if (condValue && totalExecuted < maxTotalSteps) {
                        this.executeSingleAction(item.action);
                        this.simulationTimer = setTimeout(runNext, 380);
                    } else {
                        stepIndex++;
                        this.simulationTimer = setTimeout(runNext, 100);
                    }
                }
            };

            this.simulationTimer = setTimeout(runNext, 200);
        },

        evaluateCondition(cond) {
            const clean = cond.trim().toLowerCase();
            const car = this.car;

            const dirs = [
                { dx: 0, dy: -1 },
                { dx: 1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }
            ];

            let checkDir = car.dir;
            if (clean === 'спереди_пусто' || clean === 'спереди') {
                checkDir = car.dir;
            } else if (clean === 'справа_пусто' || clean === 'справа') {
                checkDir = (car.dir + 1) % 4;
            } else if (clean === 'слева_пусто' || clean === 'слева') {
                checkDir = (car.dir + 3) % 4;
            }

            const targetX = car.x + dirs[checkDir].dx;
            const targetY = car.y + dirs[checkDir].dy;

            return this.isCellRoad(targetX, targetY);
        },

        executeSingleAction(action) {
            this.car.animate = true;
            const act = action.trim().toLowerCase();
            const car = this.car;

            if (act === 'повернуть направо' || act === 'направо') {
                car.angle += 90;
                const norm = ((car.angle % 360) + 360) % 360;
                car.dir = Math.round(norm / 90) % 4;
                return;
            }
            if (act === 'повернуть налево' || act === 'налево') {
                car.angle -= 90;
                const norm = ((car.angle % 360) + 360) % 360;
                car.dir = Math.round(norm / 90) % 4;
                return;
            }

            const dirs = [
                { dx: 0, dy: -1 },
                { dx: 1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }
            ];

            let dx = 0;
            let dy = 0;

            if (act === 'вперед') {
                dx = dirs[car.dir].dx;
                dy = dirs[car.dir].dy;
            }

            const nextX = car.x + dx;
            const nextY = car.y + dy;

            if (!this.isCellRoad(nextX, nextY)) {
                car.x = nextX;
                car.y = nextY;
                car.crashed = true;
            } else {
                car.x = nextX;
                car.y = nextY;
            }
        },

        resetCarToStart() {
            if (this.simulationTimer) {
                clearTimeout(this.simulationTimer);
                this.simulationTimer = null;
            }
            this.car.animate = false;
            this.car.x = this.car.startX;
            this.car.y = this.car.startY;
            this.car.dir = this.car.startDir;
            this.car.angle = this.car.startDir * 90;
            this.car.crashed = false;
            this.taskStatus = 'idle';
            this.statusMessage = '';
        },

        nextStep() {
            if (this.currentStepIndex + 1 < this.totalSteps) {
                this.loadTask(this.currentStepIndex + 1);
            } else {
                this.finishLesson();
            }
        },

        finishLesson() {
            this.lessonCompleted = true;

            // Сохраняем набранную серию и рекорд только при успешном завершении урока
            localStorage.setItem('streak', this.streak.toString());
            const curMax = Math.max(parseInt(localStorage.getItem('maxStreak') || '0', 10), this.streak);
            localStorage.setItem('maxStreak', curMax.toString());

            const currCompleted = parseInt(localStorage.getItem('completedLessons') || '0', 10);
            const numLessonId = parseInt(this.lessonId, 10);
            if (!isNaN(numLessonId)) {
                const newCompleted = Math.max(currCompleted, numLessonId);
                localStorage.setItem('completedLessons', newCompleted.toString());
            }

            const currentXp = parseInt(localStorage.getItem('userXp') || '0', 10);
            const earnedXp = this.lessonId === 'revision' ? 250 : 150;
            localStorage.setItem('userXp', (currentXp + earnedXp).toString());

            if (window.CodeRulitGamification) {
                window.CodeRulitGamification.recordLessonFinish(earnedXp);
            }

            if (window.confetti) {
                window.confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
            }
        },

        handleQuit() {
            if (this.lessonCompleted) return;
            if (this.streakLostInLesson) {
                // Если серия была потеряна/сброшена из-за ошибки в этом уроке, она остается 0
                localStorage.setItem('streak', '0');
            } else {
                // При выходе без завершения урока прогресс серии не сохраняется
                localStorage.setItem('streak', this.initialStreak.toString());
                localStorage.setItem('maxStreak', this.initialMaxStreak.toString());
            }
        },

        confirmExit() {
            this.handleQuit();
            window.location.href = 'index.html';
        }
    };
}

if (window.Alpine) {
    Alpine.data('lessonApp', lessonApp);
} else {
    document.addEventListener('alpine:init', () => {
        Alpine.data('lessonApp', lessonApp);
    });
}
