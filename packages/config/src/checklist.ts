import type { TaskCategory, TaskPriority } from "@wedding-univers/types";

/**
 * Rule-based default planning checklist (cahier des charges §7).
 * Deliberately NOT AI-driven: a fixed table of rules keyed by "months before
 * the wedding date", matching Principe 2 (pas d'IA gadget dans la V1).
 * Editing this table is how the checklist evolves — no model involved.
 */
export interface ChecklistRule {
  /** Inclusive upper bound, in months before the wedding date. */
  monthsBeforeMax: number;
  /** Inclusive lower bound, in months before the wedding date. */
  monthsBeforeMin: number;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
}

export const DEFAULT_CHECKLIST_RULES: ChecklistRule[] = [
  { monthsBeforeMin: 12, monthsBeforeMax: 18, title: "Définir le budget global", category: "administrative", priority: "high" },
  { monthsBeforeMin: 12, monthsBeforeMax: 18, title: "Réserver le lieu de réception", category: "venue", priority: "high" },
  { monthsBeforeMin: 12, monthsBeforeMax: 18, title: "Établir la liste des invités", category: "administrative", priority: "medium" },
  { monthsBeforeMin: 9, monthsBeforeMax: 12, title: "Réserver le photographe", category: "photography", priority: "high" },
  { monthsBeforeMin: 9, monthsBeforeMax: 12, title: "Réserver le traiteur", category: "catering", priority: "high" },
  { monthsBeforeMin: 9, monthsBeforeMax: 12, title: "Réserver le DJ ou le groupe de musique", category: "music", priority: "medium" },
  { monthsBeforeMin: 6, monthsBeforeMax: 9, title: "Choisir la robe de mariée", category: "dress", priority: "medium" },
  { monthsBeforeMin: 6, monthsBeforeMax: 9, title: "Choisir le costume du marié", category: "suit", priority: "medium" },
  { monthsBeforeMin: 6, monthsBeforeMax: 9, title: "Réserver le fleuriste", category: "flowers", priority: "medium" },
  { monthsBeforeMin: 4, monthsBeforeMax: 6, title: "Envoyer les save-the-date", category: "invitations", priority: "medium" },
  { monthsBeforeMin: 4, monthsBeforeMax: 6, title: "Organiser le transport des invités", category: "transport", priority: "low" },
  { monthsBeforeMin: 2, monthsBeforeMax: 4, title: "Envoyer les invitations", category: "invitations", priority: "high" },
  { monthsBeforeMin: 2, monthsBeforeMax: 4, title: "Finaliser le plan de table", category: "administrative", priority: "medium" },
  { monthsBeforeMin: 1, monthsBeforeMax: 2, title: "Confirmer les prestataires", category: "administrative", priority: "high" },
  { monthsBeforeMin: 0, monthsBeforeMax: 1, title: "Essayage final de la tenue", category: "dress", priority: "medium" },
  { monthsBeforeMin: 0, monthsBeforeMax: 1, title: "Confirmer le nombre définitif d'invités au traiteur", category: "catering", priority: "high" },
];

export interface GeneratedChecklistItem {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  suggestedDueDate: string;
}

/**
 * Generates the default checklist for a wedding date, relative to `referenceDate`
 * (defaults to now). Pure function, no external calls — safe to run client or server side.
 */
export function generateDefaultChecklist(
  weddingDate: Date,
  referenceDate: Date = new Date(),
): GeneratedChecklistItem[] {
  const monthsUntilWedding =
    (weddingDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

  return DEFAULT_CHECKLIST_RULES.filter(
    (rule) => monthsUntilWedding >= rule.monthsBeforeMin && monthsUntilWedding <= rule.monthsBeforeMax,
  ).map((rule) => {
    const dueDate = new Date(weddingDate);
    dueDate.setMonth(dueDate.getMonth() - rule.monthsBeforeMin);
    return {
      title: rule.title,
      category: rule.category,
      priority: rule.priority,
      suggestedDueDate: dueDate.toISOString().slice(0, 10),
    };
  });
}
