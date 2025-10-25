// Helper: compute single planetary stage given parameters.
function computeStage(params) {
    // params: {sunConfig, carrierConfig, ringConfig, inputSpeed, sunTeeth, planetTeeth, ringTeeth, numPlanets}
    let { sunConfig, carrierConfig, ringConfig, inputSpeed, sunTeeth, planetTeeth, ringTeeth, numPlanets } = params;

    // Basic validation
    if (isNaN(inputSpeed)) throw new Error('Invalid input speed');
    if ([sunTeeth, planetTeeth, ringTeeth].some(v => isNaN(v) || v <= 0)) throw new Error('Invalid gear teeth');
    if (isNaN(numPlanets) || numPlanets <= 0) throw new Error('Invalid number of planets');

    const K = ringTeeth / sunTeeth;

    // initialize
    let sunSpeed = 0, carrierSpeed = 0, ringSpeed = 0;

    if (sunConfig === 'fixed') sunSpeed = 0;
    if (carrierConfig === 'fixed') carrierSpeed = 0;
    if (ringConfig === 'fixed') ringSpeed = 0;

    if (sunConfig === 'input') sunSpeed = inputSpeed;
    if (carrierConfig === 'input') carrierSpeed = inputSpeed;
    if (ringConfig === 'input') ringSpeed = inputSpeed;

    let outputSpeed = 0;
    let gearRatio = 0;
    let ratioType = '';

    // Use same kinematic relations as before
    if (sunConfig === 'fixed') {
        if (ringConfig === 'input') {
            carrierSpeed = (ringSpeed * ringTeeth) / (ringTeeth + sunTeeth);
            outputSpeed = carrierSpeed;
            gearRatio = carrierSpeed / ringSpeed;
            ratioType = 'Ring->Carrier (Sun fixed)';
        } else {
            ringSpeed = (carrierSpeed * (ringTeeth + sunTeeth)) / ringTeeth;
            outputSpeed = ringSpeed;
            gearRatio = ringSpeed / carrierSpeed;
            ratioType = 'Carrier->Ring (Sun fixed)';
        }
    } else if (ringConfig === 'fixed') {
        if (sunConfig === 'input') {
            carrierSpeed = (sunSpeed * sunTeeth) / (ringTeeth + sunTeeth);
            outputSpeed = carrierSpeed;
            gearRatio = carrierSpeed / sunSpeed;
            ratioType = 'Sun->Carrier (Ring fixed)';
        } else {
            sunSpeed = (carrierSpeed * (ringTeeth + sunTeeth)) / sunTeeth;
            outputSpeed = sunSpeed;
            gearRatio = sunSpeed / carrierSpeed;
            ratioType = 'Carrier->Sun (Ring fixed)';
        }
    } else if (carrierConfig === 'fixed') {
        if (sunConfig === 'input') {
            ringSpeed = -(sunSpeed * sunTeeth) / ringTeeth;
            outputSpeed = ringSpeed;
            gearRatio = ringSpeed / sunSpeed;
            ratioType = 'Sun->Ring (Carrier fixed)';
        } else {
            sunSpeed = -(ringSpeed * ringTeeth) / sunTeeth;
            outputSpeed = sunSpeed;
            gearRatio = sunSpeed / ringSpeed;
            ratioType = 'Ring->Sun (Carrier fixed)';
        }
    } else {
        throw new Error('Please set one component to fixed in stage config');
    }

    // Build formula snippet
    const formula = `Stage K: z_k/z_c=${K.toFixed(3)}, type=${ratioType}, gearRatio=${gearRatio.toFixed(6)}, out=${outputSpeed.toFixed(6)}`;

    return { outputSpeed, gearRatio, internalRatio: K, formula, ratioType };
}

