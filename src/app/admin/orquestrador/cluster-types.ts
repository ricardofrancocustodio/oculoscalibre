export interface ClusterPost {
  titulo: string;
  keyword: string;
  intencao: 'informacional' | 'comercial' | 'transacional';
  resumo: string;
  siloPath: string;
  tipo: 'pilar' | 'suporte';
  linkaPara: string[];
}

export interface PostCluster {
  topico: string;
  pilar: ClusterPost;
  suportes: ClusterPost[];
}
