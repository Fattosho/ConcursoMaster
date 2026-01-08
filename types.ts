
export type Banca = 
  | 'FGV' | 'Cebraspe' | 'FCC' | 'Vunesp' | 'Cesgranrio' | 'Instituto AOCP' 
  | 'IBFC' | 'Idecan' | 'Instituto Quadrix' | 'IADES' | 'Selecon' | 'Fundatec' 
  | 'FAURGS' | 'Objetiva Concursos' | 'FEPESE' | 'NC/UFPR' | 'IBAM' | 'Gualimp' 
  | 'Consulplan' | 'FUMARC' | 'Comperve' | 'Fadesp' | 'Cetap' | 'Consulpam' 
  | 'UPENET' | 'Itame' | 'IV/UFG' | 'IDIB' | 'Ivin' | 'Instituto Acesso';

export type Materia = 
  | 'Língua Portuguesa' | 'Matemática' | 'Raciocínio Lógico' | 'Informática' 
  | 'Direito Constitucional' | 'Direito Administrativo' | 'Direito Penal' 
  | 'Direito Processual Penal' | 'Direito Civil' | 'Direito Processual Civil' 
  | 'Direito Tributário' | 'Direito Eleitoral' | 'Direito do Trabalho' 
  | 'Direito Processual do Trabalho' | 'Direito Previdenciário' | 'Administração Pública' 
  | 'Administração Geral' | 'Gestão de Pessoas' | 'Contabilidade Geral' 
  | 'Contabilidade Pública' | 'Auditoria' | 'Estatística' | 'Economia' 
  | 'Arquivologia' | 'Ética no Serviço Público' | 'Atualidades' 
  | 'Língua Inglesa' | 'Língua Espanhola' | 'Políticas Públicas';

export type Nivel = 'Médio' | 'Superior';

export interface Question {
  id: string;
  banca: Banca;
  materia: Materia;
  nivel: Nivel;
  statement: string;
  options: {
    id: string;
    text: string;
  }[];
  correctAnswerId: string;
  explanation: string;
}

export interface UserPerformance {
  totalAnswered: number;
  correctAnswers: number;
  subjectStats: Record<string, { total: number; correct: number }>;
}

export interface EssayFeedback {
  grade: string;
  pros: string[];
  cons: string[];
  tips: string;
  fullAnalysis: string;
}

export interface MnemonicResponse {
  phrase: string;
  meaning: string;
  explanation: string;
}
