package service

import (
	"context"
	"slices"
	"strings"

	"github.com/Wei-Shaw/sub2api/internal/pkg/claude"
)

// Routing preferences and sticky sessions can fall back to other schedulable accounts.
func (s *GatewayService) anthropicLongContextCandidates(accounts []Account, models []string) map[string][]int64 {
	candidates := make(map[string][]int64)
	for _, model := range append(slices.Clone(models), claude.DefaultModelIDs()...) {
		if !strings.Contains(model, "*") {
			base := model
			if strings.HasSuffix(strings.ToLower(model), claudeCodeLongContextModelSuffix) {
				base = model[:len(model)-len(claudeCodeLongContextModelSuffix)]
			}
			candidates[base] = nil
		}
	}
	for _, account := range accounts {
		if !account.IsAnthropic() && !(account.Platform == PlatformAntigravity && account.IsMixedSchedulingEnabled()) {
			continue
		}
		account.PrepareSharedSnapshot()
		snapshot := account.GetUpstreamModelMetadataSnapshot()
		for model := range candidates {
			if !s.isModelSupportedByAccount(&account, model) {
				continue
			}
			var mapped string
			switch {
			case account.Platform == PlatformAntigravity:
				mapped = mapAntigravityModel(&account, model)
			case account.IsBedrock():
				mapped, _ = ResolveBedrockModelID(&account, model)
			default:
				mapped, _ = anthropicForwardModel(&account, model)
			}
			if snapshot == nil || snapshot.Models[mapped].ContextWindow < 900_000 {
				delete(candidates, model)
				continue
			}
			candidates[model] = append(candidates[model], account.ID)
		}
	}
	return candidates
}

func (s *GatewayService) AnthropicListingModels(ctx context.Context, group *Group) []string {
	var groupID *int64
	if group != nil {
		groupID = &group.ID
	}
	catalog := s.availableModelCatalog(ctx, groupID, PlatformAnthropic)
	source := catalog.models
	allowlisted := group != nil && group.ModelAllowlistEnabled()
	if len(source) == 0 || allowlisted {
		source = append(slices.Clone(source), claude.DefaultModelIDs()...)
	}
	result := make([]string, 0, len(source))
	seen := make(map[string]bool)
	add := func(model string) {
		if !seen[model] {
			result = append(result, model)
			seen[model] = true
		}
	}
	variants := make(map[string]bool)
	for _, model := range source {
		if !strings.HasSuffix(strings.ToLower(model), claudeCodeLongContextModelSuffix) {
			add(model)
			continue
		}
		base := model[:len(model)-len(claudeCodeLongContextModelSuffix)]
		if catalog.supportsLongContext(group, base) {
			add(model)
			variants[base] = true
		}
	}
	for _, model := range source {
		if !variants[model] && catalog.supportsLongContext(group, model) {
			add(model + claudeCodeLongContextModelSuffix)
			variants[model] = true
		}
	}
	if len(catalog.models) == 0 && !allowlisted && len(variants) == 0 {
		return nil
	}
	return result
}

func (catalog availableModelCatalog) supportsLongContext(group *Group, model string) bool {
	accounts := catalog.longContext[model]
	if len(accounts) == 0 {
		return false
	}
	if group != nil {
		if routed := group.GetRoutingAccountIDs(model); len(routed) > 0 {
			for _, id := range routed {
				if slices.Contains(accounts, id) {
					return true
				}
			}
			return false
		}
	}
	return true
}
