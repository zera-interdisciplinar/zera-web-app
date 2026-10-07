import type { Categoria } from '../../types/categoria'
import type { Modelo } from '../../types/modelo'
import type { Recicladora } from '../../types/relatorio'
import type { Usuario } from '../../types/usuario'

export const categorias: Categoria[] = [
  {
    id: 1,
    codigo: '01',
    nome: 'Notebook',
    descricao: 'Equipamentos portáteis completos, com tela e bateria integradas.',
    diasLimiteDescarte: 120,
    exigeChecklistPericulosidade: true,
  },
  {
    id: 2,
    codigo: '02',
    nome: 'Monitor',
    descricao: 'Telas externas LCD e LED.',
    diasLimiteDescarte: 150,
    exigeChecklistPericulosidade: false,
  },
  {
    id: 3,
    codigo: '03',
    nome: 'Placa-mãe',
    descricao: 'Placas principais de desktops e servidores.',
    diasLimiteDescarte: 180,
    exigeChecklistPericulosidade: false,
  },
  {
    id: 4,
    codigo: '04',
    nome: 'Bateria',
    descricao: 'Baterias de íon-lítio e chumbo-ácido. Resíduo perigoso classe I.',
    diasLimiteDescarte: 60,
    exigeChecklistPericulosidade: true,
  },
  {
    id: 5,
    codigo: '05',
    nome: 'Memória RAM',
    descricao: 'Pentes DDR3, DDR4 e DDR5.',
    diasLimiteDescarte: 180,
    exigeChecklistPericulosidade: false,
  },
  {
    id: 6,
    codigo: '06',
    nome: 'SSD',
    descricao: 'Unidades de estado sólido SATA e NVMe. Exigem apagamento seguro.',
    diasLimiteDescarte: 90,
    exigeChecklistPericulosidade: true,
  },
]

export const modelos: Modelo[] = [
  {
    id: 1,
    categoriaId: 1,
    categoriaNome: 'Notebook',
    fabricante: 'Apple',
    nome: 'MacBook Air M1',
    especificacoes: {
      Processador: 'Apple M1 8 núcleos',
      Memória: '8 GB unificada',
      Armazenamento: 'SSD 256 GB',
      Tela: '13,3" 2560x1600',
    },
    vidaUtilMeses: 84,
  },
  {
    id: 2,
    categoriaId: 1,
    categoriaNome: 'Notebook',
    fabricante: 'Dell',
    nome: 'Inspiron 15 3000',
    especificacoes: {
      Processador: 'Intel Core i5-1135G7',
      Memória: '8 GB DDR4',
      Armazenamento: 'SSD 256 GB NVMe',
      Tela: '15,6" 1920x1080',
    },
    vidaUtilMeses: 60,
  },
  {
    id: 3,
    categoriaId: 2,
    categoriaNome: 'Monitor',
    fabricante: 'LG',
    nome: '24MK430H',
    especificacoes: {
      Painel: 'IPS 23,8"',
      Resolução: '1920x1080',
      Conexões: 'HDMI, VGA',
    },
    vidaUtilMeses: 84,
  },
  {
    id: 4,
    categoriaId: 4,
    categoriaNome: 'Bateria',
    fabricante: 'Dell',
    nome: 'Bateria 6 células 65Wh',
    especificacoes: {
      Química: 'Íon-lítio',
      Capacidade: '65 Wh',
      Tensão: '11,4 V',
      Risco: 'Classe I — inflamável',
    },
    vidaUtilMeses: 36,
  },
  {
    id: 5,
    categoriaId: 5,
    categoriaNome: 'Memória RAM',
    fabricante: 'Kingston',
    nome: 'KVR26N19S6/8 8GB DDR4',
    especificacoes: {
      Capacidade: '8 GB',
      Tipo: 'DDR4 2666 MHz',
      Formato: 'DIMM',
    },
    vidaUtilMeses: 120,
  },
  {
    id: 6,
    categoriaId: 6,
    categoriaNome: 'SSD',
    fabricante: 'Kingston',
    nome: 'A400 480GB SATA',
    especificacoes: {
      Capacidade: '480 GB',
      Interface: 'SATA III',
      Formato: '2,5"',
    },
    vidaUtilMeses: 60,
  },
]

export const usuarios: Usuario[] = [
  {
    id: 1,
    nome: 'Natalia Flores',
    email: 'gestora@example.invalid',
    perfil: 'gestor',
    unidade: 'Operações',
    cargo: 'Gestora',
  },
  {
    id: 2,
    nome: 'Gustavo Amex',
    email: 'funcionario@example.invalid',
    perfil: 'funcionario',
    unidade: 'Almoxarifado central',
  },
  {
    id: 3,
    nome: 'Administrador Zera',
    email: 'admin@example.invalid',
    perfil: 'administrador',
    unidade: 'Matriz',
    cargo: 'Administrador do sistema',
  },
  {
    id: 4,
    nome: 'Rafael Bittar',
    email: 'rafael.bittar@example.invalid',
    perfil: 'funcionario',
    unidade: 'Galpão 2 — triagem',
  },
  {
    id: 5,
    nome: 'Camila Duarte',
    email: 'camila.duarte@example.invalid',
    perfil: 'gestor',
    unidade: 'Unidade Lins',
  },
]


export const responsaveis: string[] = [
  'Gustavo Amex',
  'Natalia Flores',
  'Rafael Bittar',
  'Camila Duarte',
  'João Pedro Vital',
]

export const recicladoras: Recicladora[] = [
  { id: 1, nome: 'Cooperativa Recicla Vale', cnpj: '12.345.678/0001-90', cidade: 'Lins — SP' },
  { id: 2, nome: 'Eco Descarte Ambiental', cnpj: '98.765.432/0001-11', cidade: 'Bauru — SP' },
  { id: 3, nome: 'Coopermetal Reversa', cnpj: '45.678.912/0001-33', cidade: 'Campinas — SP' },
]
