/**
 * Order template utilities for saving and loading common configurations
 */

import type { IntakeData } from "../page";

export interface OrderTemplate {
  id: string;
  name: string;
  description?: string;
  data: Partial<IntakeData>;
  createdAt: number;
}

const TEMPLATES_STORAGE_KEY = "order_intake_templates";

export function saveTemplate(name: string, description: string | undefined, data: Partial<IntakeData>): OrderTemplate {
  const templates = loadTemplates();
  const template: OrderTemplate = {
    id: `template_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name,
    description,
    data: {
      // Save only the relevant parts
      frames: data.frames || [],
      mats: data.mats || [],
      glassType: data.glassType || null,
      mountingType: data.mountingType || null,
      addOns: data.addOns || {
        spacers: false,
        shadowbox: false,
        stretching: false,
        fabricWrap: false,
      },
      depositPercent: data.depositPercent || 50,
      expectedCompletionDays: data.expectedCompletionDays || 10,
    },
    createdAt: Date.now(),
  };
  
  templates.push(template);
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  return template;
}

export function loadTemplates(): OrderTemplate[] {
  try {
    const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load templates:", e);
  }
  return [];
}

export function deleteTemplate(templateId: string): void {
  const templates = loadTemplates().filter((t) => t.id !== templateId);
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}

export function applyTemplate(template: OrderTemplate, currentData: IntakeData): Partial<IntakeData> {
  return {
    ...currentData,
    frames: template.data.frames || [],
    mats: template.data.mats || [],
    glassType: template.data.glassType || null,
    mountingType: template.data.mountingType || null,
    addOns: template.data.addOns || {
      spacers: false,
      shadowbox: false,
      stretching: false,
      fabricWrap: false,
    },
    depositPercent: template.data.depositPercent || 50,
    expectedCompletionDays: template.data.expectedCompletionDays || 10,
  };
}
