export type AteneoPermissionMode = "free" | "admins";

export type AteneoIconOption = {
  id: string;
  label: string;
};

export type AteneoBadgeOption = {
  id: string;
  label: string;
};

export const ateneoIconOptions: AteneoIconOption[] = [
  { id: "cube", label: "Cubo" },
  { id: "cafe", label: "Cafe" },
  { id: "community", label: "Comunidad" },
  { id: "idea", label: "Idea" },
  { id: "target", label: "Objetivo" },
  { id: "puzzle", label: "Puzzle" },
  { id: "spark", label: "Destello" },
  { id: "team", label: "Equipo" },
  { id: "gift", label: "Regalo" },
  { id: "building", label: "Empresa" },
  { id: "home", label: "Casa" },
  { id: "medal", label: "Medalla" },
];

export const ateneoBadgeOptions: AteneoBadgeOption[] = [
  { id: "mensa_argentina", label: "Mensa AR" },
  { id: "mensa_empresarios", label: "Mathesis Empresarios" },
];

export const ateneoLanguageOptions = ["Español"] as const;

export const ateneoPermissionOptions: Array<{ value: AteneoPermissionMode; label: string }> = [
  { value: "free", label: "Libre" },
  { value: "admins", label: "Admins" },
];
