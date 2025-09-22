class ColorPicker{
    constructor()
    {
            console.log('ColorPicker constructor started');
             if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeAfterDOMReady();
            });
        } else {
            // DOM уже загружен, но даем время на рендеринг
            setTimeout(() => {
                this.initializeAfterDOMReady();
            }, 100);
        }
    }

    initializeAfterDOMReady(){
    
        console.log('DOM is ready, initializing canvases...');

        this.canvas = document.getElementById('choose-model');
        this.pickedColorCanvas = document.getElementById('picked-color');
        
        // Проверяем существование канв
        if (!this.canvas || !this.pickedColorCanvas) {
            console.log('Canvases not found, retrying in 50ms...');
            setTimeout(() => {
                this.initializeAfterDOMReady();
            }, 50);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.pickedColorCtx = this.pickedColorCanvas.getContext('2d');
        
        console.log('Canvases initialized:', {
            main: this.canvas,
            picked: this.pickedColorCanvas
        });
            this.colorCanvases = document.querySelectorAll('.color-canvas');

            this.rgbInputs = {
                r: document.getElementById('rgb-r'),
                g: document.getElementById('rgb-g'),
                b: document.getElementById('rgb-b')
            };
            this.labInputs = {
                l: document.getElementById('lab-l'),
                a: document.getElementById('lab-a'),
                b: document.getElementById('lab-b')
            };
            this.cmykInputs = {
                c: document.getElementById('CMYK-c'),
                m: document.getElementById('CMYK-m'),
                y: document.getElementById('CMYK-y'),
                k: document.getElementById('CMYK-k')
            };

            this.transparencyInput = document.getElementById('transparent-input');

            this.currentColor = { r: 255, g: 255, b: 255, a: 1 };

            this.gradientArea = {
                x: 0,      // Отступ слева
                y: 0,      // Отступ сверху
                width: 300,  // Ширина градиента
                height: 150 // Высота градиента
            };

            this.canvasRect = null;
            this.isDragging = false;
            this.currentSelection = { x: 0, y: 0 };

            setTimeout(() => {
            this.init();
        }, 150);
    }
    init() {
        console.log('=== INITIALIZING COLOR PICKER ===');
        
        // Принудительно перерисовываем все канвы
        this.forceRedrawAllCanvases();
        
        console.log('=== COLOR PICKER INITIALIZED ===');
    }

    forceRedrawAllCanvases() {
        // 1. Основной градиент
        this.drawRainbowGradient();
        console.log('Main gradient drawn');
        
        // 2. Палитра цветов
        this.setupColorPalette();
        console.log('Color palette drawn');
        
        // 3. Выбранный цвет
        this.updatePickedColor();
        console.log('Picked color updated');
        
        // 4. Обработчики событий
        this.setupEventListeners();
        console.log('Event listeners setup');
    }

    drawCanvas() {
        // Очищаем canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем градиент только в указанной области
        this.drawRainbowGradient();
        
        // Рисуем рамку вокруг градиентной области
        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            this.gradientArea.x - 1, 
            this.gradientArea.y - 1, 
            this.gradientArea.width + 2, 
            this.gradientArea.height + 2
        );
        
        // Если есть текущая позиция выбора, рисуем индикатор
        if (this.currentSelection.x > 0 && this.currentSelection.y > 0) {
            this.drawSelectionIndicator(this.currentSelection.x, this.currentSelection.y);
        }
    }

     updateCanvasRect() {
        this.canvasRect = this.canvas.getBoundingClientRect();
    }

     drawRainbowGradient() {
        if (!this.ctx) return;
        
        // Яркий тестовый градиент
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        
        gradient.addColorStop(0.00, '#FF0000'); // Красный
        gradient.addColorStop(0.16, '#FF7F00'); // Оранжевый
        gradient.addColorStop(0.32, '#FFFF00'); // Желтый
        gradient.addColorStop(0.48, '#00FF00'); // Зеленый
        gradient.addColorStop(0.64, '#0000FF'); // Синий
        gradient.addColorStop(0.80, '#4B0082'); // Индиго
        gradient.addColorStop(0.90, '#9400D3'); // Фиолетовый
        gradient.addColorStop(1.00, '#FFFFFF'); // Белый
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setupGradientClickHandler() {
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.handleColorPickFromGradient(x, y);
        });
        
        this.canvas.style.cursor = 'crosshair';
    }
    
    // НОВЫЙ МЕТОД: Выбор цвета из градиента
    handleColorPickFromGradient(x, y) {
        // Получаем цвет пикселя в точке клика
        const imageData = this.ctx.getImageData(x, y, 1, 1);
        const data = imageData.data;
        
        this.currentColor = {
            r: data[0],
            g: data[1],
            b: data[2],
            a: this.currentColor.a
        };
        
        this.updateAllFromRGB();
        
        // Визуальная обратная связь - рисуем кружок вокруг выбранной точки
        this.drawSelectionCircle(x, y);
    }
    
    // НОВЫЙ МЕТОД: Рисуем кружок вокруг выбранного цвета
    drawSelectionCircle(x, y) {
        // Сохраняем текущее состояние canvas
        this.ctx.save();
        
        // Восстанавливаем градиент (перерисовываем его)
        this.setupRainbowGradient();
        
        // Рисуем кружок выбора
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Внутренний белый кружок для контраста
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    setupColorPalette(){
        const colors = {
            'black': '#000000',
            'grey': '#808080',
            'light-grey': '#C0C0C0',
            'white': '#FFFFFF',
            'dark-red': '#8B0000',
            'red': '#FF0000',
            'orange': '#FFA500',
            'yellow': '#FFFF00',
            'dark-green': '#006400',
            'green': '#008000',
            'lime': '#00FF00',
            'light-green': '#90EE90',
            'dark-blue': '#00008B',
            'blue': '#0000FF',
            'aqua': '#00FFFF',
            'light-blue': '#ADD8E6',
            'indigo': '#4B0082',
            'purple': '#800080',
            'fuchsia': '#FF00FF',
            'plum': '#DDA0DD'
        };

        this.colorCanvases.forEach(canvas =>
        {
            const colorId = canvas.id;
            const ctx = canvas.getContext('2d');
            if (colors[colorId]) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = colors[colorId];
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(0, 0, canvas.width, canvas.height);
            }
            canvas.addEventListener('click', () => {
                this.handleColorSelectFromPalette(colors[colorId]);
            canvas.style.cursor = 'pointer';
            });
        });  
    }

     setupEventListeners() {
        this.rgbInputs.r.addEventListener('input', () => this.updateFromRGB('r'));
        this.rgbInputs.g.addEventListener('input', () => this.updateFromRGB('g'));
        this.rgbInputs.b.addEventListener('input', () => this.updateFromRGB('b'));

        // Исправлено: добавлены обработчики для LAB и CMYK
        this.labInputs.l.addEventListener('input', () => this.updateFromLAB());
        this.labInputs.a.addEventListener('input', () => this.updateFromLAB());
        this.labInputs.b.addEventListener('input', () => this.updateFromLAB());

        this.cmykInputs.c.addEventListener('input', () => this.updateFromCMYK());
        this.cmykInputs.m.addEventListener('input', () => this.updateFromCMYK());
        this.cmykInputs.y.addEventListener('input', () => this.updateFromCMYK());
        this.cmykInputs.k.addEventListener('input', () => this.updateFromCMYK());

        this.transparencyInput.addEventListener('input', () => this.updateTransparency());

        // Обработчики для градиента с исправлением отставания курсора
        this.setupGradientClickHandler();
        
        // Обновляем позицию при изменении размера окна
        window.addEventListener('resize', () => this.updateCanvasRect());
        window.addEventListener('scroll', () => this.updateCanvasRect());
    }

   setupGradientClickHandler() {
        const getCorrectCoordinates = (event) => {
            this.updateCanvasRect();
            const x = event.clientX - this.canvasRect.left;
            const y = event.clientY - this.canvasRect.top;
            
            return { x, y };
        };
        
        const isInGradientArea = (x, y) => {
            const g = this.gradientArea;
            return x >= g.x && x <= g.x + g.width && 
                   y >= g.y && y <= g.y + g.height;
        };
        
        this.canvas.addEventListener('mousedown', (event) => {
            const { x, y } = getCorrectCoordinates(event);
            if (isInGradientArea(x, y)) {
                this.isDragging = true;
                this.handleColorPickFromGradient(x, y);
            }
        });
        
        this.canvas.addEventListener('mousemove', (event) => {
            if (this.isDragging) {
                const { x, y } = getCorrectCoordinates(event);
                if (isInGradientArea(x, y)) {
                    this.handleColorPickFromGradient(x, y);
                }
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
        
        // Меняем курсор только при наведении на градиент
        this.canvas.addEventListener('mousemove', (event) => {
            const { x, y } = getCorrectCoordinates(event);
            this.canvas.style.cursor = isInGradientArea(x, y) ? 'crosshair' : 'default';
        });
    }

     handleColorPickFromGradient(x, y) {
        // Ограничиваем координаты областью градиента
        const g = this.gradientArea;
        const clampedX = Math.max(g.x, Math.min(x, g.x + g.width));
        const clampedY = Math.max(g.y, Math.min(y, g.y + g.height));
        
        // Сохраняем текущую позицию для перерисовки
        this.currentSelection.x = clampedX;
        this.currentSelection.y = clampedY;
        
        // Получаем цвет пикселя
        const imageData = this.ctx.getImageData(clampedX, clampedY, 1, 1);
        const data = imageData.data;
        
        this.currentColor = {
            r: data[0],
            g: data[1],
            b: data[2],
            a: this.currentColor.a
        };
        
        this.updateAllFromRGB();
        this.drawCanvas(); // Перерисовываем весь canvas
    }
    
    drawSelectionIndicator(x, y) {
        this.ctx.save();
        
        // Горизонтальная линия через весь canvas для лучшей видимости
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Кружок выбора на градиенте
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
        
        // Черная обводка
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Белая внутренняя обводка
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    handleColorSelectFromPalette(hexColor) { 
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
        if (result) {
            this.currentColor = {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
                a: this.currentColor.a
            };

            this.updateAllFromRGB();
        }
    }

    updateTransparency() {
        this.currentColor.a = parseInt(this.transparencyInput.value) / 100;
        this.updatePickedColor();
    }

    updateFromRGB(channel) {
        this.currentColor[channel] = parseInt(this.rgbInputs[channel].value) || 0;
        this.updateAllFromRGB();
    }

    updateFromLAB() { // Исправлено: правильное название метода
        const L = parseFloat(this.labInputs.l.value) || 0;
        const a = parseFloat(this.labInputs.a.value) || 0;
        const b = parseFloat(this.labInputs.b.value) || 0;

        // Валидация значений
        this.labInputs.l.value = Math.min(100, Math.max(0, L)); // L: 0-100
        this.labInputs.a.value = Math.min(128, Math.max(-128, a)); // a,b: -128 to 128
        this.labInputs.b.value = Math.min(128, Math.max(-128, b)); // a,b: -128 to 128

        this.convertLABtoRGB(L, a, b);
        this.updateAllFromRGB();
    }

    updateFromCMYK() {
        const c = parseFloat(this.cmykInputs.c.value) || 0;
        const m = parseFloat(this.cmykInputs.m.value) || 0;
        const y = parseFloat(this.cmykInputs.y.value) || 0;
        const k = parseFloat(this.cmykInputs.k.value) || 0;

        this.convertCMYKtoRGB(c, m, y, k);
        this.updateAllFromRGB();
    }

    updateAllFromRGB() {
        const r = this.currentColor.r;
        const g = this.currentColor.g;
        const b = this.currentColor.b;
        this.rgbInputs.r.value = r;
        this.rgbInputs.g.value = g;
        this.rgbInputs.b.value = b;

        this.convertRGBtoLAB();
        this.convertCMYKFromRGB(r, g, b);
        this.updatePickedColor();
    }

    convertRGBtoLAB() {
        const rNorm = this.currentColor.r / 255;
        const gNorm = this.currentColor.g / 255;
        const bNorm = this.currentColor.b / 255;

        const rLinear = rNorm <= 0.04045 ? rNorm / 12.92 : Math.pow((rNorm + 0.055) / 1.055, 2.4);
        const gLinear = gNorm <= 0.04045 ? gNorm / 12.92 : Math.pow((gNorm + 0.055) / 1.055, 2.4);
        const bLinear = bNorm <= 0.04045 ? bNorm / 12.92 : Math.pow((bNorm + 0.055) / 1.055, 2.4);

        let x = rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375;
        let y = rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.0721750;
        let z = rLinear * 0.0193339 + gLinear * 0.1191920 + bLinear * 0.9503041;

        x = x * 100;
        y = y * 100;
        z = z * 100;

        const nonlinearConverting = (num) => {
            const delta = 6/29;
            if (num > Math.pow(delta, 3)) {
                return Math.pow(num, 1/3);
            } else {
                return num / (3 * Math.pow(delta, 2)) + 4/29;
            }
        };

        const referenceX = 95.047;
        const referenceY = 100.000;
        const referenceZ = 108.883;

        const xRatio = x / referenceX;
        const yRatio = y / referenceY;
        const zRatio = z / referenceZ;

        const L = 116 * nonlinearConverting(yRatio) - 16;
        const a = 500 * (nonlinearConverting(xRatio) - nonlinearConverting(yRatio));
        const b = 200 * (nonlinearConverting(yRatio) - nonlinearConverting(zRatio));

        this.labInputs.l.value = Math.round(L);
        this.labInputs.a.value = Math.round(a);
        this.labInputs.b.value = Math.round(b);
    }

    convertLABtoRGB(L, a, b) {
        const referenceX = 95.047;
        const referenceY = 100.000;
        const referenceZ = 108.883;
        
        const yNorm = (L + 16) / 116;
        const xNorm = a / 500 + yNorm;
        const zNorm = yNorm - b / 200;
        
        const inverseNonlinear = (t) => {
            const delta = 6/29;
            return t > delta ? Math.pow(t, 3) : 3 * Math.pow(delta, 2) * (t - 4/29);
        };
        
        const X = inverseNonlinear(xNorm) * referenceX;
        const Y = inverseNonlinear(yNorm) * referenceY;
        const Z = inverseNonlinear(zNorm) * referenceZ;
        
        // Конвертация XYZ → RGB
        const x = X / 100;
        const y = Y / 100;
        const z = Z / 100;
        
        let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
        let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
        let bVal = x * 0.0557 + y * -0.2040 + z * 1.0570;
        
        // Гамма-коррекция
        const gammaCorrect = (c) => {
            return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - 0.055;
        };
        
        r = gammaCorrect(r);
        g = gammaCorrect(g);
        bVal = gammaCorrect(bVal);
        
        // Приведение к диапазону 0-255
        this.currentColor.r = Math.round(Math.min(255, Math.max(0, r * 255)));
        this.currentColor.g = Math.round(Math.min(255, Math.max(0, g * 255)));
        this.currentColor.b = Math.round(Math.min(255, Math.max(0, bVal * 255)));
    }

    convertCMYKFromRGB(r, g, b) {
        if (r === 0 && g === 0 && b === 0) {
            this.cmykInputs.c.value = 0;
            this.cmykInputs.m.value = 0;
            this.cmykInputs.y.value = 0;
            this.cmykInputs.k.value = 100;
            return;
        }

        const rNorm = r / 255;
        const gNorm = g / 255;
        const bNorm = b / 255;

        const k = 1 - Math.max(rNorm, gNorm, bNorm);
        const c = (1 - rNorm - k) / (1 - k);
        const m = (1 - gNorm - k) / (1 - k);
        const y = (1 - bNorm - k) / (1 - k);

        this.cmykInputs.c.value = Math.round(c * 100);
        this.cmykInputs.m.value = Math.round(m * 100);
        this.cmykInputs.y.value = Math.round(y * 100);
        this.cmykInputs.k.value = Math.round(k * 100);
    }

    convertCMYKtoRGB(c, m, y, k) {
        // Конвертация CMYK → RGB (значения в процентах 0-100)
        const cNorm = c / 100;
        const mNorm = m / 100;
        const yNorm = y / 100;
        const kNorm = k / 100;

        const r = 255 * (1 - cNorm) * (1 - kNorm);
        const g = 255 * (1 - mNorm) * (1 - kNorm);
        const b = 255 * (1 - yNorm) * (1 - kNorm);
        
        this.currentColor.r = Math.round(Math.min(255, Math.max(0, r)));
        this.currentColor.g = Math.round(Math.min(255, Math.max(0, g)));
        this.currentColor.b = Math.round(Math.min(255, Math.max(0, b)));
    }

    updatePickedColor() {
        this.pickedColorCtx.clearRect(0, 0, this.pickedColorCanvas.width, this.pickedColorCanvas.height);
        this.pickedColorCtx.fillStyle = `rgba(${this.currentColor.r}, ${this.currentColor.g}, ${this.currentColor.b}, ${this.currentColor.a})`;
        this.pickedColorCtx.fillRect(0, 0, this.pickedColorCanvas.width, this.pickedColorCanvas.height);
    }
}

window.addEventListener('load', function() {
    console.log('Window fully loaded, starting ColorPicker...');
    setTimeout(() => {
        new ColorPicker();
    }, 200);
});