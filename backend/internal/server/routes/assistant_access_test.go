package routes

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/Wei-Shaw/sub2api/internal/handler"
	"github.com/Wei-Shaw/sub2api/internal/server/middleware"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

type assistantPlazaSettingRepo struct {
	service.SettingRepository
	values map[string]string
}

func (r *assistantPlazaSettingRepo) GetValue(_ context.Context, key string) (string, error) {
	if value, ok := r.values[key]; ok {
		return value, nil
	}
	return "", service.ErrSettingNotFound
}

func (r *assistantPlazaSettingRepo) GetMultiple(_ context.Context, keys []string) (map[string]string, error) {
	out := make(map[string]string, len(keys))
	for _, key := range keys {
		if value, ok := r.values[key]; ok {
			out[key] = value
		}
	}
	return out, nil
}

func (r *assistantPlazaSettingRepo) SetMultiple(_ context.Context, values map[string]string) error {
	for key, value := range values {
		r.values[key] = value
	}
	return nil
}

type assistantPlazaUserRepo struct{ service.UserRepository }

func (assistantPlazaUserRepo) GetByID(_ context.Context, id int64) (*service.User, error) {
	return &service.User{ID: id, AllowedGroups: []int64{2}}, nil
}

type assistantPlazaSubRepo struct{ service.UserSubscriptionRepository }

func (assistantPlazaSubRepo) ListActiveByUserID(context.Context, int64) ([]service.UserSubscription, error) {
	return nil, nil
}

type assistantPlazaChannelRepo struct{ service.ChannelRepository }

func (assistantPlazaChannelRepo) ListAll(context.Context) ([]service.Channel, error) {
	return []service.Channel{{
		ID:       1,
		Name:     "plaza-channel",
		Status:   service.StatusActive,
		GroupIDs: []int64{1, 2, 3},
		ModelPricing: []service.ChannelModelPricing{{
			Platform: service.PlatformOpenAI,
			Models:   []string{"gpt-5"},
		}},
	}}, nil
}

type assistantPlazaGroupRepo struct{ service.GroupRepository }

func (assistantPlazaGroupRepo) ListActive(context.Context) ([]service.Group, error) {
	return []service.Group{
		{ID: 1, Name: "public-group", Platform: service.PlatformOpenAI, RateMultiplier: 1},
		{ID: 2, Name: "granted-exclusive", Platform: service.PlatformOpenAI, IsExclusive: true, RateMultiplier: 1},
		{ID: 3, Name: "hidden-exclusive", Platform: service.PlatformOpenAI, IsExclusive: true, RateMultiplier: 1},
	}, nil
}

