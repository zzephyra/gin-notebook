package dto

type Envelope[T any] struct {
	Data  *T      `json:"data"`
	Error *string `json:"error"`
}

type EmbedResponse struct {
	Embeddings []float32 `json:"embeddings"`
}

type IntentResponse struct {
	Intent     string  `json:"intent"`
	Confidence float64 `json:"confidence"`
}
