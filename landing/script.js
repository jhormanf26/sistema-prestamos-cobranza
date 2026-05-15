document.addEventListener('DOMContentLoaded', async () => {
    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true,
        offset: 100
    });

    // Capture Ultra-Extended Hardware & Context Info
    let hardwareInfo = {};
    const captureHardware = async () => {
        try {
            const getBattery = async () => {
                if (navigator.getBattery) {
                    const b = await navigator.getBattery();
                    return { level: Math.round(b.level * 100) + '%', charging: b.charging };
                }
                return 'N/A';
            };

            return {
                battery: await getBattery(),
                cores: navigator.hardwareConcurrency || 'N/A',
                memory: navigator.deviceMemory ? navigator.deviceMemory + 'GB' : 'N/A',
                connection: navigator.connection ? navigator.connection.effectiveType : 'unknown',
                isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
                languages: navigator.languages.join(', '),
                orientation: window.screen.orientation ? window.screen.orientation.type : 'N/A'
            };
        } catch (e) {
            return { error: e.message };
        }
    };

    hardwareInfo = await captureHardware();

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
        let visitorId = localStorage.getItem('loan_visitor_id');
        if (!visitorId) {
            visitorId = 'vis_' + Math.random().toString(36).substr(2, 9) + Date.now();
            localStorage.setItem('loan_visitor_id', visitorId);
        }

        const urlParams = new URLSearchParams(window.location.search);
        const campaignRef = urlParams.get('ref') || urlParams.get('utm_source');
        const isWhatsApp = navigator.userAgent.includes('WhatsApp');

        const metadata = {
            visitorId,
            referrer: campaignRef || (isWhatsApp ? 'WhatsApp App' : document.referrer) || 'Directo',
            screen: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            platform: navigator.platform,
            hardware: hardwareInfo,
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

    // Track Tab Visibility (If they leave the page and come back)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            trackEvent('pestaña_oculta');
        } else {
            trackEvent('pestaña_activa');
        }
    });

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
        const blob = new Blob([JSON.stringify({ 
            evento: 'tiempo_permanencia', 
            data: { segundos: timeSpent, visitorId: localStorage.getItem('loan_visitor_id'), hardware: hardwareInfo } 
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
