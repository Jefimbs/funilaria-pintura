import { Job, Client, JobStatus, SystemSettings, AdminUser } from '../types';

const JOBS_KEY = 'autocolor_jobs';
const CLIENTS_KEY = 'autocolor_clients';
const ADMINS_KEY = 'autocolor_admins';
const SETTINGS_KEY = 'autocolor_settings';

// Initialize with some mock data if empty
const initMockData = () => {
  // Initialize Admins if empty
  if (!localStorage.getItem(ADMINS_KEY)) {
    const defaultAdmin: AdminUser = {
      id: 'admin-1',
      name: 'Oficina Principal',
      username: 'admin',
      password: '123' // Changed from 'admin' to '123' as a common default, user can change
    };
    localStorage.setItem(ADMINS_KEY, JSON.stringify([defaultAdmin]));
  }

  // Initialize Jobs if empty
  if (!localStorage.getItem(JOBS_KEY)) {
    const mockClient: Client = {
      id: 'client-1',
      name: 'João Silva',
      phone: '11999999999',
      email: 'joao@email.com',
      cpf: '123.456.789-00',
      password: '123'
    };

    const mockJob: Job = {
      id: 'job-1',
      client: mockClient,
      vehicle: {
        plate: 'ABC-1234',
        model: 'Honda Civic',
        color: 'Prata'
      },
      serviceDescription: 'Repintura para-choque dianteiro e polimento.',
      status: JobStatus.PREPARATION,
      photos: [
        {
          id: 'p1',
          url: 'https://picsum.photos/id/1070/400/300',
          stage: 'before',
          timestamp: Date.now(),
          description: 'Danos visíveis no para-choque.',
          comment: 'Cliente relatou que a batida foi leve.'
        }
      ],
      createdAt: Date.now()
    };

    localStorage.setItem(JOBS_KEY, JSON.stringify([mockJob]));
    localStorage.setItem(CLIENTS_KEY, JSON.stringify([mockClient]));
  }
};

// --- Jobs ---
export const getJobs = (): Job[] => {
  initMockData();
  const data = localStorage.getItem(JOBS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveJob = (newJob: Job): void => {
  const jobs = getJobs();
  const existingIndex = jobs.findIndex(j => j.id === newJob.id);
  
  if (existingIndex >= 0) {
    jobs[existingIndex] = newJob;
  } else {
    jobs.push(newJob);
  }
  
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
};

// --- Clients ---
export const getClients = (): Client[] => {
  const data = localStorage.getItem(CLIENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveClient = (newClient: Client): void => {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === newClient.id);
  if (index >= 0) {
    clients[index] = newClient;
  } else {
    clients.push(newClient);
  }
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};

// --- Admins (Workshop Users) ---
export const getAdmins = (): AdminUser[] => {
  initMockData();
  const data = localStorage.getItem(ADMINS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveAdmin = (admin: AdminUser): void => {
  const admins = getAdmins();
  const index = admins.findIndex(a => a.id === admin.id);
  if (index >= 0) {
    admins[index] = admin;
  } else {
    admins.push(admin);
  }
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
};

export const deleteAdmin = (id: string): void => {
  const admins = getAdmins().filter(a => a.id !== id);
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
};

// --- Settings ---
export const getSettings = (): SystemSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : { name: 'AutoColor Funnel', primaryColor: '#2563eb' };
};

export const saveSettings = (settings: SystemSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};