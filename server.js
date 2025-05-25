const express = require('express');
const path = require('path');
const db = require('./database.js'); // Assumes database.js is correctly set up

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Quiz Questions Data ---
const questions = [
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

// --- API Endpoints ---

app.post('/api/signup', (req, res) => {
    console.log("[API /api/signup] Request Body:", req.body);
    const { fullName, email, mobile } = req.body;
    if (!fullName || !email || !mobile) {
        return res.status(400).json({ message: "Tous les champs sont requis." });
    }
    const sql = 'INSERT INTO users (fullName, email, mobile) VALUES (?, ?, ?)';
    db.run(sql, [fullName, email, mobile], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed: users.email")) {
                return res.status(409).json({ message: "Cet e-mail existe déjà." });
            }
            console.error("[API /api/signup] DB Error:", err.message);
            return res.status(500).json({ message: "Erreur lors de l'inscription." });
        }
        res.status(201).json({ message: "Inscription réussie!", userId: this.lastID });
    });
});

app.post('/api/submit-quiz', (req, res) => {
    console.log("[API /api/submit-quiz] Request Body:", JSON.stringify(req.body, null, 2));
    const { userEmail, userAnswers, timeTaken } = req.body;
    if (!userEmail || !userAnswers || !Array.isArray(userAnswers)) {
        return res.status(400).json({ message: "Données de soumission invalides." });
    }

    let score = 0;
    userAnswers.forEach(ans => {
        const question = questions.find(q => q.id === ans.questionId);
        if (question && typeof ans.selectedOriginalOptionIndex === 'number' && ans.selectedOriginalOptionIndex === question.answer) {
            score++;
        }
    });

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const sql = 'INSERT INTO quiz_submissions (user_email, score, totalQuestions, percentage, timeTaken) VALUES (?, ?, ?, ?, ?)';
    db.run(sql, [userEmail, score, totalQuestions, percentage, timeTaken], function (err) {
        if (err) {
            console.error("[API /api/submit-quiz] DB Error:", err.message);
            return res.status(500).json({ message: "Erreur d'enregistrement des résultats." });
        }
        res.status(201).json({
            message: "Quiz soumis avec succès!",
            submissionId: this.lastID,
            score, totalQuestions, percentage: parseFloat(percentage.toFixed(2))
        });
    });
});

app.get('/api/dashboard-analytics', (req, res) => {
    console.log("[API /api/dashboard-analytics] Fetching analytics...");
    const analytics = {
        totalParticipants: 0,
        totalSubmissions: 0,
        averageSuccessRate: 0,
        submissions: []
    };

    const countParticipantsSql = "SELECT COUNT(DISTINCT email) as participantCount FROM users";
    // Ensure u.fullName is selected and the JOIN is correct
    const submissionsSql = `
        SELECT 
            qs.user_email, 
            u.fullName, 
            qs.score, 
            qs.totalQuestions, 
            qs.percentage, 
            qs.timeTaken, 
            qs.submittedAt
        FROM quiz_submissions qs
        JOIN users u ON qs.user_email = u.email 
        ORDER BY qs.percentage DESC, qs.timeTaken ASC
    `;

    db.get(countParticipantsSql, [], (err, participantRow) => {
        if (err) {
            console.error("[API /api/dashboard-analytics] DB Error (participants count):", err.message);
            return res.status(500).json({ message: "Erreur serveur (comptage participants)." });
        }
        analytics.totalParticipants = participantRow ? participantRow.participantCount : 0;

        db.all(submissionsSql, [], (err, submissionRows) => {
            if (err) {
                console.error("[API /api/dashboard-analytics] DB Error (submissions list):", err.message);
                return res.status(500).json({ message: "Erreur serveur (liste soumissions)." });
            }
            
            // Log the raw rows to verify fullName is present
            // console.log("[API /api/dashboard-analytics] Raw submission rows from DB:", JSON.stringify(submissionRows, null, 2));

            analytics.submissions = submissionRows || [];
            analytics.totalSubmissions = analytics.submissions.length;

            if (analytics.totalSubmissions > 0) {
                const totalPercentageSum = analytics.submissions.reduce((sum, sub) => sum + (sub.percentage || 0), 0);
                analytics.averageSuccessRate = totalPercentageSum / analytics.totalSubmissions;
            } else {
                analytics.averageSuccessRate = 0;
            }
            
            console.log("[API /api/dashboard-analytics] Sending analytics. Participants:", analytics.totalParticipants, "Submissions:", analytics.totalSubmissions);
            res.json(analytics);
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Serving static files from: ${path.join(__dirname, 'public')}`);
});