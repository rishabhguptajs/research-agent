export const GAP_ANALYZER_PROMPT = (query: string, currentFacts: any[]) => `
You are a senior research analyst reviewing the initial findings for the query: "${query}".

Here are the facts we have gathered so far:
${JSON.stringify(currentFacts, null, 2)}

Your task is to identify CRITICAL GAPS in this information. What is missing? What is vague? What needs more evidence?

You MUST output a JSON object with these EXACT two fields:
1. "gaps": array of strings describing what is missing.
2. "new_search_queries": array of 3-5 SPECIFIC Google search queries to fill these gaps.

If the current facts are sufficient and comprehensive, return empty arrays.

EXAMPLE OUTPUT:
{
  "gaps": [
    "Missing specific pricing for Enterprise plan",
    "No details on security compliance certifications"
  ],
  "new_search_queries": [
    "Product X enterprise pricing 2024",
    "Product X security certifications SOC2 ISO27001"
  ]
}

CRITICAL RULES:
- Focus on MISSING information that is crucial for a comprehensive report.
- Search queries must be specific.
- Output ONLY valid JSON.
`;

export const GAP_ANALYZER_SYSTEM = "You are a critical research analyst. Identify gaps and plan follow-up research.";
