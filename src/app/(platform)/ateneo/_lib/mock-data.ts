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
      id: "group-lectura-argentina",
      name: "Lectura Argentina",
      subtitle: "248 miembros",
      activity: "Nuevo tema hace 3 h",
      rules: ["Recomendaciones de lectura y reseñas breves."],
      icon: "cube",
      badges: [],
      action: "menu",
      isMember: true,
    },
    {
      id: "group-innovacion-social",
      name: "Innovación Social",
      subtitle: "186 miembros",
      activity: "Activo hoy",
      rules: ["Proyectos, ideas y colaboraciones con impacto."],
      icon: "community",
      badges: [{ id: "official", label: "Oficial" }],
      action: "menu",
      isMember: true,
    },
    {
      id: "group-historia-y-memorias",
      name: "Historia y Memorias",
      subtitle: "121 miembros",
      activity: "Comentarios abiertos",
      rules: ["Compartir contexto histórico con respeto."],
      icon: "gift",
      badges: [],
      action: "menu",
      isMember: true,
    },
    {
      id: "group-psicologia-practica",
      name: "Psicología Práctica",
      subtitle: "94 miembros",
      activity: "Nuevo tema hace 1 día",
      rules: ["Espacio de aprendizaje y experiencias."],
      icon: "community",
      badges: [],
      action: "menu",
      isMember: true,
    },
    {
      id: "group-ciencia-ciudadana",
      name: "Ciencia Ciudadana",
      subtitle: "77 miembros",
      activity: "Sin novedades esta semana",
      rules: ["Observación, datos y proyectos participativos."],
      icon: "cube",
      badges: [],
      action: "menu",
      isMember: true,
    },
    {
      id: "group-escritura-critica",
      name: "Escritura Crítica",
      subtitle: "63 miembros",
      activity: "Activo hoy",
      rules: ["Talleres de texto, feedback y edición."],
      icon: "gift",
      badges: [],
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
      id: "group-cine-foro",
      name: "Cine Foro",
      subtitle: "58 miembros",
      activity: "Nuevo tema hace 6 h",
      rules: ["Discusión de películas y lenguaje audiovisual."],
      icon: "community",
      badges: [],
      action: "menu",
      isMember: true,
    },
    {
      id: "group-juegos-mesa",
      name: "Juegos de Mesa",
      subtitle: "44 miembros",
      activity: "Activo hoy",
      rules: ["Coordinar partidas y compartir recomendaciones."],
      icon: "cube",
      badges: [],
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
      id: "group-filosofia",
      name: "Filosofía Hoy",
      subtitle: "139 miembros",
      activity: "Nuevo tema hace 4 h",
      rules: ["Debates abiertos con argumentos claros."],
      icon: "community",
      badges: [],
      action: "join",
      actionLabel: "Unirse",
      isMember: false,
    },
    {
      id: "group-arte-digital",
      name: "Arte Digital",
      subtitle: "211 miembros",
      activity: "Activo hoy",
      rules: ["Inspiración, procesos y publicaciones visuales."],
      icon: "gift",
      badges: [{ id: "official", label: "Oficial" }],
      action: "join",
      actionLabel: "Unirse",
      isMember: false,
    },
    {
      id: "group-salud-bienestar",
      name: "Salud y Bienestar",
      subtitle: "167 miembros",
      activity: "Sin novedades esta semana",
      rules: ["Hábitos, experiencias y recursos útiles."],
      icon: "cube",
      badges: [],
      action: "join",
      actionLabel: "Unirse",
      isMember: false,
    },
    {
      id: "group-tecnologia",
      name: "Tecnología y IA",
      subtitle: "305 miembros",
      activity: "Nuevo tema hace 1 h",
      rules: ["Compartir herramientas, dudas y hallazgos."],
      icon: "community",
      badges: [{ id: "official", label: "Oficial" }],
      action: "join",
      actionLabel: "Unirse",
      isMember: false,
    },
    {
      id: "group-habitos-lectura",
      name: "Hábitos de Lectura",
      subtitle: "98 miembros",
      activity: "Activo hoy",
      rules: ["Lecturas cortas, metas y seguimiento."],
      icon: "cube",
      badges: [],
      action: "join",
      actionLabel: "Unirse",
      isMember: false,
    },
    {
      id: "group-emprendimiento",
      name: "Emprendimiento",
      subtitle: "252 miembros",
      activity: "Comentarios abiertos",
      rules: ["Experiencias, lanzamientos y aprendizajes."],
      icon: "gift",
      badges: [],
      action: "join",
      actionLabel: "Unirse",
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
      id: "group-cocina",
      name: "Cocina Compartida",
      subtitle: "72 miembros",
      activity: "Nuevo tema hace 5 h",
      rules: ["Recetas, trucos y recomendaciones."],
      icon: "community",
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
    {
      id: "group-mentoria",
      name: "Mentoría",
      subtitle: "104 miembros",
      activity: "Nuevo tema hace 2 h",
      rules: ["Acompañamiento y seguimiento entre pares."],
      icon: "community",
      badges: [],
      action: "settings",
      actionLabel: "Configurar",
      isMember: true,
    },
    {
      id: "group-red-mentores",
      name: "Red de Mentores",
      subtitle: "88 miembros",
      activity: "Activo hoy",
      rules: ["Coordinación de encuentros y roles."],
      icon: "gift",
      badges: [{ id: "official", label: "Oficial" }],
      action: "settings",
      actionLabel: "Configurar",
      isMember: true,
    },
    {
      id: "group-liderazgo",
      name: "Liderazgo",
      subtitle: "61 miembros",
      activity: "Comentarios abiertos",
      rules: ["Prácticas de liderazgo y organización."],
      icon: "cube",
      badges: [],
      action: "settings",
      actionLabel: "Configurar",
      isMember: true,
    },
    {
      id: "group-produccion-eventos",
      name: "Producción de Eventos",
      subtitle: "53 miembros",
      activity: "Sin novedades esta semana",
      rules: ["Planificación, logística y difusión."],
      icon: "community",
      badges: [],
      action: "settings",
      actionLabel: "Configurar",
      isMember: true,
    },
    {
      id: "group-comunidad-local",
      name: "Comunidad Local",
      subtitle: "47 miembros",
      activity: "Activo hoy",
      rules: ["Acciones barriales y coordinación interna."],
      icon: "gift",
      badges: [],
      action: "settings",
      actionLabel: "Configurar",
      isMember: true,
    },
    {
      id: "group-proyectos",
      name: "Proyectos",
      subtitle: "39 miembros",
      activity: "Nuevo tema hace 8 h",
      rules: ["Seguimiento de iniciativas y avances."],
      icon: "cube",
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
