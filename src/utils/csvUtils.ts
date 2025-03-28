
import { Team, Player } from "@/types/tournament";
import { generateId } from "./tournamentUtils";

// Define the expected CSV format for teams with poule information
export interface TeamCsvRow {
  player1Name: string;
  player2Name: string;
  pouleName: string;
}

/**
 * Parse CSV content into team data
 * @param csvContent - Raw CSV content as string
 * @returns Array of parsed team data or null if invalid format
 */
export const parseTeamCsv = (csvContent: string): TeamCsvRow[] | null => {
  try {
    // Split the content by lines and filter out empty lines
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    
    // Check if there's at least a header and one data row
    if (lines.length < 2) {
      return null;
    }
    
    // Get the header row and check for required columns
    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const player1Index = header.indexOf('player1');
    const player2Index = header.indexOf('player2');
    const pouleIndex = header.indexOf('poule');
    
    if (player1Index === -1 || player2Index === -1 || pouleIndex === -1) {
      return null;
    }
    
    // Parse each data row
    const teams: TeamCsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(col => col.trim());
      
      // Skip if we don't have enough columns
      if (cols.length <= Math.max(player1Index, player2Index, pouleIndex)) {
        continue;
      }
      
      const player1Name = cols[player1Index];
      const player2Name = cols[player2Index];
      const pouleName = cols[pouleIndex];
      
      // Only add if both player names and poule are present
      if (player1Name && player2Name && pouleName) {
        teams.push({ player1Name, player2Name, pouleName });
      }
    }
    
    return teams;
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return null;
  }
};

/**
 * Convert parsed CSV data to Team objects organized by poule
 * @param csvTeams - Array of parsed team data with poule name
 * @param poules - Array of poule data including name, id, and path
 * @returns Array of { pouleId, teams } objects
 */
export const convertCsvWithPoulesToTeams = (
  csvTeams: TeamCsvRow[], 
  poules: { id: string; name: string; path: string }[]
): { pouleId: string, teams: Team[] }[] => {
  const teamsByPoule: Map<string, Team[]> = new Map();
  
  csvTeams.forEach(({ player1Name, player2Name, pouleName }) => {
    // Find matching poule by name
    const poule = poules.find(p => p.name === pouleName);
    
    if (poule) {
      const player1: Player = {
        id: generateId(),
        name: player1Name
      };
      
      const player2: Player = {
        id: generateId(),
        name: player2Name
      };
      
      const newTeam: Team = {
        id: generateId(),
        players: [player1, player2]
      };
      
      // Add to the map, create a new array if this is the first team for this poule
      if (!teamsByPoule.has(poule.id)) {
        teamsByPoule.set(poule.id, []);
      }
      
      teamsByPoule.get(poule.id)?.push(newTeam);
    }
  });
  
  // Convert map to array of { pouleId, teams } objects
  return Array.from(teamsByPoule.entries()).map(([pouleId, teams]) => ({
    pouleId,
    teams
  }));
};

/**
 * Generate a CSV template string for team imports
 * @returns CSV template string
 */
export const getTeamCsvTemplate = (): string => {
  return "player1,player2,poule\nJohn Doe,Jane Smith,Poule A\nAlex Johnson,Sam Williams,Poule B";
};
