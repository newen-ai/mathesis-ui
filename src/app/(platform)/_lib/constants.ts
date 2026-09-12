import { ExperienceDraft, Profile } from "./types";

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
  intereses: [],
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

export const professionalStampLines = [
  "Perfil claro, oportunidades más precisas.",
  "Trayectoria visible, confianza inmediata.",
  "Red inteligente, conexiones relevantes.",
];
