
import * as XLSX from 'xlsx';
import { AppointmentWithDetails, AppointmentStatus } from '@/types';
import { format } from 'date-fns';

export interface ExportAppointmentsOptions {
  appointments: AppointmentWithDetails[];
  filename?: string;
  month?: string;
}

const statusLabels = {
  [AppointmentStatus.SCHEDULED]: 'Agendado',
  [AppointmentStatus.COMPLETED]: 'Concluído',
  [AppointmentStatus.CANCELED]: 'Cancelado',
  [AppointmentStatus.NO_SHOW]: 'Não Compareceu',
  [AppointmentStatus.ARCHIVED]: 'Arquivado',
};

const formatBirthdate = (birthdate?: string): string => {
  if (!birthdate) return '-';
  
  try {
    if (birthdate.includes('/') && birthdate.length === 10) {
      return birthdate;
    }
    
    if (birthdate.includes('-') && birthdate.length === 10) {
      const [year, month, day] = birthdate.split('-');
      return `${day}/${month}/${year}`;
    }
    
    const date = new Date(birthdate);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    return birthdate;
  } catch (error) {
    return birthdate;
  }
};

export const exportAppointmentsToExcel = ({ 
  appointments, 
  filename, 
  month 
}: ExportAppointmentsOptions): void => {
  try {
    // Preparar dados para exportação
    const exportData = appointments.map((appointment, index) => ({
      'Nº': index + 1,
      'Empresa': appointment.company?.name || 'Empresa não encontrada',
      'CNPJ': appointment.company?.cnpj || '-',
      'Telefone Empresa': appointment.company?.phone || '-',
      'Email Empresa': appointment.company?.email || '-',
      'Funcionário': appointment.employee?.name || 'Funcionário não encontrado',
      'CPF': appointment.employee?.cpf || '-',
      'Data Nascimento': formatBirthdate(appointment.patientBirthdate || appointment.employee?.dateOfBirth),
      'Telefone Funcionário': appointment.employee?.phone || '-',
      'Email Funcionário': appointment.employee?.email || '-',
      'Setor': appointment.employee?.sector || appointment.sector || 'Não informado',
      'Cargo': appointment.employee?.role || 'Não informado',
      'Tipo de Exame': appointment.examType?.name || 'Tipo não encontrado',
      'Data/Hora Agendamento': appointment.date 
        ? format(new Date(appointment.date), 'dd/MM/yyyy HH:mm')
        : '-',
      'Exames Complementares': appointment.hasAdditionalExams ? 'Sim' : 'Não',
      'Status': statusLabels[appointment.status] || 'Desconhecido',
      'Criado em': appointment.createdAt 
        ? format(new Date(appointment.createdAt), 'dd/MM/yyyy HH:mm')
        : '-',
      'Concluído em': appointment.completedAt 
        ? format(new Date(appointment.completedAt), 'dd/MM/yyyy HH:mm')
        : '-',
      'Cancelado em': appointment.canceledAt 
        ? format(new Date(appointment.canceledAt), 'dd/MM/yyyy HH:mm')
        : '-',
      'Observações': appointment.description || '-',
      'Possui Anexo': appointment.attachmentUrl ? 'Sim' : 'Não',
    }));

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Definir larguras das colunas
    const colWidths = [
      { wch: 5 },   // Nº
      { wch: 25 },  // Empresa
      { wch: 18 },  // CNPJ
      { wch: 15 },  // Telefone Empresa
      { wch: 25 },  // Email Empresa
      { wch: 25 },  // Funcionário
      { wch: 15 },  // CPF
      { wch: 15 },  // Data Nascimento
      { wch: 15 },  // Telefone Funcionário
      { wch: 25 },  // Email Funcionário
      { wch: 20 },  // Setor
      { wch: 20 },  // Cargo
      { wch: 20 },  // Tipo de Exame
      { wch: 18 },  // Data/Hora Agendamento
      { wch: 12 },  // Exames Complementares
      { wch: 12 },  // Status
      { wch: 18 },  // Criado em
      { wch: 18 },  // Concluído em
      { wch: 18 },  // Cancelado em
      { wch: 30 },  // Observações
      { wch: 12 },  // Possui Anexo
    ];

    worksheet['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Agendamentos');

    // Gerar nome do arquivo
    const defaultFilename = month 
      ? `agendamentos-${month}.xlsx`
      : `agendamentos-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    
    const finalFilename = filename || defaultFilename;

    // Fazer download
    XLSX.writeFile(workbook, finalFilename);
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    throw new Error('Falha ao exportar dados para Excel');
  }
};
