document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const quizContainer = document.getElementById('quiz-container');
    const quizForm = document.getElementById('quizForm');
    const resultContainer = document.getElementById('result-container');
    const timerDisplay = document.getElementById('time');
    const submitButton = document.getElementById('submitQuiz');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const quizActiveView = document.getElementById('quiz-active-view');

    // Quiz Configuration
    const QUIZ_TIME_SECONDS = 600; // 10 questions * 60 seconds
    let timeLeft = QUIZ_TIME_SECONDS;
    let timerInterval;
    let startTime;

    // Source of truth for questions - should match server.js
    const originalQuestionsData = [
        { id: 1, question: "Selon la présentation, quelle est la définition d'une urgence hypertensive (UH) ?", options: ["Une PA >180/110 mmHg traitée par repos au lit uniquement.", "Des valeurs très élevées de la PA associées à des signes de souffrance aiguë des organes cibles, requérant une baisse immédiate de la PA.", "Une pression artérielle (PA) très élevée sans symptômes spécifiques."], answer: 1 },
        { id: 2, question: "Quel est l'un des principaux éléments diagnostiques de l'HTA maligne mentionné ?", options: ["La présence d'une rétinopathie hypertensive grade III ou IV.", "Une fréquence cardiaque supérieure à 120 bpm.", "Une anxiété sévère concomitante."], answer: 0 },
        { id: 3, question: "Parmi les propositions suivantes, laquelle liste correctement des organes cibles de l'hypertension artérielle ?", options: ["Estomac, intestins, peau.", "Poumons, foie, rate.", "Rétine, cerveau, cœur, rein, artères."], answer: 2 },
        { id: 4, question: "Quelle est la principale différence entre une \"urgence hypertensive\" et une \"HTA sévère\" simple ?", options: ["L'urgence hypertensive implique une atteinte aiguë des organes cibles.", "Le niveau de pression artérielle uniquement.", "L'HTA sévère nécessite toujours un traitement intraveineux immédiat."], answer: 0 },
        { id: 5, question: "Quel est l'objectif général de baisse tensionnelle (<15% 1ère h, <25% 2ème h) dans une urgence hypertensive ?", options: ["Normaliser la PA à <120/80 mmHg en 30 minutes.", "Atteindre une PA cible en 24-48h après la baisse initiale.", "Une baisse de la PA moyenne d'environ 50% dans la première heure."], answer: 1 },
        { id: 6, question: "Quel examen est \"NÉCESSAIRE et SUFFISANT\" pour le diagnostic de rétinopathie dans l'HTA maligne ?", options: ["L'ionogramme sanguin.", "L'échocardiographie.", "Le fond d'œil."], answer: 2 },
        { id: 7, question: "En cas d'encéphalopathie hypertensive, que doit-on faire AVANT de baisser la PA ?", options: ["Administrer des diurétiques en urgence.", "Initier une thrombolyse systématique.", "Réaliser une TDM ou IRM cérébrale pour éliminer un AVC."], answer: 2 },
        { id: 8, question: "Pour une \"poussée hypertensive\" (HTA sévère sans atteinte d'organe), la présentation suggère :", options: ["Un traitement ambulatoire avec repos et surveillance.", "Une hospitalisation systématique avec traitement IV.", "L'utilisation de nifédipine à courte durée d'action en première intention."], answer: 0 },
        { id: 9, question: "Pour une dissection aortique, l'objectif thérapeutique immédiat est une PAS < 120 mmHg et une FC < ?", options: ["80 bpm", "70 bpm", "60 bpm"], answer: 2 },
        { id: 10, question: "Quel est le traitement de choix pour l'éclampsie ou la prééclampsie sévère ?", options: ["Labétalol ou Nicardipine et Sulfate de magnésium", "Nitroprussiate de sodium", "Uniquement des diurétiques à forte dose"], answer: 0 }
    ];

    let questionsForDisplay = []; // To store questions with shuffled options

    // --- Helper Functions ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function prepareQuestionsForDisplay() {
        questionsForDisplay = originalQuestionsData.map(q => {
            const indexedOptions = q.options.map((text, originalIndex) => ({ text, originalIndex }));
            const shuffledOptions = shuffleArray([...indexedOptions]);
            return { ...q, shuffledOptions }; // Add shuffledOptions to the question object
        });
    }

    // --- Rendering Functions ---
    function renderQuestions() {
        quizContainer.innerHTML = ''; // Clear previous questions
        questionsForDisplay.forEach((q_display, questionIndex) => {
            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block';

            const questionTextElem = document.createElement('p');
            questionTextElem.className = 'question-text';
            questionTextElem.textContent = `${questionIndex + 1}. ${q_display.question}`;
            questionBlock.appendChild(questionTextElem);

            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'options';

            q_display.shuffledOptions.forEach((optionObj) => {
                const label = document.createElement('label');
                const inputElement = document.createElement('input');
                inputElement.type = 'radio'; // Using radio for single-choice logic
                inputElement.name = `question${q_display.id}`;
                inputElement.value = optionObj.originalIndex; // Value is the original index
                inputElement.required = true;

                inputElement.addEventListener('change', () => {
                    document.querySelectorAll(`input[name="question${q_display.id}"]`).forEach(rb => {
                        rb.parentElement.classList.remove('selected');
                    });
                    if (inputElement.checked) {
                        label.classList.add('selected');
                    }
                });

                label.appendChild(inputElement);
                label.appendChild(document.createTextNode(` ${optionObj.text}`));
                optionsDiv.appendChild(label);
            });
            questionBlock.appendChild(optionsDiv);
            quizContainer.appendChild(questionBlock);
        });
    }

    // --- Timer Functions ---
    function startTimer() {
        startTime = Date.now();
        timeLeft = QUIZ_TIME_SECONDS;
        updateTimerDisplay();
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerDisplay.textContent = "Temps écoulé !";
                handleQuizSubmission(true);
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // --- Quiz Submission ---
    async function handleQuizSubmission(isTimeUp = false) {
        clearInterval(timerInterval);
        submitButton.disabled = true;
        submitButton.textContent = 'Soumission...';

        const userEmail = localStorage.getItem('quizUserEmail');
        if (!userEmail) {
            showErrorResult("Utilisateur non identifié. Impossible de soumettre le quiz.");
            return;
        }

        const userAnswersPayload = [];
        let allQuestionsAnswered = true;

        questionsForDisplay.forEach(q_display => {
            const selectedRadio = document.querySelector(`input[name="question${q_display.id}"]:checked`);
            if (selectedRadio) {
                userAnswersPayload.push({
                    questionId: q_display.id,
                    selectedOriginalOptionIndex: parseInt(selectedRadio.value)
                });
            } else {
                allQuestionsAnswered = false;
                userAnswersPayload.push({
                    questionId: q_display.id,
                    selectedOriginalOptionIndex: null
                });
            }
        });

        if (!allQuestionsAnswered && !isTimeUp) {
            alert("Veuillez répondre à toutes les questions avant de soumettre.");
            submitButton.disabled = false;
            submitButton.textContent = 'Soumettre le Quiz';
            return;
        }

        const timeTaken = QUIZ_TIME_SECONDS - timeLeft;
        console.log("[Client] Submitting quiz. Payload:", JSON.stringify({ userEmail, userAnswers: userAnswersPayload, timeTaken }, null, 2));

        try {
            const response = await fetch('/api/submit-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail, userAnswers: userAnswersPayload, timeTaken }),
            });

            console.log("[Client] Fetch response status:", response.status);
            const data = await response.json();
            console.log("[Client] Fetch response data:", data);

            showQuizResults(data, response.ok, timeTaken);

        } catch (error) {
            console.error("[Client] Fetch error during quiz submission:", error);
            showErrorResult("Erreur Réseau. Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet et réessayer.");
        }
    }

    function showQuizResults(data, isSuccess, timeTaken) {
        quizActiveView.style.display = 'none';
        resultContainer.style.display = 'block';

        if (isSuccess) {
            resultContainer.innerHTML = `
                <h2>Quiz Terminé !</h2>
                <p><strong>Score Officiel :</strong> ${data.score} / ${data.totalQuestions}</p>
                <p><strong>Pourcentage :</strong> ${data.percentage}%</p>
                <p><strong>Temps Pris :</strong> ${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s</p>
                <p class="thank-you-message">Merci d'avoir participé !</p>
                <button onclick="window.location.href='index.html'">Retour à l'inscription</button>`;
        } else {
            resultContainer.innerHTML = `
                <h2>Erreur de Soumission</h2>
                <p class="error">Impossible de soumettre votre quiz : ${data.message || 'Erreur serveur inconnue'}</p>
                <button onclick="window.location.href='quiz.html'">Réessayer</button>`;
        }
    }
    function showErrorResult(message) {
        quizActiveView.style.display = 'none';
        resultContainer.style.display = 'block';
        resultContainer.innerHTML = `
            <h2>Erreur</h2>
            <p class="error">${message}</p>
            <button onclick="window.location.href='quiz.html'">Réessayer</button>`;
    }


    // --- Initial Page Setup ---
    function initializeQuizPage() {
        const userEmail = localStorage.getItem('quizUserEmail');
        const userName = localStorage.getItem('quizUserName');

        if (!userEmail) {
            alert('Informations utilisateur non trouvées. Veuillez vous inscrire d\'abord.');
            window.location.href = 'index.html';
            return;
        }
        userNameDisplay.textContent = userName || 'Utilisateur';

        quizActiveView.style.display = 'block';
        resultContainer.style.display = 'none';

        prepareQuestionsForDisplay();
        renderQuestions();
        startTimer();

        quizForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleQuizSubmission();
        });
    }

    initializeQuizPage();
});