
// Player type
export interface Player {
  id: string;
  name: string;
}

// Team type
export interface Team {
  id: string;
  players: [Player, Player];
}

// Set score type
export interface SetScore {
  scoreA?: number;
  scoreB?: number;
}

// Match type
export interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
  sets: SetScore[];
  completed: boolean;
  order: number;
}

// Poule type
export interface Poule {
  id: string;
  name: string;
  teams: Team[];
  matches: Match[];
}

// Level type
export interface Level {
  id: string;
  name: string; // "1", "2", "3", "4", "4+"
  poules: Poule[];
}

// Discipline type
export interface Discipline {
  id: string;
  name: string; // "Dames dubbel", "Heren dubbel", "Gemengd dubbel"
  levels: Level[];
}

// Tournament type
export interface Tournament {
  disciplines: Discipline[];
}

// User type for authentication
export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
}

// Navigation state to keep track of current view
export interface NavigationState {
  selectedDiscipline?: string;
  selectedLevel?: string;
  selectedPoule?: string;
}

// Admin component props that include team viewing
export interface AdminComponentProps {
  isAdmin?: boolean;
  onEditItem?: (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => void;
  onDeleteItem?: (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => void;
  onViewTeams?: (pouleId: string) => void;
}
