import type { ComponentType } from "react";
export interface MiniAppDefinition {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: ComponentType;
  component: ComponentType;
  tone: "light" | "red";
}
