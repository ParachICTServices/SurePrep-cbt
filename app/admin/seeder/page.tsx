"use client";
import { useState } from "react";
import { doc, setDoc, serverTimestamp, getDocs, query, where, collection, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { Loader2, ListTree, Tag, CheckCircle, Search, Wand2, Trash2 } from "lucide-react";
import { toast } from "sonner";

// ─── SUBJECT TOPICS ───────────────────────────────────────────────────────────
const SUBJECT_TOPICS: Record<string, string[]> = {
  mathematics: [
    'Numbers & Arithmetic', 'Ratio & Proportion', 'Indices, Logs & Surds', 'Sets',
    'Algebraic Expressions', 'Factorization', 'Quadratic Equations', 'Simultaneous Equations',
    'Graphs', 'Rational Expressions', 'Inequalities', 'Geometry', 'Trigonometry',
    'Calculus', 'Statistics', 'Probability', 'Vectors'
  ],
  physics: [
    'Measurement & Units', 'Motion', 'Equilibrium of Forces', 'Work, Energy & Power',
    'Simple Machines', 'Elasticity', 'Hydrostatics', 'Temperature & Thermal Expansion',
    'Heat & Vapours', 'Molecular Theory', 'Waves & Sound', 'Light (Reflection/Refraction)',
    'Electrostatics', 'Current Electricity', 'Magnetism', 'Electromagnetism', 'Atomic Physics'
  ],
  chemistry: [
    'Particulate Nature of Matter', 'Stoichiometry', 'Gas Laws', 'Atomic Structure',
    'Periodic Table', 'Chemical Bonding', 'Thermodynamics', 'Chemical Kinetics',
    'Equilibrium', 'Acids, Bases & Salts', 'Electrochemistry', 'Organic Chemistry',
    'Metals & Non-Metals', 'Nuclear Chemistry'
  ],
  biology: [
    'Living Organisms', 'Cell Biology', 'Nutrition', 'Transport System',
    'Respiration', 'Excretion', 'Regulation & Homeostasis', 'Reproduction',
    'Genetics', 'Ecology', 'Evolution'
  ],
  english: [
    'Oral English', 'Comprehension', 'Summary', 'Lexis & Structure', 'Essay Writing'
  ],
  literature: [
    'Drama', 'Prose', 'Poetry', 'Shakespeare', 'Literary Appreciation',
    'African Literature', 'Non-African Literature'
  ],
  economics: [
    'Basic Concepts', 'Economic Systems', 'Production', 'Market Structures',
    'Money & Inflation', 'Financial Institutions', 'Public Finance',
    'International Trade', 'Economic Development'
  ],
  government: [
    'Concepts of Government', 'Political Parties', 'Electoral Process',
    'Public Administration', 'Pre-Colonial Administration', 'Colonial Administration',
    'Constitutional Development', 'International Organizations'
  ],
  accounting: [
    'Book Keeping', 'Final Accounts', 'Partnership', 'Company Accounts',
    'Public Sector Accounting', 'Manufacturing Accounts'
  ],
  commerce: [
    'Occupation', 'Trade', 'Business Organization', 'Banking & Finance',
    'Transportation', 'Communication', 'Insurance', 'Advertising', 'Marketing'
  ]
};

// ─── KEYWORD MAP ──────────────────────────────────────────────────────────────
const TOPIC_KEYWORDS: Record<string, Record<string, string[]>> = {
  mathematics: {
    'quadratic-equations':      ['quadratic', 'x²', 'x^2', 'discriminant', 'completing the square'],
    'simultaneous-equations':   ['simultaneous', 'solve the equations', 'find x and y'],
    'indices,-logs-&-surds':    ['logarithm', 'log ', 'ln ', 'indices', 'surd', 'index', 'exponent', 'laws of indices'],
    'ratio-&-proportion':       ['ratio', 'proportion', 'direct variation', 'inverse variation', 'shared in ratio'],
    'numbers-&-arithmetic':     ['lcm', 'hcf', 'prime', 'integer', 'decimal', 'place value', 'divisib', 'number line', 'base ten'],
    'sets':                     ['union', 'intersection', 'complement', 'subset', 'venn', 'universal set'],
    'algebraic-expressions':    ['expand', 'simplify', 'expression', 'polynomial', 'binomial', 'algebraic'],
    'factorization':            ['factoris', 'factori', 'common factor', 'difference of two squares'],
    'graphs':                   ['graph', 'gradient', 'slope', 'intercept', 'plot', 'sketch', 'coordinate'],
    'rational-expressions':     ['rational', 'partial fraction', 'numerator', 'denominator'],
    'inequalities':             ['inequality', 'inequalities', 'greater than', 'less than', 'range of values'],
    'geometry':                 ['angle', 'triangle', 'circle', 'polygon', 'perimeter', 'area', 'volume',
                                  'rectangle', 'square', 'parallel', 'perpendicular', 'chord', 'tangent',
                                  'arc', 'sector', 'diameter', 'radius', 'circumference', 'cube', 'cylinder',
                                  'cone', 'sphere', 'prism', 'bearing', 'locus'],
    'trigonometry':             ['sin', 'cos', 'tan', 'trigon', 'angle of elevation', 'angle of depression',
                                  'cosine rule', 'sine rule', 'pythagoras'],
    'calculus':                 ['differentiat', 'integrat', 'dy/dx', 'derivative', 'rate of change', 'd/dx', 'turning point'],
    'statistics':               ['mean', 'median', 'mode', 'average', 'frequency', 'histogram', 'variance',
                                  'standard deviation', 'ogive', 'class interval'],
    'probability':              ['probability', 'likely', 'chance', 'random', 'sample space', 'dice', 'coin', 'draw a ball'],
    'vectors':                  ['vector', 'magnitude', 'position vector', 'resultant'],
  },
  physics: {
    // ✅ Legacy topic IDs — kept so old questions get retagged correctly
    'mechanics': [
      'velocity', 'acceleration', 'speed', 'momentum', 'force', 'newton',
      'inertia', 'projectile', 'displacement', 'dynamics', 'kinetics',
      'scalar quantity', 'vector quantity', 'friction', 'impulse'
    ],
    'electricity-and-magnetism': [
      'electric current', 'potential difference', 'resistance', 'ohm',
      'circuit diagram', 'magnetic flux', 'electromagnetic field',
      'galvanometer', 'ammeter', 'voltmeter', 'series circuit', 'parallel circuit'
    ],
    'thermodynamics': [
      'heat', 'temperature', 'thermal', 'specific heat capacity', 'latent heat',
      'conduction', 'convection', 'radiation', 'thermal expansion',
      'thermometer', 'calorimeter', 'heat transfer', 'boiling point', 'melting point'
    ],
    // ✅ Current correct topic IDs
    'motion':                           ['velocity', 'acceleration', 'speed', 'displacement', 'projectile',
                                         'momentum', 'inertia', 'uniform motion', 'equations of motion',
                                         'distance-time', 'velocity-time', 'newton\'s law'],
    'work,-energy-&-power':             ['work done', 'kinetic energy', 'potential energy', 'power', 'joule', 'watt',
                                         'energy conversion', 'mechanical energy', 'conservation of energy'],
    'waves-&-sound':                    ['wave', 'frequency', 'wavelength', 'amplitude', 'sound', 'echo',
                                         'resonance', 'pitch', 'transverse', 'longitudinal', 'hertz'],
    'current-electricity':              ['current', 'voltage', 'resistance', 'ohm', 'circuit', 'resistor',
                                         'ammeter', 'voltmeter', 'kirchhoff', 'electromotive force', 'e.m.f',
                                         'internal resistance', 'electrical power', 'watt'],
    'electrostatics':                   ['charge', 'electric field', 'coulomb', 'static electricity',
                                         'electrostatic', 'capacitor', 'capacitance', 'electric potential'],
    'magnetism':                        ['magnet', 'magnetic field', 'compass', 'flux', 'pole',
                                         'magnetic force', 'permanent magnet', 'ferromagnetic'],
    'electromagnetism':                 ['electromagnetic', 'induction', 'motor', 'generator', 'transformer',
                                         'faraday', 'lenz', 'solenoid', 'coil', 'induced emf'],
    'light-(reflection/refraction)':    ['light', 'reflection', 'refraction', 'mirror', 'lens', 'focal',
                                         'ray', 'prism', 'total internal reflection', 'critical angle',
                                         'concave', 'convex', 'image', 'snell'],
    'measurement-&-units':              ['si unit', 'dimension', 'scalar', 'significant figure',
                                         'unit of measurement', 'base unit', 'derived unit', 'vernier',
                                         'micrometer', 'precision', 'accuracy'],
    'atomic-physics':                   ['nucleus', 'electron', 'proton', 'neutron', 'radioactive',
                                         'decay', 'half-life', 'nuclear', 'alpha', 'beta', 'gamma',
                                         'fission', 'fusion', 'isotope', 'atomic number', 'mass number'],
    'hydrostatics':                     ['pressure', 'fluid', 'density', 'upthrust', 'archimedes',
                                         'buoyancy', 'pascal', 'hydraulic', 'liquid pressure',
                                         'relative density', 'specific gravity'],
    'elasticity':                       ['elastic', 'stress', 'strain', 'hooke', 'spring', 'extension',
                                         'young modulus', 'elastic limit', 'deformation', 'compression'],
    'simple-machines':                  ['lever', 'pulley', 'gear', 'mechanical advantage', 'velocity ratio',
                                         'inclined plane', 'wedge', 'screw', 'efficiency of machine',
                                         'effort', 'load'],
    'equilibrium-of-forces':            ['equilibrium', 'moment', 'torque', 'tension', 'resultant force',
                                         'turning effect', 'center of gravity', 'couple', 'beam',
                                         'principle of moments'],
    'temperature-&-thermal-expansion':  ['thermal expansion', 'temperature', 'thermometer', 'celsius',
                                         'kelvin', 'fahrenheit', 'linear expansion', 'volume expansion',
                                         'coefficient of expansion', 'bimetallic'],
    'heat-&-vapours':                   ['latent heat', 'specific heat', 'vapour', 'evaporation',
                                         'saturated vapour', 'humidity', 'dew point', 'boiling',
                                         'condensation', 'calorimetry'],
    'molecular-theory':                 ['brownian motion', 'kinetic theory', 'molecule', 'diffusion',
                                         'surface tension', 'viscosity', 'cohesion', 'adhesion',
                                         'intermolecular'],
  },
  chemistry: {
    'organic-chemistry':                ['organic', 'hydrocarbon', 'alkane', 'alkene', 'alkyne', 'alcohol',
                                         'ester', 'carboxylic', 'functional group', 'isomer', 'polymer'],
    'acids,-bases-&-salts':             ['acid', 'base', 'salt', 'neutrali', 'ph', 'indicator', 'alkali', 'titration'],
    'electrochemistry':                 ['electrolysis', 'electrode', 'cathode', 'anode', 'electrolyte'],
    'atomic-structure':                 ['atomic number', 'mass number', 'orbital', 'electron shell', 'atomic structure'],
    'periodic-table':                   ['periodic table', 'group', 'period', 'transition metal'],
    'chemical-bonding':                 ['ionic bond', 'covalent bond', 'metallic bond', 'van der waals', 'hydrogen bond'],
    'stoichiometry':                    ['mole', 'molar mass', 'stoichiometr', 'yield', 'limiting reagent'],
    'gas-laws':                         ['gas law', 'boyle', 'charles', 'ideal gas', 'avogadro'],
    'thermodynamics':                   ['enthalpy', 'exothermic', 'endothermic', 'heat of reaction', 'bond energy', 'hess'],
    'chemical-kinetics':                ['rate of reaction', 'catalyst', 'activation energy', 'collision theory'],
    'equilibrium':                      ['equilibrium', 'reversible reaction', 'le chatelier'],
    'metals-&-non-metals':              ['alloy', 'corrosion', 'rusting', 'extraction of metal'],
    'nuclear-chemistry':                ['nuclear', 'radioactive', 'fission', 'fusion', 'half-life'],
    'particulate-nature-of-matter':     ['diffusion', 'brownian motion', 'kinetic theory', 'particulate'],
  },
  biology: {
    'cell-biology':                     ['cell wall', 'cell membrane', 'nucleus', 'organelle', 'mitochondria',
                                         'chloroplast', 'osmosis', 'diffusion'],
    'genetics':                         ['gene', 'chromosome', 'dna', 'rna', 'allele', 'dominant', 'recessive',
                                         'genotype', 'phenotype', 'mutation'],
    'ecology':                          ['ecosystem', 'food chain', 'food web', 'habitat', 'population', 'biotic', 'abiotic'],
    'reproduction':                     ['fertilisation', 'gamete', 'sperm', 'ovum', 'embryo', 'pollination', 'seed dispersal'],
    'nutrition':                        ['carbohydrate', 'protein', 'vitamin', 'mineral', 'diet', 'digestion', 'enzyme', 'nutrient'],
    'transport-system':                 ['blood', 'heart', 'artery', 'vein', 'capillary', 'circulation',
                                         'xylem', 'phloem', 'transpiration'],
    'respiration':                      ['respiration', 'oxygen', 'carbon dioxide', 'atp', 'glycolysis',
                                         'aerobic', 'anaerobic', 'breathing'],
    'excretion':                        ['excretion', 'kidney', 'urine', 'urea', 'nephron', 'filtration'],
    'regulation-&-homeostasis':         ['homeostasis', 'hormone', 'nervous system', 'neuron', 'reflex', 'insulin', 'glucagon'],
    'evolution':                        ['natural selection', 'adaptation', 'darwin', 'variation', 'fossil'],
    'living-organisms':                 ['kingdom', 'classification', 'taxonomy', 'bacteria', 'fungi', 'virus', 'protist'],
  },
  english: {
    'oral-english': [
      'stress', 'intonation', 'phoneme', 'vowel', 'consonant', 'syllable',
      'rhyme', 'pronunciation', 'spoken', 'sound', 'tone', 'accent',
      'voiced', 'voiceless', 'nasal', 'plosive', 'fricative', 'diphthong',
      'word stress', 'sentence stress', 'rhythm', 'pitch'
    ],
    'comprehension': [
      'passage', 'according to the passage', 'from the passage', 'the author',
      'the writer', 'the text', 'what does the writer', 'what is the main idea',
      'best title', 'the passage suggests', 'in the passage', 'read the',
      'the tone of', 'the mood of', 'infer', 'implied', 'the theme'
    ],
    'summary': [
      'summarize', 'summary', 'in your own words', 'note form',
      'list the points', 'points made', 'from the passage above'
    ],
    'lexis-&-structure': [
      'synonym', 'antonym', 'closest in meaning', 'opposite in meaning',
      'word that best', 'fill in the blank', 'choose the word',
      'complete the sentence', 'correct form', 'tense', 'plural',
      'singular', 'verb', 'noun', 'adjective', 'adverb', 'preposition',
      'conjunction', 'pronoun', 'article', 'modal', 'passive', 'active voice',
      'relative clause', 'conditional', 'gerund', 'infinitive', 'participle',
      'subject', 'predicate', 'clause', 'phrase', 'sentence structure',
      'grammatically', 'correct option', 'which of the following',
      'error', 'most appropriate', 'best completes'
    ],
    'essay-writing': [
      'essay', 'write a letter', 'write an article', 'write a speech',
      'formal letter', 'informal letter', 'narrative', 'descriptive',
      'expository', 'argumentative', 'introduction', 'conclusion',
      'paragraph', 'composition', 'write about'
    ],
  },
  accounting: {
    'book-keeping': [
      'ledger', 'journal', 'double entry', 'debit', 'credit', 'posting',
      'trial balance', 'folio', 'source document', 'invoice', 'receipt',
      'cash book', 'petty cash', 'day book', 'book of original entry',
      'subsidiary book', 'opening entry', 'closing entry'
    ],
    'final-accounts': [
      'trading account', 'profit and loss', 'balance sheet', 'income statement',
      'gross profit', 'net profit', 'capital', 'liability', 'asset',
      'current asset', 'fixed asset', 'accrual', 'prepayment', 'depreciation',
      'provision', 'bad debt', 'stock', 'closing stock', 'opening stock',
      'cost of sales', 'revenue', 'expense', 'appropriation'
    ],
    'partnership': [
      'partnership', 'partner', 'profit sharing', 'goodwill', 'admission',
      'dissolution', 'revaluation', 'capital account', 'current account',
      'drawings', 'interest on capital', 'salary to partner', 'joint venture'
    ],
    'company-accounts': [
      'company', 'shareholder', 'share capital', 'ordinary share', 'preference share',
      'debenture', 'dividend', 'retained earnings', 'reserve', 'bonus issue',
      'rights issue', 'public limited', 'private limited', 'prospectus',
      'annual report', 'directors'
    ],
    'public-sector-accounting': [
      'government account', 'public sector', 'consolidated fund', 'budget',
      'appropriation', 'warrant', 'vote', 'auditor general', 'public fund',
      'statutory expenditure', 'recurrent expenditure', 'capital expenditure'
    ],
    'manufacturing-accounts': [
      'manufacturing', 'factory', 'cost of production', 'prime cost',
      'factory overhead', 'work in progress', 'raw material', 'direct labour',
      'indirect cost', 'production cost', 'cost account', 'manufacturing profit'
    ],
  },
  commerce: {
    'occupation': [
      'occupation', 'profession', 'trade', 'industry', 'commerce',
      'direct service', 'indirect service', 'extractive', 'constructive',
      'manufacturing', 'type of production'
    ],
    'trade': [
      'home trade', 'foreign trade', 'import', 'export', 'entrepot',
      'retail', 'wholesale', 'retailer', 'wholesaler', 'middleman',
      'chain of distribution', 'barter', 'counter trade'
    ],
    'business-organization': [
      'sole trader', 'partnership', 'cooperative', 'public corporation',
      'limited liability', 'memorandum', 'articles of association',
      'incorporation', 'franchise', 'merger', 'acquisition', 'conglomerate'
    ],
    'banking-&-finance': [
      'bank', 'central bank', 'commercial bank', 'savings', 'loan',
      'interest', 'overdraft', 'mortgage', 'cheque', 'credit card',
      'debit card', 'letter of credit', 'bill of exchange', 'promissory note'
    ],
    'transportation': [
      'transport', 'road', 'rail', 'air', 'water', 'pipeline',
      'freight', 'cargo', 'shipping', 'haulage', 'warehousing',
      'container', 'bill of lading', 'consignment'
    ],
    'communication': [
      'communication', 'telephone', 'internet', 'postal', 'telegraph',
      'email', 'fax', 'media', 'broadcast', 'satellite', 'network'
    ],
    'insurance': [
      'insurance', 'premium', 'policy', 'insurer', 'insured', 'claim',
      'indemnity', 'subrogation', 'contribution', 'proximate cause',
      'life assurance', 'fire insurance', 'marine insurance', 'cover note'
    ],
    'advertising': [
      'advertising', 'advertisement', 'media', 'promotion', 'publicity',
      'brand', 'slogan', 'target audience', 'sales promotion', 'public relations'
    ],
    'marketing': [
      'marketing', 'market research', 'consumer', 'demand', 'supply',
      'pricing', 'distribution channel', 'product', 'place', 'price',
      'promotion', 'market segmentation', 'branding', 'packaging'
    ],
  },
  economics: {
    'basic-concepts': [
      'scarcity', 'opportunity cost', 'scale of preference', 'wants',
      'needs', 'economics', 'factors of production', 'land', 'labour',
      'capital', 'entrepreneur', 'utility', 'wealth', 'income'
    ],
    'economic-systems': [
      'capitalism', 'socialism', 'mixed economy', 'free market',
      'command economy', 'planned economy', 'price mechanism',
      'private sector', 'public sector', 'nationalization', 'privatization'
    ],
    'production': [
      'production', 'productivity', 'division of labour', 'specialization',
      'scale of production', 'returns to scale', 'cost of production',
      'fixed cost', 'variable cost', 'average cost', 'marginal cost',
      'total cost', 'revenue', 'profit', 'loss', 'break even'
    ],
    'market-structures': [
      'monopoly', 'oligopoly', 'perfect competition', 'monopolistic',
      'price discrimination', 'cartel', 'market power', 'firm',
      'industry', 'demand curve', 'supply curve', 'equilibrium price',
      'elasticity', 'price ceiling', 'price floor'
    ],
    'money-&-inflation': [
      'money', 'inflation', 'deflation', 'currency', 'barter',
      'purchasing power', 'consumer price', 'hyperinflation', 'stagflation',
      'money supply', 'velocity of money', 'quantity theory'
    ],
    'financial-institutions': [
      'central bank', 'commercial bank', 'development bank', 'stock exchange',
      'insurance company', 'pension fund', 'microfinance', 'monetary policy',
      'interest rate', 'reserve requirement', 'open market operation'
    ],
    'public-finance': [
      'government expenditure', 'taxation', 'tax', 'fiscal policy',
      'budget deficit', 'budget surplus', 'national debt', 'subsidy',
      'transfer payment', 'public goods', 'externality', 'merit goods'
    ],
    'international-trade': [
      'international trade', 'balance of payment', 'balance of trade',
      'exchange rate', 'tariff', 'quota', 'embargo', 'dumping',
      'comparative advantage', 'absolute advantage', 'terms of trade',
      'foreign exchange', 'devaluation', 'revaluation', 'current account'
    ],
    'economic-development': [
      'economic development', 'gdp', 'gnp', 'per capita income',
      'standard of living', 'poverty', 'unemployment', 'industrialization',
      'foreign aid', 'foreign investment', 'developing country', 'infrastructure'
    ],
  },
  government: {
    'concepts-of-government': [
      'government', 'state', 'sovereignty', 'constitution', 'democracy',
      'autocracy', 'oligarchy', 'federal', 'unitary', 'confederal',
      'separation of powers', 'rule of law', 'legitimacy', 'authority', 'power'
    ],
    'political-parties': [
      'political party', 'party system', 'one party', 'two party', 'multi party',
      'manifesto', 'ideology', 'pressure group', 'interest group', 'lobby',
      'opposition', 'ruling party', 'primary election', 'candidate'
    ],
    'electoral-process': [
      'election', 'voting', 'ballot', 'suffrage', 'franchise', 'electorate',
      'constituency', 'proportional representation', 'first past the post',
      'referendum', 'plebiscite', 'electoral commission', 'rigging', 'independent'
    ],
    'public-administration': [
      'civil service', 'bureaucracy', 'minister', 'ministry', 'department',
      'public servant', 'cabinet', 'executive', 'legislature', 'judiciary',
      'local government', 'council', 'public policy', 'administration'
    ],
    'pre-colonial-administration': [
      'pre-colonial', 'traditional', 'emirate', 'obship', 'chieftaincy',
      'council of elders', 'age grade', 'obi', 'oba', 'emir', 'igbo',
      'yoruba', 'hausa', 'fulani', 'kingship', 'traditional ruler'
    ],
    'colonial-administration': [
      'colonial', 'british', 'indirect rule', 'direct rule', 'lugard',
      'protectorate', 'amalgamation', 'governor general', 'native authority',
      'warrant chief', 'crown colony', 'mandate territory'
    ],
    'constitutional-development': [
      'constitution', 'clifford', 'richards', 'macpherson', 'lyttleton',
      'independence', 'republic', 'federal', 'amendment', 'bill of rights',
      'fundamental rights', 'entrenchment', 'constituent assembly'
    ],
    'international-organizations': [
      'united nations', 'african union', 'ecowas', 'commonwealth',
      'nato', 'opec', 'world bank', 'imf', 'wto', 'security council',
      'general assembly', 'peacekeeping', 'sanctions', 'diplomatic'
    ],
  },
  literature: {
    'drama': [
      'play', 'playwright', 'dialogue', 'scene', 'act', 'stage direction',
      'tragedy', 'comedy', 'protagonist', 'antagonist', 'conflict',
      'dramatic irony', 'soliloquy', 'aside', 'monologue', 'climax'
    ],
    'prose': [
      'novel', 'short story', 'narrator', 'plot', 'character', 'setting',
      'theme', 'point of view', 'first person', 'third person', 'flashback',
      'foreshadowing', 'figurative language', 'diction', 'prose fiction'
    ],
    'poetry': [
      'poem', 'poet', 'verse', 'stanza', 'rhyme scheme', 'metre', 'rhythm',
      'imagery', 'metaphor', 'simile', 'personification', 'alliteration',
      'onomatopoeia', 'ode', 'sonnet', 'lyric', 'epic', 'ballad'
    ],
    'shakespeare': [
      'shakespeare', 'hamlet', 'othello', 'macbeth', 'romeo', 'juliet',
      'merchant of venice', 'midsummer', 'king lear', 'elizabethan'
    ],
    'literary-appreciation': [
      'literary device', 'tone', 'mood', 'style', 'structure', 'form',
      'genre', 'satire', 'allegory', 'symbolism', 'irony', 'paradox',
      'hyperbole', 'euphemism', 'oxymoron', 'literary criticism'
    ],
    'african-literature': [
      'chinua achebe', 'wole soyinka', 'ngugi', 'buchi emecheta', 'chimamanda',
      'things fall apart', 'african writer', 'postcolonial', 'oral tradition',
      'african novel', 'negritude', 'africa'
    ],
    'non-african-literature': [
      'charles dickens', 'jane austen', 'george orwell', 'hemingway',
      'american literature', 'british literature', 'european literature',
      'victorian', 'modernism', 'postmodernism', 'western literature'
    ],
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function assignTopics(subject: string, questionText: string, explanation: string = ""): string[] {
  const keywordMap = TOPIC_KEYWORDS[subject];
  if (!keywordMap) return [];
  const text = (questionText + " " + explanation).toLowerCase();
  const matched: string[] = [];
  for (const [topicId, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      matched.push(topicId);
    }
  }
  return matched;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function TopicSeeder() {
  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("mathematics");

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev]);
  const isBusy = loading || auditing || tagging || clearing || clearingAll;

  // ─── AUDIT ─────────────────────────────────────────────────────────────────
  const auditTopics = async () => {
    setAuditing(true);
    setLogs([]);
    addLog(`🔍 Auditing: ${selectedSubject}...`);
    try {
      const snap = await getDocs(
        query(collection(db, "questions"), where("subject", "==", selectedSubject))
      );
      addLog(`📦 ${snap.size} total questions found`);

      let noTopics = 0;
      const topicCounts: Record<string, number> = {};

      snap.docs.forEach(d => {
        const topics = d.data().topics;
        if (!topics || !Array.isArray(topics) || topics.length === 0) {
          noTopics++;
        } else {
          topics.forEach((t: string) => {
            topicCounts[t] = (topicCounts[t] || 0) + 1;
          });
        }
      });

      if (noTopics > 0) addLog(`⚠️  ${noTopics} questions have NO topics — run Auto-Tag to fix`);

      const sorted = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) {
        addLog("❌ No topics found on any questions.");
      } else {
        addLog(`✅ ${sorted.length} unique topic(s) in DB:`);
        addLog("─────────────────────────────────");
        sorted.forEach(([t, c]) => addLog(`  "${t}"  →  ${c} question${c > 1 ? 's' : ''}`));
        addLog("─────────────────────────────────");
      }
    } catch (e: any) {
      addLog(`❌ ${e.message}`);
    } finally {
      setAuditing(false);
    }
  };

  // ─── CLEAR GENERAL TAGS ────────────────────────────────────────────────────
  const clearGeneralTags = async () => {
    setClearing(true);
    setLogs([]);
    addLog(`🧹 Clearing "general" tags for: ${selectedSubject}...`);
    try {
      const snap = await getDocs(
        query(collection(db, "questions"), where("subject", "==", selectedSubject))
      );

      const generalDocs = snap.docs.filter(d => {
        const t = d.data().topics;
        return Array.isArray(t) && t.length === 1 && t[0] === "general";
      });

      addLog(`📦 Found ${generalDocs.length} questions tagged only "general"`);

      if (generalDocs.length === 0) {
        addLog("✅ Nothing to clear.");
        return;
      }

      const batches = chunkArray(generalDocs, 20);
      for (let i = 0; i < batches.length; i++) {
        await Promise.all(
          batches[i].map(d =>
            updateDoc(doc(db, "questions", d.id), { topics: [] })
          )
        );
        addLog(`⏳ Cleared batch ${i + 1}/${batches.length}`);
        if (i < batches.length - 1) await sleep(500);
      }

      addLog("─────────────────────────────────");
      addLog(`✅ Cleared ${generalDocs.length} "general" tags.`);
      addLog("🎉 Now run Auto-Tag to re-process these questions.");
      toast.success(`Cleared ${generalDocs.length} general tags!`);
    } catch (e: any) {
      addLog(`❌ ${e.message}`);
      toast.error("Clear failed");
    } finally {
      setClearing(false);
    }
  };

  // ─── CLEAR ALL TAGS ────────────────────────────────────────────────────────
  // ✅ NEW: Wipes ALL tags so you can retag from scratch with corrected keywords
  const clearAllTags = async () => {
    setClearingAll(true);
    setLogs([]);
    addLog(`🧹 Clearing ALL tags for: ${selectedSubject}...`);
    addLog(`⚠️  This will reset every question — use before a full retag`);
    try {
      const snap = await getDocs(
        query(collection(db, "questions"), where("subject", "==", selectedSubject))
      );

      const taggedDocs = snap.docs.filter(d => {
        const t = d.data().topics;
        return Array.isArray(t) && t.length > 0;
      });

      addLog(`📦 Found ${taggedDocs.length} tagged questions — clearing all...`);

      if (taggedDocs.length === 0) {
        addLog("✅ Nothing to clear — all questions already untagged.");
        return;
      }

      const batches = chunkArray(taggedDocs, 20);
      for (let i = 0; i < batches.length; i++) {
        await Promise.all(
          batches[i].map(d =>
            updateDoc(doc(db, "questions", d.id), { topics: [] })
          )
        );
        addLog(`⏳ Cleared batch ${i + 1}/${batches.length}`);
        if (i < batches.length - 1) await sleep(500);
      }

      addLog("─────────────────────────────────");
      addLog(`✅ Cleared ALL tags from ${taggedDocs.length} questions.`);
      addLog("🎉 Now run Auto-Tag to re-process with updated keywords.");
      toast.success(`Cleared all tags for ${selectedSubject}!`);
    } catch (e: any) {
      addLog(`❌ ${e.message}`);
      toast.error("Clear All failed");
    } finally {
      setClearingAll(false);
    }
  };

  // ─── AUTO-TAG (BATCHED) ────────────────────────────────────────────────────
  const autoTagQuestions = async () => {
    setTagging(true);
    setLogs([]);
    addLog(`🤖 Auto-tagging untagged questions for: ${selectedSubject}...`);
    try {
      const snap = await getDocs(
        query(collection(db, "questions"), where("subject", "==", selectedSubject))
      );
      addLog(`📦 ${snap.size} total questions fetched`);

      let skipped = 0;
      let tagged = 0;
      let unmatched = 0;
      const topicTally: Record<string, number> = {};

      const toTag: { id: string; assigned: string[] }[] = [];

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const existing = data.topics;
        if (existing && Array.isArray(existing) && existing.length > 0) {
          skipped++;
          continue;
        }
        const assigned = assignTopics(selectedSubject, data.questionText || "", data.explanation || "");
        toTag.push({ id: docSnap.id, assigned });
      }

      addLog(`⏭️  Already tagged (skipping): ${skipped}`);
      addLog(`📝 ${toTag.length} questions need tagging — processing in batches of 20...`);
      addLog("─────────────────────────────────");

      const batches = chunkArray(toTag, 20);

      for (let i = 0; i < batches.length; i++) {
        await Promise.all(
          batches[i].map(async ({ id, assigned }) => {
            if (assigned.length === 0) {
              unmatched++;
              await updateDoc(doc(db, "questions", id), { topics: ["general"] });
            } else {
              await updateDoc(doc(db, "questions", id), { topics: assigned });
              assigned.forEach(t => { topicTally[t] = (topicTally[t] || 0) + 1; });
              tagged++;
            }
          })
        );
        addLog(`⏳ Batch ${i + 1}/${batches.length} done — ${Math.min((i + 1) * 20, toTag.length)}/${toTag.length} processed`);
        if (i < batches.length - 1) await sleep(500);
      }

      addLog("─────────────────────────────────");
      addLog(`✅ Successfully tagged: ${tagged}`);
      addLog(`⚠️  No keyword match (tagged "general"): ${unmatched}`);
      addLog("─────────────────────────────────");
      addLog("Topics assigned breakdown:");
      Object.entries(topicTally)
        .sort((a, b) => b[1] - a[1])
        .forEach(([t, c]) => addLog(`  ${t}  →  ${c}`));
      addLog("─────────────────────────────────");
      addLog("🎉 Done! Run Audit to verify results.");
      toast.success(`Tagged ${tagged} questions for ${selectedSubject}!`);
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
      toast.error("Auto-tag failed");
    } finally {
      setTagging(false);
    }
  };

  // ─── SYNC SUBJECTS ─────────────────────────────────────────────────────────
  const updateTopicsOnly = async () => {
    setLoading(true);
    setLogs([]);
    addLog("🚀 Syncing topic lists to subjects collection...");
    try {
      let count = 0;
      for (const [subjectId, topicsList] of Object.entries(SUBJECT_TOPICS)) {
        await setDoc(doc(db, "subjects", subjectId), {
          topics: topicsList,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        count++;
        addLog(`✅ ${subjectId}: ${topicsList.length} topics synced`);
      }
      addLog(`🎉 Done! Updated ${count} subjects.`);
      toast.success("Topics synced!");
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
      toast.error("Sync failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ListTree size={32} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Topic Manager</h1>
            <p className="text-slate-500 text-sm">
              Audit, auto-tag, and sync topics across your question bank.
            </p>
          </div>

          {/* Subject Selector */}
          <div className="mb-6">
            <label className="text-sm font-bold text-slate-700 block mb-2">Select Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isBusy}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {Object.keys(SUBJECT_TOPICS).map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">

            {/* Step 1 — Audit */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider">Step 1</p>
              <button onClick={auditTopics} disabled={isBusy}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md">
                {auditing ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                Audit
              </button>
            </div>

            {/* Step 2 — Clear General */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider">Step 2a</p>
              <button onClick={clearGeneralTags} disabled={isBusy}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md">
                {clearing ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                Clear General
              </button>
            </div>

            {/* Step 2b — Clear ALL ✅ NEW */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider">Step 2b</p>
              <button onClick={clearAllTags} disabled={isBusy}
                className="w-full bg-red-800 hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md">
                {clearingAll ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Step 3 — Auto-Tag */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider">Step 3</p>
              <button onClick={autoTagQuestions} disabled={isBusy}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md">
                {tagging ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                Auto-Tag
              </button>
            </div>

            {/* Step 4 — Sync */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider">Step 4</p>
              <button onClick={updateTopicsOnly} disabled={isBusy}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Tag size={16} />}
                Sync
              </button>
            </div>
          </div>

          {/* Log Panel */}
          <div className="bg-slate-900 rounded-xl p-4 h-80 overflow-y-auto font-mono text-xs border border-slate-700 shadow-inner">
            {logs.length === 0 ? (
              <p className="text-slate-500 text-center mt-28">Select a subject and run Audit first...</p>
            ) : (
              logs.map((log, i) => (
                <p key={i} className={`mb-1 leading-relaxed ${
                  log.includes("❌") ? "text-red-400" :
                  log.includes("✅") ? "text-emerald-400" :
                  log.includes("⚠️") ? "text-amber-400" :
                  log.includes("🎉") || log.includes("🤖") ? "text-yellow-300 font-bold" :
                  log.includes("⏳") ? "text-blue-300" :
                  log.includes("🧹") ? "text-orange-300" :
                  log.includes("─") ? "text-slate-600" :
                  "text-slate-300"
                }`}>
                  {log}
                </p>
              ))
            )}
          </div>

          {/* Info Footer */}
          <div className="mt-6 flex items-start gap-3 bg-blue-50 p-4 rounded-xl text-blue-800 text-xs">
            <CheckCircle className="shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-bold mb-1">Workflow:</p>
              <p className="leading-relaxed">
                <strong>1. Audit</strong> — check current topic state and spot rogue IDs like "mechanics" or "electricity-and-magnetism".<br />
                <strong>2a. Clear General</strong> — resets questions tagged only as <code className="bg-blue-100 px-1 rounded">"general"</code> back to untagged.<br />
                <strong>2b. Clear All</strong> — wipes ALL tags so you can retag from scratch. Use this when rogue topic IDs exist.<br />
                <strong>3. Auto-Tag</strong> — assigns topics by scanning question text. Only touches untagged questions.<br />
                <strong>4. Sync</strong> — updates the subjects collection with topic lists.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}