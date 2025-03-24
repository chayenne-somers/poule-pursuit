import { Match, Poule, Team, SetScore } from "../types/tournament";

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
        sets: [{}, {}, {}], // Initialize with three empty sets
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
  matchesWon: number;
  setsWon: number;
  pointsScored: number;
}

export const calculateStandings = (poule: Poule): TeamStanding[] => {
  const standings: Record<string, TeamStanding> = {};

  // Initialize standings for all teams
  poule.teams.forEach(team => {
    standings[team.id] = {
      team,
      played: 0,
      matchesWon: 0,
      setsWon: 0,
      pointsScored: 0
    };
  });

  // Calculate based on completed matches
  poule.matches.forEach(match => {
    if (match.completed) {
      const teamAStanding = standings[match.teamA.id];
      const teamBStanding = standings[match.teamB.id];

      // Update matches played
      teamAStanding.played += 1;
      teamBStanding.played += 1;

      // Count sets won and points scored
      let setsWonA = 0;
      let setsWonB = 0;
      let pointsA = 0;
      let pointsB = 0;

      match.sets.forEach(set => {
        if (typeof set.scoreA === 'number' && typeof set.scoreB === 'number') {
          // Add points
          pointsA += set.scoreA;
          pointsB += set.scoreB;

          // Determine set winner
          if (set.scoreA > set.scoreB) {
            setsWonA++;
          } else if (set.scoreB > set.scoreA) {
            setsWonB++;
          }
        }
      });

      // Update sets won and points scored in standings
      teamAStanding.setsWon += setsWonA;
      teamBStanding.setsWon += setsWonB;
      teamAStanding.pointsScored += pointsA;
      teamBStanding.pointsScored += pointsB;

      // Determine match winner
      if (setsWonA > setsWonB) {
        teamAStanding.matchesWon += 1;
      } else if (setsWonB > setsWonA) {
        teamBStanding.matchesWon += 1;
      }
    }
  });

  // Convert to array and sort by:
  // 1. Most matches won
  // 2. If tied, most sets won
  // 3. If still tied, most points scored
  return Object.values(standings).sort((a, b) => {
    if (a.matchesWon !== b.matchesWon) {
      return b.matchesWon - a.matchesWon;
    }
    if (a.setsWon !== b.setsWon) {
      return b.setsWon - a.setsWon;
    }
    return b.pointsScored - a.pointsScored;
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
  
  // Return the top team
  if (standings.length > 0) {
    return standings[0].team;
  }
  
  return null;
};

// Local storage helpers
export const saveTournament = (tournament: any): void => {
  localStorage.setItem('tournament', JSON.stringify(tournament));
};

// Ensure safe tournament loading with proper defaults
export const loadTournament = (): any => {
  try {
    const data = localStorage.getItem('tournament');
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    
    // Ensure disciplines exists
    if (!parsedData.disciplines) {
      parsedData.disciplines = [];
    }
    
    // Ensure each discipline has a levels array
    parsedData.disciplines.forEach((discipline: any) => {
      if (!discipline.levels) {
        discipline.levels = [];
      }
      
      // Ensure each level has a poules array
      discipline.levels.forEach((level: any) => {
        if (!level.poules) {
          level.poules = [];
        }
        
        // Ensure each poule has teams and matches arrays
        level.poules.forEach((poule: any) => {
          if (!poule.teams) {
            poule.teams = [];
          }
          if (!poule.matches) {
            poule.matches = [];
          }
          
          // Ensure each match has a sets array with 3 sets
          poule.matches.forEach((match: any) => {
            if (!match.sets || !Array.isArray(match.sets)) {
              match.sets = [{}, {}, {}];
            }
            // Ensure 3 sets
            while (match.sets.length < 3) {
              match.sets.push({});
            }
          });
        });
      });
    });
    
    return parsedData;
  } catch (error) {
    console.error("Error loading tournament data:", error);
    return { disciplines: [] };
  }
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

// Check if a set is valid (has both scores)
export const isSetComplete = (set: SetScore): boolean => {
  return typeof set.scoreA === 'number' && typeof set.scoreB === 'number';
};

// Check if a match is complete (all sets have scores)
export const areAllSetsComplete = (match: Match): boolean => {
  return match.sets.every(set => isSetComplete(set));
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
