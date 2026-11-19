ALTER TABLE users
    ADD COLUMN IF NOT EXISTS assistant_api_key_id BIGINT REFERENCES api_keys(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_assistant_api_key_id_unique
    ON users (assistant_api_key_id) WHERE assistant_api_key_id IS NOT NULL;
