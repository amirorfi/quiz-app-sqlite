const signupForm = document.getElementById('signupForm');
const messageDiv = document.getElementById('message');
const submitButton = document.getElementById('submitButton'); // Get the button

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageDiv.textContent = '';
    messageDiv.className = '';

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const mobile = document.getElementById('mobile').value;

    if (!fullName || !email || !mobile) {
        messageDiv.textContent = 'Veuillez remplir tous les champs.'; // French
        messageDiv.className = 'error';
        return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        messageDiv.textContent = 'Veuillez entrer une adresse e-mail valide.'; // French
        messageDiv.className = 'error';
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Inscription en cours...'; // French

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fullName, email, mobile }),
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.textContent = data.message + ' Redirection vers le quiz...'; // French
            messageDiv.className = 'success';
            localStorage.setItem('quizUserEmail', email);
            localStorage.setItem('quizUserName', fullName);

            setTimeout(() => {
                window.location.href = 'quiz.html';
            }, 2000);
        } else {
            messageDiv.textContent = data.message || 'Erreur lors de l\'inscription.'; // French
            messageDiv.className = 'error';
            submitButton.disabled = false;
            submitButton.textContent = 'Commencer le Quiz'; // French
        }
    } catch (error) {
        console.error("Error during signup:", error);
        messageDiv.textContent = 'Erreur réseau ou serveur indisponible. Veuillez réessayer.'; // French
        messageDiv.className = 'error';
        submitButton.disabled = false;
        submitButton.textContent = 'Commencer le Quiz'; // French
    }
});