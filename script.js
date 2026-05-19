const previousDisplay = document.getElementById('previous-display');
const currentDisplay = document.getElementById('current-display');
const triggerArea = document.getElementById('trigger-area');

let currentInput = '0'; // Guarda el número puro (sin puntos de miles)
let previousInput = '';
let activeOperator = '';
let shouldResetScreen = false;
let isResultDisplayed = false;

// Estado Mágico
let isMagicMode = false;
let autoOffset = 0;
let volumeOverrideMinutes = null;
let pendingVibrationTimer = null;
let predictedHour = null;
let predictedMinute = null;

// --- Función para formatear con puntos de miles y coma decimal ---
function formatNumberWithThousands(stringNumber) {
    if (stringNumber === 'Error' || stringNumber === '0') return stringNumber;
    
    // Separar parte entera de la decimal
    const parts = stringNumber.split(',');
    let integerPart = parts[0];
    const decimalPart = parts[1] !== undefined ? ',' + parts[1] : '';

    // Colocar los puntos de miles en la parte entera
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    return integerPart + decimalPart;
}

// --- Auto-ajuste de tamaño de fuente ---
function adjustFontSize() {
    const textLength = currentDisplay.innerText.length;
    if (textLength > 14) {
        currentDisplay.style.fontSize = '2.2rem';
    } else if (textLength > 9) {
        currentDisplay.style.fontSize = '3.1rem';
    } else {
        currentDisplay.style.fontSize = '4.8rem';
    }
}

// --- Trigger Secreto (Pulsación Larga en Pantalla) ---
let touchTimer;
triggerArea.addEventListener('touchstart', (e) => {
    touchTimer = setTimeout(() => {
        isMagicMode = !isMagicMode;
        vibrate(50); // Vibración ultra sutil de confirmación
    }, 2500);
});

triggerArea.addEventListener('touchend', () => clearTimeout(touchTimer));

// --- Captura de Botones de Volumen ---
window.addEventListener('keydown', (e) => {
    if (!isMagicMode) return;
    if (e.key === 'VolumeUp') {
        volumeOverrideMinutes = 1;
        vibrate(40);
    } else if (e.key === 'VolumeDown') {
        volumeOverrideMinutes = 2;
        vibrate(40);
    }
});

// --- Lógica Matemática Real ---
function appendNumber(num) {
    if (shouldResetScreen || isResultDisplayed) {
        currentInput = '';
        shouldResetScreen = false;
        isResultDisplayed = false;
    }
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
    isResultDisplayed = false;
    
    // Muestra la operación arriba con el formato correcto de miles
    previousDisplay.innerText = `${formatNumberWithThousands(previousInput)} ${activeOperator}`;
}

function calculateNormal() {
    let result = 0;
    const prev = parseFloat(previousInput.replace(/\./g, '').replace(',', '.'));
    const current = parseFloat(currentInput.replace(/\./g, '').replace(',', '.'));

    if (isNaN(prev) || isNaN(current)) return;

    switch (activeOperator) {
        case '+': result = prev + current; break;
        case '-': result = prev - current; break;
        case '×': result = prev * current; break;
        case '÷': result = current === 0 ? 'Error' : prev / current; break;
        case '%': result = (prev * current) / 100; break;
        default: return;
    }

    // Guardar la operación completa para el historial superior antes de borrar las variables
    previousDisplay.innerText = `${formatNumberWithThousands(previousInput)} ${activeOperator} ${formatNumberWithThousands(currentInput)}`;

    // Redondear para evitar decimales flotantes infinitos de JS
    if (result !== 'Error') {
        result = Math.round(result * 100000) / 100000;
    }

    currentInput = result.toString().replace('.', ',');
    activeOperator = '';
    previousInput = '';
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
            vibrate(60); // Notificación táctil silenciosa del tiempo cumplido
            clearInterval(pendingVibrationTimer);
            isMagicMode = false; 
        }
    }, 1000);
}

function computeMagic() {
    if (isMagicMode) {
        // En el modo magia simulamos que la operación de arriba es lo que introdujo el usuario
        previousDisplay.innerText = `${formatNumberWithThousands(currentInput)}`;
        currentInput = getMagicNumber();
        
        // Renderizado especial con el igual delante
        currentDisplay.innerText = `= ${formatNumberWithThousands(currentInput)}`;
        adjustFontSize();
        
        startChivatoTimer();
        isResultDisplayed = true;
    } else {
        if (activeOperator === '') return;
        calculateNormal();
        
        // Renderizado normal con el igual delante
        currentDisplay.innerText = `= ${formatNumberWithThousands(currentInput)}`;
        adjustFontSize();
        
        isResultDisplayed = true;
    }
}

function updateDisplay() {
    currentDisplay.innerText = formatNumberWithThousands(currentInput);
    adjustFontSize();
}

function clearAll() {
    currentInput = '0';
    previousInput = '';
    activeOperator = '';
    shouldResetScreen = false;
    isResultDisplayed = false;
    isMagicMode = false;
    volumeOverrideMinutes = null;
    previousDisplay.innerText = '';
    if (pendingVibrationTimer) clearInterval(pendingVibrationTimer);
    updateDisplay();
}

function deleteNumber() {
    if (isResultDisplayed) return;
    currentInput = currentInput.toString().slice(0, -1);
    if (currentInput === '' || currentInput === '-') currentInput = '0';
    updateDisplay();
}

function toggleScientific() {}
function vibrate(p) { if (navigator.vibrate) navigator.vibrate(p); }

updateDisplay();
