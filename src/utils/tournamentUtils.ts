
import { Match, Poule, Team, SetResult } from "../types/tournament";

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
        sets: [],
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
  sets: {
    won: number;
    lost: number;
  };
  points: {
    scored: number;
    conceded: number;
  };
  matchPoints: number;
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
      sets: {
        won: 0,
        lost: 0
      },
      points: {
        scored: 0,
        conceded: 0
      },
      matchPoints: 0
    };
  });

  // Calculate based on completed matches
  poule.matches.forEach(match => {
    if (match.completed && match.sets.length > 0) {
      const teamAStanding = standings[match.teamA.id];
      const teamBStanding = standings[match.teamB.id];

      // Update matches played
      teamAStanding.played += 1;
      teamBStanding.played += 1;

      // Count sets won by each team
      let setsWonByA = 0;
      let setsWonByB = 0;
      let pointsScoredByA = 0;
      let pointsScoredByB = 0;

      match.sets.forEach(set => {
        if (set.scoreA > set.scoreB) {
          setsWonByA += 1;
        } else if (set.scoreB > set.scoreA) {
          setsWonByB += 1;
        }
        
        pointsScoredByA += set.scoreA;
        pointsScoredByB += set.scoreB;
      });

      // Update sets stats
      teamAStanding.sets.won += setsWonByA;
      teamAStanding.sets.lost += setsWonByB;
      teamBStanding.sets.won += setsWonByB;
      teamBStanding.sets.lost += setsWonByA;

      // Update points stats
      teamAStanding.points.scored += pointsScoredByA;
      teamAStanding.points.conceded += pointsScoredByB;
      teamBStanding.points.scored += pointsScoredByB;
      teamBStanding.points.conceded += pointsScoredByA;

      // Update wins, losses and match points
      if (setsWonByA > setsWonByB) {
        teamAStanding.won += 1;
        teamBStanding.lost += 1;
        teamAStanding.matchPoints += 2;
        teamBStanding.matchPoints += 0;
      } else if (setsWonByA < setsWonByB) {
        teamAStanding.lost += 1;
        teamBStanding.won += 1;
        teamAStanding.matchPoints += 0;
        teamBStanding.matchPoints += 2;
      } else {
        // Draw (if allowed)
        teamAStanding.matchPoints += 1;
        teamBStanding.matchPoints += 1;
      }
    }
  });

  // Convert to array and sort by: 
  // 1. match points
  // 2. sets won
  // 3. points difference
  return Object.values(standings).sort((a, b) => {
    // First, sort by match points
    if (b.matchPoints !== a.matchPoints) {
      return b.matchPoints - a.matchPoints;
    }
    
    // If match points are equal, sort by sets won
    if (b.sets.won !== a.sets.won) {
      return b.sets.won - a.sets.won;
    }
    
    // If sets won are equal, sort by points difference
    const pointsDiffA = a.points.scored - a.points.conceded;
    const pointsDiffB = b.points.scored - b.points.conceded;
    
    return pointsDiffB - pointsDiffA;
  });
};

// Get winner of a poule
export const getPouleWinner = (poule: Poule): Team | null => {
  // Only return a winner if all matches are completed
  const allMatchesCompleted = poule.matches.every(match => match.completed);
  
  if (!allMatchesCompleted || poule.matches.length === 0) {
    return null;
  }
  
  const standings = calculateStandings(poule);
  
  // If there are standings, return the first team (highest ranked)
  if (standings.length > 0) {
    return standings[0].team;
  }
  
  return null;
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
