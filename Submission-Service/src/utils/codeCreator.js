/**
 * Combines code snippets into a complete executable code
 * @param startSnippet - The starting/template code (function signature, imports, etc.)
 * @param userCode - The user-written implementation
 * @param endSnippet - The ending code (closing braces, test execution, etc.)
 * @returns Complete code ready for execution
 */
function codeCreator(startSnippet, userCode, endSnippet) {
  return `${startSnippet}
${userCode}
${endSnippet}`;
}

module.exports = codeCreator;
