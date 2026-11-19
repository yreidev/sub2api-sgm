//go:build integration

package repository

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/ent/apikey"
	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/stretchr/testify/require"
)

func TestAssistantKeyLifecycle(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	client := integrationEntClient
	db := integrationDB

	group := mustCreateGroup(t, client, &service.Group{Name: "Auto", Platform: service.PlatformComposite, RateMultiplier: 1})
	owner := mustCreateUser(t, client, &service.User{Balance: 20})
	other := mustCreateUser(t, client, &service.User{})
	repo := NewAPIKeyRepository(client, db)
	svc := service.NewAPIKeyService(repo, NewUserRepository(client, db), NewGroupRepository(client, db),
		NewUserSubscriptionRepository(client), nil, nil, &config.Config{})

	legacy := &service.APIKey{UserID: owner.ID, GroupID: &group.ID, Name: "Assistant", Key: "sk-legacy-assistant-key", Status: service.StatusActive}
	require.NoError(t, repo.Create(ctx, legacy))

	unissued, err := svc.GetAssistantKey(ctx, owner.ID)
	require.NoError(t, err)
	require.Nil(t, unissued)

	const concurrentRequests = 6
	var keys [concurrentRequests]*service.APIKey
	var errs [concurrentRequests]error
	var wg sync.WaitGroup
	start := make(chan struct{})
	for i := range keys {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			keys[i], errs[i] = svc.EnsureAssistantKey(ctx, owner.ID, false)
		}()
	}
	close(start)
	wg.Wait()
	for _, err := range errs {
		require.NoError(t, err)
	}
	fixed := keys[0]
	readBack, err := svc.GetAssistantKey(ctx, owner.ID)
	require.NoError(t, err)
	require.Equal(t, fixed.Key, readBack.Key)
	unissued, err = svc.GetAssistantKey(ctx, other.ID)
	require.NoError(t, err)
	require.Nil(t, unissued)
	require.NotEqual(t, legacy.ID, fixed.ID)
	require.Equal(t, group.ID, *fixed.GroupID)
	require.Equal(t, "Assistant", fixed.Name)
	for _, got := range keys {
		require.Equal(t, fixed.ID, got.ID)
		require.Equal(t, fixed.Key, got.Key)
	}

	count, err := repo.CountByUserID(ctx, owner.ID)
	require.NoError(t, err)
	require.EqualValues(t, 2, count)

	_, err = svc.EnsureAssistantKey(ctx, other.ID, true)
	require.ErrorIs(t, err, service.ErrAssistantKeyBalance)
	require.NoError(t, repo.Create(ctx, &service.APIKey{UserID: other.ID, Name: "Existing", Key: "sk-other-existing-key", Status: service.StatusActive}))
	require.NoError(t, client.User.UpdateOneID(other.ID).SetBalance(10).Exec(ctx))
	unrelated, err := svc.EnsureAssistantKey(ctx, other.ID, false)
	require.NoError(t, err)
	require.NotEqual(t, fixed.Key, unrelated.Key)
	require.Equal(t, other.ID, unrelated.UserID)

	require.NoError(t, client.User.UpdateOneID(owner.ID).SetBalance(0).Exec(ctx))
	got, err := svc.EnsureAssistantKey(ctx, owner.ID, false)
	require.NoError(t, err)
	require.Equal(t, fixed.Key, got.Key)

	require.NoError(t, client.APIKey.UpdateOneID(fixed.ID).SetStatus("inactive").Exec(ctx))
	_, err = svc.EnsureAssistantKey(ctx, owner.ID, false)
	require.ErrorIs(t, err, service.ErrAssistantKeyStatus)

	require.NoError(t, repo.Delete(ctx, fixed.ID))
	_, err = svc.GetAssistantKey(ctx, owner.ID)
	require.ErrorIs(t, err, service.ErrAssistantKeyDeleted)
	_, err = svc.EnsureAssistantKey(ctx, owner.ID, false)
	require.ErrorIs(t, err, service.ErrAssistantKeyDeleted)
	_, err = svc.EnsureAssistantKey(ctx, owner.ID, true)
	require.ErrorIs(t, err, service.ErrAssistantKeyBalance)

	require.NoError(t, client.User.UpdateOneID(owner.ID).SetBalance(10).Exec(ctx))
	replacement, err := svc.EnsureAssistantKey(ctx, owner.ID, true)
	require.NoError(t, err)
	require.NotEqual(t, fixed.Key, replacement.Key)
	got, err = svc.EnsureAssistantKey(ctx, owner.ID, true)
	require.NoError(t, err)
	require.Equal(t, replacement.Key, got.Key)

	exists, err := client.APIKey.Query().Where(apikey.IDEQ(legacy.ID), apikey.KeyEQ(legacy.Key)).Exist(ctx)
	require.NoError(t, err)
	require.True(t, exists)
}
