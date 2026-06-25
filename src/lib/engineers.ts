import { type Engineer } from './types';

export const ENGINEERS: Engineer[] = [
  { id: 'steven.snyder', name: 'Steven Snyder', level: 'PRINCIPAL_IC', jiraAccountId: '' },
  { id: 'julia.ballo', name: 'Julia Ballo', level: 'SENIOR_IC', jiraAccountId: '712020:22be27ff-b9b2-4a7a-912d-0c1a7efbe0bf' },
  { id: 'agnes.szigethy', name: 'Agnes Szigethy', level: 'SENIOR_IC', jiraAccountId: '712020:7409260c-a008-45cb-ae2b-0575beaac53e' },
  { id: 'michael.murphy', name: 'Michael Murphy', level: 'PRINCIPAL_IC', jiraAccountId: '' },
];

export function getEngineerById(id: string): Engineer | undefined {
  return ENGINEERS.find((e) => e.id === id);
}
