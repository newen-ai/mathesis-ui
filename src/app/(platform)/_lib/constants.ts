import { ExperienceDraft, FeedPost, Profile } from "./types";

export type NavItem = {
  label: string;
  href: string;
};

export const STORAGE_KEY = "mensa-empresarios-profile-v1";
export const FEED_STORAGE_KEY = "mensa-empresarios-feed-v1";

export const emptyProfile: Profile = {
  nombre: "",
  apellido: "",
  fechaNacimiento: "",
  nacionalidad: "",
  puesto: "",
};

export const emptyExperience: ExperienceDraft = {
  puestoTrabajo: "",
  lugarTrabajo: "",
  fechaComienzo: "",
  fechaFinalizacion: "",
  trabajoActual: false,
};

export const navItems: NavItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Perfil", href: "/perfil" },
  { label: "Cuenta", href: "/cuenta" },
  { label: "Red", href: "/red" },
  { label: "Mensajes", href: "/mensajes" },
  { label: "Notificaciones", href: "/notificaciones" },
];

export const catchyLines = [
  "Ideas brillantes, impacto real.",
  "Donde el analisis profundo se convierte en accion.",
  "Somos miembros de Mensa Argentina, y esta red tambien piensa en grande.",
  "Mentes excepcionales, resultados extraordinarios.",
  "Pensar mejor hoy para liderar mejor manana.",
  "El talento conecta, la vision transforma.",
  "Tu experiencia vale mas cuando se comparte.",
  "Networking inteligente para decisiones inteligentes.",
  "Donde la curiosidad se convierte en oportunidad.",
  "Conocimiento profundo, impacto visible.",
  "Una red de pares, un mundo de posibilidades.",
  "Cada conexion puede abrir una gran idea.",
  "Estrategia clara, ejecucion impecable.",
  "Pensamiento critico para negocios que avanzan.",
  "La excelencia empieza con una buena conversacion.",
  "Tu perfil profesional, tu mejor carta de presentacion.",
  "Innovar juntos es crecer mas rapido.",
  "Aqui conectan las ideas que hacen diferencia.",
  "Inteligencia colectiva para desafios complejos.",
  "Mensa Argentina en accion: talento que colabora.",
  "Grandes preguntas, mejores soluciones.",
  "Cuando las mentes se conectan, los proyectos despegan.",
];

export const professionalStampLines = [
  "Perfil claro, oportunidades mas precisas.",
  "Trayectoria visible, confianza inmediata.",
  "Red inteligente, conexiones relevantes.",
];

export const defaultFeedPosts: FeedPost[] = [
  {
    id: "seed-1",
    autor: "Sofia Rinaldi",
    cargo: "Directora de Innovacion | Mensa Argentina",
    tiempo: "Hace 2 horas",
    etiqueta: "Tendencias",
    contenido:
      "En mercados inciertos, la ventaja competitiva esta en la velocidad de aprendizaje. Estamos lanzando una mesa de trabajo para analizar IA aplicada a operaciones empresariales.",
  },
  {
    id: "seed-2",
    autor: "Esteban Lopez",
    cargo: "Founder @ Nodo Andino",
    tiempo: "Hace 5 horas",
    etiqueta: "Networking",
    contenido:
      "Busco conectar con perfiles de estrategia comercial y crecimiento B2B para un proyecto regional. Si te interesa colaborar, escribime por Mensajes.",
  },
  {
    id: "seed-3",
    autor: "Lucia Ferrer",
    cargo: "People & Culture Lead",
    tiempo: "Ayer",
    etiqueta: "Comunidad",
    contenido:
      "Cuando el talento se conecta con proposito, aparecen oportunidades que no estaban en el radar. Gran valor en la ultima ronda de presentaciones de la red.",
  },
];