func TestAssistantConsoleAccess(t *testing.T) {
	gin.SetMode(gin.TestMode)
	settings := service.NewSettingService(&assistantPlazaSettingRepo{values: map[string]string{}}, &config.Config{})
	require.NoError(t, settings.UpdateSettings(context.Background(), &service.SystemSettings{
		ModelPlazaEnabled:  true,
		BackendModeEnabled: false,
	}))
	t.Cleanup(func() {
		require.NoError(t, settings.UpdateSettings(context.Background(), &service.SystemSettings{
			ModelPlazaEnabled:  false,
			BackendModeEnabled: false,
		}))
	})

	h := mcpRouteHandlers()
	keys := service.NewAPIKeyService(
		&mcpRouteAPIKeyRepo{},
		assistantPlazaUserRepo{},
		nil,
		assistantPlazaSubRepo{},
		nil,
		nil,
		nil,
	)
	h.APIKey = handler.NewAPIKeyHandler(keys)
	h.Usage = handler.NewUsageHandler(nil, keys, nil, nil)
	h.ModelPlaza = handler.NewModelPlazaHandler(
		service.NewModelPlazaService(assistantPlazaChannelRepo{}, assistantPlazaGroupRepo{}, nil, nil, nil),
		keys,
		settings,
	)
	role := service.RoleUser
	signedIn := true
	auth := func(c *gin.Context) {
		if signedIn {
			c.Set(string(middleware.ContextKeyUserRole), role)
			c.Set(string(middleware.ContextKeyUser), middleware.AuthSubject{UserID: 7})
		}
		c.Next()
	}
	router := gin.New()
	v1 := router.Group("/api/v1")
	RegisterUserRoutes(v1, h, auth, mcpRouteNext, settings, nil)
	RegisterModelPlazaRoutes(v1, h, auth, settings, nil)
	handler.RegisterPageRoutes(v1, t.TempDir(), auth, auth, nil)
	request := func(method, path string) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(method, "/api/v1"+path, nil)
		req.Header.Set("auth_method", service.AuditAuthMethodMCPOAuth)
		router.ServeHTTP(w, req)
		return w
	}
	for _, path := range []string{
		"/keys", "/keys/9", "/groups/available", "/usage/dashboard/stats", "/usage/errors",
		"/redeem/history", "/subscriptions", "/channels/available", "/channel-monitors",
		"/channel-monitor-v2/users", "/user/aff", "/pages/demo",
	} {
		require.Equal(t, http.StatusForbidden, request(http.MethodGet, path).Code, path)
	}
	for _, path := range []string{"/keys", "/redeem", "/user/aff/transfer"} {
		require.Equal(t, http.StatusForbidden, request(http.MethodPost, path).Code, path)
	}
	require.Equal(t, http.StatusForbidden, request(http.MethodDelete, "/keys/9").Code)
	require.Equal(t, http.StatusForbidden, request(http.MethodPut, "/keys/9").Code)

	// Signed-in regular users can open Model Plaza and see public + authorized exclusive groups.
	plazaResp := request(http.MethodGet, "/model-plaza")
	require.Equal(t, http.StatusOK, plazaResp.Code, plazaResp.Body.String())
	require.Contains(t, plazaResp.Body.String(), "public-group")
	require.Contains(t, plazaResp.Body.String(), "granted-exclusive")
	require.NotContains(t, plazaResp.Body.String(), "hidden-exclusive")

	// An invalid filter reaches the personal handlers. It must never reach a repository.
	for _, path := range []string{"/usage", "/usage/stats"} {
		w := request(http.MethodGet, path+"?api_key_id=invalid")
		require.Equal(t, http.StatusBadRequest, w.Code, path)
		require.Contains(t, w.Body.String(), "Invalid api_key_id")
	}

	role = service.RoleAdmin
	w := request(http.MethodGet, "/keys/9")
	require.Equal(t, http.StatusOK, w.Code)
	require.Contains(t, w.Body.String(), "owner-key")
	require.Equal(t, http.StatusOK, request(http.MethodGet, "/model-plaza").Code)

	// Backend mode still blocks non-admin (regular and anonymous) callers on Model Plaza,
	// while keeping admin access working.
	require.NoError(t, settings.UpdateSettings(context.Background(), &service.SystemSettings{
		ModelPlazaEnabled:  true,
		BackendModeEnabled: true,
	}))
	role = service.RoleUser
	backendUserResp := request(http.MethodGet, "/model-plaza")
	require.Equal(t, http.StatusForbidden, backendUserResp.Code, backendUserResp.Body.String())
	require.Contains(t, backendUserResp.Body.String(), "Backend mode is active")

	signedIn = false
	backendAnonResp := request(http.MethodGet, "/model-plaza")
	require.Equal(t, http.StatusForbidden, backendAnonResp.Code, backendAnonResp.Body.String())
	require.Contains(t, backendAnonResp.Body.String(), "Backend mode is active")

	signedIn = true
	role = service.RoleAdmin
	backendAdminResp := request(http.MethodGet, "/model-plaza")
	require.Equal(t, http.StatusOK, backendAdminResp.Code, backendAdminResp.Body.String())
}
