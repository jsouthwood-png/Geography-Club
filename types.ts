
export enum GeographyTopic {
  COASTS = 'The Changing Landscapes of the UK: Coasts',
  RIVERS = 'The Changing Landscapes of the UK: Rivers',
  WEATHER = 'Weather Hazards and Climate Change',
  ECOSYSTEMS = 'Ecosystems, Biodiversity and Management',
  CITIES = 'Changing Cities',
  DEVELOPMENT = 'Global Development',
  WATER_RESOURCES = 'Water Resource Management'
}

export interface Question {
  id: string;
  topic: GeographyTopic;
  questionText: string;
  markScheme: string[];
  modelAnswer: string;
}

export interface Feedback {
  score: number;
  comments: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
}

export interface HistoryItem {
  id: string;
  question: Question;
  userAnswer: string;
  feedback: Feedback;
  date: string;
}
