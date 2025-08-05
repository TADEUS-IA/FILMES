document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================
    // =================== ÁREA DE CONFIGURAÇÃO ESTRATÉGICA ==============
    // ===================================================================

    const webhookURL = 'http://localhost:5678/webhook-test/capturadeclientes';
    const finalRedirectURL = 'https://drive.google.com/file/d/1Fge73t1ZGBtqzNqGg84DO7uuGa7oX5fa/view?usp=sharing';
    const backgroundMusicPath = 'musica.mp3';

    const validationRegex = {
        name: /^[a-zA-ZáàãâéèêíìóòõôúùçÇÁÀÃÂÉÈÊÍÌÓÒÕÔÚÙ\s'-]{3,}$/,
        phone: /^\(?(?:[1-9][0-9])\)?\s?9?\d{4,5}-?\d{4}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    };
    
    const journey = [
        { type: 'multiple-choice', name: "etapa_1_engajamento", image: "imagem01.jpg", options: [ { text: "Perco clientes por demora", value: 2 }, { text: "Meu processo é manual", value: 1 }, { text: "Estou apenas curioso", value: 0 } ] },
        { type: 'text-input', name: 'nome', image: 'imagem02.jpg', question: 'Entendido. Para continuarmos, qual seu nome?', validation: validationRegex.name },
        { type: 'text-input', name: 'email', image: 'imagem03.jpg', question: 'Obrigado. Agora, seu melhor e-mail.', validation: validationRegex.email },
        { type: 'text-input', name: 'telefone', image: 'imagem04.jpg', question: 'Perfeito. E para finalizar, seu telefone.', validation: validationRegex.phone },
        { type: 'multiple-choice', name: "etapa_2_solucao", image: "imagem05.jpg", options: [ { text: "Preciso automatizar agora", value: 2 }, { text: "Quero mais eficiência", value: 1 }, { text: "Tenho medo de robôs", value: 0 } ] },
        { type: 'multiple-choice', name: "etapa_3_disponibilidade", image: "imagem06.jpg", options: [ { text: "Quero atender 24/7", value: 2 }, { text: "Atendo em horário comercial", value: 1 }, { text: "Meu público é específico", value: 0 } ] },
        { type: 'multiple-choice', name: "etapa_4_investimento", image: "imagem07.jpg", options: [ { text: "Investir para escalar", value: 2 }, { text: "Busco custo-benefício", value: 1 }, { text: "Quero algo gratuito", value: 0 } ] },
        { type: 'multiple-choice', name: "etapa_5_implementacao", image: "imagem08.jpg", options: [ { text: "Quero começar hoje", value: 2 }, { text: "Preciso de ajuda para iniciar", value: 1 }, { text: "Parece complicado", value: 0 } ] },
        { type: 'multiple-choice', name: "etapa_6_concorrencia", image: "imagem09.jpg", options: [ { text: "Quero estar à frente", value: 2 }, { text: "Acompanho o mercado", value: 1 }, { text: "Não me comparo", value: 0 } ] },
        { type: 'multiple-choice', name: "etapa_7_decisao", image: "imagem10.jpg", options: [ { text: "Vamos iniciar a parceria", value: 2 }, { text: "Preciso de mais detalhes", value: 1 }, { text: "Vou pensar a respeito", value: 0 } ] }
    ];
    
    // ======================= FIM DA CONFIGURAÇÃO =======================

    const ui = {
        interactionContainer: document.getElementById('interaction-container'),
        messageContainer: document.getElementById('message-container'),
        optionsContainer: document.getElementById('options-container'),
        inputArea: document.getElementById('input-area'),
        userInput: document.getElementById('user-input'),
        imageBg1: document.getElementById('image-bg-1'),
        imageBg2: document.getElementById('image-bg-2'),
        backgroundMusic: document.getElementById('background-music'),
        backBtn: document.getElementById('back-btn'),
        audioBtn: document.getElementById('audio-btn'),
    };

    let appState = 'JOURNEY';
    let currentStepIndex = 0;
    let userAnswers = {};
    let isProcessing = false;
    let activeImage = ui.imageBg1;
    let inactiveImage = ui.imageBg2;

    const updateImage = (newSrc) => {
        return new Promise((resolve) => {
            if (!newSrc || activeImage.src.endsWith(newSrc)) return resolve();
            inactiveImage.src = newSrc;
            const listener = () => {
                activeImage.classList.remove('active');
                inactiveImage.classList.add('active');
                [activeImage, inactiveImage] = [inactiveImage, activeImage];
                inactiveImage.removeEventListener('load', listener);
                resolve();
            };
            inactiveImage.addEventListener('load', listener);
            inactiveImage.onerror = () => {
                console.error(`Erro ao carregar imagem: ${newSrc}`);
                inactiveImage.removeEventListener('load', listener);
                resolve();
            };
        });
    };
    
    const renderStep = async () => {
        if (currentStepIndex >= journey.length) {
            finishJourney();
            return;
        }
        isProcessing = true;
        appState = 'JOURNEY';
        const currentStep = journey[currentStepIndex];

        ui.backBtn.style.display = currentStepIndex > 0 ? 'flex' : 'none';
        ui.audioBtn.style.display = 'flex';
        
        await updateImage(currentStep.image);
        
        ui.messageContainer.innerHTML = '';
        ui.optionsContainer.innerHTML = '';
        ui.inputArea.style.display = 'none';

        if (currentStep.type === 'text-input') {
            ui.inputArea.style.display = 'block';
            ui.userInput.value = userAnswers[currentStep.name] || '';
            ui.userInput.classList.remove('error');
            ui.userInput.focus();
            const msgEl = document.createElement('div');
            msgEl.className = 'bot-message';
            msgEl.textContent = currentStep.question;
            ui.messageContainer.appendChild(msgEl);
        } else if (currentStep.type === 'multiple-choice') {
            currentStep.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'option-btn';
                button.textContent = option.text;
                button.style.animationDelay = `${index * 100}ms`;
                button.onclick = () => handleChoice(option, currentStep.name);
                ui.optionsContainer.appendChild(button);
            });
        }
        
        setTimeout(() => isProcessing = false, 200);
    };

    const handleTextInput = () => {
        if (isProcessing) return;
        const currentStep = journey[currentStepIndex];
        const answer = ui.userInput.value.trim();

        if (currentStep.validation && !currentStep.validation.test(answer)) {
            ui.userInput.classList.add('error');
            setTimeout(() => ui.userInput.classList.remove('error'), 500);
            return;
        }
        
        isProcessing = true;
        userAnswers[currentStep.name] = answer;
        currentStepIndex++;
        renderStep();
    };
    
    const handleChoice = (option, stepName) => {
        if (isProcessing) return;
        isProcessing = true;
        userAnswers[stepName] = { text: option.text, value: option.value };
        currentStepIndex++;
        renderStep();
    };

    const goBack = () => {
        if (isProcessing || currentStepIndex === 0) return;
        isProcessing = true;
        currentStepIndex--;
        const previousStep = journey[currentStepIndex];
        delete userAnswers[previousStep.name];
        renderStep();
    };

    const classifyLead = () => {
        const score = Object.values(userAnswers)
            .filter(answer => typeof answer === 'object' && typeof answer.value === 'number')
            .reduce((sum, answer) => sum + answer.value, 0);
        if (score >= 10) return "Quente";
        if (score >= 5) return "Morno";
        return "Frio";
    };

    const finishJourney = async () => {
        isProcessing = true;
        appState = 'FINISHED';

        // Pausa a música de fundo imediatamente
        ui.backgroundMusic.pause();

        // Oculta os elementos da interface antiga
        ui.inputArea.style.display = 'none';
        ui.optionsContainer.innerHTML = '';
        activeImage.classList.remove('active');
        inactiveImage.classList.remove('active');
        ui.backBtn.style.display = 'none';
        ui.audioBtn.style.display = 'none';
        ui.messageContainer.innerHTML = '';
        
        // Monta e envia o payload para o webhook
        const payload = {
            nome: userAnswers.nome,
            email: userAnswers.email,
            telefone: userAnswers.telefone,
            classificacao_final: classifyLead()
        };
        journey.forEach(step => {
            if(step.type === 'multiple-choice' && userAnswers[step.name]) {
                payload[step.name] = userAnswers[step.name].text;
            }
        });
        
        try {
            await fetch(webhookURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log('Dados enviados com sucesso para o webhook!');
        } catch (error) {
            console.error('Falha ao enviar dados:', error);
        }

        // --- TELA DE CARREGAMENTO FINAL APENAS COM O VÍDEO ---

        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'loading-screen-container';
        
        // Cria apenas o vídeo, sem mensagem ou barra de progresso
        loadingScreen.innerHTML = `<video src="loading-video.mp4" id="final-loading-video" class="loading-video" loop playsinline></video>`;

        ui.interactionContainer.appendChild(loadingScreen);

        // Pega o vídeo que acabamos de criar
        const finalVideo = document.getElementById('final-loading-video');

        // Tenta tocar o vídeo com som. Se o navegador bloquear, toca sem som.
        const playPromise = finalVideo.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Autoplay com som bloqueado pelo navegador. Tocando sem som.", error);
                finalVideo.muted = true;
                finalVideo.play();
            });
        }

        // Mantém o timer de 30 segundos para o redirecionamento
        const totalDuration = 30;
        setTimeout(() => {
            window.location.href = finalRedirectURL;
        }, totalDuration * 1000);
    };
    
    const openFullscreen = () => {
        const elem = document.documentElement;
        if (document.fullscreenElement) return;

        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => console.error(`Erro ao tentar entrar em tela cheia: ${err.message}`));
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }
    };
    
    const init = async () => {
        if (backgroundMusicPath) {
            ui.backgroundMusic.src = backgroundMusicPath;
            ui.backgroundMusic.volume = 0.2;
        }
        
        const imageSources = journey.map(step => step.image).filter(Boolean);
        const imagePromises = imageSources.map(src => new Promise((resolve) => {
            const img = new Image(); img.src = src; img.onload = resolve; img.onerror = resolve;
        }));
        await Promise.all(imagePromises);
        
        activeImage.src = journey[0].image;
        await new Promise(resolve => setTimeout(resolve, 10));
        activeImage.classList.add('active');
        
        ui.interactionContainer.classList.add('visible');
        renderStep();
    };
    
    ui.userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleTextInput();
    });
    
    ui.backBtn.addEventListener('click', goBack);

    ui.audioBtn.addEventListener('click', () => {
        const music = ui.backgroundMusic;
        if (music.paused) {
            music.play().catch(() => {});
            ui.audioBtn.classList.remove('muted');
        } else {
            music.pause();
            ui.audioBtn.classList.add('muted');
        }
    });
    
    document.body.addEventListener('click', () => {
        if (ui.backgroundMusic.paused && appState !== 'FINISHED') {
             ui.backgroundMusic.play().catch(() => {});
             ui.audioBtn.classList.remove('muted');
        }
        openFullscreen();
    }, { once: true });
    
    init();
});