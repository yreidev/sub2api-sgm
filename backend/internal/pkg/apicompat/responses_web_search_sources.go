package apicompat

import (
	"encoding/json"
	"slices"
)

const webSearchSourcesInclude = "web_search_call.action.sources"

// IncludeWebSearchSources asks a hosted web_search to report the pages it
// used; without it a web_search_call carries only its query.
func IncludeWebSearchSources(req *ResponsesRequest) {
	for _, tool := range req.Tools {
		if tool.Type == "web_search" {
			if !slices.Contains(req.Include, webSearchSourcesInclude) {
				req.Include = append(req.Include, webSearchSourcesInclude)
			}
			return
		}
	}
}

type webSearchResult struct {
	Type             string `json:"type"`
	URL              string `json:"url"`
	Title            string `json:"title"`
	EncryptedContent string `json:"encrypted_content"`
}

// Only complete Anthropic result blocks can be returned to a Messages client.
// Standard Responses URL sources have no encrypted document content.
func webSearchCallResults(item *ResponsesOutput) json.RawMessage {
	if item.Action == nil {
		return json.RawMessage("[]")
	}
	var sources []json.RawMessage
	if json.Unmarshal(item.Action.Sources, &sources) != nil {
		return json.RawMessage("[]")
	}
	results := []webSearchResult{}
	for _, raw := range sources {
		var result webSearchResult
		if json.Unmarshal(raw, &result) == nil && result.URL != "" && result.Title != "" && result.EncryptedContent != "" {
			result.Type = "web_search_result"
			results = append(results, result)
		}
	}
	out, _ := json.Marshal(results)
	return out
}
