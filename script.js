const previousDisplay = document.getElementById('previous-display');
const currentDisplay = document.getElementById('current-display');
const triggerArea = document.getElementById('trigger-area');

let currentInput = '0';
let previousInput = '';
let activeOperator = '';
let shouldResetScreen = false;

// Estado Mágico
let isMagicMode = false;
let autoOffset = 0;
let volumeOverrideMinutes = null;
let pendingVibrationTimer = null;
let predictedHour = null;
let predictedMinute = null;

// --- Auto-ajuste de tamaño de fuente (Solución al número gigante) ---
function adjustFontSize() {
    const textLength = currentDisplay.innerText.length;
    if (textLength > 11) {
        currentDisplay.style.fontSize = '2.4rem';
    } else if (textLength > 7) {
        currentDisplay.style.fontSize = '3.3rem';
    } else {
        currentDisplay.style.fontSize = '4.8rem';
    }
}

// --- Trigger Secreto (Pulsación Larga en Pantalla) ---
let touchTimer;
triggerArea.addEventListener('touchstart', (e) => {
    touchTimer = setTimeout(() => {
        isMagicMode = !isMagicMode;
        vibrate(250); // Feedback háptico secreto
        console.log("Modo Magia: " + isMagicMode);
    }, 2500); // 2.5 segundos reteniendo
});

triggerArea.addEventListener('touchend', () => clearTimeout(touchTimer));

// --- Captura de Botones de Volumen ---
window.addEventListener('keydown', (e) => {
    if (!isMagicMode) return;
    if (e.key === 'VolumeUp') {
        volumeOverrideMinutes = 1;
        vibrate([40, 40]);
    } else if (e.key === 'VolumeDown') {
        volumeOverrideMinutes = 2;
        vibrate([40, 40, 40]);
    }
});

// --- Lógica Matemática Real (Para Modo No-Mágico) ---
function appendNumber(num) {
    if (currentInput === '0' && num !== ',') {
        currentInput = num.toString();
    } else {
        if (num === ',' && currentInput.includes(',')) return;
        currentInput += num.toString();
    }
    updateDisplay();
}

function appendOperator(op) {
    if (activeOperator !== '' && !shouldResetScreen) {
        calculateNormal();
    }
    previousInput = currentInput;
    activeOperator = op;
    shouldResetScreen = true;
    previousDisplay.innerText = `${previousInput} ${activeOperator}`;
}

function calculateNormal() {
    let result = 0;
    const prev = parseFloat(previousInput.replace(',', '.'));
    const current = parseFloat(currentInput.replace(',', '.'));

    if (isNaN(prev) || ...isNaN(current)) return;

    switch (activeOperator) {
        case '+': result = prev + current; break;
        case '-': result = prev - current; break;
        case '×': result = prev * current; break;
        case '÷': result = current === 0 ? 'Error' : prev / current; break;
        case '%': result = (prev * current) / 100; break;
        default: return;
    }

    currentInput = result.toString().replace('.', ',');
    activeOperator = '';
    previousInput = '';
    previousDisplay.innerText = '';
}

// --- Cálculo Forzado Mágico ---
function getMagicNumber() {
    const now = new Date();
    if (now.getSeconds() < 30) { autoOffset = 1; } else { autoOffset = 2; }
    
    let minutesOffset = (volumeOverrideMinutes !== null) ? volumeOverrideMinutes : autoOffset;

    const targetDate = new Date(now);
    targetDate.setMinutes(targetDate.getMinutes() + minutesOffset);

    let dayStr = targetDate.getDate().toString(); 
    let monthStr = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    let yearStr = targetDate.getFullYear().toString().slice(-2);
    let hourStr = targetDate.getHours().toString().padStart(2, '0');
    let minuteStr = targetDate.getMinutes().toString().padStart(2, '0');

    predictedHour = targetDate.getHours();
    predictedMinute = targetDate.getMinutes();

    return dayStr + monthStr + yearStr + hourStr + minuteStr;
}

function startChivatoTimer() {
    if (pendingVibrationTimer) clearInterval(pendingVibrationTimer);
    pendingVibrationTimer = setInterval(() => {
        const now = new Date();
        if (now.getHours() === predictedHour && now.getMinutes() === predictedMinute && now.getSeconds() === 0) {
            vibrate([150, 100, 150]);
            clearInterval(pendingVibrationTimer);
            isMagicMode = false;
        }
    }, 1000);
}

function computeMagic() {
    if (isMagicMode) {
        // Enseña la predicción temporal
        currentInput = getMagicNumber();
        previousDisplay.innerText = '';
        updateDisplay();
        vibrate(80);
        startChivatoTimer();
    } else {
        // Ejecuta matemáticas reales convencionales
        calculateNormal();
        updateDisplay();
    }
    shouldResetScreen = true;
}

function updateDisplay() {
    currentDisplay.innerText = currentInput;
    adjustFontSize();
}

function clearAll() {
    currentInput = '0';
    previousInput = '';
    activeOperator = '';
    shouldResetScreen = false;
    isMagicMode = false;
    volumeOverrideMinutes = null;
    previousDisplay.innerText = '';
    if (pendingVibrationTimer) clearInterval(pendingVibrationTimer);
    updateDisplay();
}

function deleteNumber() {
    currentInput = currentInput.toString().slice(0, -1);
    if (currentInput === '' || currentInput === '-') currentInput = '0';
    updateDisplay();
}

function toggleScientific() {}
function vibrate(p) { if (navigator.vibrate) navigator.vibrate(p); }

updateDisplay();
