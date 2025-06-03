
import { supabase } from '@/integrations/supabase/client';
import { Tournament, Discipline, Level, Poule, Team, Match } from '@/types/tournament';

// Get or create a tournament for the current user
export const getOrCreateTournament = async (): Promise<string> => {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    throw new Error('User not authenticated');
  }

  const user_id = session.session.user.id;
  
  // Check if user already has a tournament
  const { data: existingTournament, error: fetchError } = await supabase
    .from('tournaments')
    .select('id')
    .eq('user_id', user_id)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (existingTournament) {
    return existingTournament.id;
  }

  // Create new tournament
  const { data: newTournament, error: createError } = await supabase
    .from('tournaments')
    .insert([
      { 
        user_id: user_id, 
        name: 'My Tournament',
        data: {} // Keep for backward compatibility
      }
    ])
    .select('id')
    .single();

  if (createError) {
    throw createError;
  }

  return newTournament.id;
};

// Load tournament data from the new database structure
export const loadTournamentFromDB = async (): Promise<Tournament> => {
  try {
    const tournamentId = await getOrCreateTournament();
    
    // Fetch all disciplines for this tournament
    const { data: disciplines, error: disciplinesError } = await supabase
      .from('disciplines')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at');

    if (disciplinesError) throw disciplinesError;

    if (!disciplines || disciplines.length === 0) {
      return { disciplines: [] };
    }

    // Fetch all levels for these disciplines
    const disciplineIds = disciplines.map(d => d.id);
    const { data: levels, error: levelsError } = await supabase
      .from('levels')
      .select('*')
      .in('discipline_id', disciplineIds)
      .order('created_at');

    if (levelsError) throw levelsError;

    // Fetch all poules for these levels
    const levelIds = levels?.map(l => l.id) || [];
    const { data: poules, error: poulesError } = await supabase
      .from('poules')
      .select('*')
      .in('level_id', levelIds)
      .order('created_at');

    if (poulesError) throw poulesError;

    // Fetch all teams for these poules
    const pouleIds = poules?.map(p => p.id) || [];
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .in('poule_id', pouleIds)
      .order('created_at');

    if (teamsError) throw teamsError;

    // Fetch all matches for these poules
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .in('poule_id', pouleIds)
      .order('match_order');

    if (matchesError) throw matchesError;

    // Build the tournament structure
    const tournament: Tournament = {
      disciplines: disciplines.map(discipline => ({
        id: discipline.id,
        name: discipline.name,
        levels: (levels || [])
          .filter(level => level.discipline_id === discipline.id)
          .map(level => ({
            id: level.id,
            name: level.name,
            poules: (poules || [])
              .filter(poule => poule.level_id === level.id)
              .map(poule => {
                const pouleTeams = (teams || [])
                  .filter(team => team.poule_id === poule.id)
                  .map(team => ({
                    id: team.id,
                    players: [
                      { id: `${team.id}_1`, name: team.player1_name },
                      { id: `${team.id}_2`, name: team.player2_name }
                    ] as [any, any]
                  }));

                const pouleMatches = (matches || [])
                  .filter(match => match.poule_id === poule.id)
                  .map(match => {
                    const teamA = pouleTeams.find(t => t.id === match.team_a_id);
                    const teamB = pouleTeams.find(t => t.id === match.team_b_id);
                    
                    return {
                      id: match.id,
                      teamA: teamA || { id: 'unknown', players: [{ id: 'unknown1', name: 'Unknown' }, { id: 'unknown2', name: 'Unknown' }] as [any, any] },
                      teamB: teamB || { id: 'unknown', players: [{ id: 'unknown1', name: 'Unknown' }, { id: 'unknown2', name: 'Unknown' }] as [any, any] },
                      sets: [
                        { scoreA: match.set1_score_a, scoreB: match.set1_score_b },
                        { scoreA: match.set2_score_a, scoreB: match.set2_score_b },
                        { scoreA: match.set3_score_a, scoreB: match.set3_score_b }
                      ],
                      completed: match.completed,
                      order: match.match_order
                    };
                  });

                return {
                  id: poule.id,
                  name: poule.name,
                  teams: pouleTeams,
                  matches: pouleMatches
                };
              })
          }))
      }))
    };

    return tournament;
  } catch (error) {
    console.error('Error loading tournament from DB:', error);
    return { disciplines: [] };
  }
};

// Create a new discipline
export const createDiscipline = async (name: string): Promise<void> => {
  const tournamentId = await getOrCreateTournament();
  
  const { error } = await supabase
    .from('disciplines')
    .insert([{ tournament_id: tournamentId, name }]);

  if (error) throw error;
};

// Update discipline
export const updateDiscipline = async (id: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('disciplines')
    .update({ name })
    .eq('id', id);

  if (error) throw error;
};

// Delete discipline
export const deleteDiscipline = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('disciplines')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Create a new level
export const createLevel = async (disciplineId: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('levels')
    .insert([{ discipline_id: disciplineId, name }]);

  if (error) throw error;
};

// Update level
export const updateLevel = async (id: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('levels')
    .update({ name })
    .eq('id', id);

  if (error) throw error;
};

// Delete level
export const deleteLevel = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('levels')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Create a new poule
export const createPoule = async (levelId: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('poules')
    .insert([{ level_id: levelId, name }]);

  if (error) throw error;
};

// Update poule
export const updatePoule = async (id: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('poules')
    .update({ name })
    .eq('id', id);

  if (error) throw error;
};

// Delete poule
export const deletePoule = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('poules')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Create a new team
export const createTeam = async (pouleId: string, player1Name: string, player2Name: string): Promise<void> => {
  const { error } = await supabase
    .from('teams')
    .insert([{ 
      poule_id: pouleId, 
      player1_name: player1Name, 
      player2_name: player2Name 
    }]);

  if (error) throw error;
};

// Update team
export const updateTeam = async (id: string, player1Name: string, player2Name: string): Promise<void> => {
  const { error } = await supabase
    .from('teams')
    .update({ 
      player1_name: player1Name, 
      player2_name: player2Name 
    })
    .eq('id', id);

  if (error) throw error;
};

// Delete team
export const deleteTeam = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Remove all teams from a poule
export const removeAllTeamsFromPoule = async (pouleId: string): Promise<void> => {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('poule_id', pouleId);

  if (error) throw error;
};