function calculatePlanetary() {
    try {
        const stageCount = parseInt(document.getElementById('stageCount').value, 10) || 1;
        let currentInputSpeed = parseFloat(document.getElementById('inputSpeed').value);
        if (isNaN(currentInputSpeed)) { alert('Please enter a valid input speed!'); return; }

        let totalRatio = 1;
        let stageResults = [];

        for (let s = 1; s <= stageCount; s++) {
            // read per-stage values from DOM with suffix
            const sunConfig = document.getElementById(`sunConfig-${s}`).value;
            const carrierConfig = document.getElementById(`carrierConfig-${s}`).value;
            const ringConfig = document.getElementById(`ringConfig-${s}`).value;

            const sunTeeth = parseFloat(document.getElementById(`sunTeeth-${s}`).value);
            const planetTeeth = parseFloat(document.getElementById(`planetTeeth-${s}`).value);
            const ringTeeth = parseFloat(document.getElementById(`ringTeeth-${s}`).value);
            const numPlanets = parseFloat(document.getElementById(`numPlanets-${s}`).value);

            // basic validation per stage
            if ([sunTeeth, planetTeeth, ringTeeth].some(v => isNaN(v) || v <= 0)) {
                alert(`Please enter valid positive teeth counts for stage ${s}!`);
                return;
            }

            // Ensure exactly one fixed per stage
            const configs = [sunConfig, carrierConfig, ringConfig];
            const fixedCount = configs.filter(c => c === 'fixed').length;
            const inputCount = configs.filter(c => c === 'input').length;
            if (fixedCount !== 1 || inputCount !== 1) {
                alert(`Stage ${s}: please select exactly one Input and one Fixed component (the other may be Output).`);
                return;
            }

            const res = computeStage({ sunConfig, carrierConfig, ringConfig, inputSpeed: currentInputSpeed, sunTeeth, planetTeeth, ringTeeth, numPlanets });

            // If computed gearRatio is 0 or NaN, guard
            if (!isFinite(res.gearRatio)) {
                alert(`Stage ${s} computed an invalid gear ratio.`);
                return;
            }

            totalRatio *= res.gearRatio;
            stageResults.push({ stage: s, ...res });
            // feed output as next input
            currentInputSpeed = res.outputSpeed;
        }

        // Display combined results
        const finalOutput = currentInputSpeed;

        document.getElementById('outputSpeed').textContent = finalOutput.toFixed(6) + ' rpm';
        // show total ratio in decimal and approximate N:1
        const totalDisplay = totalRatio.toFixed(6);
        let ratioText;
        if (totalRatio === 0) ratioText = '0:1';
        else if (Math.abs(totalRatio) >= 1) ratioText = Math.abs(totalRatio).toFixed(3) + ':1';
        else ratioText = (1 / Math.abs(totalRatio)).toFixed(3) + ':1';
        document.getElementById('gearRatio').textContent = `${totalDisplay} / ${ratioText}`;

        // internal ratio: show per-stage K values
        document.getElementById('internalRatio').textContent = stageResults.map(r => r.internalRatio.toFixed(3)).join(', ');

        // Build calculation text with per-stage details
        let formulaText = '';
        stageResults.forEach(r => {
            formulaText += `Stage ${r.stage}: ${r.formula}\n`;
        });
        formulaText += `\nTotal combined gear ratio (product of stage ratios): ${totalRatio.toFixed(6)}\n`;
        formulaText += `Final output speed: ${finalOutput.toFixed(6)} rpm`;

        document.getElementById('calculation').textContent = formulaText;
        document.getElementById('resultSection').classList.add('show');
    } catch (err) {
        alert(err.message || 'Error calculating stages');
    }
}

// show/hide stage blocks when stage count changes
document.getElementById('stageCount').addEventListener('change', function (e) {
    const count = parseInt(e.target.value, 10) || 1;
    for (let s = 1; s <= 3; s++) {
        const el = document.getElementById(`stage-${s}`);
        if (!el) continue;
        el.style.display = s <= count ? 'block' : 'none';
    }
});

// UI helpers for Add/Remove buttons
function addStageUI() {
    const sel = document.getElementById('stageCount');
    const current = parseInt(sel.value, 10) || 1;
    if (current >= 3) return; // max 3
    sel.value = (current + 1).toString();
    sel.dispatchEvent(new Event('change'));
}

function removeStageUI() {
    const sel = document.getElementById('stageCount');
    const current = parseInt(sel.value, 10) || 1;
    if (current <= 1) return;
    sel.value = (current - 1).toString();
    sel.dispatchEvent(new Event('change'));
}

// wire the Add/Remove buttons after DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    const addBtn = document.getElementById('addStageBtn');
    const remBtn = document.getElementById('removeStageBtn');
    if (addBtn) addBtn.addEventListener('click', addStageUI);
    if (remBtn) remBtn.addEventListener('click', removeStageUI);
});

// Allow Enter key to calculate
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        calculatePlanetary();
    }
});
