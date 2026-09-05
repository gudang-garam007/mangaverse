-- MangaVerse Oracle - Database Initialization

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    auth_provider VARCHAR(50) DEFAULT 'email',
    subscription_tier VARCHAR(20) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    daily_battles_used INT DEFAULT 0,
    daily_analyses_used INT DEFAULT 0,
    daily_conversions_used INT DEFAULT 0,
    daily_chat_messages INT DEFAULT 0,
    daily_theories_used INT DEFAULT 0,
    daily_whatifs_used INT DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Manga Table
CREATE TABLE IF NOT EXISTS manga (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mal_id INT UNIQUE,
    anilist_id INT UNIQUE,
    title VARCHAR(500) NOT NULL,
    title_english VARCHAR(500),
    title_japanese VARCHAR(500),
    author VARCHAR(200),
    artist VARCHAR(200),
    status VARCHAR(50),
    genres TEXT[],
    themes TEXT[],
    synopsis TEXT,
    cover_image_url TEXT,
    total_chapters INT,
    rating DECIMAL(3,2),
    popularity INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Characters Table
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anilist_id INT UNIQUE,
    name VARCHAR(200) NOT NULL,
    name_japanese VARCHAR(200),
    manga_id UUID REFERENCES manga(id) ON DELETE SET NULL,
    universe VARCHAR(100),
    role VARCHAR(50),
    personality TEXT,
    backstory TEXT,
    catchphrases TEXT[],
    image_url TEXT,
    gender VARCHAR(20),
    age VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    title VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Theories Table
CREATE TABLE IF NOT EXISTS theories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    manga_id UUID REFERENCES manga(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    theory_text TEXT NOT NULL,
    ai_verdict TEXT,
    plausibility_score INT,
    supporting_evidence JSONB,
    contradicting_evidence JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    upvotes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Generated Images Table
CREATE TABLE IF NOT EXISTS generated_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_image_url TEXT,
    generated_image_url TEXT,
    style VARCHAR(50),
    resolution VARCHAR(20),
    has_watermark BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    favorite_manga_ids UUID[],
    preferred_genres TEXT[],
    preferred_themes TEXT[],
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_manga_mal_id ON manga(mal_id);
CREATE INDEX IF NOT EXISTS idx_manga_anilist_id ON manga(anilist_id);
CREATE INDEX IF NOT EXISTS idx_characters_anilist_id ON characters(anilist_id);
CREATE INDEX IF NOT EXISTS idx_characters_universe ON characters(universe);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_theories_status ON theories(status);
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);