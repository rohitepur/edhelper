/**
 * AI Generator stub — Ollama integration placeholder.
 * Provides safe fallbacks when Ollama is not available.
 */
const AIGenerator = {
    async isOllamaAvailable() {
        return false;
    },
    async generateProblemBatch(subject, count, tags) {
        return [];
    }
};
