/**
 * Company Personnel & Department Claim Guidelines
 */

export const COMPANY_PERSONNEL = [
  {
    id: 'joern',
    name: 'Joern',
    fullName: 'Joern Prawn',
    email: 'joern.prawn@gmail.com',
    department: 'Sales',
    title: 'Senior Sales Director',
    avatar: '💼',
    allowedCategories: ['Meals'],
    policyRule: 'Sales department can only claim Meals (Client hospitality, business dinners, lunch meetings).',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'jiatong',
    name: 'Jiatong',
    fullName: 'Jiatong Chen',
    email: 'jiatong.chen@company.internal',
    department: 'R&D',
    title: 'Principal Research Engineer',
    avatar: '🔬',
    allowedCategories: ['Materials'],
    policyRule: 'R&D department can only claim Materials (Hardware components, lab supplies, prototyping tools).',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

export const DEPARTMENT_POLICIES = {
  Sales: {
    allowed: ['Meals'],
    ruleDescription: 'Sales personnel are strictly permitted to claim Meals only.',
    keywords: ['dinner', 'lunch', 'meal', 'bistro', 'restaurant', 'food', 'cafe', 'coffee', 'hospitality', 'catering', 'breakfast'],
  },
  'R&D': {
    allowed: ['Materials'],
    ruleDescription: 'R&D personnel are strictly permitted to claim Materials only.',
    keywords: ['material', 'hardware', 'component', 'sensor', 'arduino', 'tool', 'lab', 'prototype', 'electronics', 'parts', 'chip', 'wires', 'pcb'],
  },
};

/**
 * Check whether an expense item complies with the staff member's department policy
 * 
 * @param {string} department - 'Sales' | 'R&D'
 * @param {string} expenseItem - description/item name
 * @returns {{ isCompliant: boolean, category: string, reason: string }}
 */
export function checkExpensePolicy(department, expenseItem = '') {
  const dept = (department || '').trim();
  const text = (expenseItem || '').toLowerCase();

  // If department policy is not defined, pass by default
  const policy = DEPARTMENT_POLICIES[dept];
  if (!policy) {
    return { isCompliant: true, category: 'General', reason: 'Standard claim policy applies.' };
  }

  // Detect category based on keywords
  const isMeal = /dinner|lunch|meal|bistro|restaurant|food|cafe|coffee|hospitality|catering|breakfast|bar|steak/i.test(text);
  const isMaterial = /material|hardware|component|sensor|arduino|tool|lab|prototype|electronics|parts|chip|wires|pcb|resistor|board|3d print/i.test(text);

  let detectedCategory = 'Other';
  if (isMeal) detectedCategory = 'Meals';
  else if (isMaterial) detectedCategory = 'Materials';

  if (dept === 'Sales') {
    if (isMeal) {
      return {
        isCompliant: true,
        category: 'Meals',
        reason: '✓ Approved: Meals expense complies with Sales claim policy.',
      };
    }
    return {
      isCompliant: false,
      category: detectedCategory,
      reason: `⚠️ Policy Warning: Sales department can only claim Meals. "${expenseItem || 'This item'}" appears to be ${detectedCategory}.`,
    };
  }

  if (dept === 'R&D') {
    if (isMaterial) {
      return {
        isCompliant: true,
        category: 'Materials',
        reason: '✓ Approved: Materials expense complies with R&D claim policy.',
      };
    }
    return {
      isCompliant: false,
      category: detectedCategory,
      reason: `⚠️ Policy Warning: R&D department can only claim Materials. "${expenseItem || 'This item'}" appears to be ${detectedCategory}.`,
    };
  }

  return { isCompliant: true, category: detectedCategory, reason: 'Approved under general policy.' };
}
