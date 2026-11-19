package service

import (
	"context"
	"errors"
	"fmt"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
)

var (
	ErrAssistantKeyBalance = infraerrors.Conflict("ASSISTANT_KEY_BALANCE_REQUIRED", "add balance before getting an assistant API key")
	ErrAssistantKeyDeleted = infraerrors.Conflict("ASSISTANT_KEY_DELETED", "the assistant API key was deleted")
	ErrAssistantKeyGroup   = infraerrors.Conflict("ASSISTANT_KEY_GROUP_UNAVAILABLE", "the assistant API key requires an available Auto group")
	ErrAssistantKeyStatus  = infraerrors.Conflict("ASSISTANT_KEY_INACTIVE", "the assistant API key is inactive")
	ErrAssistantKeyExpired = infraerrors.Conflict("ASSISTANT_KEY_EXPIRED", "the assistant API key has expired")
	ErrAssistantKeyQuota   = infraerrors.Conflict("ASSISTANT_KEY_QUOTA_EXHAUSTED", "the assistant API key has exhausted its quota")
)

type assistantKeyRepository interface {
	AssistantKeyID(context.Context, int64) (int64, error)
	WithAssistantKey(context.Context, int64, func(context.Context, int64, float64) (*APIKey, error)) (*APIKey, error)
}

func (s *APIKeyService) EnsureAssistantKey(ctx context.Context, userID int64, replaceDeleted bool) (*APIKey, error) {
	repo, ok := s.apiKeyRepo.(assistantKeyRepository)
	if !ok {
		return nil, fmt.Errorf("assistant key repository is unavailable")
	}
	auto, err := s.GetAssistantGroup(ctx, userID)
	if err != nil {
		return nil, err
	}

	var created bool
	key, err := repo.WithAssistantKey(ctx, userID, func(ctx context.Context, keyID int64, balance float64) (*APIKey, error) {
		if keyID != 0 {
			existing, err := s.getUsableAssistantKey(ctx, userID, keyID, auto)
			if err == nil {
				return existing, nil
			}
			if !errors.Is(err, ErrAPIKeyNotFound) {
				return nil, err
			}
			if !replaceDeleted {
				return nil, ErrAssistantKeyDeleted
			}
		}
		if balance <= 0 {
			return nil, ErrAssistantKeyBalance
		}
		if auto == nil {
			return nil, ErrAssistantKeyGroup
		}
		if err := s.checkAPIKeyCreateLimits(ctx, userID); err != nil {
			return nil, err
		}
		value, err := s.GenerateKey()
		if err != nil {
			return nil, fmt.Errorf("generate assistant key: %w", err)
		}
		key := &APIKey{UserID: userID, GroupID: &auto.ID, Name: "Assistant", Key: value, Status: StatusActive}
		if err := s.apiKeyRepo.Create(ctx, key); err != nil {
			return nil, fmt.Errorf("create assistant key for user %d: %w", userID, err)
		}
		created = true
		return key, nil
	})
	if err == nil && created {
		s.InvalidateAuthCacheByKey(ctx, key.Key)
	}
	return key, err
}

// GetAssistantKey reads the existing binding without allocating a credential.
func (s *APIKeyService) GetAssistantKey(ctx context.Context, userID int64) (*APIKey, error) {
	repo, ok := s.apiKeyRepo.(assistantKeyRepository)
	if !ok {
		return nil, fmt.Errorf("assistant key repository is unavailable")
	}
	id, err := repo.AssistantKeyID(ctx, userID)
	if err != nil || id == 0 {
		return nil, err
	}
	auto, err := s.GetAssistantGroup(ctx, userID)
	if err != nil {
		return nil, err
	}
	key, err := s.getUsableAssistantKey(ctx, userID, id, auto)
	if errors.Is(err, ErrAPIKeyNotFound) {
		return nil, ErrAssistantKeyDeleted
	}
	return key, err
}

func (s *APIKeyService) getUsableAssistantKey(ctx context.Context, userID, keyID int64, auto *Group) (*APIKey, error) {
	key, err := s.apiKeyRepo.GetByID(ctx, keyID)
	if err != nil {
		return nil, err
	}
	switch {
	case key.UserID != userID:
		return nil, ErrAPIKeyNotFound
	case key.IsExpired():
		return nil, ErrAssistantKeyExpired
	case key.IsQuotaExhausted():
		return nil, ErrAssistantKeyQuota
	case key.Status != StatusActive:
		return nil, ErrAssistantKeyStatus
	case auto == nil || key.GroupID == nil || *key.GroupID != auto.ID:
		return nil, ErrAssistantKeyGroup
	}
	return key, nil
}

// GetAssistantGroup resolves the available group used by the fixed assistant key.
func (s *APIKeyService) GetAssistantGroup(ctx context.Context, userID int64) (*Group, error) {
	groups, err := s.GetAvailableGroups(ctx, userID)
	if err != nil {
		return nil, err
	}
	for _, group := range groups {
		if group.Name == "Auto" && group.Platform == PlatformComposite && group.Status == StatusActive && !group.IsSubscriptionType() {
			return &group, nil
		}
	}
	return nil, nil
}
