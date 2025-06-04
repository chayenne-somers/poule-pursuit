
import { Match, Poule, SetScore, Team, TeamStanding, Tournament } from '@/types/tournament';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { loadTournamentFromDB } from './supabaseUtils';

// Export the generateId function
export const generateId = (): string => {
  return uuidv4();
};

// Function to initialize a new tournament with sample data
export const initializeTournament = (): Tournament => {
  const disciplineId = uuidv4();
  const levelId = uuidv4();
  const pouleId = uuidv4();

  const team1: Team = { id: uuidv4(), players: [{ id: uuidv4(), name: 'Player A1' }, { id: uuidv4(), name: 'Player A2' }] };
  const team2: Team = { id: uuidv4(), players: [{ id: uuidv4(), name: 'Player B1' }, { id: uuidv4(), name: 'Player B2' }] };
  const team3: Team = { id: uuidv4(), players: [{ id: uuidv4(), name: 'Player C1' }, { id: uuidv4(), name: 'Player C2' }] };
  const team4: Team = { id: uuidv4(), players: [{ id: uuidv4(), name: 'Player D1' }, { id: uuidv4(), name: 'Player D2' }] };

  const teams = [team1, team2, team3, team4];

  const matches: Match[] = [
    { id: uuidv4(), teamA: team1, teamB: team2, sets: [{}, {}, {}], completed: false, order: 1 },
    { id: uuidv4(), teamA: team3, teamB: team4, sets: [{}, {}, {}], completed: false, order: 2 },
    { id: uuidv4(), teamA: team1, teamB: team3, sets: [{}, {}, {}], completed: false, order: 3 },
    { id: uuidv4(), teamA: team2, teamB: team4, sets: [{}, {}, {}], completed: false, order: 4 },
    { id: uuidv4(), teamA: team1, teamB: team4, sets: [{}, {}, {}], completed: false, order: 5 },
    { id: uuidv4(), teamA: team2, teamB: team3, sets: [{}, {}, {}], completed: false, order: 6 },
  ];

  const poule: Poule = { id: pouleId, name: 'Sample Poule', teams: teams, matches: matches };

  return {
    disciplines: [
      {
        id: disciplineId,
        name: 'Sample Discipline',
        levels: [
          {
            id: levelId,
            name: 'Sample Level',
            poules: [poule],
          },
        ],
      },
    ],
  };
};

// Load tournament data - now uses the new database structure for authenticated users
export const loadTournament = async (): Promise<Tournament> => {
  try {
    console.log("Loading tournament data");
    
    // Check if user is authenticated
    const { data: session } = await supabase.auth.getSession();
    
    if (session.session) {
      console.log("Authenticated user, loading from database");
      return await loadTournamentFromDB();
    } else {
      console.log("Unauthenticated user, using localStorage/demo data");
      
      // For unauthenticated users, use the existing localStorage logic
      const localData = localStorage.getItem('tournament');
      
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);
          const tournamentData = ensureTournamentStructure(parsedData);
          
          // Get current URL to extract poule ID if present
          const currentUrl = window.location.pathname;
          const pouleIdMatch = currentUrl.match(/\/poule\/([^\/]+)/);
          const currentPouleId = pouleIdMatch ? pouleIdMatch[1] : null;
          
          if (currentPouleId) {
            // Try to find the specific poule in the tournament data
            let foundPoule = null;
            const allPoules: Poule[] = [];
            
            // Collect all poules from the tournament
            if (tournamentData.disciplines) {
              tournamentData.disciplines.forEach(discipline => {
                if (discipline.levels) {
                  discipline.levels.forEach(level => {
                    if (level.poules) {
                      allPoules.push(...level.poules);
                    }
                  });
                }
              });
            }
            
            // Check if the requested poule is in the tournament
            foundPoule = allPoules.find(poule => poule.id === currentPouleId);
            
            if (foundPoule) {
              return tournamentData;
            } else {
              // If not found, try to get it from demo poules
              const demoPoules = getDemoPoules();
              foundPoule = demoPoules.find(poule => poule.id === currentPouleId);
              
              if (foundPoule) {
                const updatedTournament = addPouleToTournament(tournamentData, foundPoule);
                return updatedTournament;
              } else {
                const mergedTournament = mergeDemoPoules(tournamentData, demoPoules);
                return mergedTournament;
              }
            }
          } else {
            // Not on a specific poule page, include all demo poules
            const demoPoules = getDemoPoules();
            const mergedTournament = mergeDemoPoules(tournamentData, demoPoules);
            return mergedTournament;
          }
        } catch (parseError) {
          console.error("Error parsing localStorage data:", parseError);
        }
      }
      
      // Fallback to sample data
      const newTournament = initializeTournament();
      localStorage.setItem('tournament', JSON.stringify(newTournament));
      return newTournament;
    }
  } catch (error) {
    console.error("Error loading tournament data:", error);
    // Final fallback to sample data
    const newTournament = initializeTournament();
    localStorage.setItem('tournament', JSON.stringify(newTournament));
    return newTournament;
  }
};

