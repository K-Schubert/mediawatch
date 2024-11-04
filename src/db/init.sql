CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    link TEXT NOT NULL UNIQUE,
    author TEXT NOT NULL,
    title TEXT,
    topic TEXT,
    abstract TEXT,
    html TEXT,
    text TEXT,
    published_date TIMESTAMP,
    modified_date TIMESTAMP,
    membership TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    language VARCHAR(2) DEFAULT 'fr'
);

CREATE OR REPLACE FUNCTION update_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_data_modified_at
BEFORE UPDATE ON articles
FOR EACH ROW
EXECUTE FUNCTION update_modified_at();

-- INSERT INTO articles (source, link, author, title, topic, abstract, html, text, published_date, language) VALUES
-- ('EXAMPLE SOURCE', 'https://example.html', 'EXAMPLE AUTHOR', 'EXAMPLE TITLE', 'EXAMPLE TOPIC', 'EXAMPLE ABSTRACT', 'EXAMPLE HTML', 'EXAMPLE TEXT',
-- '01-01-2001 HH:MM:SS', 'fr');