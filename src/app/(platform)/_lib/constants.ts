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
  empresaActual: "",
  about: "",
  locationCountry: "",
  locationCity: "",
  locationPostalCode: "",
  imagenPerfilUrl: "",
  imagenBannerUrl: "",
};

export const emptyExperience: ExperienceDraft = {
  puestoTrabajo: "",
  lugarTrabajo: "",
  descripcion: "",
  fechaComienzo: "",
  fechaFinalizacion: "",
  trabajoActual: false,
};

export const navItems: NavItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Perfil", href: "/perfil" },
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
    autor: "Martin Rodriguez",
    cargo: "Fisico teorico · IAFE · Buenos Aires",
    tiempo: "hace 3h",
    etiqueta: "∫ AR",
    contenido:
      "Terminamos de escribir el paper sobre decoherencia en sistemas de spin acoplado. Si a alguien de la comunidad le interesa mecanica cuantica aplicada, encantado de compartir el draft antes de mandarlo a revision.",
    attachment: {
      type: "pdf",
      title: "Decoherencia en sistemas de spin acoplado - draft.pdf",
      subtitle: "PDF · 2.4 MB",
      url: "#",
      isAvailable: true,
    },
  },
  {
    id: "seed-2",
    autor: "Sofia Herrera",
    cargo: "Escritora · Docente UNT",
    tiempo: "hace 5 h",
    etiqueta: "∫ AR",
    contenido:
      "El Congreso Mensa Tucuman fue increible. 87 miembros, 3 dias de debates y conexiones que no esperaba.",
    attachment: {
      type: "image",
      title: "foto · congreso_mensa_tuc.jpg",
      subtitle: "Imagen",
      sourceLabel: "Galeria del evento",
      isAvailable: false,
    },
  },
  {
    id: "seed-3",
    autor: "Carlos Vega",
    cargo: "CEO · TechFlow · ∫ Mensa Empresarios",
    tiempo: "hace 1 dia",
    etiqueta: "ME",
    contenido:
      "Lanzamos la segunda version de nuestro producto de automatizacion con IA para pymes. Reducimos 40% el tiempo en tareas administrativas de nuestros primeros clientes.",
  },
];