// Save tournament data - for authenticated users, this is handled by supabaseUtils
export const saveTournament = async (tournament: Tournament): Promise<void> => {
  try {
    // Always save to localStorage for backward compatibility
    localStorage.setItem('tournament', JSON.stringify(tournament));

    // For authenticated users, the data is automatically saved through supabaseUtils
    const { data: session } = await supabase.auth.getSession();
    if (session?.session) {
      console.log("Tournament data managed through database for authenticated users");
    } else {
      console.log("Tournament data saved to localStorage for unauthenticated users");
    }
  } catch (error) {
    console.error("Error saving tournament data:", error);
  }
};

export const generateMatches = (poule: Poule): Match[] => {
  const teams = poule.teams;
  const matches: Match[] = [];
  let order = 1;

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        id: uuidv4(),
        teamA: teams[i],
        teamB: teams[j],
        sets: [{}, {}, {}],
        completed: false,
        order: order++,
      });
    }
  }

  return matches;
};

export const checkAdminCredentials = (username: string, password: string): boolean => {
  return username === 'admin' && password === 'admin123';
};

export const saveAdminCredentials = (username: string, password: string): void => {
  localStorage.setItem('adminCredentials', JSON.stringify({ username, password }));
};

export const addPouleToTournament = (tournament: Tournament, poule: Poule): Tournament => {
  const updatedTournament: Tournament = { ...tournament };

  if (!updatedTournament.disciplines || updatedTournament.disciplines.length === 0) {
    updatedTournament.disciplines = [
      { id: generateId(), name: "Demo Discipline", levels: [] }
    ];
  }

  const firstDiscipline = updatedTournament.disciplines[0];

  if (!firstDiscipline.levels || firstDiscipline.levels.length === 0) {
    firstDiscipline.levels = [
      { id: generateId(), name: "Demo Level", poules: [] }
    ];
  }

  const firstLevel = firstDiscipline.levels[0];
  if (!firstLevel.poules.some(p => p.id === poule.id)) {
    firstLevel.poules.push(poule);
  }

  return updatedTournament;
};

export const jsonToTournament = (data: any): Tournament => {
  return {
    disciplines: data.disciplines.map((discipline: any) => ({
      id: discipline.id,
      name: discipline.name,
      levels: discipline.levels.map((level: any) => ({
        id: level.id,
        name: level.name,
        poules: level.poules.map((poule: any) => ({
          id: poule.id,
          name: poule.name,
          teams: poule.teams.map((team: any) => ({
            id: team.id,
            players: team.players.map((player: any) => ({
              id: player.id,
              name: player.name,
            })),
          })),
          matches: poule.matches.map((match: any) => ({
            id: match.id,
            teamA: {
              id: match.teamA.id,
              players: match.teamA.players.map((player: any) => ({
                id: player.id,
                name: player.name,
              })),
            },
            teamB: {
              id: match.teamB.id,
              players: match.teamB.players.map((player: any) => ({
                id: player.id,
                name: player.name,
              })),
            },
            sets: match.sets.map((set: any) => ({
              scoreA: set.scoreA,
              scoreB: set.scoreB,
            })),
            completed: match.completed,
            order: match.order,
          })),
        })),
      })),
    })),
  };
};

