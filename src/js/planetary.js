function calculatePlanetary() {
    // Get configuration
    const sunConfig = document.getElementById('sunConfig').value;
    const carrierConfig = document.getElementById('carrierConfig').value;
    const ringConfig = document.getElementById('ringConfig').value;

    // Get input values
    const inputSpeed = parseFloat(document.getElementById('inputSpeed').value);
    const sunTeeth = parseFloat(document.getElementById('sunTeeth').value);
    const planetTeeth = parseFloat(document.getElementById('planetTeeth').value);
    const ringTeeth = parseFloat(document.getElementById('ringTeeth').value);
    const numPlanets = parseFloat(document.getElementById('numPlanets').value);

    // Validation
    if (isNaN(inputSpeed)) {
        alert('Please enter a valid input speed!');
        return;
    }

    if (isNaN(sunTeeth) || sunTeeth <= 0 || isNaN(planetTeeth) || planetTeeth <= 0 || isNaN(ringTeeth) || ringTeeth <= 0) {
        alert('Please enter valid positive numbers for all gear teeth!');
        return;
    }

    if (isNaN(numPlanets) || numPlanets <= 0) {
        alert('Please enter a valid number of planets!');
        return;
    }

    // Check that exactly one component is input, one is output, and one is fixed
    const configs = [sunConfig, carrierConfig, ringConfig];
    const inputCount = configs.filter(c => c === 'input').length;
    const outputCount = configs.filter(c => c === 'output').length;
    const fixedCount = configs.filter(c => c === 'fixed').length;

    if (inputCount !== 1 || outputCount !== 1 || fixedCount !== 1) {
        alert('Please select exactly one Input, one Output, and one Fixed component!');
        return;
    }

    // Calculate internal ratio K
    const K = ringTeeth / sunTeeth;

    // Initialize speeds (we'll calculate based on configuration)
    let sunSpeed = 0;
    let carrierSpeed = 0;
    let ringSpeed = 0;

    // Determine which component is fixed and set its speed to 0
    if (sunConfig === 'fixed') sunSpeed = 0;
    if (carrierConfig === 'fixed') carrierSpeed = 0;
    if (ringConfig === 'fixed') ringSpeed = 0;

    // Set input speed
    if (sunConfig === 'input') sunSpeed = inputSpeed;
    if (carrierConfig === 'input') carrierSpeed = inputSpeed;
    if (ringConfig === 'input') ringSpeed = inputSpeed;

    // Basic kinematic equation: n_k × z_k + n_c × z_c = n_u × (z_k + z_c)
    // Solve for the output component

    let outputSpeed;
    let gearRatio;
    let ratioType;

    if (sunConfig === 'fixed') {
        // Sun fixed (n_c = 0)
        if (ringConfig === 'input') {
            // Ring input, carrier output: i^c_ku = (z_k + z_c)/z_k = 1 + 1/K
            carrierSpeed = (ringSpeed * ringTeeth) / (ringTeeth + sunTeeth);
            outputSpeed = carrierSpeed;
            gearRatio = carrierSpeed / ringSpeed;
            ratioType = 'Ring to Carrier (Sun fixed - "malá redukce")';
        } else {
            // Carrier input, ring output: i^c_uk = z_k/(z_k + z_c) = K/(K+1)
            ringSpeed = (carrierSpeed * (ringTeeth + sunTeeth)) / ringTeeth;
            outputSpeed = ringSpeed;
            gearRatio = ringSpeed / carrierSpeed;
            ratioType = 'Carrier to Ring (Sun fixed - "malý rychloběh")';
        }
    } else if (ringConfig === 'fixed') {
        // Ring fixed (n_k = 0)
        if (sunConfig === 'input') {
            // Sun input, carrier output: i^k_cu = (z_k + z_c)/z_c = K + 1
            carrierSpeed = (sunSpeed * sunTeeth) / (ringTeeth + sunTeeth);
            outputSpeed = carrierSpeed;
            gearRatio = carrierSpeed / sunSpeed;
            ratioType = 'Sun to Carrier (Ring fixed - "velká redukce")';
        } else {
            // Carrier input, sun output: i^k_uc = z_c/(z_k + z_c) = 1/(K+1)
            sunSpeed = (carrierSpeed * (ringTeeth + sunTeeth)) / sunTeeth;
            outputSpeed = sunSpeed;
            gearRatio = sunSpeed / carrierSpeed;
            ratioType = 'Carrier to Sun (Ring fixed - "velký rychloběh")';
        }
    } else if (carrierConfig === 'fixed') {
        // Carrier fixed (n_u = 0)
        if (sunConfig === 'input') {
            // Sun input, ring output: i^u_ck = -z_k/z_c = -K
            ringSpeed = -(sunSpeed * sunTeeth) / ringTeeth;
            outputSpeed = ringSpeed;
            gearRatio = ringSpeed / sunSpeed;
            ratioType = 'Sun to Ring (Carrier fixed - "zpětná redukce")';
        } else {
            // Ring input, sun output: i^u_kc = -z_c/z_k = -1/K
            sunSpeed = -(ringSpeed * ringTeeth) / sunTeeth;
            outputSpeed = sunSpeed;
            gearRatio = sunSpeed / ringSpeed;
            ratioType = 'Ring to Sun (Carrier fixed - "zpětný rychloběh")';
        }
    }

    // Display results
    document.getElementById('outputSpeed').textContent = outputSpeed.toFixed(3) + ' rpm';
    document.getElementById('gearRatio').textContent = gearRatio.toFixed(1) + ':1';
    document.getElementById('internalRatio').textContent = K.toFixed(3);

    // Build detailed calculation
    let formulaText = `Configuration:\n`;
    formulaText += `Sun Gear: ${sunConfig.toUpperCase()} (${sunSpeed.toFixed(3)} rpm)\n`;
    formulaText += `Planet Carrier: ${carrierConfig.toUpperCase()} (${carrierSpeed.toFixed(3)} rpm)\n`;
    formulaText += `Ring Gear: ${ringConfig.toUpperCase()} (${ringSpeed.toFixed(3)} rpm)\n\n`;

    formulaText += `Gear Parameters:\n`;
    formulaText += `Sun teeth (z_c): ${sunTeeth}\n`;
    formulaText += `Planet teeth (z_s): ${planetTeeth}\n`;
    formulaText += `Ring teeth (z_k): ${ringTeeth}\n`;
    formulaText += `Number of planets: ${numPlanets}\n`;
    formulaText += `Internal ratio (K): z_k/z_c = ${ringTeeth}/${sunTeeth} = ${K.toFixed(3)}\n\n`;

    formulaText += `Basic kinematic equation:\n`;
    formulaText += `n_k × z_k + n_c × z_c = n_u × (z_k + z_c)\n\n`;

    formulaText += `Calculation:\n`;
    formulaText += `${ringSpeed.toFixed(3)} × ${ringTeeth} + ${sunSpeed.toFixed(3)} × ${sunTeeth} = ${carrierSpeed.toFixed(3)} × (${ringTeeth} + ${sunTeeth})\n`;
    formulaText += `${(ringSpeed * ringTeeth).toFixed(3)} + ${(sunSpeed * sunTeeth).toFixed(3)} = ${(carrierSpeed * (ringTeeth + sunTeeth)).toFixed(3)}\n\n`;

    formulaText += `Result:\n`;
    formulaText += `${ratioType}\n`;
    formulaText += `Gear Ratio: ${gearRatio.toFixed(3)} ≈ ${gearRatio.toFixed(1)}:1\n`;
    formulaText += `Output Speed: ${outputSpeed.toFixed(3)} rpm`;

    document.getElementById('calculation').textContent = formulaText;
    document.getElementById('resultSection').classList.add('show');
}

// Allow Enter key to calculate
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        calculatePlanetary();
    }
});
