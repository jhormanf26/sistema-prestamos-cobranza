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

    // Analytics Tracking
    const trackEvent = (evento, data = {}) => {
        // Generar o recuperar ID de visitante (Rastreo por "Cookies" persistentes)
        let visitorId = localStorage.getItem('loan_visitor_id');
        if (!visitorId) {
            visitorId = 'vis_' + Math.random().toString(36).substr(2, 9) + Date.now();
            localStorage.setItem('loan_visitor_id', visitorId);
        }

        const metadata = {
            visitorId,
            referrer: document.referrer || 'directo',
            screen: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            platform: navigator.platform,
            vendor: navigator.vendor,
            ...data
        };

        fetch('/promocion/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ evento, data: metadata })
        }).catch(err => console.log('Track error:', err));
    };

    // Track Visit
    trackEvent('visita', { path: window.location.pathname });

    // Track Scroll Depth
    let scrollLogged50 = false;
    let scrollLogged90 = false;
    window.addEventListener('scroll', () => {
        const scrolled = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
        if (scrolled > 0.5 && !scrollLogged50) {
            trackEvent('scroll_50');
            scrollLogged50 = true;
        }
        if (scrolled > 0.9 && !scrollLogged90) {
            trackEvent('scroll_90');
            scrollLogged90 = true;
        }
    });

    // Track Time on Page
    const startTime = Date.now();
    window.addEventListener('beforeunload', () => {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        // Usar sendBeacon para asegurar que se envíe al cerrar
        const blob = new Blob([JSON.stringify({ 
            evento: 'tiempo_permanencia', 
            data: { segundos: timeSpent, visitorId: localStorage.getItem('loan_visitor_id') } 
        })], { type: 'application/json' });
        navigator.sendBeacon('/promocion/track', blob);
    });

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
        
        btnContact.onclick = () => {
            trackEvent('click_solicitar', { principal, installments, frequency });
            window.open(`https://wa.me/573158572338?text=${message}`, '_blank');
        };
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
