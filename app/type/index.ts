export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  subscriptionStatus: 'free' | 'premium';
  examCategory?: 'senior' | 'junior' | 'professional';
  subscriptionExpiry?: number;
  credits: number; 
  totalCreditsEarned?: number; 
  specialization?: 'sciences' | 'arts' | 'commercial' | 'general';
  paymentRef?: string;
  createdAt?: string;
}

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctOption: number; 
  explanation?: string; 
  subject: string;
  imageURL?: string | null;
  topics?: string[];  
}

// NEW: Credit pricing configuration
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 50,
    price: 1000,
    bonus: 0,
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic Pack',
    credits: 100,
    price: 2000, 
    bonus: 10,
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    credits: 250,
    price: 5000,
    bonus: 50,
    popular: false,
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    credits: 500,
    price: 10000,
    bonus: 150,
    popular: false,
  }
];


export const CREDIT_COSTS = {

  subjectPractice: 5,
  

  jambMock: 20,      
  waecMock: 15,     
  necoMock: 15,     
  commonEntrance: 10, 
  beceMock: 10,
  interviewPrep: 8,
  generalKnowledge: 5,
  
 
  viewExplanation: 1, 
  retakeTest: 3,      
};


export function getCreditCost(examType: string): number {
  const costs: Record<string, number> = {
    'jamb': CREDIT_COSTS.jambMock,
    'waec': CREDIT_COSTS.waecMock,
    'neco': CREDIT_COSTS.necoMock,
    'common-entrance': CREDIT_COSTS.commonEntrance,
    'bece': CREDIT_COSTS.beceMock,
    'interview': CREDIT_COSTS.interviewPrep,
    'general': CREDIT_COSTS.generalKnowledge,
    'subject': CREDIT_COSTS.subjectPractice,
  };
  
  return costs[examType] || CREDIT_COSTS.subjectPractice;
}