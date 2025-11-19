export type PhotoStage = 'before' | 'during' | 'after';

export enum JobStatus {
  RECEIVED = 'Recebido',
  PREPARATION = 'Preparação',
  PAINTING = 'Pintura',
  FINISHING = 'Finalização',
  COMPLETED = 'Concluído'
}

export interface Photo {
  id: string;
  url: string;
  stage: PhotoStage;
  timestamp: number;
  description?: string; // AI Generated description
  comment?: string; // Manual comment from admin
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  password: string; // In a real app, this would be hashed
}

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  password: string;
}

export interface Vehicle {
  plate: string;
  model: string;
  color: string;
}

export interface Job {
  id: string;
  client: Client;
  vehicle: Vehicle;
  serviceDescription: string;
  status: JobStatus;
  photos: Photo[];
  createdAt: number;
  notes?: string;
}

export type UserRole = 'superadmin' | 'admin' | 'client';

export interface UserSession {
  role: UserRole;
  userId?: string; // If client
  name: string;
}

export interface SystemSettings {
  name: string;
  primaryColor: string;
}