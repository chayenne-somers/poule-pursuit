
import { Team, Player } from "@/types/tournament";
import { generateId } from "./tournamentUtils";

// Define the expected CSV format for teams
export interface TeamCsvRow {
  player1Name: string;
  player2Name: string;
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
    
    if (player1Index === -1 || player2Index === -1) {
      return null;
    }
    
    // Parse each data row
    const teams: TeamCsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(col => col.trim());
      
      // Skip if we don't have enough columns
      if (cols.length <= Math.max(player1Index, player2Index)) {
        continue;
      }
      
      const player1Name = cols[player1Index];
      const player2Name = cols[player2Index];
      
      // Only add if both player names are present
      if (player1Name && player2Name) {
        teams.push({ player1Name, player2Name });
      }
    }
    
    return teams;
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return null;
  }
};

/**
 * Convert parsed CSV data to Team objects
 * @param csvTeams - Array of parsed team data
 * @returns Array of Team objects
 */
export const convertCsvToTeams = (csvTeams: TeamCsvRow[]): Team[] => {
  return csvTeams.map(({ player1Name, player2Name }) => {
    const player1: Player = {
      id: generateId(),
      name: player1Name
    };
    const player2: Player = {
      id: generateId(),
      name: player2Name
    };
    
    return {
      id: generateId(),
      players: [player1, player2]
    };
  });
};

/**
 * Generate a CSV template string for team imports
 * @returns CSV template string
 */
export const getTeamCsvTemplate = (): string => {
  return "player1,player2\nJohn Doe,Jane Smith\nAlex Johnson,Sam Williams";
};
