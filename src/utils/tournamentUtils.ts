import { Match, Poule, Team, SetScore, Tournament } from "../types/tournament";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// Generate all matches for a poule with the specific ordering based on team count
export const generateMatches = (poule: Poule): Match[] => {
  const teams = poule.teams;
  const matches: Match[] = [];
  
  // Return empty array if there are fewer than 2 teams
  if (teams.length < 2) {
    return [];
  }
  
  // Use specific match ordering based on team count
  if (teams.length === 3) {
    // For 3 teams: Team 1 vs Team 2, Team 1 vs Team 3, Team 2 vs Team 3
    matches.push(createMatch(teams[0], teams[1], 1)); // Team 1 vs Team 2
    matches.push(createMatch(teams[0], teams[2], 2)); // Team 1 vs Team 3
    matches.push(createMatch(teams[1], teams[2], 3)); // Team 2 vs Team 3
  } 
  else if (teams.length === 4) {
    // For 4 teams: specific ordering as requested
    matches.push(createMatch(teams[0], teams[1], 1)); // Team 1 vs Team 2
    matches.push(createMatch(teams[2], teams[3], 2)); // Team 3 vs Team 4
    matches.push(createMatch(teams[0], teams[2], 3)); // Team 1 vs Team 3
    matches.push(createMatch(teams[1], teams[3], 4)); // Team 2 vs Team 4
    matches.push(createMatch(teams[0], teams[3], 5)); // Team 1 vs Team 4
    matches.push(createMatch(teams[1], teams[2], 6)); // Team 2 vs Team 3
  } 
  else if (teams.length === 5) {
    // For 5 teams: updated specific ordering as requested
    matches.push(createMatch(teams[0], teams[1], 1));  // Team 1 vs Team 2
    matches.push(createMatch(teams[2], teams[3], 2));  // Team 3 vs Team 4
    matches.push(createMatch(teams[4], teams[0], 3));  // Team 5 vs Team 1
    matches.push(createMatch(teams[1], teams[2], 4));  // Team 2 vs Team 3
    matches.push(createMatch(teams[3], teams[4], 5));  // Team 4 vs Team 5
    matches.push(createMatch(teams[0], teams[2], 6));  // Team 1 vs Team 3
    matches.push(createMatch(teams[1], teams[4], 7));  // Team 2 vs Team 5
    matches.push(createMatch(teams[0], teams[3], 8));  // Team 1 vs Team 4
    matches.push(createMatch(teams[2], teams[4], 9));  // Team 3 vs Team 5
    matches.push(createMatch(teams[1], teams[3], 10)); // Team 2 vs Team 4
  } 
  else {
    // For any other number of teams, use round-robin pattern
    let orderCounter = 1;
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

// Convert Tournament to Json
const tournamentToJson = (tournament: Tournament): Json => {
  return tournament as unknown as Json;
};

// Convert Json to Tournament
const jsonToTournament = (json: Json): Tournament => {
  return json as unknown as Tournament;
};

// Save tournament data to Supabase
export const saveTournament = async (tournament: Tournament): Promise<void> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session) {
      // Fall back to localStorage if not authenticated
      localStorage.setItem('tournament', JSON.stringify(tournament));
      return;
    }
    
    const user_id = session.session.user.id;
    
    // Check if a tournament record already exists for this user
    const { data: existingTournament, error: queryError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle();
    
    if (queryError) {
      console.error("Error checking for existing tournament:", queryError);
      throw queryError;
    }
    
    // Convert tournament to Json type for Supabase
    const tournamentJson = tournamentToJson(tournament);
    
    if (existingTournament) {
      // Update existing tournament
      const { error } = await supabase
        .from('tournaments')
        .update({ 
          data: tournamentJson,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTournament.id);
      
      if (error) throw error;
    } else {
      // Create new tournament
      const { error } = await supabase
        .from('tournaments')
        .insert({ 
          name: 'My Tournament',
          user_id,
          data: tournamentJson
        });
      
      if (error) throw error;
    }
  } catch (error: any) {
    console.error("Error saving tournament data:", error);
    // Fall back to localStorage on error
    localStorage.setItem('tournament', JSON.stringify(tournament));
    toast({
      title: "Error saving data",
      description: "Your data has been saved locally but not to the cloud.",
      variant: "destructive"
    });
  }
};

// Load tournament data from Supabase
export const loadTournament = async (): Promise<Tournament> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (session.session) {
      const user_id = session.session.user.id;
      
      const { data, error } = await supabase
        .from('tournaments')
        .select('data')
        .eq('user_id', user_id)
        .maybeSingle();
      
      if (error) {
        // If no tournament found in database, try localStorage
        if (error.code === 'PGRST116') {
          const localData = localStorage.getItem('tournament');
          if (localData) {
            const parsedData = JSON.parse(localData);
            return ensureTournamentStructure(parsedData);
          }
          return initializeTournament();
        }
        throw error;
      }
      
      if (data && data.data) {
        // Convert from Json to Tournament
        return ensureTournamentStructure(jsonToTournament(data.data));
      }
    } else {
      // Not authenticated, fall back to localStorage
      const localData = localStorage.getItem('tournament');
      if (localData) {
        const parsedData = JSON.parse(localData);
        return ensureTournamentStructure(parsedData);
      }
    }
    
    return initializeTournament();
  } catch (error) {
    console.error("Error loading tournament data:", error);
    
    // Fall back to localStorage on error
    try {
      const localData = localStorage.getItem('tournament');
      if (localData) {
        const parsedData = JSON.parse(localData);
        return ensureTournamentStructure(parsedData);
      }
    } catch (localError) {
      console.error("Error loading from localStorage:", localError);
    }
    
    return initializeTournament();
  }
};

// Ensure safe tournament loading with proper defaults
const ensureTournamentStructure = (parsedData: any): Tournament => {
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
      discipline.levels.forEach((level: any) => {
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
  });
  
  return parsedData;
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
export const initializeTournament = (): Tournament => {
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

  // Initialize admin credentials if they don't exist
  if (!localStorage.getItem('adminCredentials')) {
    saveAdminCredentials('admin', 'admin123');
  }
  
  // Create tournament object
  const tournament: Tournament = { disciplines };
  
  return tournament;
};

// Get the number of sets won by each team in a match
export const getSetsWon = (match: Match) => {
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
  
  return { setsWonA, setsWonB };
};

// Check if a team won a match (won 2 or more sets)
export const didTeamWinMatch = (match: Match, isTeamA: boolean) => {
  const { setsWonA, setsWonB } = getSetsWon(match);
  return isTeamA ? setsWonA >= 2 : setsWonB >= 2;
};
