document.addEventListener('DOMContentLoaded', () => {

    // CONFIGURAÇÃO DO SUPABASE
    const supabaseUrl = 'https://cpxcqupfldioxjeigdto.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNweGNxdXBmbGRpb3hqZWlnZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTg5NzMsImV4cCI6MjA3OTIzNDk3M30.kSgqM2H7omed_uTD3aL_xkAwfKv0FSXhRIwlTKs_WyQ';
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // VARIÁVEIS GLOBAIS
    const formContainer = document.getElementById('form-container');
    const resultContainer = document.getElementById('result-container');
    const btnBack = document.getElementById('btn-back');
    const progressBar = document.getElementById('progress-bar');
    const spotlightEl = document.getElementById('spotlight');
    const particlesContainer = document.getElementById('particles-container');

    let answers = {};
    let stepHistory = [1];
    let totalSteps = 4; 

    // NAVEGAÇÃO
    function showStep(stepId, direction = 'forward') {
        const stepToGo = String(stepId);
        let currentScreen = document.querySelector('.step-screen:not(.hidden)');
        let nextScreen = document.querySelector(`[data-step="${stepToGo}"]`);
        
        if (!nextScreen) return;

        if(direction === 'forward') {
            if (stepHistory[stepHistory.length - 1] !== stepId) {
                stepHistory.push(stepId);
            }
        }

        if (stepHistory.length > 1) {
            btnBack.classList.remove('hidden', 'opacity-0');
            btnBack.classList.add('animate-fade-in');
        } else {
            btnBack.classList.add('hidden', 'opacity-0');
            btnBack.classList.remove('animate-fade-in');
        }

        // Lógica da barra de progresso (3a, 3b, 3c, 3d contam como 75%)
        let progressIndex = 0;
        if (stepToGo === '1') progressIndex = 1;
        else if (stepToGo === '2') progressIndex = 2;
        else if (stepToGo.startsWith('3')) progressIndex = 3;
        else if (stepToGo === '4') progressIndex = 4;
        
        progressBar.style.width = `${(progressIndex / 4) * 100}%`;

        if (currentScreen) {
            const exitClass = (direction === 'forward') ? 'step-exit' : 'step-exit-reverse';
            currentScreen.classList.add(exitClass);
            
            setTimeout(() => {
                currentScreen.classList.add('hidden');
                currentScreen.classList.remove(exitClass);

                const enterClass = (direction === 'forward') ? 'step-enter' : 'step-enter-reverse';
                nextScreen.classList.remove('hidden');
                nextScreen.classList.add(enterClass);
                setTimeout(() => nextScreen.classList.remove(enterClass), 500);
            }, 400);
        } else {
             nextScreen.classList.remove('hidden');
             nextScreen.classList.add('step-enter');
             setTimeout(() => nextScreen.classList.remove('step-enter'), 500);
        }
    }

    // BOTÃO VOLTAR
    btnBack.addEventListener('click', () => {
        if (stepHistory.length <= 1) return;
        stepHistory.pop();
        const previousStepId = stepHistory[stepHistory.length - 1];
        const questionId = getQuestionIdFromStep(previousStepId);
        if (questionId) delete answers[questionId];
        const prevScreen = document.querySelector(`[data-step="${previousStepId}"]`);
        if (prevScreen) {
             prevScreen.querySelectorAll('.radio-option.selected').forEach(btn => btn.classList.remove('selected'));
        }
        showStep(previousStepId, 'backward');
    });

    // OPÇÕES (MÚLTIPLA ESCOLHA)
    document.querySelectorAll('.radio-option').forEach(button => {
        button.addEventListener('click', () => {
            const step = button.closest('.step-screen').dataset.step;
            const questionId = getQuestionIdFromStep(step);
            const value = button.dataset.value;
            
            if (questionId) answers[questionId] = value;

            button.closest('.step-screen').querySelectorAll('.radio-option').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            setTimeout(() => {
                if (button.dataset.submit) {
                    answers['decisao_final'] = value; 
                    handleSubmit();
                    return;
                }
                if (button.dataset.next) showStep(button.dataset.next, 'forward');
            }, 300);
        });
    });

    // CAMPO DE TEXTO (MEDO - 3b)
    const inputMedo = document.getElementById('input-medo');
    const btnNextMedo = document.getElementById('btn-next-medo');
    if(inputMedo && btnNextMedo) {
        inputMedo.addEventListener('input', () => { btnNextMedo.disabled = inputMedo.value.trim() === ""; });
        inputMedo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!btnNextMedo.disabled) btnNextMedo.click(); }
        });
        btnNextMedo.addEventListener('click', () => {
            answers['descricao_medo'] = inputMedo.value;
            showStep('4', 'forward');
        });
    }

    // CAMPO DE TEXTO (GERAL - 3c)
    const inputGeral = document.getElementById('input-desafio-geral');
    const btnNextGeral = document.getElementById('btn-next-geral');
    if(inputGeral && btnNextGeral) {
        inputGeral.addEventListener('input', () => { btnNextGeral.disabled = inputGeral.value.trim() === ""; });
        inputGeral.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!btnNextGeral.disabled) btnNextGeral.click(); }
        });
        btnNextGeral.addEventListener('click', () => {
            answers['desafio_geral'] = inputGeral.value;
            showStep('4', 'forward');
        });
    }

    // CAMPO DE TEXTO (NEGÓCIO - 3d - NOVO)
    const inputNegocio = document.getElementById('input-negocio');
    const btnNextNegocio = document.getElementById('btn-next-negocio');
    if(inputNegocio && btnNextNegocio) {
        inputNegocio.addEventListener('input', () => { btnNextNegocio.disabled = inputNegocio.value.trim() === ""; });
        inputNegocio.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!btnNextNegocio.disabled) btnNextNegocio.click(); }
        });
        btnNextNegocio.addEventListener('click', () => {
            answers['melhoria_negocio'] = inputNegocio.value;
            showStep('4', 'forward');
        });
    }
    
    // SUBMISSÃO
    async function handleSubmit() {
        spotlightEl.style.opacity = '1'; 
        await new Promise(r => setTimeout(r, 100));
        spotlightEl.style.clipPath = 'circle(0% at 50% 50%)';

        setTimeout(() => {
            formContainer.classList.add('hidden');
            progressBar.style.width = '100%';
        }, 200);

        // Salva na tabela V3
        try {
            const { error } = await supabaseClient.from('pesquisa_landing_page_v3').insert([answers]);
            if (error) throw error;
        } catch (error) { console.error("Erro Supabase:", error); }

        await new Promise(r => setTimeout(r, 1500));

        // Partículas
        particlesContainer.innerHTML = '';
        for (let i = 0; i < 80; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * window.innerWidth * 0.6 + 100;
            particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
            particle.style.left = '50%';
            particle.style.top = '50%';
            particlesContainer.appendChild(particle);
            setTimeout(() => particle.classList.add('animating'), Math.random() * 100);
        }

        await new Promise(r => setTimeout(r, 600));

        // LÓGICA DE RESULTADO
        const { idade, trabalho, decisao_final } = answers;
        let resultId;

        // 1. 100% Decidido -> Grupo Melhor
        if (decisao_final === 'totalmente-decidido') {
            resultId = 'result-vip_networking';
        } 
        // 2. Travado -> Verifica Perfil
        else { 
             // Perfil Jovem/Trabalhador OU Autonomo -> Grupo Melhor
             if (['15-17', '17-20', 'mais-20'].includes(idade) && ['jovem-aprendiz', 'clt', 'autonomo'].includes(trabalho)) {
                resultId = 'result-vip_networking';
             } else {
                 // Outros -> Grupo Normal
                resultId = 'result-geral';
             }
        }

        const resultCard = document.getElementById(resultId);
        resultContainer.classList.remove('hidden');
        resultCard.classList.remove('hidden');
        resultContainer.classList.add('glitch-enter');
        progressBar.style.width = '0%';
        
        setTimeout(() => {
            particlesContainer.innerHTML = '';
            spotlightEl.style.opacity = '0'; 
            spotlightEl.style.clipPath = 'circle(150% at 50% 50%)'; 
        }, 2000);
    }

    function getQuestionIdFromStep(step) {
        step = String(step);
        if (step === '1') return 'idade';
        if (step === '2') return 'trabalho';
        if (step === '3a') return 'tem_medo_trabalho';
        if (step === '3b') return 'descricao_medo';
        if (step === '3c') return 'desafio_geral';
        if (step === '3d') return 'melhoria_negocio'; // Nova
        if (step === '4') return 'decisao_final';
        return null;
    }

    showStep(1, 'forward');
});
