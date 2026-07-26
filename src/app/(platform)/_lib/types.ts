export type Profile = {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  nacionalidad: string;
  puesto: string;
  empresaActual: string;
};

export type Experience = {
  id: string;
  puestoTrabajo: string;
  lugarTrabajo: string;
  fechaComienzo: string;
  fechaFinalizacion: string;
  trabajoActual: boolean;
};

export type ExperienceDraft = Omit<Experience, "id">;

export type FeedPost = {
  id: string;
  autor: string;
  cargo: string;
  tiempo: string;
  contenido: string;
  etiqueta?: string;
  ownerProfileId?: string;
  attachment?: {
    type: "pdf" | "image";
    title: string;
    subtitle: string;
    sourceLabel?: string;
    url?: string;
    isAvailable?: boolean;
  };
};