export const ensureTournamentStructure = (data: any): Tournament => {
  if (!data || typeof data !== 'object') {
    console.warn("Invalid tournament data format. Initializing a new tournament.");
    return initializeTournament();
  }

  if (!data.disciplines || !Array.isArray(data.disciplines)) {
    console.warn("Disciplines data missing or invalid. Initializing default disciplines.");
    data.disciplines = [];
  }

  data.disciplines.forEach((discipline: any, disciplineIndex: number) => {
    if (!discipline || typeof discipline !== 'object') {
      console.warn(`Discipline at index ${disciplineIndex} is invalid. Initializing default discipline.`);
      data.disciplines[disciplineIndex] = { id: uuidv4(), name: 'Default Discipline', levels: [] };
      discipline = data.disciplines[disciplineIndex];
    }

    if (!discipline.levels || !Array.isArray(discipline.levels)) {
      console.warn(`Levels data missing or invalid in discipline ${discipline.name}. Initializing default levels.`);
      discipline.levels = [];
    }

    discipline.levels.forEach((level: any, levelIndex: number) => {
      if (!level || typeof level !== 'object') {
        console.warn(`Level at index ${levelIndex} in discipline ${discipline.name} is invalid. Initializing default level.`);
        discipline.levels[levelIndex] = { id: uuidv4(), name: 'Default Level', poules: [] };
        level = discipline.levels[levelIndex];
      }

      if (!level.poules || !Array.isArray(level.poules)) {
        console.warn(`Poules data missing or invalid in level ${level.name}. Initializing default poules.`);
        level.poules = [];
      }

      level.poules.forEach((poule: any, pouleIndex: number) => {
        if (!poule || typeof poule !== 'object') {
          console.warn(`Poule at index ${pouleIndex} in level ${level.name} is invalid. Initializing default poule.`);
          discipline.levels[levelIndex].poules[pouleIndex] = { id: uuidv4(), name: 'Default Poule', teams: [], matches: [] };
          poule = discipline.levels[levelIndex].poules[pouleIndex];
        }

        if (!poule.teams || !Array.isArray(poule.teams)) {
          console.warn(`Teams data missing or invalid in poule ${poule.name}. Initializing default teams.`);
          poule.teams = [];
        }

        if (!poule.matches || !Array.isArray(poule.matches)) {
          console.warn(`Matches data missing or invalid in poule ${poule.name}. Initializing default matches.`);
          poule.matches = [];
        }

        poule.matches.forEach((match: any, matchIndex: number) => {
          if (!match || typeof match !== 'object') {
            console.warn(`Match at index ${matchIndex} in poule ${poule.name} is invalid. Initializing default match.`);
            poule.matches[matchIndex] = {
              id: uuidv4(),
              teamA: { id: uuidv4(), players: [{ id: uuidv4(), name: 'Player A1' }, { id: uuidv4(), name: 'Player A2' }] },
              teamB: { id: uuidv4(), players: [{ id: uuidv4(), name: 'Player B1' }, { id: uuidv4(), name: 'Player B2' }] },
              sets: [{}, {}, {}],
              completed: false,
              order: matchIndex + 1,
            };
            match = poule.matches[matchIndex];
          }

          if (!match.sets || !Array.isArray(match.sets)) {
            console.warn(`Sets data missing or invalid in match ${matchIndex} of poule ${poule.name}. Initializing default sets.`);
            match.sets = [{}, {}, {}];
          } else if (match.sets.length < 3) {
            while (match.sets.length < 3) {
              match.sets.push({});
            }
          }
        });
      });
    });
  });

  return data as Tournament;
};

