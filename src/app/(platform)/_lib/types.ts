export type Profile = {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  nacionalidad: string;
  puesto: string;
  empresaActual: string;
  about: string;
  locationCountry: string;
  locationCity: string;
  locationPostalCode: string;
  intereses: string[];
  imagenPerfilUrl: string;
  imagenBannerUrl: string;
};

export type Experience = {
  id: string;
  puestoTrabajo: string;
  lugarTrabajo: string;
  descripcion: string;
  fechaComienzo: string;
  fechaFinalizacion: string;
  trabajoActual: boolean;
};

export type ExperienceDraft = Omit<Experience, "id">;

export type Education = {
  id: string;
  institucion: string;
  titulo: string;
  campoEstudio: string;
  fechaComienzo: string;
  fechaFinalizacion: string;
  estudiandoActualmente: boolean;
  descripcion: string;
};

export type EducationDraft = Omit<Education, "id">;

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
