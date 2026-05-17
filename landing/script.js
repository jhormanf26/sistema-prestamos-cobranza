document.addEventListener('DOMContentLoaded', async () => {
    const startTime = performance.now();

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

    // Elements
    const amountInput = document.getElementById('amount');
    const amountRange = document.getElementById('amountRange');
    const installmentsSelect = document.getElementById('installments');
    const frequencySelect = document.getElementById('frequency');
    const resInstallment = document.getElementById('resInstallment');
    const resTotal = document.getElementById('resTotal');
    const btnContact = document.getElementById('btnContact');
    const btnPdf = document.getElementById('btnPdf');
    
    // Modal Elements
    const leadModal = document.getElementById('leadModal');
    const formLead = document.getElementById('formLead');
    const leadName = document.getElementById('leadName');
    const leadPhone = document.getElementById('leadPhone');
    const closeModal = document.querySelector('.close-modal');
    
    // Mobile Menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const navMenu = document.getElementById('nav-menu');

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.onclick = () => navMenu.classList.add('active');
    }
    if (closeMenuBtn && navMenu) {
        closeMenuBtn.onclick = () => navMenu.classList.remove('active');
    }

    // Cerrar menú al hacer clic en cualquier enlace (incluyendo el botón de solicitar)
    document.querySelectorAll('.nav-links a, .btn-cta-nav').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // Validación estricta de Celular (Solo 10 números)
    if (leadPhone) {
        leadPhone.oninput = (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
        };
    }

    // FAQ Accordion
    document.querySelectorAll('.faq-item').forEach(item => {
        item.onclick = () => item.classList.toggle('active');
    });

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
            timeOnPage: Math.round((performance.now() - startTime) / 1000)
        };

        fetch('/promocion/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ evento, data, metadata })
        }).then(res => {
            if (res.status === 429) showSecurityLock(60); // 60 segundos por defecto
        }).catch(() => {});
    };

    window.showSecurityLock = (seconds) => {
        const modal = document.getElementById('securityModal');
        const timerDisplay = document.getElementById('lockTimer');
        if (!modal || !timerDisplay) return;

        modal.style.display = 'flex';
        let timeLeft = seconds;

        const interval = setInterval(() => {
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            timerDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                modal.style.display = 'none';
            }
            timeLeft--;
        }, 1000);
    };

    // Global Rate Limit Interceptor for forms
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        if (response.status === 429) {
            showSecurityLock(60);
        }
        return response;
    };

    // Track Performance (Load Time)
    window.onload = () => {
        const loadTime = Math.round(performance.now() - startTime);
        trackEvent('rendimiento_carga', { milisegundos: loadTime });
    };

    // Social Proof Logic (Real Data)
    const socialProof = document.getElementById('socialProof');
    const spTitle = document.getElementById('spTitle');
    const spSubtitle = document.getElementById('spSubtitle');
    
    let realEvents = [];

    const fetchSocialProof = async () => {
        try {
            const res = await fetch('/promocion/social-proof');
            realEvents = await res.json();
        } catch (e) {
            console.log('Social Proof Error:', e);
        }
    };

    const showSocialProof = () => {
        if (!socialProof) return;
        
        let title, sub;
        if (realEvents.length > 0) {
            const ev = realEvents[Math.floor(Math.random() * realEvents.length)];
            const location = ev.ciudad ? `en ${ev.ciudad}` : "en Colombia";
            
            if (ev.evento === 'lead_captured') {
                title = "🚀 ¡Nuevo Lead Capturado!";
                sub = `${location} • Solicitó asesoría`;
            } else {
                title = "💰 Simulación realizada";
                sub = `${location} por $${parseInt(ev.monto || 0).toLocaleString()}`;
            }
        } else {
            const fakes = [
                { t: 'Préstamo solicitado por $1.500.000', s: 'Hace 2 min en Bogotá' },
                { t: 'Crédito aprobado para Carlos M.', s: 'Hace 5 min en Medellín' },
                { t: 'Nuevo desembolso realizado', s: 'Hace 12 min en Cali' }
            ];
            const ev = fakes[Math.floor(Math.random() * fakes.length)];
            title = ev.t;
            sub = ev.s;
        }

        spTitle.textContent = title;
        spSubtitle.textContent = sub;
        socialProof.classList.add('active');
        setTimeout(() => socialProof.classList.remove('active'), 6000);
    };

    fetchSocialProof();
    setInterval(fetchSocialProof, 300000); // Refresh data every 5min

    setTimeout(() => {
        showSocialProof();
        setInterval(showSocialProof, 20000); // Show popup every 20s
    }, 8000);

    // Track Visit
    trackEvent('visita', { path: window.location.pathname });

    // Modal Logic
    btnContact.onclick = (e) => {
        e.preventDefault();
        
        // Confeti al primer clic
        confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.8 },
            gravity: 1.2
        });

        trackEvent('click_solicitar_abrir_modal');
        leadModal.style.display = 'flex';
    };

    if(closeModal) {
        closeModal.onclick = () => leadModal.style.display = 'none';
    }
    window.onclick = (e) => { if (e.target == leadModal) leadModal.style.display = 'none'; };

    formLead.onsubmit = async (e) => {
        e.preventDefault();
        const name = leadName.value;
        const phone = leadPhone.value;
        
        const principal = amountInput.value.replace(/\./g, '');
        const installments = installmentsSelect.value;
        const frequency = frequencySelect.value;

        await trackEvent('lead_captured', { name, phone, principal, installments, frequency });

        // Efecto Confeti de celebración
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#0d6efd', '#198754', '#ffc107']
        });

        const message = encodeURIComponent(`¡Hola! Mi nombre es ${name}. Vi tu página web y me interesa un crédito de $${parseInt(principal).toLocaleString('es-CO')} en ${installments} cuotas ${frequency}. ¿Me podrías asesorar?`);
        
        setTimeout(() => {
            window.open(`https://wa.me/573158572338?text=${message}`, '_blank');
            leadModal.style.display = 'none';
        }, 1000);
    };

    // PDF Generation
    btnPdf.onclick = () => {
        trackEvent('click_ver_pdf_plan_pagos');

        // Confeti suave para el PDF
        confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        });
        confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        });
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const amount = amountInput.value;
        const installmentsNum = parseInt(installmentsSelect.value);
        const frequency = frequencySelect.value;
        const quotaValue = resInstallment.textContent;
        const totalValue = resTotal.textContent;

        // Estilo del PDF
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(13, 110, 253);
        doc.text("PRÉSTAMOS PRO", 20, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        doc.text("Plan de Pagos Sugerido (Informativo)", 20, 27);
        doc.text(`Fecha de Generación: ${new Date().toLocaleString()}`, 20, 32);
        
        doc.line(20, 36, 190, 36);
        
        // Resumen
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("RESUMEN DE TU CRÉDITO", 20, 45);
        
        const summaryData = [
            ["Monto", `$ ${amount}`],
            ["Cuotas", `${installmentsNum}`],
            ["Frecuencia", frequency.toUpperCase()],
            ["Valor Cuota", quotaValue],
            ["Total a Pagar", totalValue]
        ];

        doc.autoTable({
            startY: 48,
            body: summaryData,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 1 },
            columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
        });

        // Cronograma de Pagos
        doc.setFont("helvetica", "bold");
        doc.text("CRONOGRAMA DE PAGOS ESTIMADO", 20, doc.lastAutoTable.finalY + 15);
        
        const tableBody = [];
        let currentDate = new Date();
        
        for (let i = 1; i <= installmentsNum; i++) {
            // Calcular fecha según frecuencia
            if (frequency === 'diario') currentDate.setDate(currentDate.getDate() + 1);
            else if (frequency === 'semanal') currentDate.setDate(currentDate.getDate() + 7);
            else if (frequency === 'quincenal') currentDate.setDate(currentDate.getDate() + 15);
            else if (frequency === 'mensual') currentDate.setMonth(currentDate.getMonth() + 1);
            else if (frequency === 'bimensual') currentDate.setMonth(currentDate.getMonth() + 2);
            else if (frequency === 'trimensual') currentDate.setMonth(currentDate.getMonth() + 3);

            tableBody.push([
                i,
                currentDate.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                quotaValue
            ]);
        }

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['N° Cuota', 'Fecha de Pago', 'Monto de Cuota']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [13, 110, 253], halign: 'center' },
            columnStyles: { 
                0: { halign: 'center' }, 
                1: { halign: 'center' }, 
                2: { halign: 'right' } 
            }
        });

        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text("* Este documento es una proyección automática y está sujeto a verificación crediticia.", 20, doc.lastAutoTable.finalY + 15);
        doc.text("* Los pagos deben realizarse en los canales autorizados informados por WhatsApp.", 20, doc.lastAutoTable.finalY + 20);
        
        // Abrir en nueva ventana en lugar de descargar
        const blobUrl = doc.output('bloburl');
        window.open(blobUrl, '_blank');
    };

    // Track Tab Visibility
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            trackEvent('pestaña_oculta');
        } else {
            trackEvent('pestaña_activa');
        }
    });

    // Track Scroll Depth
    let scrollLogged25 = false;
    let scrollLogged50 = false;
    let scrollLogged75 = false;
    let scrollLogged90 = false;
    window.addEventListener('scroll', () => {
        const scrolled = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
        if (scrolled > 0.25 && !scrollLogged25) {
            trackEvent('scroll_25');
            scrollLogged25 = true;
        }
        if (scrolled > 0.5 && !scrollLogged50) {
            trackEvent('scroll_50');
            scrollLogged50 = true;
        }
        if (scrolled > 0.75 && !scrollLogged75) {
            trackEvent('scroll_75');
            scrollLogged75 = true;
        }
        if (scrolled > 0.9 && !scrollLogged90) {
            trackEvent('scroll_90');
            scrollLogged90 = true;
        }
    });

    // Track Heatmap
    amountInput.addEventListener('click', () => trackEvent('click_input_monto'));
    amountRange.addEventListener('click', () => trackEvent('click_slider_monto'));
    installmentsSelect.addEventListener('click', () => trackEvent('click_select_cuotas'));
    frequencySelect.addEventListener('click', () => trackEvent('click_select_frecuencia'));

    // Track Time on Page
    window.addEventListener('beforeunload', () => {
        const timeSpent = Math.round((performance.now() - startTime) / 1000);
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
        let factor = 1;
        if (frequency === 'diario') factor = 1/30;
        else if (frequency === 'semanal') factor = 7/30;
        else if (frequency === 'quincenal') factor = 0.5;
        else if (frequency === 'mensual') factor = 1;
        else if (frequency === 'bimensual') factor = 2;
        else if (frequency === 'trimensual') factor = 3;
        
        const totalInterest = principal * monthlyRate * (installments * factor); 
        const total = principal + totalInterest;
        const installmentValue = total / installments;

        resInstallment.textContent = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(installmentValue);
        resTotal.textContent = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total);
        
        trackEvent('simulacion', { principal, installments, frequency });
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
