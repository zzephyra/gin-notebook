package constant

// ModelSpec 描述模型的总上下文窗口大小、推荐输入/输出预算。
type ModelSpec struct {
	TotalContextTokens int // 模型总上下文容量
	RecommendedInput   int // 推荐最大输入 token
	RecommendedOutput  int // 推荐最大输出 token
}

// ModelTotalContext 返回指定模型的上下文配置。
// ⚠️ 注意：不同厂商 token 计算方式略有差异，建议留安全余量。
func ModelTotalContext(model string) ModelSpec {
	switch model {
	case "gpt-3.5-turbo":
		return ModelSpec{TotalContextTokens: 4096, RecommendedInput: 3200, RecommendedOutput: 896}
	case "gpt-3.5-turbo-16k":
		return ModelSpec{TotalContextTokens: 16384, RecommendedInput: 13000, RecommendedOutput: 3384}
	case "gpt-4":
		return ModelSpec{TotalContextTokens: 8192, RecommendedInput: 6400, RecommendedOutput: 1792}
	case "gpt-4-turbo", "gpt-4-turbo-128k":
		return ModelSpec{TotalContextTokens: 131072, RecommendedInput: 104000, RecommendedOutput: 27072}
	case "gpt-4.1":
		return ModelSpec{TotalContextTokens: 1000000, RecommendedInput: 850000, RecommendedOutput: 150000}

	case "claude-1":
		return ModelSpec{TotalContextTokens: 9000, RecommendedInput: 7000, RecommendedOutput: 2000}
	case "claude-2":
		return ModelSpec{TotalContextTokens: 100000, RecommendedInput: 85000, RecommendedOutput: 15000}
	case "claude-3-opus":
		return ModelSpec{TotalContextTokens: 200000, RecommendedInput: 160000, RecommendedOutput: 40000}
	case "claude-3-sonnet":
		return ModelSpec{TotalContextTokens: 200000, RecommendedInput: 160000, RecommendedOutput: 40000}
	case "claude-3-haiku":
		return ModelSpec{TotalContextTokens: 200000, RecommendedInput: 160000, RecommendedOutput: 40000}

	case "deepseek-chat":
		return ModelSpec{TotalContextTokens: 32768, RecommendedInput: 26000, RecommendedOutput: 6780}
	case "deepseek-coder":
		return ModelSpec{TotalContextTokens: 65536, RecommendedInput: 52000, RecommendedOutput: 13536}

	case "mistral-small":
		return ModelSpec{TotalContextTokens: 32768, RecommendedInput: 26000, RecommendedOutput: 6780}
	case "mistral-large":
		return ModelSpec{TotalContextTokens: 128000, RecommendedInput: 100000, RecommendedOutput: 28000}

	case "gemini-1.5-pro":
		return ModelSpec{TotalContextTokens: 1000000, RecommendedInput: 850000, RecommendedOutput: 150000}
	case "gemini-1.5-flash":
		return ModelSpec{TotalContextTokens: 1000000, RecommendedInput: 850000, RecommendedOutput: 150000}

	default:
		// 默认兜底（兼容未知模型）
		return ModelSpec{TotalContextTokens: 8192, RecommendedInput: 6500, RecommendedOutput: 1692}
	}
}
