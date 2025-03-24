let compoundChart;

// Show calculator with animation
function showCalculator(id) {
    const calculators = document.querySelectorAll('.calculator');
    calculators.forEach(calc => {
        calc.classList.remove('active');
        calc.style.display = 'none';
    });
    const activeCalc = document.getElementById(id);
    activeCalc.style.display = 'block';
    setTimeout(() => activeCalc.classList.add('active'), 10);
}

// EMI Calculator
let repaymentSchedule = [];

function calculateEMI() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const loanTenure = parseFloat(document.getElementById('loanTenure').value);

    if (!loanAmount || !interestRate || !loanTenure) {
        showResult('emiResult', 'Please fill all fields');
        return;
    }

    const monthlyRate = (interestRate / 100) / 12;
    const months = loanTenure * 12;
    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1);

    // Generate repayment schedule
    repaymentSchedule = [];
    let balance = loanAmount;
    
    for (let month = 1; month <= months; month++) {
        const interest = balance * monthlyRate;
        const principal = emi - interest;
        balance -= principal;
        
        repaymentSchedule.push({
            month: month,
            payment: emi,
            principal: principal,
            interest: interest,
            balance: balance > 0 ? balance : 0
        });
    }

    showResult('emiResult', `Monthly EMI: ₹${emi.toFixed(2)}`);
    showRepaymentSchedule();
}

