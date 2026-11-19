//go:build unit

package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/handler"
	"github.com/Wei-Shaw/sub2api/internal/handler/admin"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestAdminSystemVersionAndRemovedUpdateRoutes(t *testing.T) {
	router := gin.New()
	const prefix = "/api/v1/admin/system"
	registerSystemRoutes(router.Group("/api/v1/admin"), &handler.Handlers{
		Admin: &handler.AdminHandlers{System: admin.NewSystemHandler("1.2.3", nil)},
	})

	version := httptest.NewRecorder()
	router.ServeHTTP(version, httptest.NewRequest(http.MethodGet, prefix+"/version", nil))
	require.Equal(t, http.StatusOK, version.Code)
	require.JSONEq(t, `{"code":0,"message":"success","data":{"version":"1.2.3"}}`, version.Body.String())

	for _, endpoint := range []struct{ method, path string }{
		{http.MethodGet, "/check-updates"}, {http.MethodGet, "/rollback-versions"},
		{http.MethodPost, "/update"}, {http.MethodPost, "/rollback"},
	} {
		t.Run(endpoint.path, func(t *testing.T) {
			res := httptest.NewRecorder()
			router.ServeHTTP(res, httptest.NewRequest(endpoint.method, prefix+endpoint.path, nil))
			require.Equal(t, http.StatusNotFound, res.Code)
		})
	}
}