export const tournamentToJson = (tournament: Tournament): any => {
  return {
    disciplines: tournament.disciplines.map(discipline => ({
      id: discipline.id,
      name: discipline.name,
      levels: discipline.levels.map(level => ({
        id: level.id,
        name: level.name,
        poules: level.poules.map(poule => ({
          id: poule.id,
          name: poule.name,
          teams: poule.teams.map(team => ({
            id: team.id,
            players: team.players.map(player => ({
              id: player.id,
              name: player.name,
            })),
          })),
          matches: poule.matches.map(match => ({
            id: match.id,
            teamA: {
              id: match.teamA.id,
              players: match.teamA.players.map(player => ({
                id: player.id,
                name: player.name,
              })),
            },
            teamB: {
              id: match.teamB.id,
              players: match.teamB.players.map(player => ({
                id: player.id,
                name: player.name,
              })),
            },
            sets: match.sets.map(set => ({
              scoreA: set.scoreA,
              scoreB: set.scoreB,
            })),
            completed: match.completed,
            order: match.order,
          })),
        })),
      })),
    })),
  };
};

export const calculateStandings = (poule: Poule): TeamStanding[] => {
  const standings: { [teamId: string]: TeamStanding } = {};

  poule.teams.forEach(team => {
    standings[team.id] = {
      team: team,
      played: 0,
      matchesWon: 0,
      setsWon: 0,
      setsLost: 0,
      setSaldo: 0,
      pointsScored: 0,
    };
  });

  poule.matches.forEach(match => {
    if (match.completed) {
      const teamAId = match.teamA.id;
      const teamBId = match.teamB.id;

      standings[teamAId].played += 1;
      standings[teamBId].played += 1;

      const { setsWonA, setsWonB } = getSetsWon(match);
      standings[teamAId].setsWon += setsWonA;
      standings[teamBId].setsWon += setsWonB;
      standings[teamAId].setsLost += setsWonB;
      standings[teamBId].setsLost += setsWonA;

      standings[teamAId].setSaldo += setsWonA - setsWonB;
      standings[teamBId].setSaldo += setsWonB - setsWonA;

      if (setsWonA > setsWonB) {
        standings[teamAId].matchesWon += 1;
        standings[teamAId].pointsScored += 2;
        standings[teamBId].pointsScored += 1;
      } else {
        standings[teamBId].matchesWon += 1;
        standings[teamBId].pointsScored += 2;
        standings[teamAId].pointsScored += 1;
      }
    }
  });

  const standingsArray: TeamStanding[] = Object.values(standings);
  standingsArray.sort((a, b) => {
    if (b.pointsScored !== a.pointsScored) {
      return b.pointsScored - a.pointsScored;
    }
    if (b.setSaldo !== a.setSaldo) {
      return b.setSaldo - a.setSaldo;
    }
    return b.matchesWon - a.matchesWon;
  });

  return standingsArray;
};

export const getPouleWinner = (poule: Poule): Team | null => {
  const standings = calculateStandings(poule);
  return standings.length > 0 ? standings[0].team : null;
};

export const isSetComplete = (set: SetScore): boolean => {
  return set.scoreA !== undefined && set.scoreB !== undefined;
};

export const isMatchComplete = (match: Match): boolean => {
  const { setsWonA, setsWonB } = getSetsWon(match);
  return setsWonA >= 2 || setsWonB >= 2;
};

