/**
 * Combines code snippets into a complete executable code
 * @param startSnippet - The starting/template code (function signature, imports, etc.)
 * @param userCode - The user-written implementation
 * @param endSnippet - The ending code (closing braces, test execution, etc.)
 * @returns Complete code ready for execution
 */
function codeCreator(startSnippet, userCode, endSnippet) {
  const start = (startSnippet || '').trim();
  const user = (userCode || '').trim();
  const end = (endSnippet || '').trim();

  if (!user) {
    return `${start}\n${end}`.trim();
  }

  const includesStart = !!(start && user.includes(start));
  const includesEnd = !!(end && user.includes(end));

  if (includesStart && includesEnd) {
    return user;
  }

  if (includesStart && !includesEnd) {
    return [user, end].filter(Boolean).join('\n').trim();
  }

  if (!includesStart && includesEnd) {
    return [start, user].filter(Boolean).join('\n').trim();
  }

  const sections = [start, user, end].filter(Boolean);
  return sections.join('\n').trim();
}

module.exports = codeCreator;
