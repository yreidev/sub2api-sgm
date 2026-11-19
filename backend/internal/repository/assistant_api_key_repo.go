package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	dbent "github.com/Wei-Shaw/sub2api/ent"
	"github.com/Wei-Shaw/sub2api/internal/service"
)

func (r *apiKeyRepository) WithAssistantKey(ctx context.Context, userID int64, resolve func(context.Context, int64, float64) (*service.APIKey, error)) (*service.APIKey, error) {
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin assistant key transaction: %w", err)
	}
	defer func() { _ = tx.Rollback() }()
	client := tx.Client()
	var existingID int64
	var balance float64
	// The row lock serializes allocation across app instances, including when no binding exists.
	err = scanSingleRow(ctx, client, `
		SELECT COALESCE(assistant_api_key_id, 0), balance
		FROM users WHERE id = $1 AND deleted_at IS NULL FOR NO KEY UPDATE`, []any{userID}, &existingID, &balance)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, service.ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("lock assistant key binding for user %d: %w", userID, err)
	}
	key, err := resolve(dbent.NewTxContext(ctx, tx), existingID, balance)
	if err != nil {
		return nil, err
	}
	if key.ID != existingID {
		if _, err := client.ExecContext(ctx, `UPDATE users SET assistant_api_key_id = $1 WHERE id = $2`, key.ID, userID); err != nil {
			return nil, fmt.Errorf("bind assistant key for user %d: %w", userID, err)
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit assistant key binding for user %d: %w", userID, err)
	}
	return key, nil
}

func (r *apiKeyRepository) AssistantKeyID(ctx context.Context, userID int64) (int64, error) {
	var id int64
	err := scanSingleRow(ctx, r.client, `SELECT COALESCE(assistant_api_key_id, 0)
		FROM users WHERE id = $1 AND deleted_at IS NULL`, []any{userID}, &id)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, service.ErrUserNotFound
	}
	if err != nil {
		return 0, fmt.Errorf("read assistant key binding for user %d: %w", userID, err)
	}
	return id, nil
}
