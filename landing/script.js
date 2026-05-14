document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true,
        offset: 100
    });

    // Simulator Logic
    const amountInput = document.getElementById('amount');
    const amountRange = document.getElementById('amountRange');
    const installmentsSelect = document.getElementById('installments');
    const frequencySelect = document.getElementById('frequency');
    
    const resInstallment = document.getElementById('resInstallment');
    const resTotal = document.getElementById('resTotal');
    const btnContact = document.getElementById('btnContact');

    const formatAmount = (val) => {
        const num = val.toString().replace(/\D/g, '');
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const calculate = () => {
        const principal = parseFloat(amountInput.value.replace(/\./g, '')) || 0;
        const installments = parseInt(installmentsSelect.value);
        const frequency = frequencySelect.value;
        
        let monthlyRate = 0.02;
        const totalInterest = principal * monthlyRate * (installments / (frequency === 'mensual' ? 1 : 4)); 
        const total = principal + totalInterest;
        const installmentValue = total / installments;

        resInstallment.textContent = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(installmentValue);
        resTotal.textContent = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total);
        
        const message = encodeURIComponent(`¡Hola! Vi tu página web y me interesa un crédito de $${principal.toLocaleString('es-CO')} en ${installments} cuotas ${frequency}. ¿Me podrías asesorar?`);
        btnContact.onclick = () => window.open(`https://wa.me/573158572338?text=${message}`, '_blank');
    };

    // Sync Slider and Input
    amountInput.addEventListener('input', (e) => {
        const formatted = formatAmount(e.target.value);
        e.target.value = formatted;
        amountRange.value = e.target.value.replace(/\./g, '');
        calculate();
    });

    amountRange.addEventListener('input', () => {
        amountInput.value = formatAmount(amountRange.value);
        calculate();
    });

    installmentsSelect.addEventListener('change', calculate);
    frequencySelect.addEventListener('change', calculate);

    // Initial Calculation
    calculate();

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.padding = '10px 0';
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        } else {
            navbar.style.padding = '20px 0';
            navbar.style.background = 'rgba(255, 255, 255, 0.7)';
        }
    });
});
