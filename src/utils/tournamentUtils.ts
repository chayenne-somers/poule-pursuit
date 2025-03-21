
import { Match, Poule, Team } from "../types/tournament";

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// Generate all matches for a poule
export const generateMatches = (poule: Poule): Match[] => {
  const teams = poule.teams;
  const matches: Match[] = [];
  let orderCounter = 1;

  // Generate matches: each team plays against all other teams
  for (let i = 0; i < teams.length - 1; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        id: generateId(),
        teamA: teams[i],
        teamB: teams[j],
        completed: false,
        order: orderCounter++
      });
    }
  }

  return matches;
};

// Calculate team standings in a poule
export interface TeamStanding {
  team: Team;
  played: number;
  won: number;
  lost: number;
  points: number;
}

export const calculateStandings = (poule: Poule): TeamStanding[] => {
  const standings: Record<string, TeamStanding> = {};

  // Initialize standings for all teams
  poule.teams.forEach(team => {
    standings[team.id] = {
      team,
      played: 0,
      won: 0,
      lost: 0,
      points: 0
    };
  });

  // Calculate based on completed matches
  poule.matches.forEach(match => {
    if (match.completed && typeof match.scoreA === 'number' && typeof match.scoreB === 'number') {
      const teamAStanding = standings[match.teamA.id];
      const teamBStanding = standings[match.teamB.id];

      // Update matches played
      teamAStanding.played += 1;
      teamBStanding.played += 1;

      // Update wins, losses and points
      if (match.scoreA > match.scoreB) {
        teamAStanding.won += 1;
        teamBStanding.lost += 1;
        teamAStanding.points += 2;
        teamBStanding.points += 0;
      } else if (match.scoreA < match.scoreB) {
        teamAStanding.lost += 1;
        teamBStanding.won += 1;
        teamAStanding.points += 0;
        teamBStanding.points += 2;
      } else {
        // Draw (if allowed)
        teamAStanding.points += 1;
        teamBStanding.points += 1;
      }
    }
  });

  // Convert to array and sort by points (descending)
  return Object.values(standings).sort((a, b) => b.points - a.points);
};

// Local storage helpers
export const saveTournament = (tournament: any): void => {
  localStorage.setItem('tournament', JSON.stringify(tournament));
};

export const loadTournament = (): any => {
  const data = localStorage.getItem('tournament');
  return data ? JSON.parse(data) : null;
};

export const saveAdminCredentials = (username: string, password: string): void => {
  // In a real app, we would use a secure authentication method
  // This is just for demonstration
  localStorage.setItem('adminCredentials', JSON.stringify({ username, password }));
};

export const checkAdminCredentials = (username: string, password: string): boolean => {
  const credentials = localStorage.getItem('adminCredentials');
  if (!credentials) return false;
  
  const { username: storedUsername, password: storedPassword } = JSON.parse(credentials);
  return username === storedUsername && password === storedPassword;
};

// Initialize sample tournament data
export const initializeTournament = () => {
  // Check if tournament data already exists
  if (loadTournament()) return;

  const disciplines = [
    { id: "d1", name: "Dames dubbel", levels: [] },
    { id: "d2", name: "Heren dubbel", levels: [] },
    { id: "d3", name: "Gemengd dubbel", levels: [] }
  ];

  // Initialize levels for each discipline
  disciplines.forEach(discipline => {
    discipline.levels = [
      { id: `${discipline.id}_l1`, name: "1", poules: [] },
      { id: `${discipline.id}_l2`, name: "2", poules: [] },
      { id: `${discipline.id}_l3`, name: "3", poules: [] },
      { id: `${discipline.id}_l4`, name: "4", poules: [] },
      { id: `${discipline.id}_l5`, name: "4+", poules: [] }
    ];
  });

  saveTournament({ disciplines });

  // Initialize admin credentials if they don't exist
  if (!localStorage.getItem('adminCredentials')) {
    saveAdminCredentials('admin', 'admin123');
  }
};
