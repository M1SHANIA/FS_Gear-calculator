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

        // Read global roles
        const roleInput = document.getElementById('roleInput').value; // 'sun'|'carrier'|'ring'
        const roleOutput = document.getElementById('roleOutput').value;
        if (!roleInput || !roleOutput || roleInput === roleOutput) { alert('Please select different Input and Output components.'); return; }
        const roleFixed = ['sun', 'carrier', 'ring'].filter(x => x !== roleInput && x !== roleOutput)[0];

        // Build per-component config strings used by computeStage
        const sunConfig = (roleInput === 'sun') ? 'input' : (roleOutput === 'sun') ? 'output' : 'fixed';
        const carrierConfig = (roleInput === 'carrier') ? 'input' : (roleOutput === 'carrier') ? 'output' : 'fixed';
        const ringConfig = (roleInput === 'ring') ? 'input' : (roleOutput === 'ring') ? 'output' : 'fixed';

        // read main stage (stage 1) teeth
        const sunTeethMain = parseFloat(document.getElementById('sunTeeth-1').value);
        const planetTeeth1 = parseFloat(document.getElementById('planetTeeth-1').value);
        const ringTeethMain = parseFloat(document.getElementById('ringTeeth-1').value);
        const numPlanetsMain = parseFloat(document.getElementById('numPlanets-1').value);
        if ([sunTeethMain, planetTeeth1, ringTeethMain].some(v => isNaN(v) || v <= 0)) { alert('Please enter valid sun/planet/ring teeth for stage 1'); return; }

        let totalRatio = 1;
        let stageResults = [];

        // Stage 1: full planetary
        const res1 = computeStage({ sunConfig, carrierConfig, ringConfig, inputSpeed: currentInputSpeed, sunTeeth: sunTeethMain, planetTeeth: planetTeeth1, ringTeeth: ringTeethMain, numPlanets: numPlanetsMain });
        if (!isFinite(res1.gearRatio)) { alert('Stage 1 computed an invalid gear ratio.'); return; }
        totalRatio *= res1.gearRatio;
        stageResults.push({ stage: 1, ...res1 });
        currentInputSpeed = res1.outputSpeed;

        // Additional rows (treat each added planet row as a separate half-stage)
        for (let s = 2; s <= stageCount; s++) {
            const planetTeethS = parseFloat(document.getElementById(`planetTeeth-${s}`).value);
            if (isNaN(planetTeethS) || planetTeethS <= 0) { alert(`Please enter valid planet teeth for stage ${s}`); return; }

            // Interpret the added planet row as a half-stage where its sun gear = planetTeethS and ring = main ring
            const sunTeethS = planetTeethS;
            const ringTeethS = ringTeethMain;
            // use same numPlanets as main stage unless a specific field exists
            const numPlanetsS = isFinite(parseFloat(document.getElementById(`numPlanets-${s}`)?.value)) ? parseFloat(document.getElementById(`numPlanets-${s}`).value) : numPlanetsMain;

            const res = computeStage({ sunConfig, carrierConfig, ringConfig, inputSpeed: currentInputSpeed, sunTeeth: sunTeethS, planetTeeth: planetTeethS, ringTeeth: ringTeethS, numPlanets: numPlanetsS });
            if (!isFinite(res.gearRatio)) { alert(`Stage ${s} computed an invalid gear ratio.`); return; }
            totalRatio *= res.gearRatio;
            stageResults.push({ stage: s, ...res });
            currentInputSpeed = res.outputSpeed;
        }

        // Display combined results
        const finalOutput = currentInputSpeed;
        document.getElementById('outputSpeed').textContent = finalOutput.toFixed(6) + ' rpm';
        const totalDisplay = totalRatio.toFixed(6);
        let ratioText;
        if (totalRatio === 0) ratioText = '0:1';
        else if (Math.abs(totalRatio) >= 1) ratioText = Math.abs(totalRatio).toFixed(3) + ':1';
        else ratioText = (1 / Math.abs(totalRatio)).toFixed(3) + ':1';
        document.getElementById('gearRatio').textContent = `${totalDisplay} / ${ratioText}`;
        document.getElementById('internalRatio').textContent = stageResults.map(r => r.internalRatio.toFixed(3)).join(', ');

        let formulaText = '';
        stageResults.forEach(r => { formulaText += `Stage ${r.stage}: ${r.formula}\n`; });
        formulaText += `\nTotal combined gear ratio (product of stage ratios): ${totalRatio.toFixed(6)}\n`;
        formulaText += `Final output speed: ${finalOutput.toFixed(6)} rpm`;

        // Calculate inertia if enabled
        const inertiaEnabled = document.getElementById('enableInertia')?.checked;
        if (inertiaEnabled && typeof calculateTotalInertia === 'function') {
            try {
                // Collect inertia inputs for each stage
                const inertiaInputs = [];

                // Stage 1 - full component set
                const J_sun_1 = parseFloat(document.getElementById('J_sun-1')?.value) || 0;
                const J_planet_1 = parseFloat(document.getElementById('J_planet-1')?.value) || 0;
                const J_ring_1 = parseFloat(document.getElementById('J_ring-1')?.value) || 0;
                const J_carrier_1 = parseFloat(document.getElementById('J_carrier-1')?.value) || 0;
                inertiaInputs.push({
                    J_sun: J_sun_1,
                    J_planet: J_planet_1,
                    J_ring: J_ring_1,
                    J_carrier: J_carrier_1
                });

                // Additional stages (only planet inertia for half-stages)
                for (let s = 2; s <= stageCount; s++) {
                    const J_planet = parseFloat(document.getElementById(`J_planet-${s}`)?.value) || 0;
                    inertiaInputs.push({
                        J_sun: J_planet, // Use planet inertia as the sun for half-stage
                        J_planet: J_planet,
                        J_ring: J_ring_1, // Share main ring
                        J_carrier: J_carrier_1 // Share main carrier
                    });
                }

                // Prepare stage data for inertia calculation
                const stages = stageResults.map((r, idx) => {
                    const stageNum = idx + 1;
                    let sunTeeth, planetTeeth, ringTeeth, numPlanets;

                    if (stageNum === 1) {
                        sunTeeth = sunTeethMain;
                        planetTeeth = parseFloat(document.getElementById('planetTeeth-1').value);
                        ringTeeth = ringTeethMain;
                        numPlanets = numPlanetsMain;
                    } else {
                        const planetTeethS = parseFloat(document.getElementById(`planetTeeth-${stageNum}`).value);
                        sunTeeth = planetTeethS; // Half-stage interpretation
                        planetTeeth = planetTeethS;
                        ringTeeth = ringTeethMain;
                        numPlanets = numPlanetsMain;
                    }

                    return {
                        sunConfig,
                        carrierConfig,
                        ringConfig,
                        gearRatio: r.gearRatio,
                        sunTeeth,
                        planetTeeth,
                        ringTeeth,
                        numPlanets
                    };
                });

                const inertiaResult = calculateTotalInertia(stages, inertiaInputs);

                // Display inertia in separate field
                const inertiaResultItem = document.getElementById('inertiaResultItem');
                const equivalentInertiaEl = document.getElementById('equivalentInertia');
                if (inertiaResultItem && equivalentInertiaEl) {
                    inertiaResultItem.style.display = 'block';
                    equivalentInertiaEl.textContent = `${inertiaResult.J_total.toFixed(8)} kg·m²`;
                }

                // Display detailed inertia breakdown in calculation textarea
                formulaText += `\n\n=== INERTIA ANALYSIS ===\n`;
                formulaText += `Total Equivalent Inertia (reflected to input): ${inertiaResult.J_total.toFixed(8)} kg·m²\n\n`;

                inertiaResult.stages_breakdown.forEach((stageData, idx) => {
                    formulaText += `Stage ${idx + 1} contribution:\n`;
                    formulaText += `  J_input component: ${stageData.breakdown.J_input.toFixed(8)} kg·m²\n`;
                    formulaText += `  J_output reflected: ${stageData.breakdown.J_output.toFixed(8)} kg·m²\n`;
                    formulaText += `  J_planets reflected: ${stageData.breakdown.J_planets.toFixed(8)} kg·m²\n`;
                    formulaText += `  Stage equivalent: ${stageData.J_equivalent.toFixed(8)} kg·m²\n`;
                    formulaText += `  Reflected through ratio ${stageData.accumulated_ratio.toFixed(6)}: ${stageData.J_reflected.toFixed(8)} kg·m²\n\n`;
                });

            } catch (inertiaErr) {
                formulaText += `\n\nInertia calculation error: ${inertiaErr.message}`;
            }
        } else {
            // Hide inertia result if not enabled
            const inertiaResultItem = document.getElementById('inertiaResultItem');
            if (inertiaResultItem) {
                inertiaResultItem.style.display = 'none';
            }
        }

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

    // wire global role pickers to update the Fixed display
    const inGlobal = document.getElementById('roleInput');
    const outGlobal = document.getElementById('roleOutput');
    const fixedDisplay = document.getElementById('roleFixed');
    function updateFixed() {
        if (!inGlobal || !outGlobal || !fixedDisplay) return;
        const a = inGlobal.value, b = outGlobal.value;
        if (!a || !b) { fixedDisplay.textContent = '-'; return; }
        if (a === b) { fixedDisplay.textContent = 'Choose different'; return; }
        const fixed = ['sun', 'carrier', 'ring'].filter(x => x !== a && x !== b)[0];
        fixedDisplay.textContent = fixed.charAt(0).toUpperCase() + fixed.slice(1);
    }
    if (inGlobal) inGlobal.addEventListener('change', updateFixed);
    if (outGlobal) outGlobal.addEventListener('change', updateFixed);
    updateFixed();

    // Wire inertia checkbox to show/hide inertia input panels
    const inertiaCheckbox = document.getElementById('enableInertia');
    if (inertiaCheckbox) {
        inertiaCheckbox.addEventListener('change', function () {
            const inertiaPanels = document.querySelectorAll('.inertia-panel');
            const display = this.checked ? 'block' : 'none';
            inertiaPanels.forEach(panel => {
                panel.style.display = display;
            });
        });
    }
});

// Sync role-picker choices into the underlying per-component selects (sunConfig, carrierConfig, ringConfig)
// (Per-stage role helpers removed — we use global role selectors now.)

// Allow Enter key to calculate
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        calculatePlanetary();
    }
});
