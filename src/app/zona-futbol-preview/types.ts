export interface League {
  name: string;
  code: string;
  color: string;
  accent: string;
  icon: string;
  games?: number;
  players?: number;
}

export interface Feature {
  id: string;
  icon: string;
  title: string;
  desc: string;
  badge?: string;
}

export interface StepItem {
  number: number;
  title: string;
  desc: string;
  stat: number;
  suffix: string;
  icon?: string;
}
