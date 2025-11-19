import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, MessageCircle, LogOut, User, Plus, Image as ImageIcon, Wand2, ChevronLeft, Car, Paintbrush, CheckCircle, Settings, Save, Trash2, X, Pencil, Palette, Shield, Lock } from 'lucide-react';
import { Button } from './components/Button';
import { Input, Select, Textarea } from './components/Input';
import { Job, JobStatus, UserSession, PhotoStage, Photo, Client, AdminUser } from './types';
import * as storage from './services/storage';
import * as geminiService from './services/geminiService';

// --- Helper Functions ---

const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/[^\d]+/g, '');

  if (cleanCPF.length !== 11) return false;

  // Check for repeated digits (e.g., 111.111.111-11)
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  // Validate first digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  // Validate second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
};

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

// --- Helper Components ---

const StatusBadge = ({ status }: { status: JobStatus }) => {
  const colors = {
    [JobStatus.RECEIVED]: 'bg-gray-100 text-gray-800',
    [JobStatus.PREPARATION]: 'bg-yellow-100 text-yellow-800',
    [JobStatus.PAINTING]: 'bg-blue-100 text-blue-800',
    [JobStatus.FINISHING]: 'bg-purple-100 text-purple-800',
    [JobStatus.COMPLETED]: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
      {status}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [view, setView] = useState<'login' | 'dashboard' | 'create-job' | 'job-details' | 'superadmin'>('login');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState(storage.getSettings());
  
  // Load data on mount
  useEffect(() => {
    setJobs(storage.getJobs());
    const settings = storage.getSettings();
    setSystemSettings(settings);
    applyTheme(settings.primaryColor);
  }, []);

  const applyTheme = (color: string) => {
    document.documentElement.style.setProperty('--color-primary', color);
    // Simple darken logic for hover
    // In a real app, use a color manipulation library
    document.documentElement.style.setProperty('--color-primary-hover', color); 
  };

  // Refresh data helper
  const refreshData = () => {
    setJobs(storage.getJobs());
    const settings = storage.getSettings();
    setSystemSettings(settings);
    applyTheme(settings.primaryColor);
  };

  const handleLogin = (role: 'admin' | 'client', username: string, pass: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      // SuperAdmin Check
      if (username === 'Jefersonbs' && pass === '1020#') {
        setSession({ role: 'superadmin', name: 'SuperAdmin' });
        setView('superadmin');
        setIsLoading(false);
        return;
      }

      if (role === 'admin') {
        const admins = storage.getAdmins();
        const adminUser = admins.find(a => a.username === username && a.password === pass);
        
        if (adminUser) {
           setSession({ role: 'admin', name: adminUser.name });
           setView('dashboard');
        } else {
           alert('Credenciais de oficina inválidas');
        }
      } else if (role === 'client') {
        const clients = storage.getClients();
        const client = clients.find(c => c.email === username && c.password === pass);
        if (client) {
          setSession({ role: 'client', userId: client.id, name: client.name });
          // Filter jobs for this client
          const allJobs = storage.getJobs();
          const myJobs = allJobs.filter(j => j.client.id === client.id);
          if (myJobs.length > 0) {
             setSelectedJob(myJobs[0]);
             setView('job-details');
          } else {
             alert("Nenhum serviço encontrado para este cliente.");
          }
        } else {
          alert('Credenciais de cliente inválidas');
        }
      } else {
        alert('Credenciais inválidas');
      }
      setIsLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setSession(null);
    setView('login');
    setSelectedJob(null);
  };

  // --- Views ---

  if (view === 'login') {
    return <LoginView systemName={systemSettings.name} onLogin={handleLogin} isLoading={isLoading} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg text-white">
            {session?.role === 'superadmin' ? <Shield size={20} /> : <Paintbrush size={20} />}
          </div>
          <h1 className="font-bold text-xl text-slate-800 hidden sm:block">
            {session?.role === 'superadmin' ? 'Painel SuperAdmin' : systemSettings.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Olá, {session?.name}</span>
          <button onClick={handleLogout} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
        {view === 'superadmin' && session?.role === 'superadmin' && (
          <SuperAdminDashboard 
            onSettingsChange={refreshData}
          />
        )}

        {view === 'dashboard' && session?.role === 'admin' && (
          <AdminDashboard 
            jobs={jobs} 
            onCreateClick={() => setView('create-job')}
            onJobClick={(job) => { setSelectedJob(job); setView('job-details'); }}
          />
        )}

        {view === 'create-job' && (
          <CreateJobView 
            onCancel={() => setView('dashboard')}
            onSuccess={() => { refreshData(); setView('dashboard'); }}
          />
        )}

        {view === 'job-details' && selectedJob && (
          <JobDetailsView 
            job={selectedJob} 
            userRole={session?.role || 'client'}
            onBack={session?.role === 'admin' ? () => setView('dashboard') : undefined}
            onUpdate={() => { refreshData(); const updated = storage.getJobs().find(j => j.id === selectedJob.id); if(updated) setSelectedJob(updated); }}
          />
        )}
      </main>
    </div>
  );
}

// --- Sub-Components ---

function LoginView({ systemName, onLogin, isLoading }: { systemName: string, onLogin: (r: any, u: string, p: string) => void, isLoading: boolean }) {
  const [activeTab, setActiveTab] = useState<'admin' | 'client'>('client');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="p-8 text-center border-b border-slate-100 bg-white">
          <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{systemName}</h2>
          <p className="text-slate-500 text-sm mt-1">Acompanhamento de Pintura e Funilaria</p>
        </div>
        
        <div className="flex p-2 bg-slate-50 mx-6 mt-6 rounded-lg">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'client' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setActiveTab('client'); setEmail(''); setPass(''); }}
          >
            Sou Cliente
          </button>
          <button 
             className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'admin' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             onClick={() => { setActiveTab('admin'); setEmail(''); setPass(''); }}
          >
            Sou Oficina
          </button>
        </div>

        <div className="p-6 pt-4">
          <form onSubmit={(e) => { e.preventDefault(); onLogin(activeTab, email, pass); }}>
            <Input 
              label={activeTab === 'admin' ? "Usuário" : "E-mail"} 
              type={activeTab === 'admin' ? "text" : "email"}
              placeholder=""
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-white"
            />
            <Input 
              label="Senha" 
              type="password" 
              placeholder=""
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
              className="bg-white"
            />
            <Button type="submit" className="w-full mt-4 shadow-lg shadow-blue-200 bg-primary hover:bg-primary-hover" isLoading={isLoading}>
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SuperAdminDashboard({ onSettingsChange }: { onSettingsChange: () => void }) {
  const [settings, setSettings] = useState(storage.getSettings());
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', username: '', password: '' });

  useEffect(() => {
    setAdmins(storage.getAdmins());
  }, []);

  const handleSaveSettings = () => {
    storage.saveSettings(settings);
    onSettingsChange();
    alert('Configurações salvas com sucesso!');
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const admin: AdminUser = {
      id: `adm-${Date.now()}`,
      name: newAdmin.name,
      username: newAdmin.username,
      password: newAdmin.password
    };
    storage.saveAdmin(admin);
    setAdmins(storage.getAdmins());
    setIsEditingAdmin(false);
    setNewAdmin({ name: '', username: '', password: '' });
  };

  const handleDeleteAdmin = (id: string) => {
    if (confirm('Tem certeza que deseja remover este administrador?')) {
      storage.deleteAdmin(id);
      setAdmins(storage.getAdmins());
    }
  };

  return (
    <div className="space-y-8">
      {/* Global Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <Palette size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Personalização do Sistema</h2>
            <p className="text-sm text-slate-500">Altere a aparência e o nome da aplicação</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Input 
            label="Nome do Sistema" 
            value={settings.name} 
            onChange={e => setSettings({...settings, name: e.target.value})}
            placeholder="Ex: Funilaria Express"
           />
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Cor Principal</label>
             <div className="flex gap-3 items-center">
               <input 
                 type="color" 
                 value={settings.primaryColor}
                 onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                 className="h-10 w-20 p-1 rounded cursor-pointer border"
               />
               <span className="text-sm text-slate-500">{settings.primaryColor}</span>
             </div>
           </div>
        </div>
        <div className="mt-4 flex justify-end">
           <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary-hover">
             <Save size={18} /> Salvar Aparência
           </Button>
        </div>
      </div>

      {/* Admins Management */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Gerenciar Oficinas (Admins)</h2>
              <p className="text-sm text-slate-500">Crie login para os donos de oficina</p>
            </div>
          </div>
          <Button onClick={() => setIsEditingAdmin(true)} size="sm" className="bg-primary hover:bg-primary-hover">
             <Plus size={16} /> Novo Admin
          </Button>
        </div>

        {isEditingAdmin && (
          <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold mb-3">Novo Administrador</h3>
            <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Input label="Nome da Oficina" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} required />
              <Input label="Usuário de Login" value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})} required />
              <Input label="Senha" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} required />
              <div className="flex gap-2">
                <Button type="submit" className="bg-primary hover:bg-primary-hover w-full">Salvar</Button>
                <Button type="button" variant="secondary" onClick={() => setIsEditingAdmin(false)}>Cancelar</Button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm">
                <th className="p-3 border-b">Nome</th>
                <th className="p-3 border-b">Usuário</th>
                <th className="p-3 border-b">Senha</th>
                <th className="p-3 border-b text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id} className="border-b last:border-0">
                  <td className="p-3">{admin.name}</td>
                  <td className="p-3 font-mono text-sm bg-slate-50 inline-block rounded mt-1">{admin.username}</td>
                  <td className="p-3 text-slate-500">******</td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                      title="Remover acesso"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">Nenhum administrador cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ jobs, onCreateClick, onJobClick }: { jobs: Job[], onCreateClick: () => void, onJobClick: (j: Job) => void }) {
  // Removed Settings Card from here as it is now in SuperAdmin
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Painel de Serviços</h2>
        <Button onClick={onCreateClick} className="bg-primary hover:bg-primary-hover">
          <Plus size={18} /> Novo Serviço
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map(job => (
          <div 
            key={job.id} 
            onClick={() => onJobClick(job)}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-lg text-slate-800">{job.vehicle.plate}</span>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-slate-600 text-sm mb-1">{job.vehicle.model} • {job.vehicle.color}</p>
            <p className="text-slate-500 text-sm mb-3 line-clamp-1">{job.client.name}</p>
            
            <div className="border-t pt-3 flex justify-between items-center text-xs text-slate-400">
              <span>{new Date(job.createdAt).toLocaleDateString()}</span>
              <div className="flex items-center gap-1 group-hover:text-primary transition-colors">
                <ImageIcon size={14} /> {job.photos.length} Fotos
              </div>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            Nenhum serviço cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}

function CreateJobView({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: () => void }) {
  // State for form
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCpf, setClientCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [desc, setDesc] = useState('');

  const validateCurrentCpf = (cpf: string) => {
    if (!validateCPF(cpf)) {
      setCpfError("CPF Inválido. Verifique os dígitos.");
      return false;
    }
    setCpfError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentCpf(clientCpf)) {
      // The error state is set by the validation function, showing inline feedback
      return;
    }

    if (clientPassword.length < 4) {
      alert("A senha deve ter pelo menos 4 caracteres.");
      return;
    }

    const newClient: Client = {
      id: `c-${Date.now()}`,
      name: clientName,
      phone: clientPhone,
      email: clientEmail,
      cpf: clientCpf,
      password: clientPassword
    };

    const newJob: Job = {
      id: `j-${Date.now()}`,
      client: newClient,
      vehicle: { plate, model, color },
      serviceDescription: desc,
      status: JobStatus.RECEIVED,
      photos: [],
      createdAt: Date.now()
    };

    storage.saveClient(newClient);
    storage.saveJob(newJob);
    onSuccess();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded">
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold">Cadastrar Novo Serviço</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Dados do Cliente</h3>
          </div>
          <Input label="Nome Completo" required value={clientName} onChange={e => setClientName(e.target.value)} />
          <Input 
            label="CPF" 
            required 
            value={clientCpf} 
            onChange={e => {
              const formatted = formatCPF(e.target.value);
              setClientCpf(formatted);
              if (formatted.length >= 14) validateCurrentCpf(formatted);
              else setCpfError('');
            }}
            onBlur={() => validateCurrentCpf(clientCpf)}
            error={cpfError}
            maxLength={14}
            placeholder=""
          />
          <Input label="WhatsApp/Telefone" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
          <Input label="E-mail" type="email" required value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
          <Input 
            label="Senha de Acesso" 
            type="text" 
            required 
            className="md:col-span-2" 
            value={clientPassword} 
            onChange={e => setClientPassword(e.target.value)}
            placeholder=""
          />

          <div className="md:col-span-2 mt-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Dados do Veículo</h3>
          </div>
          <Input label="Placa" required value={plate} onChange={e => setPlate(e.target.value)} />
          <Input label="Modelo" required value={model} onChange={e => setModel(e.target.value)} />
          <Input label="Cor" required value={color} onChange={e => setColor(e.target.value)} />
          
          <div className="md:col-span-2">
            <Textarea label="Descrição do Serviço" required rows={3} value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" className="bg-primary hover:bg-primary-hover">Salvar Cadastro</Button>
        </div>
      </form>
    </div>
  );
}

function EditJobModal({ job, onCancel, onSuccess }: { job: Job, onCancel: () => void, onSuccess: () => void }) {
  const [clientName, setClientName] = useState(job.client.name);
  const [clientPhone, setClientPhone] = useState(job.client.phone);
  const [clientEmail, setClientEmail] = useState(job.client.email);
  const [clientCpf, setClientCpf] = useState(job.client.cpf || '');
  const [cpfError, setCpfError] = useState('');
  const [clientPassword, setClientPassword] = useState(job.client.password);
  
  const [plate, setPlate] = useState(job.vehicle.plate);
  const [model, setModel] = useState(job.vehicle.model);
  const [color, setColor] = useState(job.vehicle.color);
  const [desc, setDesc] = useState(job.serviceDescription);

  const validateCurrentCpf = (cpf: string) => {
    if (!validateCPF(cpf)) {
      setCpfError("CPF Inválido.");
      return false;
    }
    setCpfError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (clientCpf && !validateCurrentCpf(clientCpf)) {
       return;
    }

    const updatedClient: Client = {
      ...job.client,
      name: clientName,
      phone: clientPhone,
      email: clientEmail,
      cpf: clientCpf,
      password: clientPassword
    };

    const updatedJob: Job = {
      ...job,
      client: updatedClient,
      vehicle: { plate, model, color },
      serviceDescription: desc
    };

    storage.saveClient(updatedClient);
    storage.saveJob(updatedJob);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b pb-2 shrink-0">
          <h3 className="text-lg font-bold">Editar Informações</h3>
          <button onClick={onCancel} className="text-slate-500 hover:bg-slate-100 p-1 rounded"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2">
               <p className="text-xs text-slate-400 uppercase font-bold">Cliente</p>
             </div>
             <Input label="Nome" value={clientName} onChange={e => setClientName(e.target.value)} required />
             <Input 
              label="CPF" 
              value={clientCpf} 
              onChange={e => {
                const formatted = formatCPF(e.target.value);
                setClientCpf(formatted);
                if (formatted.length >= 14) validateCurrentCpf(formatted);
                else setCpfError('');
              }}
              onBlur={() => validateCurrentCpf(clientCpf)}
              error={cpfError}
              required 
            />
             <Input label="Telefone" value={clientPhone} onChange={e => setClientPhone(e.target.value)} required />
             <Input label="Email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} required />
             <Input label="Senha" value={clientPassword} onChange={e => setClientPassword(e.target.value)} required />

             <div className="md:col-span-2 mt-2">
               <p className="text-xs text-slate-400 uppercase font-bold">Veículo</p>
             </div>
             <Input label="Placa" value={plate} onChange={e => setPlate(e.target.value)} required />
             <Input label="Modelo" value={model} onChange={e => setModel(e.target.value)} required />
             <Input label="Cor" value={color} onChange={e => setColor(e.target.value)} required />
             
             <div className="md:col-span-2">
               <Textarea label="Descrição" value={desc} onChange={e => setDesc(e.target.value)} required />
             </div>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
             <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
             <Button type="submit" className="bg-primary hover:bg-primary-hover">Salvar Alterações</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditPhotoModal({ photo, onCancel, onSave }: { photo: Photo, onCancel: () => void, onSave: (p: Photo) => void }) {
  const [comment, setComment] = useState(photo.comment || '');
  const [description, setDescription] = useState(photo.description || '');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto flex flex-col">
         <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-lg font-bold">Editar Foto</h3>
            <button onClick={onCancel} className="text-slate-500 hover:bg-slate-100 p-1 rounded"><X size={20} /></button>
         </div>
         
         <div className="h-48 bg-slate-100 rounded mb-4 overflow-hidden border flex justify-center items-center shrink-0">
           <img src={photo.url} className="h-full w-full object-contain" alt="Editing" />
         </div>
         
         <div className="space-y-4 flex-1">
            <Input label="Comentário Manual" value={comment} onChange={e => setComment(e.target.value)} />
            <Textarea label="Descrição IA (Editável)" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
         </div>
         
         <div className="flex justify-end gap-2 mt-6 pt-4 border-t shrink-0">
           <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
           <Button onClick={() => onSave({ ...photo, comment, description })} className="bg-primary hover:bg-primary-hover">Salvar</Button>
         </div>
      </div>
    </div>
  );
}

function JobDetailsView({ job, userRole, onBack, onUpdate }: { job: Job, userRole: string, onBack?: () => void, onUpdate: () => void }) {
  const isAdmin = userRole === 'admin';
  const [activeStage, setActiveStage] = useState<PhotoStage>('before');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingMsg, setIsGeneratingMsg] = useState(false);

  // Modals State
  const [showEditJob, setShowEditJob] = useState(false);
  const [photoToEdit, setPhotoToEdit] = useState<Photo | null>(null);

  // Upload Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoComment, setPhotoComment] = useState('');

  const filteredPhotos = job.photos.filter(p => p.stage === activeStage);

  const handleStatusChange = (newStatus: string) => {
    const updatedJob = { ...job, status: newStatus as JobStatus };
    storage.saveJob(updatedJob);
    onUpdate();
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      setPhotoComment('');
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = async () => {
    if (!previewUrl) return;

    // Auto analyze if it's "Before" stage and no comment provided (or we can do both)
    let desc = '';
    if (activeStage === 'before' && !photoComment) {
      if(confirm("Deseja usar IA para analisar o dano nesta foto?")) {
        setIsAnalyzing(true);
        desc = await geminiService.analyzeCarImage(previewUrl);
        setIsAnalyzing(false);
      }
    }

    const newPhoto: Photo = {
      id: `p-${Date.now()}`,
      url: previewUrl,
      stage: activeStage,
      timestamp: Date.now(),
      description: desc,
      comment: photoComment
    };

    const updatedJob = { ...job, photos: [...job.photos, newPhoto] };
    storage.saveJob(updatedJob);
    onUpdate();

    // Reset upload state
    setPreviewUrl(null);
    setPhotoComment('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Prompt to send WhatsApp
    if (isAdmin) {
      setTimeout(() => {
        if(confirm("Foto adicionada! Deseja gerar mensagem para o cliente?")) {
           handleGenerateWhatsApp(updatedJob, newPhoto);
        }
      }, 100);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta foto?")) return;
    const updatedPhotos = job.photos.filter(p => p.id !== photoId);
    const updatedJob = { ...job, photos: updatedPhotos };
    storage.saveJob(updatedJob);
    onUpdate();
  };

  const handleSavePhotoEdit = (updatedPhoto: Photo) => {
    const updatedPhotos = job.photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p);
    const updatedJob = { ...job, photos: updatedPhotos };
    storage.saveJob(updatedJob);
    onUpdate();
    setPhotoToEdit(null);
  };

  const handleGenerateWhatsApp = async (currentJob: Job, photo: Photo | null) => {
    setIsGeneratingMsg(true);
    const msg = await geminiService.generateUpdateMessage(currentJob, photo);
    setIsGeneratingMsg(false);
    
    // Clean phone number
    const phone = currentJob.client.phone.replace(/\D/g, '');
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3 w-full">
          {isAdmin && (
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full shrink-0">
              <ChevronLeft />
            </button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-800">{job.vehicle.model} <span className="text-slate-400 text-lg font-normal">({job.vehicle.plate})</span></h2>
              {isAdmin && (
                <button 
                  onClick={() => setShowEditJob(true)}
                  className="bg-slate-100 p-1.5 rounded-full text-slate-600 hover:bg-blue-100 hover:text-primary transition-colors"
                  title="Editar Cadastro"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mt-1">
              <span className="flex items-center gap-1"><User size={14} /> {job.client.name}</span>
              <span className="hidden sm:inline mx-1">•</span>
              <span className="bg-slate-100 px-2 rounded text-slate-700 line-clamp-1">{job.serviceDescription}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
           {isAdmin ? (
             <div className="w-full sm:w-48">
                <Select label="" value={job.status} onChange={(e) => handleStatusChange(e.target.value)}>
                  {Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
             </div>
           ) : (
             <div className="self-start md:self-center">
               <StatusBadge status={job.status} />
             </div>
           )}
           
           {isAdmin && (
             <Button 
              variant="outline" 
              onClick={() => handleGenerateWhatsApp(job, null)}
              isLoading={isGeneratingMsg}
              title="Gerar mensagem de status via IA"
            >
               <MessageCircle size={18} /> Notificar
             </Button>
           )}
        </div>
      </div>

      {/* Funnel/Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {(['before', 'during', 'after'] as PhotoStage[]).map((stage) => {
             const labels: Record<string, string> = { before: 'Antes / Chegada', during: 'Durante / Processo', after: 'Depois / Finalizado' };
             return (
              <button
                key={stage}
                onClick={() => setActiveStage(stage)}
                className={`flex-1 min-w-[140px] py-4 font-medium text-sm transition-colors border-b-2 ${
                  activeStage === stage 
                    ? 'border-primary text-primary bg-blue-50' 
                    : 'border-transparent text-slate-500 hover:bg-slate-50'
                }`}
              >
                {labels[stage]}
              </button>
             );
          })}
        </div>

        <div className="p-6 min-h-[400px]">
          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
             {/* Add Button (Admin Only) */}
             {isAdmin && (
               <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[4/3] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary hover:bg-blue-50 cursor-pointer transition-all"
               >
                 {isAnalyzing ? (
                    <span className="animate-pulse flex flex-col items-center">
                      <Wand2 className="mb-2" /> Analisando...
                    </span>
                 ) : (
                   <>
                    <Camera size={32} className="mb-2" />
                    <span className="text-sm font-medium">Adicionar Foto</span>
                   </>
                 )}
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={onFileSelect}
                 />
               </div>
             )}

             {filteredPhotos.map(photo => (
               <div key={photo.id} className="group relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 shadow-sm border">
                 <img src={photo.url} alt={photo.stage} className="w-full h-full object-cover" />
                 <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-xs z-10">
                   <p>{new Date(photo.timestamp).toLocaleDateString()} {new Date(photo.timestamp).toLocaleTimeString()}</p>
                 </div>
                 
                 {/* Admin Actions */}
                 {isAdmin && (
                   <div className="absolute top-2 right-2 flex gap-2 z-20">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPhotoToEdit(photo); }}
                        className="bg-white text-slate-700 p-1.5 rounded-full shadow-md hover:bg-blue-50 hover:text-primary transition-colors"
                        title="Editar Foto"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                        className="bg-white text-red-500 p-1.5 rounded-full shadow-md hover:bg-red-50 transition-colors"
                        title="Excluir Foto"
                      >
                        <Trash2 size={14} />
                      </button>
                   </div>
                 )}

                 {/* Comments / Descriptions */}
                 {(photo.description || photo.comment) && (
                   <div className="absolute top-0 left-0 right-0 bg-primary/90 p-2 text-white text-xs transform -translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                     {photo.comment && (
                       <div className="flex gap-1 items-start mb-1">
                         <MessageCircle size={12} className="mt-0.5 shrink-0" />
                         <p className="font-medium">{photo.comment}</p>
                       </div>
                     )}
                     {photo.description && (
                       <div className="flex gap-1 items-start opacity-90">
                         <Wand2 size={12} className="mt-0.5 shrink-0" />
                         <p>{photo.description}</p>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             ))}

             {!isAdmin && filteredPhotos.length === 0 && (
               <div className="col-span-full text-center py-12 text-slate-400 flex flex-col items-center">
                 <ImageIcon size={48} className="mb-4 opacity-20" />
                 <p>Nenhuma foto registrada nesta etapa ainda.</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Upload Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <h3 className="font-bold text-lg mb-3 shrink-0">Confirmar Foto</h3>
            <div className="h-48 bg-slate-100 rounded-lg overflow-hidden mb-4 border shrink-0 flex items-center justify-center">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            </div>
            <Input 
              label="Comentário (Opcional)" 
              value={photoComment} 
              onChange={e => setPhotoComment(e.target.value)}
              placeholder="Ex: Detalhe do amassado..."
            />
            <div className="flex gap-2 justify-end mt-4 shrink-0">
              <Button variant="secondary" onClick={() => { setPreviewUrl(null); setPhotoComment(''); if(fileInputRef.current) fileInputRef.current.value = ''; }}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmUpload} className="bg-primary hover:bg-primary-hover">
                Adicionar Foto
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {showEditJob && (
        <EditJobModal 
          job={job} 
          onCancel={() => setShowEditJob(false)} 
          onSuccess={() => { setShowEditJob(false); onUpdate(); }} 
        />
      )}

      {/* Edit Photo Modal */}
      {photoToEdit && (
        <EditPhotoModal 
          photo={photoToEdit} 
          onCancel={() => setPhotoToEdit(null)} 
          onSave={handleSavePhotoEdit} 
        />
      )}
    </div>
  );
}