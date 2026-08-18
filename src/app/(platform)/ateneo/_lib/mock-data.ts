export type AteneoBadge = {
  id: string;
  label: string;
};

export type AteneoGroup = {
  id: string;
  name: string;
  subtitle: string;
  activity: string;
  rules: string[];
  icon: "cafe" | "community" | "cube" | "gift";
  badges: AteneoBadge[];
  action: "menu" | "join" | "settings";
  actionLabel?: string;
  isMember: boolean;
};

export type AteneoTabKey = "mine" | "discover" | "admin";

export type AteneoIconOption = {
  id: string;
  label: string;
};

export type AteneoPermissionMode = "free" | "admins";

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
  { id: "mensa-ar", label: "∫ Mensa AR" },
  { id: "mensa-empresarios", label: "∫ Mensa Empresarios" },
];

export const ateneoLanguageOptions = ["Español"] as const;

export const ateneoPermissionOptions: Array<{ value: AteneoPermissionMode; label: string }> = [
  { value: "free", label: "Libre" },
  { value: "admins", label: "Admins" },
];

export const ateneoTabs: Array<{ key: AteneoTabKey; label: string }> = [
  { key: "mine", label: "Tus grupos" },
  { key: "discover", label: "Descubrir" },
  { key: "admin", label: "Grupos que administrás" },
];

export const ateneoGroupsByTab: Record<AteneoTabKey, AteneoGroup[]> = {
  mine: [
    {
      id: "group-comunicacion-mensa-argentina",
      name: "Comunicación Mensa Argentina",
      subtitle: "1.2k miembros",
      activity: "Activo hoy",
      rules: [
        "Respeto entre miembros.",
        "Mantener el foco en temas de la comunidad.",
      ],
      icon: "community",
      badges: [
        { id: "official", label: "Oficial" },
        { id: "mensa-ar", label: "∫ Mensa AR" },
      ],
      action: "menu",
      isMember: true,
    },
    {
      id: "group-oferta-trabajo",
      name: "Oferta y Búsqueda de Trabajo",
      subtitle: "Transitorio",
      activity: "Sin novedades esta semana",
      rules: [
        "Publicar oportunidades reales.",
        "Evitar spam y autopromoción sin contexto.",
      ],
      icon: "community",
      badges: [{ id: "official", label: "Oficial" }],
      action: "menu",
      isMember: true,
    },
    {
      id: "group-ajedrez",
      name: "Ajedrez y Estrategia",
      subtitle: "84 miembros",
      activity: "Activo hoy",
      rules: [
        "Partidas y análisis en tono constructivo.",
        "No spoilers sin advertencia.",
      ],
      icon: "cube",
      badges: [],
      action: "menu",
      isMember: true,
    },
  ],
  discover: [
    {
      id: "group-mensa-empresarios",
      name: "Comunicación Mensa Empresarios",
      subtitle: "Solo visible con insignia Empresarios",
      activity: "No la tenés aún",
      rules: ["Grupo privado con validación de insignia."],
      icon: "gift",
      badges: [
        { id: "official", label: "Oficial" },
        { id: "mensa-emp", label: "∫ Mensa Empresarios" },
      ],
      action: "menu",
      isMember: false,
    },
    {
      id: "group-club-lectura",
      name: "Club de Lectura",
      subtitle: "51 miembros",
      activity: "Sin novedades esta semana",
      rules: ["Compartir lecturas con reseñas breves."],
      icon: "cube",
      badges: [],
      action: "join",
      actionLabel: "Unirse",
      isMember: false,
    },
    {
      id: "group-ciencia-futuro",
      name: "Ciencia y Futuro",
      subtitle: "347 miembros",
      activity: "Nuevo tema hace 2 h",
      rules: ["Debates basados en evidencia y fuentes."],
      icon: "community",
      badges: [{ id: "official", label: "Oficial" }],
      action: "join",
      actionLabel: "Unirse",
      isMember: false,
    },
  ],
  admin: [
    {
      id: "group-cafe-mathesis",
      name: "Café Mathesis",
      subtitle: "Social",
      activity: "Activo hoy",
      rules: [
        "Espacio social de la comunidad.",
        "Cuidar el trato y mantener respeto.",
      ],
      icon: "cafe",
      badges: [
        { id: "official", label: "Oficial" },
        { id: "mensa-ar", label: "∫ Mensa AR" },
      ],
      action: "settings",
      actionLabel: "Configurar",
      isMember: true,
    },
    {
      id: "group-lab-producto",
      name: "Lab de Producto",
      subtitle: "93 miembros",
      activity: "Comentarios abiertos",
      rules: ["Feedback claro, concreto y accionable."],
      icon: "gift",
      badges: [],
      action: "settings",
      actionLabel: "Configurar",
      isMember: true,
    },
  ],
};

export const ateneoGroupsFlat: AteneoGroup[] = Object.values(ateneoGroupsByTab).flat();

export function getAteneoGroupById(groupId: string): AteneoGroup | undefined {
  return ateneoGroupsFlat.find((group) => group.id === groupId);
}