export const getSetsWon = (match: Match): { setsWonA: number; setsWonB: number } => {
  let setsWonA = 0;
  let setsWonB = 0;

  match.sets.forEach(set => {
    // Only count sets where both scores are defined (i.e., the set has been played)
    if (set.scoreA !== undefined && set.scoreB !== undefined) {
      if (set.scoreA > set.scoreB) {
        setsWonA++;
      } else if (set.scoreB > set.scoreA) {
        setsWonB++;
      }
      // If scores are equal, neither team wins the set (though this is unusual in badminton)
    }
  });

  return { setsWonA, setsWonB };
};

export const didTeamWinMatch = (match: Match, isTeamA: boolean): boolean => {
  const { setsWonA, setsWonB } = getSetsWon(match);
  return isTeamA ? setsWonA > setsWonB : setsWonB > setsWonA;
};

export const getDemoPoules = (): Poule[] => {
  const team1: Team = { id: 'demo-team-1', players: [{ id: 'demo-player-1', name: 'Demo A1' }, { id: 'demo-player-2', name: 'Demo A2' }] };
  const team2: Team = { id: 'demo-team-2', players: [{ id: 'demo-player-3', name: 'Demo B1' }, { id: 'demo-player-4', name: 'Demo B2' }] };
  const team3: Team = { id: 'demo-team-3', players: [{ id: 'demo-player-5', name: 'Demo C1' }, { id: 'demo-player-6', name: 'Demo C2' }] };
  const team4: Team = { id: 'demo-team-4', players: [{ id: 'demo-player-7', name: 'Demo D1' }, { id: 'demo-player-8', name: 'Demo D2' }] };

  const demoMatches: Match[] = [
    { id: 'demo-match-1', teamA: team1, teamB: team2, sets: [{ scoreA: 21, scoreB: 18 }, { scoreA: 23, scoreB: 25 }, { scoreA: 19, scoreB: 21 }], completed: true, order: 1 },
    { id: 'demo-match-2', teamA: team3, teamB: team4, sets: [{ scoreA: 21, scoreB: 15 }, { scoreA: 21, scoreB: 17 }, {}], completed: true, order: 2 },
    { id: 'demo-match-3', teamA: team1, teamB: team3, sets: [{ scoreA: 18, scoreB: 21 }, { scoreA: 21, scoreB: 19 }, { scoreA: 21, scoreB: 16 }], completed: true, order: 3 },
    { id: 'demo-match-4', teamA: team2, teamB: team4, sets: [{ scoreA: 15, scoreB: 21 }, { scoreA: 17, scoreB: 21 }, {}], completed: true, order: 4 },
    { id: 'demo-match-5', teamA: team1, teamB: team4, sets: [{ scoreA: 21, scoreB: 12 }, { scoreA: 21, scoreB: 19 }, {}], completed: true, order: 5 },
    { id: 'demo-match-6', teamA: team2, teamB: team3, sets: [{ scoreA: 12, scoreB: 21 }, { scoreA: 19, scoreB: 21 }, {}], completed: true, order: 6 },
  ];

  const demoPoule: Poule = {
    id: 'demo-poule',
    name: 'Demo Poule',
    teams: [team1, team2, team3, team4],
    matches: demoMatches,
  };
  
  return [demoPoule];
};

const mergeDemoPoules = (tournament: Tournament, demoPoules: Poule[]): Tournament => {
  const updatedTournament: Tournament = { ...tournament };

  if (!updatedTournament.disciplines || updatedTournament.disciplines.length === 0) {
    updatedTournament.disciplines = [
      { id: "demo-discipline", name: "Demo Discipline", levels: [] }
    ];
  }

  const firstDiscipline = updatedTournament.disciplines[0];

  if (!firstDiscipline.levels || firstDiscipline.levels.length === 0) {
    firstDiscipline.levels = [
      { id: "demo-level", name: "Demo Level", poules: [] }
    ];
  }

  const firstLevel = firstDiscipline.levels[0];
  demoPoules.forEach(demoPoule => {
    if (!firstLevel.poules.some(p => p.id === demoPoule.id)) {
      firstLevel.poules.push(demoPoule);
    }
  });

  return updatedTournament;
};
