import katex from "katex";

/**
 * Normalizes and cleans raw academic text and equations into standard KaTeX-compatible LaTeX.
 */
export function normalizeLatexContent(rawText: string): string {
  if (!rawText) return "";

  let text = rawText;

  // 1. Normalize linebreaks, excessive whitespace, and common extraction artifacts
  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/[ \t]+/g, " ");

  // 2. Normalize common mathematical Unicode symbols to LaTeX commands
  text = text.replace(/×/g, "\\times ");
  text = text.replace(/÷/g, "\\div ");
  text = text.replace(/±/g, "\\pm ");
  text = text.replace(/≤/g, "\\le ");
  text = text.replace(/≥/g, "\\ge ");
  text = text.replace(/≠/g, "\\ne ");
  text = text.replace(/≈/g, "\\approx ");
  text = text.replace(/→/g, "\\to ");
  text = text.replace(/←/g, "\\gets ");
  text = text.replace(/⇒/g, "\\implies ");
  text = text.replace(/⇔/g, "\\iff ");
  text = text.replace(/∞/g, "\\infty ");
  text = text.replace(/√\s*(\([^\)]+\)|[a-zA-Z0-9]+)/g, "\\sqrt{$1}");
  text = text.replace(/√/g, "\\sqrt{}");
  text = text.replace(/°\s*C/g, "^{\\circ}\\text{C}");
  text = text.replace(/°/g, "^{\\circ}");

  // Greek letters
  text = text.replace(/α/g, "\\alpha ");
  text = text.replace(/β/g, "\\beta ");
  text = text.replace(/γ/g, "\\gamma ");
  text = text.replace(/δ/g, "\\delta ");
  text = text.replace(/ε/g, "\\epsilon ");
  text = text.replace(/θ/g, "\\theta ");
  text = text.replace(/λ/g, "\\lambda ");
  text = text.replace(/μ/g, "\\mu ");
  text = text.replace(/π/g, "\\pi ");
  text = text.replace(/ρ/g, "\\rho ");
  text = text.replace(/σ/g, "\\sigma ");
  text = text.replace(/τ/g, "\\tau ");
  text = text.replace(/φ/g, "\\phi ");
  text = text.replace(/ω/g, "\\omega ");
  text = text.replace(/Δ/g, "\\Delta ");
  text = text.replace(/Ω/g, "\\Omega ");

  // 3. Fix common malformed LaTeX wrappers e.g. $$ $ ... $ $$ or $$...$$
  text = text.replace(/\$\$\s*\$\s*([^\$]+)\s*\$\s*\$\$/g, "$$$$1$$$");
  text = text.replace(/\$\s*\$\s*([^\$]+)\s*\$\s*\$/g, "$$$$1$$$");

  // 4. Normalize clean spacing inside $...$ delimiters
  text = text.replace(/\$\s+([^\$]+?)\s+\$/g, "$$$1$$");

  return text.trim();
}

/**
 * Validates whether KaTeX can successfully parse LaTeX snippets without throwing syntax errors.
 */
export function validateLatexSyntax(latexStr: string): { isValid: boolean; error?: string } {
  if (!latexStr || latexStr.trim() === "") {
    return { isValid: true };
  }

  try {
    // Extract math inside $...$ or test the whole string if already formatted
    const mathRegex = /\$\$([\s\S]*?)\$\$|\$([\s\S]*?)\$/g;
    let match;
    let hasMath = false;

    while ((match = mathRegex.exec(latexStr)) !== null) {
      hasMath = true;
      const formula = match[1] || match[2] || "";
      if (formula.trim()) {
        katex.renderToString(formula, { throwOnError: true });
      }
    }

    if (!hasMath) {
      // Test the text itself in case it's a bare formula snippet (e.g. \frac{1}{2})
      if (latexStr.includes("\\") || latexStr.includes("^") || latexStr.includes("_")) {
        katex.renderToString(latexStr, { throwOnError: true });
      }
    }

    return { isValid: true };
  } catch (err: any) {
    return {
      isValid: false,
      error: `KaTeX parsing error: ${err?.message || "Invalid LaTeX syntax"}`,
    };
  }
}
