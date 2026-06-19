export interface Paciente {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  prevision?: string;
  seguroComplementario?: string;
  activo: boolean;
  creadoEn: string;
}

export interface Profesional {
  id: string;
  nombre: string;
  apellido: string;
  especialidades: string[];
  email: string;
  activo: boolean;
}

export interface Agenda {
  id: string;
  pacienteId: string;
  profesionalId: string;
  especialidadId: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: "pendiente" | "confirmada" | "en_curso" | "realizada" | "cancelada" | "no_show";
  motivoConsulta?: string;
  notasRecepcion?: string;
}
