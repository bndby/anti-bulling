/** Local keyword heuristics before LLM — cheap first pass. */
const SUPPORT_PATTERNS = [
  /хочу\s+(умереть|покончить)/i,
  /суицид/i,
  /самоубий/i,
  /режу\s+себя/i,
  /причинить\s+вред/i,
  /уби(ть|й)\s+(себя|меня|его|её|их)/i,
  /меня\s+избивают\s+в\s+реально/i,
  /реально\s+избивают/i,
  /угрожают\s+убить/i,
  /принеси\s+нож/i,
  /хочу\s+отомстить\s+и\s+избить/i,
];

export function localSafetyCheck(text: string): {
  supportMode: boolean;
  reason: string;
} {
  for (const re of SUPPORT_PATTERNS) {
    if (re.test(text)) {
      return {
        supportMode: true,
        reason: 'Обнаружены признаки реальной опасности или вреда.',
      };
    }
  }
  return { supportMode: false, reason: '' };
}
