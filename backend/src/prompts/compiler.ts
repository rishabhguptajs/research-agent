export const COMPILER_PROMPT = (factsWithContext: Array<{ index: number, assertion: string, snippet: string, source: string }>) => `
You are an expert research analyst. You MUST write a comprehensive report with INLINE CITATIONS.

RESEARCH FACTS (use these numbers as inline citations):
${factsWithContext.map(f => `[${f.index}] ${f.assertion}\nContext: "${f.snippet}"\nSource: ${f.source}\n`).join('\n')}

CRITICAL REQUIREMENT - INLINE CITATIONS:
YOU MUST EMBED CITATION NUMBERS [1], [2], [3] DIRECTLY INTO THE TEXT WHEREVER YOU USE INFORMATION.

CORRECT EXAMPLE:
"The 2024 Indian election had 970 million eligible voters [1], making it the largest democratic exercise globally [2]. Turnout fell to 65.978% [3], down from the 2019 record [4]."

WRONG EXAMPLE (NO CITATIONS):
"The 2024 Indian election had 970 million eligible voters, making it the largest democratic exercise globally."

INSTRUCTIONS:
1. Write a 2-3 sentence executive summary (no citations needed here)
2. Write an EXTREMELY DETAILED report (800-1200 words):
   - Use markdown headers: ## for main sections, ### for subsections
   - EVERY fact, statistic, claim, or piece of information MUST have [N] citation immediately after it
   - Example: "The BJP won 240 seats [5] but lost its majority [6]."
   - Use multiple citations where appropriate: [1][2][3]
   - Include ALL data points, dates, numbers, names
   - Organize logically with clear sections
   - Use bullet points for lists
   
3. In the citations array, list each source matching the [N] numbers used in the text

REMEMBER: If you write a sentence without inline [N] citations, you are doing it WRONG. Citations must appear THROUGHOUT the detailed text, not at the end.
`;

export const COMPILER_SYSTEM = "You are an elite research analyst. YOU MUST embed inline citations as [1], [2], [3] etc. THROUGHOUT your detailed report text. Every claim needs a citation number right after it. This is NOT optional.";
