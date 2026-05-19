const previousDisplay = document.getElementById('previous-display');
const currentDisplay = document.getElementById('current-display');
const triggerArea = document.getElementById('trigger-area');
const equalsBtn = document.getElementById('btn-equals');

let currentOperand = '0';
let previousOperand = '';
let operation = undefined;

// Estado Mágico
let isMagicMode = false;
let autoOffset = 0; // Se ajustará dinámicamente +1 o +2
let volumeOverrideMinutes = null; // null, 1 o 2
let pendingVibrationTimer = null;
let predictedHour = null;
let predictedMinute = null;

// --- Lógica del Trigger Secreto ---
// Mantener pulsado el área de display (negra) durante 3 segundos activa el modo mágico.
let touchTimer;
triggerArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchTimer = setTimeout(() => {
        isMagicMode = !isMagicMode;
        vibrate(300); // Vibración larga de confirmación (secreta)
        console.log("Modo Mágico: " + isMagicMode);
        
        // Feedback visual sutil solo para ti
        triggerArea.classList.toggle('magic-active');
        setTimeout(() => { triggerArea.classList.remove('magic-active') }, 1000); 

    }, 3000); // 3 segundos de pulsación
});

triggerArea.addEventListener('touchend', () => {
    clearTimeout(touchTimer);
});

// --- Lógica de Botones de Volumen ---
// Esta funcionalidad depende del soporte del navegador/móvil y puede variar.
window.addEventListener('keydown', (e) => {
    if (!isMagicMode) return; // Solo funciona en modo mágico

    if (e.key === 'VolumeUp') {
        volumeOverrideMinutes = 1;
        vibrate([50, 50, 50]); // Feedback rápido secreto
        console.log("Emergencia: Configurado minutos +1");
    } else if (e.key === 'VolumeDown') {
        volumeOverrideMinutes = 2;
        vibrate([50, 50, 150]); // Feedback secreto
        console.log("Emergencia: Configurado minutos +2");
    }
});

// --- Lógica del Forzaje Mágico ---
function getMagicTimeParts() {
    const now = new Date();
    const seconds = now.getSeconds();

    // Lógica Automática
    if (seconds < 30) {
        autoOffset = 1;
    } else {
        autoOffset = 2;
    }

    // Lógica de Emergencia (Botones de Volumen)
    let minutesOffset = (volumeOverrideMinutes !== null) ? volumeOverrideMinutes : autoOffset;

    // Calcular la hora/minuto final (manejando el cambio de hora/día)
    const targetDate = new Date(now);
    targetDate.setMinutes(targetDate.getMinutes() + minutesOffset);

    // Formateo según la regla: [D]DMMYYHHmm
    // May 19 -> '19', May 5 -> '5'
    let dayStr = targetDate.getDate().toString(); 
    let monthStr = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    let yearLast2Str = targetDate.getFullYear().toString().slice(-2);
    let hourStr = targetDate.getHours().toString().padStart(2, '0');
    let minuteStr = targetDate.getMinutes().toString().padStart(2, '0');

    // Guardar para el temporizador de vibración
    predictedHour = targetDate.getHours();
    predictedMinute = targetDate.getMinutes();

    return dayStr + monthStr + yearLast2Str + hourStr + minuteStr;
}

// --- Temporizador de Vibración (Chivato) ---
function startBackgroundVibrationTimer() {
    if (pendingVibrationTimer) clearInterval(pendingVibrationTimer);

    pendingVibrationTimer = setInterval(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentSecond = now.getSeconds();

        // Cuando la hora real coincida con la hora predicha y esté en el segundo 0
        if (currentHour === predictedHour && currentMinute === predictedMinute && currentSecond < 3) {
            vibrate([100, 100, 100]); // Tres vibraciones cortas: es el momento.
            clearInterval(pendingVibrationTimer); // Parar el temporizador
            isMagicMode = false; // Resetear modo para el siguiente truco
            volumeOverrideMinutes = null;
        }
    }, 1000); // Comprobar cada segundo
}

// --- Funcionalidad del Botón '=' ---
function computeMagic() {
    if (isMagicMode) {
        currentOperand = getMagicTimeParts();
        updateDisplay();
        vibrate(100); // Vibración rápida confirmando el forzaje mostrado
        startBackgroundVibrationTimer(); // Iniciar el chivato
    } else {
        // Funcionamiento normal (puedes añadir aquí un motor matemático básico)
        console.log("Modo Normal: No implementado");
        currentOperand = "Err"; // Por simplicidad, no implementamos el motor matemático.
        updateDisplay();
    }
}

// --- Lógica de la Calculadora Básica (Interfaz) ---
function appendNumber(number) {
    if (number === ',' && currentOperand.includes(',')) return; // No duplicar comas
    if (currentOperand === '0' && number !== ',') {
        currentOperand = number.toString();
    } else {
        currentOperand = currentOperand.toString() + number.toString();
    }
    updateDisplay();
}

function updateDisplay() {
    currentDisplay.innerText = currentOperand;
    if (operation != undefined) {
        previousDisplay.innerText = `${previousOperand} ${operation}`;
    } else {
        previousDisplay.innerText = '';
    }
}

function clearAll() {
    currentOperand = '0';
    previousOperand = '';
    operation = undefined;
    isMagicMode = false; // Limpia el modo mágico al hacer AC
    volumeOverrideMinutes = null;
    if (pendingVibrationTimer) clearInterval(pendingVibrationTimer);
    updateDisplay();
}

function deleteNumber() {
    currentOperand = currentOperand.toString().slice(0, -1);
    if (currentOperand === '') currentOperand = '0';
    updateDisplay();
}

function appendOperator(op) {
    // Solo interfaz, sin lógica matemática compleja por ahora.
    if (currentOperand === '') return;
    if (previousOperand !== '') {
        // En una app real, aquí calcularíamos
    }
    operation = op;
    previousOperand = currentOperand;
    currentOperand = '';
    updateDisplay();
}

function toggleScientific() {
    // Por simplicidad, no implementamos el cambio de modo.
}

// Función auxiliar para vibración segura
function vibrate(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// Inicializar
updateDisplay();