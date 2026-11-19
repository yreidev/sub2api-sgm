package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/handler"
	"github.com/Wei-Shaw/sub2api/internal/server/middleware"
	"github.com/Wei-Shaw/sub2api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestAssistantConsoleAccess(t *testing.T) {
	h := mcpRouteHandlers()
	keys := service.NewAPIKeyService(&mcpRouteAPIKeyRepo{}, nil, nil, nil, nil, nil, nil)
	h.APIKey = handler.NewAPIKeyHandler(keys)
	h.Usage = handler.NewUsageHandler(nil, keys, nil, nil)
	h.ModelPlaza = handler.NewModelPlazaHandler(nil, nil, nil)
	role := service.RoleUser
	auth := func(c *gin.Context) {
		c.Set(string(middleware.ContextKeyUserRole), role)
		c.Set(string(middleware.ContextKeyUser), middleware.AuthSubject{UserID: 7})
		c.Next()
	}
	router := gin.New()
	v1 := router.Group("/api/v1")
	RegisterUserRoutes(v1, h, auth, mcpRouteNext, nil, nil)
	RegisterModelPlazaRoutes(v1, h, auth, nil, nil)
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
		"/channel-monitor-v2/users", "/user/aff", "/pages/demo", "/model-plaza",
	} {
		require.Equal(t, http.StatusForbidden, request(http.MethodGet, path).Code, path)
	}
	for _, path := range []string{"/keys", "/redeem", "/user/aff/transfer"} {
		require.Equal(t, http.StatusForbidden, request(http.MethodPost, path).Code, path)
	}
	require.Equal(t, http.StatusForbidden, request(http.MethodDelete, "/keys/9").Code)
	require.Equal(t, http.StatusForbidden, request(http.MethodPut, "/keys/9").Code)

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
}
