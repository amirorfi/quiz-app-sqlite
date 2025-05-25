-- Créer la table users (équivalent de votre table SQLite)
CREATE TABLE IF NOT EXISTS users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    email text NOT NULL UNIQUE,
    mobile text NOT NULL,
    signed_up_at timestamptz DEFAULT now()
);

-- Créer la table quiz_submissions (équivalent de votre table SQLite)
CREATE TABLE IF NOT EXISTS quiz_submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email text NOT NULL,
    score integer NOT NULL,
    total_questions integer NOT NULL,
    percentage decimal NOT NULL,
    time_taken integer,
    submitted_at timestamptz DEFAULT now(),
    FOREIGN KEY (user_email) REFERENCES users(email)
);

-- Activer Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité basiques (à ajuster selon vos besoins)
-- Permettre à tous de lire et insérer (vous pouvez être plus restrictif)
CREATE POLICY "Users can be created by anyone" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read their own data" ON users
    FOR SELECT USING (true);

CREATE POLICY "Quiz submissions can be created" ON quiz_submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Quiz submissions can be read" ON quiz_submissions
    FOR SELECT USING (true);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_email ON quiz_submissions(user_email);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_submitted_at ON quiz_submissions(submitted_at);
