import { type Engineer } from './types';

export const ENGINEERS: Engineer[] = [
  { id: 'steven.snyder', name: 'Steven Snyder', level: 'PRINCIPAL_IC' },
  { id: 'julia.ballo', name: 'Julia Ballo', level: 'SENIOR_IC' },
  { id: 'agnes.szigethy', name: 'Agnes Szigethy', level: 'SENIOR_IC' },
  { id: 'michael.murphy', name: 'Michael Murphy', level: 'PRINCIPAL_IC' },
];

export function getEngineerById(id: string): Engineer | undefined {
  return ENGINEERS.find((e) => e.id === id);
}
