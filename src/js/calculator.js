let stageCount = 1;

function addStage() {
    stageCount++;
    const container = document.getElementById("stagesContainer");
    const newStage = document.createElement("div");
    newStage.className = "gear-chain";
    newStage.setAttribute("data-stage", stageCount);
    newStage.innerHTML = `
                <h3>Stage ${stageCount}</h3>
                <div class="gear-row">
                    <div>
                        <label>Driving Gear (teeth):</label>
                        <input type="number" class="driving-gear" placeholder="e.g., 20" step="1" min="1">
                    </div>
                    <div>
                        <label>Driven Gear (teeth):</label>
                        <input type="number" class="driven-gear" placeholder="e.g., 45" step="1" min="1">
                    </div>
                </div>
                <button class="remove-stage" onclick="removeStage(${stageCount})">Remove Stage</button>
            `;
    container.appendChild(newStage);
}

function removeStage(stageNum) {
    const stage = document.querySelector(`[data-stage="${stageNum}"]`);
    if (stage && stageCount > 1) {
        stage.remove();
        stageCount--;
        renumberStages();
    }
}

function renumberStages() {
    const stages = document.querySelectorAll(".gear-chain");
    stages.forEach((stage, index) => {
        stage.setAttribute("data-stage", index + 1);
        stage.querySelector("h3").textContent = `Stage ${index + 1}`;
    });
    stageCount = stages.length;
}

function calculate() {
    const inputSpeed = parseFloat(
        document.getElementById("inputSpeed").value
    );

    if (isNaN(inputSpeed) || inputSpeed <= 0) {
        alert("Please enter a valid input speed!");
        return;
    }

    const stages = document.querySelectorAll(".gear-chain");
    let totalRatio = 1;
    let calculationSteps = [];
    let allValid = true;

    stages.forEach((stage, index) => {
        const driving = parseFloat(
            stage.querySelector(".driving-gear").value
        );
        const driven = parseFloat(stage.querySelector(".driven-gear").value);

        if (isNaN(driving) || isNaN(driven) || driving <= 0 || driven <= 0) {
            allValid = false;
            return;
        }

        const ratio = driving / driven;
        totalRatio *= ratio;
        calculationSteps.push(
            `Stage ${index + 1}: ${driving}/${driven} = ${ratio.toFixed(4)}`
        );
    });

    if (!allValid) {
        alert("Please fill in all gear teeth values with positive numbers!");
        return;
    }

    const outputSpeed = inputSpeed * totalRatio;

    // Display results in "decimal / N:1" format
    const decimalDisplay = totalRatio.toFixed(2);
    let ratioDisplayText;
    if (totalRatio === 0) {
        ratioDisplayText = "0:1";
    } else if (totalRatio >= 1) {
        ratioDisplayText = totalRatio.toFixed(1) + ":1";
    } else {
        const inv = 1 / totalRatio;
        ratioDisplayText = inv.toFixed(1) + ":1";
    }

    document.getElementById("totalRatio").textContent = `${decimalDisplay} / ${ratioDisplayText}`;
    document.getElementById("outputSpeed").textContent =
        outputSpeed.toFixed(1) + " min⁻¹";

    let formulaText = `Input Speed: ${inputSpeed} min⁻¹\n\n`;
    formulaText += calculationSteps.join("\n") + "\n\n";
    formulaText += `Total Ratio: ${totalRatio.toFixed(6)}\n`;
    formulaText += `Output Speed = ${inputSpeed} × ${totalRatio.toFixed(
        6
    )} = ${outputSpeed.toFixed(1)} min⁻¹`;

    document.getElementById("calculation").textContent = formulaText;
    document.getElementById("resultSection").classList.add("show");
}

// Allow Enter key to calculate
document.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        calculate();
    }
});
