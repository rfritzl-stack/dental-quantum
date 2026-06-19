import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Inicializa el cliente oficial solo si existen las variables
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper para saber si estamos en modo simulación
export const isSupabaseMock = !supabase;

// Datos de prueba para el flujo simulado local
export const mockUsers = {
  pacientes: [
    { id: "p-1", email: "demo@paciente.cl", nombre: "Paciente Demo", rut: "12345678-9", role: "paciente" },
    { id: "p-2", email: "juan@perez.cl", nombre: "Juan Pérez", rut: "19876543-2", role: "paciente" }
  ],
  staff: [
    { id: "s-1", email: "asilva@dentalquantum.cl", nombre: "Andrés Silva", role: "dentista" },
    { id: "s-2", email: "ctoledo@dentalquantum.cl", nombre: "Claudia Toledo", role: "dentista" },
    { id: "s-3", email: "recepcion@dentalquantum.cl", nombre: "María Recepción", role: "recepcionista" },
    { id: "s-4", email: "admin@dentalquantum.cl", nombre: "Administrador Quantum", role: "admin" }
  ]
};
