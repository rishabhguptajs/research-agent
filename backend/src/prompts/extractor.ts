export const EXTRACTOR_PROMPT = (question: string, context: string) => `
Sub-question: "${question}"

Context:
${context}

Extract key facts from the context that answer the sub-question.
Each fact must include the source URL, the exact snippet from the text, and the assertion (fact statement).
If the context doesn't answer the question, return an empty list.
`;

export const EXTRACTOR_SYSTEM = "You are a precise fact extractor. Only extract facts supported by the text.";
