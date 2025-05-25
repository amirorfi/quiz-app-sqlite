document.addEventListener('DOMContentLoaded', () => {
    const totalParticipantsElem = document.getElementById('total-participants');
    const avgSuccessRateElem = document.getElementById('avg-success-rate');
    const totalSubmissionsElem = document.getElementById('total-submissions');
    const resultsTbody = document.getElementById('results-tbody');
    const sortByRankButton = document.getElementById('sort-by-rank');

    let allSubmissionsData = []; // Store the fetched submissions

    // Helper to format time from seconds to "Xm Ys" or "Ys"
    function formatTime(totalSeconds) {
        if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) {
            return 'N/A';
        }
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }

    // Renders the submissions table
    function renderTable(submissionsToRender) {
        resultsTbody.innerHTML = ''; // Clear previous entries

        if (!submissionsToRender || submissionsToRender.length === 0) {
            resultsTbody.innerHTML = '<tr><td colspan="7">Aucune soumission pour le moment.</td></tr>';
            return;
        }

        submissionsToRender.forEach((sub, index) => {
            const row = resultsTbody.insertRow();
            row.insertCell().textContent = index + 1; // Rank
            // Prioritize fullName, then user_email, then 'N/A'
            row.insertCell().textContent = sub.fullName || sub.user_email || 'N/A';
            row.insertCell().textContent = sub.score !== undefined ? sub.score : 'N/A';
            row.insertCell().textContent = sub.totalQuestions !== undefined ? sub.totalQuestions : 'N/A';
            row.insertCell().textContent = sub.percentage !== undefined ? sub.percentage.toFixed(2) : 'N/A';
            row.insertCell().textContent = formatTime(sub.timeTaken);
            row.insertCell().textContent = sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' }) : 'N/A';
        });
    }

    // Sorts and then renders the table by rank (success DESC, time ASC)
    function sortAndRenderByRank() {
        if (!allSubmissionsData || allSubmissionsData.length === 0) {
            renderTable([]); // Render empty table correctly
            return;
        }
        const sorted = [...allSubmissionsData].sort((a, b) => {
            const percentageA = a.percentage !== undefined ? a.percentage : -1;
            const percentageB = b.percentage !== undefined ? b.percentage : -1;

            if (percentageB !== percentageA) {
                return percentageB - percentageA; // Higher percentage first
            }
            // Tie-breaker: timeTaken (lower is better)
            const timeA = (a.timeTaken === null || a.timeTaken === undefined) ? Infinity : a.timeTaken;
            const timeB = (b.timeTaken === null || b.timeTaken === undefined) ? Infinity : b.timeTaken;
            return timeA - timeB;
        });
        renderTable(sorted);
    }

    // Fetches analytics data from the server
    async function fetchAnalyticsData() {
        try {
            const response = await fetch('/api/dashboard-analytics');
            if (!response.ok) {
                throw new Error(`Erreur de chargement des données: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log("[Dashboard Client] Analytics data received:", data);

            totalParticipantsElem.textContent = data.totalParticipants !== undefined ? data.totalParticipants : 'Erreur';
            avgSuccessRateElem.textContent = data.averageSuccessRate !== undefined ? `${data.averageSuccessRate.toFixed(2)}%` : 'Erreur';
            totalSubmissionsElem.textContent = data.totalSubmissions !== undefined ? data.totalSubmissions : 'Erreur';
            
            allSubmissionsData = data.submissions || []; // Ensure it's an array
            sortAndRenderByRank(); // Initial sort and render

        } catch (error) {
            console.error("Erreur lors de la récupération des analytiques:", error);
            resultsTbody.innerHTML = `<tr><td colspan="7">Impossible de charger les données: ${error.message}</td></tr>`;
            totalParticipantsElem.textContent = 'Erreur';
            avgSuccessRateElem.textContent = 'Erreur';
            totalSubmissionsElem.textContent = 'Erreur';
        }
    }

    // Event Listeners
    if (sortByRankButton) {
        sortByRankButton.addEventListener('click', sortAndRenderByRank);
    }

    // Initial data fetch
    fetchAnalyticsData();
});