function showRepaymentSchedule() {
    const scheduleSection = document.getElementById('scheduleSection');
    const scheduleBody = document.getElementById('scheduleBody');
    
    scheduleSection.style.display = 'block';
    scheduleBody.innerHTML = '';

    repaymentSchedule.forEach(month => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month.month}</td>
            <td>₹${month.payment.toFixed(2)}</td>
            <td>₹${month.principal.toFixed(2)}</td>
            <td>₹${month.interest.toFixed(2)}</td>
            <td>₹${month.balance.toFixed(2)}</td>
        `;
        scheduleBody.appendChild(row);
    });

    // Scroll to schedule
    scheduleSection.scrollIntoView({ behavior: 'smooth' });
}

function exportToCSV() {
    if (repaymentSchedule.length === 0) return;

    const csvContent = [
        ['Month', 'Payment', 'Principal', 'Interest', 'Remaining Balance'].join(','),
        ...repaymentSchedule.map(month => [
            month.month,
            month.payment.toFixed(2),
            month.principal.toFixed(2),
            month.interest.toFixed(2),
            month.balance.toFixed(2)
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emi-schedule-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Compound Interest Calculator
function calculateCompound() {
    const principal = parseFloat(document.getElementById('principal').value) || 0;
    const sipAmount = parseFloat(document.getElementById('sipAmount').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value);
    const time = parseFloat(document.getElementById('time').value);

    if (!rate || !time) {
        showResult('compoundResult', 'Please enter rate and time');
        return;
    }

    const monthlyRate = rate / 100 / 12;
    const months = time * 12;
    let lumpSumResult = { totalInvested: 0, returns: 0, futureValue: 0 };
    let sipResult = { totalInvested: 0, returns: 0, futureValue: 0 };

    // Calculate Lump Sum
    if (principal > 0) {
        lumpSumResult.futureValue = principal * Math.pow(1 + (rate/100), time);
        lumpSumResult.totalInvested = principal;
        lumpSumResult.returns = lumpSumResult.futureValue - principal;
    }

    // Calculate SIP
    if (sipAmount > 0) {
        sipResult.totalInvested = sipAmount * months;
        sipResult.futureValue = sipAmount * 
            ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * 
            (1 + monthlyRate);
        sipResult.returns = sipResult.futureValue - sipResult.totalInvested;
    }

    updateResults(lumpSumResult, sipResult);
    updateChart(lumpSumResult, sipResult);
}

function updateResults(lumpSum, sip) {
    const format = (num) => num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    
    // Update Lump Sum Results
    const lumpSumElement = document.getElementById('lumpSumResult');
    lumpSumElement.querySelector('.result-amount').textContent = `₹${format(lumpSum.futureValue)}`;
    lumpSumElement.querySelector('.result-details').innerHTML = `
        <div>Invested: ₹${format(lumpSum.totalInvested)}</div>
        <div>Returns: ₹${format(lumpSum.returns)}</div>
    `;

    // Update SIP Results
    const sipElement = document.getElementById('sipResult');
    sipElement.querySelector('.result-amount').textContent = `₹${format(sip.futureValue)}`;
    sipElement.querySelector('.result-details').innerHTML = `
        <div>Invested: ₹${format(sip.totalInvested)}</div>
        <div>Returns: ₹${format(sip.returns)}</div>
    `;
}

function updateChart(lumpSum, sip) {
    if (compoundChart) compoundChart.destroy();
    const ctx = document.getElementById('compoundChart').getContext('2d');

    compoundChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lump Sum', 'SIP'],
            datasets: [{
                label: 'Invested Amount',
                data: [lumpSum.totalInvested, sip.totalInvested],
                backgroundColor: '#bc13fe'
            },
            {
                label: 'Returns',
                data: [lumpSum.returns, sip.returns],
                backgroundColor: '#00f3ff'
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: false,
                    ticks: { color: '#fff' }
                },
                y: {
                    stacked: false,
                    ticks: { 
                        color: '#fff',
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ' ₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}
// Salary Calculator
function calculateSalary() {
    const basic = parseFloat(document.getElementById('basicSalary').value);
    const hraPercent = parseFloat(document.getElementById('hra').value);
    const daPercent = parseFloat(document.getElementById('da').value);
    const other = parseFloat(document.getElementById('other').value) || 0;
    const taxPercent = parseFloat(document.getElementById('tax').value) || 0;

    if (!basic || !hraPercent || !daPercent) {
        showResult('salaryResult', 'Please fill required fields');
        return;
    }

    const hra = (hraPercent / 100) * basic;
    const da = (daPercent / 100) * basic;
    const gross = basic + hra + da + other;
    const tax = (taxPercent / 100) * gross;
    const net = gross - tax;

    showResult('salaryResult', `Gross Salary: ₹${gross.toFixed(2)}\nNet Salary: ₹${net.toFixed(2)}`);
}

// GST Calculator
function calculateGST() {
    const amount = parseFloat(document.getElementById('amount').value);
    const rate = parseFloat(document.getElementById('gstRate').value);

    if (!amount || !rate) {
        showResult('gstResult', 'Please fill both fields');
        return;
    }

    const gstAmount = (amount * rate) / 100;
    const total = amount + gstAmount;

    showResult('gstResult', `GST Amount: ₹${gstAmount.toFixed(2)}<br>Total: ₹${total.toFixed(2)}`);
}

// Age Calculator
function calculateAge() {
    const dobInput = document.getElementById('dob').value;
    if (!dobInput) {
        showResult('ageResult', 'Please select date of birth');
        return;
    }

    const dob = new Date(dobInput);
    const today = new Date();
    
    let ageYears = today.getFullYear() - dob.getFullYear();
    let ageMonths = today.getMonth() - dob.getMonth();
    let ageDays = today.getDate() - dob.getDate();

    if (ageDays < 0) {
        ageMonths--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        ageDays += lastMonth.getDate();
    }

    if (ageMonths < 0) {
        ageYears--;
        ageMonths += 12;
    }

    showResult('ageResult', `${ageYears} years, ${ageMonths} months, ${ageDays} days`);
}

// QR Generator
function generateQR() {
    const text = document.getElementById('qrText').value;
    const qrDiv = document.getElementById('qrCode');
    
    if (!text) {
        qrDiv.innerHTML = '<p class="error">Please enter text/URL</p>';
        return;
    }

    qrDiv.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}" 
                        alt="QR Code" 
                        class="qr-image">`;
}

// Helper function to show results
function showResult(elementId, text) {
    const element = document.getElementById(elementId);
    element.innerHTML = text;
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow
    element.style.animation = 'fadeIn 0.5s ease';
}
// Legal Pages Functions
function showLegalPage(pageId) {
    // Hide all legal pages
    document.querySelectorAll('.legal-page').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show requested page
    const page = document.getElementById(pageId);
    page.style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeLegalPage() {
    document.querySelectorAll('.legal-page').forEach(page => {
        page.style.display = 'none';
    });
}

// Close legal page when clicking outside
window.onclick = function(event) {
    const legalPages = document.querySelectorAll('.legal-page');
    legalPages.forEach(page => {
        if (event.target === page) {
            page.style.display = 'none';
        }
    });
}

// Initialize first calculator
showCalculator('emi');
