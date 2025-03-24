import { Match, Poule, Team, SetScore } from "../types/tournament";

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// Generate all matches for a poule with specific ordering patterns
export const generateMatches = (poule: Poule): Match[] => {
  const teams = poule.teams;
  const matches: Match[] = [];
  
  if (teams.length < 2) {
    return [];
  }
  
  // Implement specific ordering patterns based on the number of teams
  if (teams.length === 3) {
    // For 3 teams: 1v2, 1v3, 2v3
    matches.push(createMatch(teams[0], teams[1], 1));
    matches.push(createMatch(teams[0], teams[2], 2));
    matches.push(createMatch(teams[1], teams[2], 3));
  } 
  else if (teams.length === 4) {
    // For 4 teams: 1v2, 3v4, 1v3, 2v4, 1v4, 2v3
    matches.push(createMatch(teams[0], teams[1], 1));
    matches.push(createMatch(teams[2], teams[3], 2));
    matches.push(createMatch(teams[0], teams[2], 3));
    matches.push(createMatch(teams[1], teams[3], 4));
    matches.push(createMatch(teams[0], teams[3], 5));
    matches.push(createMatch(teams[1], teams[2], 6));
  }
  else if (teams.length === 5) {
    // For 5 teams: 1v2, 3v4, 5v1, 2v3, 4v5, 1v3, 2v5, 3v4, 1v4, 3v5, 2v4
    matches.push(createMatch(teams[0], teams[1], 1));
    matches.push(createMatch(teams[2], teams[3], 2));
    matches.push(createMatch(teams[4], teams[0], 3));
    matches.push(createMatch(teams[1], teams[2], 4));
    matches.push(createMatch(teams[3], teams[4], 5));
    matches.push(createMatch(teams[0], teams[2], 6));
    matches.push(createMatch(teams[1], teams[4], 7));
    matches.push(createMatch(teams[2], teams[3], 8));
    matches.push(createMatch(teams[0], teams[3], 9));
    matches.push(createMatch(teams[2], teams[4], 10));
    matches.push(createMatch(teams[1], teams[3], 11));
  }
  else {
    // For all other team counts, use a generic round-robin approach
    let orderCounter = 1;
    // Generate matches: each team plays against all other teams
    for (let i = 0; i < teams.length - 1; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push(createMatch(teams[i], teams[j], orderCounter++));
      }
    }
  }

  return matches;
};

// Helper function to create a match
const createMatch = (teamA: Team, teamB: Team, order: number): Match => {
  return {
    id: generateId(),
    teamA,
    teamB,
    sets: [{}, {}, {}], // Initialize with three empty sets
    completed: false,
    order
  };
};

// Check if a set is complete (has both scores)
export const isSetComplete = (set: SetScore): boolean => {
  return typeof set.scoreA === 'number' && typeof set.scoreB === 'number';
};

// Check if a team won a set
export const didTeamWinSet = (set: SetScore, isTeamA: boolean): boolean => {
  if (!isSetComplete(set)) return false;
  
  return isTeamA 
    ? set.scoreA! > set.scoreB!
    : set.scoreB! > set.scoreA!;
};

// Calculate team standings in a poule
export interface TeamStanding {
  team: Team;
  played: number;
  matchesWon: number;
  setsWon: number;
  setsLost: number;
  setSaldo: number;
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
      setsLost: 0,
      setSaldo: 0,
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
      teamAStanding.setsLost += setsWonB;
      teamBStanding.setsLost += setsWonA;
      teamAStanding.setSaldo = teamAStanding.setsWon - teamAStanding.setsLost;
      teamBStanding.setSaldo = teamBStanding.setsWon - teamBStanding.setsLost;
      teamAStanding.pointsScored += pointsA;
      teamBStanding.pointsScored += pointsB;

      // Determine match winner (team wins if they won 2 or more sets)
      if (setsWonA >= 2) {
        teamAStanding.matchesWon += 1;
      } else if (setsWonB >= 2) {
        teamBStanding.matchesWon += 1;
      }
    }
  });

  // Convert to array and sort by:
  // 1. Most matches won
  // 2. If tied, best set saldo (sets won - sets lost)
  // 3. If still tied, most points scored
  return Object.values(standings).sort((a, b) => {
    if (a.matchesWon !== b.matchesWon) {
      return b.matchesWon - a.matchesWon;
    }
    if (a.setSaldo !== b.setSaldo) {
      return b.setSaldo - a.setSaldo;
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

// Check if a match is complete (a team has won 2 sets)
export const isMatchComplete = (match: Match): boolean => {
  if (!match.sets || match.sets.length < 3) return false;
  
  let setsWonA = 0;
  let setsWonB = 0;
  
  match.sets.forEach(set => {
    if (isSetComplete(set)) {
      if (set.scoreA! > set.scoreB!) {
        setsWonA++;
      } else if (set.scoreB! > set.scoreA!) {
        setsWonB++;
      }
    }
  });
  
  return setsWonA >= 2 || setsWonB >= 2;
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
