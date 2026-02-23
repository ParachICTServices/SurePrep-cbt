export type SubjectId =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'english'
  | 'literature'
  | 'government'
  | 'economics'
  | 'accounting'
  | 'commerce'
  | 'geography'
  | 'civic-education'
  | 'agricultural-science'
  | 'computer-studies'
  | 'crs'
  | 'irs'
  | 'history'
  | 'further-mathematics';

export const SUBJECT_TOPICS: Record<SubjectId, string[]> = {

  mathematics: [
    'Number & Numeration',
    'Algebra',
    'Quadratic Equations',
    'Trigonometry',
    'Mensuration',
    'Geometry',
    'Statistics',
    'Probability',
    'Variation',
    'Logarithms',
    'Coordinate Geometry',
    'Calculus (Introductory)'
  ],

  'further-mathematics': [
    'Matrices & Determinants',
    'Complex Numbers',
    'Advanced Calculus',
    'Differential Equations',
    'Vectors',
    'Mechanics',
    'Statistics (Advanced)'
  ],

  physics: [
    'Measurement & Units',
    'Mechanics',
    'Waves',
    'Heat & Thermodynamics',
    'Light & Optics',
    'Electricity',
    'Magnetism',
    'Atomic & Nuclear Physics',
    'Electronics'
  ],

  chemistry: [
    'Atomic Structure',
    'Periodic Table',
    'Chemical Bonding',
    'Stoichiometry',
    'Acids, Bases & Salts',
    'Organic Chemistry',
    'Hydrocarbons',
    'Electrolysis',
    'Rates of Reaction',
    'Redox Reactions'
  ],

  biology: [
    'Cell Structure',
    'Nutrition',
    'Transport System',
    'Respiration',
    'Excretion',
    'Ecology',
    'Genetics',
    'Evolution',
    'Reproduction',
    'Microorganisms'
  ],

  english: [
    'Comprehension',
    'Lexis & Structure',
    'Oral English',
    'Synonyms & Antonyms',
    'Sentence Interpretation',
    'Essay Writing',
    'Summary Writing',
    'Registers & Idioms'
  ],

  literature: [
    'Poetry Analysis',
    'Drama',
    'Prose',
    'African Literature',
    'Literary Appreciation',
    'Literary Devices'
  ],

  government: [
    'Nigerian Constitution',
    'Arms of Government',
    'Political Ideologies',
    'Electoral Process',
    'Public Administration',
    'Citizenship',
    'International Relations',
    'Military Rule in Nigeria',
    'Democracy & Good Governance'
  ],

  economics: [
    'Basic Economic Concepts',
    'Demand & Supply',
    'Elasticity',
    'Production',
    'Market Structures',
    'National Income',
    'Money & Banking',
    'Inflation',
    'International Trade',
    'Economic Development'
  ],

  accounting: [
    'Principles of Accounting',
    'Double Entry System',
    'Cash Book',
    'Trial Balance',
    'Final Accounts',
    'Depreciation',
    'Control Accounts',
    'Partnership Accounts',
    'Company Accounts'
  ],

  commerce: [
    'Trade',
    'Retail & Wholesale',
    'Banking',
    'Insurance',
    'Transportation',
    'Business Units',
    'Consumer Protection',
    'Advertising'
  ],

  geography: [
    'Map Reading',
    'Latitude & Longitude',
    'Weather & Climate',
    'Rocks & Minerals',
    'Population',
    'Settlement',
    'Transportation',
    'Natural Resources',
    'Environmental Issues'
  ],

  'civic-education': [
    'National Values',
    'Human Rights',
    'Rule of Law',
    'Citizenship',
    'Democracy',
    'Constitution',
    'Political Apathy',
    'Public Service'
  ],

  'agricultural-science': [
    'Crop Production',
    'Animal Husbandry',
    'Soil Science',
    'Farm Tools & Machinery',
    'Agricultural Economics',
    'Fisheries',
    'Forestry',
    'Pest Control'
  ],

  'computer-studies': [
    'Computer Hardware',
    'Software',
    'Operating Systems',
    'Data Processing',
    'Programming Basics',
    'Internet & Networking',
    'Database',
    'ICT Applications'
  ],

  crs: [
    'Creation',
    'Leadership',
    'Prophets',
    'Teachings of Jesus',
    'Parables',
    'Miracles',
    'Early Church',
    'Christian Living'
  ],

  irs: [
    'Tawhid',
    'Prophethood',
    'Quran',
    'Hadith',
    'Sharia',
    'Islamic Moral Teachings',
    'Pillars of Islam'
  ],

  history: [
    'Pre-Colonial Nigeria',
    'Trans-Atlantic Slave Trade',
    'Colonial Administration',
    'Nationalism',
    'Independence',
    'Civil War',
    'Military Rule',
    'Modern Nigeria'
  ]
};


export function getTopicsForSubject(subjectId: string): string[] {
  return SUBJECT_TOPICS[subjectId as SubjectId] || [];
}


export function formatTopicId(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-');
}