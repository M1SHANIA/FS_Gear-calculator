// inertia.js - Module for calculating moment of inertia in planetary gearboxes

/**
 * Calculate reflected inertia from one component to another through gear ratio
 * J_reflected = J_component * (ratio)^2
 * 
 * @param {number} J - Moment of inertia of the component (kg·m²)
 * @param {number} ratio - Speed ratio between components
 * @returns {number} Reflected inertia
 */
function reflectInertia(J, ratio) {
    if (isNaN(J) || isNaN(ratio)) return 0;
    return J * ratio * ratio;
}

/**
 * Calculate total inertia reflected to input shaft for a planetary stage
 * 
 * For a planetary gearbox, the equivalent inertia depends on which component is input/output/fixed.
 * General formula: J_eq = J_input + J_output*(i^2) + J_fixed*0 + J_planets*(various factors)
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.sunConfig - 'input', 'output', or 'fixed'
 * @param {string} params.carrierConfig - 'input', 'output', or 'fixed'
 * @param {string} params.ringConfig - 'input', 'output', or 'fixed'
 * @param {number} params.gearRatio - Overall gear ratio of the stage (output/input)
 * @param {number} params.J_sun - Moment of inertia of sun gear (kg·m²)
 * @param {number} params.J_planet - Moment of inertia of ONE planet gear (kg·m²)
 * @param {number} params.J_ring - Moment of inertia of ring gear (kg·m²)
 * @param {number} params.J_carrier - Moment of inertia of carrier (kg·m²)
 * @param {number} params.numPlanets - Number of planet gears
 * @param {number} params.sunTeeth - Number of sun gear teeth
 * @param {number} params.ringTeeth - Number of ring gear teeth
 * @returns {Object} { J_equivalent, breakdown }
 */
function calculateStageInertia(params) {
    const {
        sunConfig, carrierConfig, ringConfig,
        gearRatio,
        J_sun = 0, J_planet = 0, J_ring = 0, J_carrier = 0,
        numPlanets = 3,
        sunTeeth, ringTeeth
    } = params;

    // Validate inputs
    if (isNaN(gearRatio) || gearRatio === 0) {
        throw new Error('Invalid gear ratio for inertia calculation');
    }

    let J_eq = 0;
    let J_input_direct = 0;
    let J_output_reflected = 0;
    let J_planets_reflected = 0;

    // Determine which is input and which is output
    let inputComponent = null;
    let outputComponent = null;
    if (sunConfig === 'input') inputComponent = 'sun';
    else if (carrierConfig === 'input') inputComponent = 'carrier';
    else if (ringConfig === 'input') inputComponent = 'ring';

    if (sunConfig === 'output') outputComponent = 'sun';
    else if (carrierConfig === 'output') outputComponent = 'carrier';
    else if (ringConfig === 'output') outputComponent = 'ring';

    // Add input component inertia directly (no reflection needed)
    if (inputComponent === 'sun') {
        J_input_direct = J_sun;
    } else if (inputComponent === 'carrier') {
        J_input_direct = J_carrier;
    } else if (inputComponent === 'ring') {
        J_input_direct = J_ring;
    }
    J_eq += J_input_direct;

    // Reflect output component inertia through gear ratio
    if (outputComponent === 'sun') {
        J_output_reflected = reflectInertia(J_sun, gearRatio);
    } else if (outputComponent === 'carrier') {
        J_output_reflected = reflectInertia(J_carrier, gearRatio);
    } else if (outputComponent === 'ring') {
        J_output_reflected = reflectInertia(J_ring, gearRatio);
    }
    J_eq += J_output_reflected;

    // Planet gears: their inertia contribution depends on carrier speed ratio
    // Simplified: planets rotate about carrier axis and spin on their own axis
    // J_planets_eq ≈ J_planet_single × numPlanets × (carrier_speed / input_speed)^2
    // For more accuracy, we'd need (carrier_speed/input + planet_spin/input)^2 terms
    // Here we use simplified model: carrier motion dominates

    let carrierSpeedRatio = 0;
    if (inputComponent === 'carrier') {
        carrierSpeedRatio = 1.0; // carrier is input
    } else if (outputComponent === 'carrier') {
        carrierSpeedRatio = gearRatio; // carrier is output
    } else {
        // carrier is fixed or calculate from kinematics
        // For simplicity, if carrier is fixed, ratio is 0
        carrierSpeedRatio = 0;
    }

    const J_planets_total = J_planet * numPlanets;
    J_planets_reflected = reflectInertia(J_planets_total, carrierSpeedRatio);
    J_eq += J_planets_reflected;

    // Fixed component contributes 0 (speed = 0)
    // (already handled by not adding it)

    return {
        J_equivalent: J_eq,
        breakdown: {
            J_input: J_input_direct,
            J_output: J_output_reflected,
            J_planets: J_planets_reflected
        }
    };
}

/**
 * Calculate total equivalent inertia for multi-stage planetary gearbox
 * Each stage's inertia is reflected through accumulated gear ratio
 * 
 * @param {Array} stages - Array of stage results from calculatePlanetary
 * @param {Array} inertiaInputs - Array of inertia inputs per stage
 * @returns {Object} { J_total, stages_breakdown }
 */
function calculateTotalInertia(stages, inertiaInputs) {
    if (!stages || stages.length === 0) {
        throw new Error('No stages provided for inertia calculation');
    }

    let J_total = 0;
    let stages_breakdown = [];
    let accumulatedRatio = 1.0; // accumulated ratio from input to current stage

    for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const inertia = inertiaInputs[i] || {};

        // Calculate this stage's equivalent inertia
        const stageResult = calculateStageInertia({
            sunConfig: stage.sunConfig,
            carrierConfig: stage.carrierConfig,
            ringConfig: stage.ringConfig,
            gearRatio: stage.gearRatio,
            J_sun: inertia.J_sun || 0,
            J_planet: inertia.J_planet || 0,
            J_ring: inertia.J_ring || 0,
            J_carrier: inertia.J_carrier || 0,
            numPlanets: stage.numPlanets || 3,
            sunTeeth: stage.sunTeeth,
            ringTeeth: stage.ringTeeth
        });

        // Reflect this stage's inertia to the overall input through accumulated ratio
        const J_stage_reflected = reflectInertia(stageResult.J_equivalent, accumulatedRatio);

        stages_breakdown.push({
            stage: i + 1,
            J_equivalent: stageResult.J_equivalent,
            accumulated_ratio: accumulatedRatio,
            J_reflected: J_stage_reflected,
            breakdown: stageResult.breakdown
        });

        J_total += J_stage_reflected;

        // Update accumulated ratio for next stage
        accumulatedRatio *= stage.gearRatio;
    }

    return {
        J_total: J_total,
        stages_breakdown: stages_breakdown
    };
}

// Export functions for use in planetary.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        reflectInertia,
        calculateStageInertia,
        calculateTotalInertia
    };
}
