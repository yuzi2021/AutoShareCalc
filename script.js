function processFile() {
    const fileInput = document.getElementById('fileInput');
    const smartumPercentage = parseFloat(document.getElementById('smartumPercentage').value);
    const epassiPercentage = parseFloat(document.getElementById('epassiPercentage').value);
    const edenredPercentage = parseFloat(document.getElementById('edenredPercentage').value);
    const totalPercentage = parseFloat(document.getElementById('totalPercentage').value);
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Please upload a file.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        try {
            const data = event.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // Locate the 'Total' row
            let totalRowIndex = jsonData.findIndex(row => row[0] && row[0].toString().toLowerCase().includes("total"));

            if (totalRowIndex === -1) {
                throw new Error("Could not find 'Total' row in the sheet.");
            }

            // Extract totals
            const smartumTotal = parseFloat(jsonData[totalRowIndex][jsonData[0].indexOf("Smartum")]) || 0;
            const epassiTotal = parseFloat(jsonData[totalRowIndex][jsonData[0].indexOf("Epassi")]) || 0;
            const edenredTotal = parseFloat(jsonData[totalRowIndex][jsonData[0].indexOf("Edenred")]) || 0;

            // Apply percentages
            const adjustedSmartumTotal = smartumTotal * smartumPercentage;
            const adjustedEpassiTotal = epassiTotal * epassiPercentage;
            const adjustedEdenredTotal = edenredTotal * edenredPercentage;

            // Other columns
            let otherTotals = 0;
            const otherColumns = [
                "Käteismaksut", "Korttimaksu (manuaalinen)", "Korttimaksu (integraatio)",
                "Lahjakorttimaksut", "Odottaa laskutusta", "Laskutettu", "Maksetut laskut",
                "ZZZ - ei saapunut - laskutettu", "Yritystä (Avoki Finland) laskutettu", "Ennakkomaksettu"
            ];
            
            let tableHeaders = '<th>Adjusted Smartum</th><th>Adjusted Epassi</th><th>Adjusted Edenred</th>';
            let tableValues = `<td>${adjustedSmartumTotal.toFixed(2)}</td><td>${adjustedEpassiTotal.toFixed(2)}</td><td>${adjustedEdenredTotal.toFixed(2)}</td>`;
            
            otherColumns.forEach(col => {
                const colIndex = jsonData[0].indexOf(col);
                if (colIndex !== -1) {
                    const colValue = parseFloat(jsonData[totalRowIndex][colIndex]) || 0;
                    otherTotals += colValue;
                    tableHeaders += `<th>${col}</th>`;
                    tableValues += `<td>${colValue.toFixed(2)}</td>`;
                }
            });

            // Calculate final sum and apply final percentage
            const sum = adjustedSmartumTotal + adjustedEpassiTotal + adjustedEdenredTotal + otherTotals;
            const finalAmount = sum * totalPercentage;

            // Update table
            const tableHead = document.querySelector("#resultsTable thead");
            const tableBody = document.querySelector("#resultsTable tbody");
            
            if (!tableHead || !tableBody) {
                throw new Error("Table elements not found in the DOM.");
            }

            tableHead.innerHTML = `<tr>${tableHeaders}</tr>`;
            tableBody.innerHTML = `<tr>${tableValues}</tr>`;

            // Display calculation steps
            const calculationSteps = document.getElementById('calculationSteps');
            if (!calculationSteps) {
                throw new Error("Calculation steps element not found in the DOM.");
            }

            calculationSteps.innerHTML = `
                <div class="step-result">Original Smartum: ${smartumTotal.toFixed(2)}</div>
                <div class="step-result">Adjusted Smartum: ${smartumTotal.toFixed(2)} * ${smartumPercentage} = ${adjustedSmartumTotal.toFixed(2)}</div>
                <div class="step-result">Original Epassi: ${epassiTotal.toFixed(2)}</div>
                <div class="step-result">Adjusted Epassi: ${epassiTotal.toFixed(2)} * ${epassiPercentage} = ${adjustedEpassiTotal.toFixed(2)}</div>
                <div class="step-result">Original Edenred: ${edenredTotal.toFixed(2)}</div>
                <div class="step-result">Adjusted Edenred: ${edenredTotal.toFixed(2)} * ${edenredPercentage} = ${adjustedEdenredTotal.toFixed(2)}</div>
                <div class="step-result">Total Adjusted Amount: ${sum.toFixed(2)}</div>
                <div class="step-result">
                    <div>Final Percentage Applied: ${(totalPercentage * 100).toFixed(2)}%</div>
                    <div class="final-amount">Final Amount: ${finalAmount.toFixed(2)}</div>
                </div>
            `;

            // Make results section visible
            document.querySelector('.results-section').style.display = 'block';
        } catch (error) {
            console.error("Error processing file:", error);
            alert(`Error processing file: ${error.message}`);
        }
    };

    reader.onerror = function() {
        console.error("File reading failed");
        alert("Failed to read the file. Please try again.");
    };

    reader.readAsBinaryString(file);
}

// Hide results section initially
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.results-section').style.display = 'none';
});