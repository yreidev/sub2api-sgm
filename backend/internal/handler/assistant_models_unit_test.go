//go:build unit

package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/server/middleware"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

type assistantModelsGroupRepo struct {
	service.GroupRepository
	group service.Group
}

func (r assistantModelsGroupRepo) ListActive(context.Context) ([]service.Group, error) {
	return []service.Group{r.group}, nil
}

type assistantModelsSubscriptions struct {
	service.UserSubscriptionRepository
}

func (assistantModelsSubscriptions) ListActiveByUserID(context.Context, int64) ([]service.UserSubscription, error) {
	return nil, nil
}

func TestAssistantModelsListsChatModels(t *testing.T) {
	const groupID int64 = 42
	accounts := &gatewayModelsAccountRepoStub{byGroup: map[int64][]service.Account{
		groupID: {{ID: 1, Platform: service.PlatformOpenAI, Credentials: map[string]any{
			"model_mapping": map[string]any{"mapped-text": "text", "shared-text": "text", "alias-*": "wildcard", "gpt-image-1": "image", "codex-auto-demo": "text"},
		}}},
	}}
	routes := &gatewayModelsRouteRepoStub{routes: []service.CompositeModelRoute{
		{PublicModel: "responses-text", MatchType: service.CompositeRouteMatchExact, Endpoint: service.CompositeRouteEndpointResponses, Enabled: true},
		{PublicModel: "chat-text", MatchType: service.CompositeRouteMatchExact, Endpoint: service.CompositeRouteEndpointChatCompletions, Enabled: true},
		{PublicModel: "mapped-text", MatchType: service.CompositeRouteMatchExact, TargetPlatform: service.PlatformTypeSafe, Endpoint: service.CompositeRouteEndpointChatCompletions, Enabled: true},
		{PublicModel: "images-only", MatchType: service.CompositeRouteMatchExact, Endpoint: service.CompositeRouteEndpointImages, Enabled: true},
		{PublicModel: "system-only", MatchType: service.CompositeRouteMatchExact, TargetPlatform: service.PlatformTypeSafe, Enabled: true},
	}}
	for _, tc := range []struct {
		name       string
		allowlist  []string
		want       []string
		noCapacity bool
	}{
		{name: "Chat excludes SystemOne shadow, Responses aliases and media", want: []string{"codex-auto-demo", "shared-text", "chat-text"}},
		{name: "allowlist", allowlist: []string{"chat-text", "responses-text", "images-only"}, want: []string{"chat-text"}},
		{name: "allowlist without Chat models", allowlist: []string{"responses-text"}, want: []string{}},
		{name: "no capacity", noCapacity: true, want: []string{}},
		{name: "allowlist without capacity", allowlist: []string{"gpt-5"}, noCapacity: true, want: []string{}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			h := newGatewayModelsHandlerForTest(accounts, routes)
			if tc.noCapacity {
				nonChatRoutes := &gatewayModelsRouteRepoStub{routes: []service.CompositeModelRoute{
					{PublicModel: "responses-only", MatchType: service.CompositeRouteMatchExact, Endpoint: service.CompositeRouteEndpointResponses, Enabled: true},
					{PublicModel: "images-only", MatchType: service.CompositeRouteMatchExact, Endpoint: service.CompositeRouteEndpointImages, Enabled: true},
				}}
				h = newGatewayModelsHandlerForTest(&gatewayModelsAccountRepoStub{}, nonChatRoutes)
			}
			group := service.Group{ID: groupID, Name: "Auto", Platform: service.PlatformComposite, Status: service.StatusActive}
			group.ModelAllowlist = service.GroupModelAllowlist{Enabled: tc.allowlist != nil, Models: tc.allowlist}
			h.apiKeyService = service.NewAPIKeyService(nil, &userHandlerRepoStub{user: &service.User{ID: 1}},
				assistantModelsGroupRepo{group: group}, assistantModelsSubscriptions{}, nil, nil, nil)
			rec := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(rec)
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/keys/assistant/models", nil)
			c.Set(string(middleware.ContextKeyUser), middleware.AuthSubject{UserID: 1})
			h.AssistantModels(c)
			require.Equal(t, http.StatusOK, rec.Code)
			var body struct{ Data []string }
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
			require.Equal(t, tc.want, body.Data)
			if tc.noCapacity && tc.allowlist == nil {
				require.Equal(t, []string{"responses-only"}, h.codexModelIDsForGroup(c.Request.Context(), &group, ""))
				empty := newGatewayModelsHandlerForTest(&gatewayModelsAccountRepoStub{}, &gatewayModelsRouteRepoStub{})
				require.NotEmpty(t, empty.codexModelIDsForGroup(c.Request.Context(), &group, ""))
			}
		})
	}
}
