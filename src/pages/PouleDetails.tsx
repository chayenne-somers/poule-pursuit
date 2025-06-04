
import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  Match, 
  Poule, 
  SetScore, 
  Tournament 
} from '@/types/tournament';
import { 
  loadTournament, 
  saveTournament, 
  calculateStandings, 
  getPouleWinner,
  isMatchComplete
} from '@/utils/tournamentUtils';
import { updateMatchScores } from '@/utils/supabaseUtils';
import TeamStandings from '@/components/TeamStandings';
import PouleWinnerCard from '@/components/PouleWinnerCard';
import MatchCard from '@/components/MatchCard';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/hooks/use-auth';

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Alert,
  AlertTitle,
  AlertDescription
} from "@/components/ui/alert";
import { 
  ChevronLeft, 
  Save,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PouleDetails = () => {
  const { pouleId } = useParams<{ pouleId: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [poule, setPoule] = useState<Poule | null>(null);
  const [breadcrumb, setBreadcrumb] = useState({ discipline: '', level: '' });
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();

  // Debug the current route
  useEffect(() => {
    console.log("PouleDetails: Current route", location.pathname);
    console.log("PouleDetails: User authenticated:", user ? "Yes" : "No");
    console.log("PouleDetails: Poule ID:", pouleId);
  }, [location, user, pouleId]);

  // Load tournament data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Loading tournament data for poule:", pouleId);
        
        if (!pouleId) {
          setError("No poule ID provided");
          setLoading(false);
          return;
        }
        
        // Load tournament data
        const data = await loadTournament();
        console.log("Tournament data loaded:", data ? "Success" : "Failed");
        
        if (!data || !data.disciplines || data.disciplines.length === 0) {
          setError("Tournament data is empty or invalid");
          setLoading(false);
          return;
        }
        
        setTournament(data);
        
        // Find poule and set breadcrumb
        console.log("Looking for poule with ID:", pouleId);
        let foundPoule: Poule | null = null;
        let disciplineName = '';
        let levelName = '';
        
        // Traverse through all disciplines, levels, and poules
        for (const discipline of data.disciplines) {
          for (const level of discipline.levels) {
            for (const poule of level.poules) {
              if (poule.id === pouleId) {
                console.log(`Found poule '${poule.name}' in ${discipline.name}, level ${level.name}`);
                foundPoule = poule;
                disciplineName = discipline.name;
                levelName = level.name;
                break;
              }
            }
            if (foundPoule) break;
          }
          if (foundPoule) break;
        }
        
        if (foundPoule) {
          console.log("Found poule:", foundPoule.name);
          // Ensure matches have the sets array structure
          const updatedMatches = foundPoule.matches.map(match => {
            if (!match.sets || match.sets.length === 0) {
              // Convert old format to new format if needed
              const sets: SetScore[] = [{}, {}, {}];
              return { ...match, sets };
            }
            // Make sure there are 3 sets
            const sets = [...match.sets];
            while (sets.length < 3) {
              sets.push({});
            }
            return { ...match, sets };
          });
          
          const updatedPoule = { ...foundPoule, matches: updatedMatches };
          setPoule(updatedPoule);
          setMatches(updatedMatches);
          setBreadcrumb({ 
            discipline: disciplineName, 
            level: levelName 
          });
        } else {
          console.error("Poule not found with ID:", pouleId);
          setError(`Poule with ID ${pouleId} not found in tournament data`);
        }
      } catch (error) {
        console.error("Error loading tournament data:", error);
        setError("Failed to load tournament data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [pouleId]);

  // Handle score changes
  const handleScoreChange = (matchIndex: number, setIndex: number, team: 'A' | 'B', value: string) => {
    const updatedMatches = [...matches];
    const match = { ...updatedMatches[matchIndex] };
    
    const sets = [...match.sets];
    const set = { ...sets[setIndex] };
    
    // Update the score - ensure we handle empty inputs correctly
    if (team === 'A') {
      set.scoreA = value === '' ? undefined : parseInt(value, 10);
    } else {
      set.scoreB = value === '' ? undefined : parseInt(value, 10);
    }
    
    sets[setIndex] = set;
    match.sets = sets;
    
    // Check if match is complete (a team has won 2 sets)
    match.completed = isMatchComplete(match);
    
    updatedMatches[matchIndex] = match;
    setMatches(updatedMatches);
  };

  // Save scores for a specific match
  const handleSaveMatch = async (matchIndex: number) => {
    if (!tournament || !poule) return;
    
    try {
      const match = matches[matchIndex];
      
      // Check if user is authenticated to use database
      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session) {
        // Save to database for authenticated users
        await updateMatchScores(
          match.id,
          match.sets[0]?.scoreA,
          match.sets[0]?.scoreB,
          match.sets[1]?.scoreA,
          match.sets[1]?.scoreB,
          match.sets[2]?.scoreA,
          match.sets[2]?.scoreB,
          match.completed
        );
        
        // Update the local state immediately without reloading from database
        const updatedMatches = [...matches];
        updatedMatches[matchIndex] = match;
        setMatches(updatedMatches);
        
        // Update the poule state as well
        const updatedPoule = { ...poule, matches: updatedMatches };
        setPoule(updatedPoule);
        
        // Update tournament state
        const updatedTournament = { ...tournament };
        let updated = false;
        
        for (let i = 0; i < updatedTournament.disciplines.length; i++) {
          const discipline = updatedTournament.disciplines[i];
          for (let j = 0; j < discipline.levels.length; j++) {
            const level = discipline.levels[j];
            for (let k = 0; k < level.poules.length; k++) {
              const p = level.poules[k];
              if (p.id === poule.id) {
                updatedTournament.disciplines[i].levels[j].poules[k] = updatedPoule;
                updated = true;
                break;
              }
            }
            if (updated) break;
          }
          if (updated) break;
        }
        
        if (updated) {
          setTournament(updatedTournament);
        }
      } else {
        // For unauthenticated users, update localStorage
        const updatedPoule: Poule = { 
          ...poule, 
          matches: matches.map((m, i) => i === matchIndex ? match : m) 
        };
        
        // Find and update the poule in the tournament
        const updatedTournament = { ...tournament };
        
        let updated = false;
        
        for (let i = 0; i < updatedTournament.disciplines.length; i++) {
          const discipline = updatedTournament.disciplines[i];
          for (let j = 0; j < discipline.levels.length; j++) {
            const level = discipline.levels[j];
            for (let k = 0; k < level.poules.length; k++) {
              const p = level.poules[k];
              if (p.id === poule.id) {
                updatedTournament.disciplines[i].levels[j].poules[k] = updatedPoule;
                updated = true;
                break;
              }
            }
            if (updated) break;
          }
          if (updated) break;
        }
        
        if (updated) {
          await saveTournament(updatedTournament);
          setTournament(updatedTournament);
          setPoule(updatedPoule);
          setMatches(updatedPoule.matches);
        }
      }
      
      toast({
        title: "Match saved",
        description: `Match ${matchIndex + 1} scores have been updated`,
      });
    } catch (error) {
      console.error('Error saving match:', error);
      toast({
        title: "Error",
        description: "Failed to save match scores. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Save all matches
  const handleSaveScores = async () => {
    if (!tournament || !poule) return;
    
    try {
      // Check if user is authenticated to use database
      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session) {
        // Save all matches to database for authenticated users
        for (const match of matches) {
          await updateMatchScores(
            match.id,
            match.sets[0]?.scoreA,
            match.sets[0]?.scoreB,
            match.sets[1]?.scoreA,
            match.sets[1]?.scoreB,
            match.sets[2]?.scoreA,
            match.sets[2]?.scoreB,
            match.completed
          );
        }
        
        // Update the local state immediately
        const updatedPoule = { ...poule, matches };
        setPoule(updatedPoule);
        
        // Update tournament state
        const updatedTournament = { ...tournament };
        let updated = false;
        
        for (let i = 0; i < updatedTournament.disciplines.length; i++) {
          const discipline = updatedTournament.disciplines[i];
          for (let j = 0; j < discipline.levels.length; j++) {
            const level = discipline.levels[j];
            for (let k = 0; k < level.poules.length; k++) {
              const p = level.poules[k];
              if (p.id === poule.id) {
                updatedTournament.disciplines[i].levels[j].poules[k] = updatedPoule;
                updated = true;
                break;
              }
            }
            if (updated) break;
          }
          if (updated) break;
        }
        
        if (updated) {
          setTournament(updatedTournament);
        }
      } else {
        // For unauthenticated users, update localStorage
        const updatedPoule: Poule = { ...poule, matches };
        
        // Find and update the poule in the tournament
        const updatedTournament = { ...tournament };
        
        let updated = false;
        
        for (let i = 0; i < updatedTournament.disciplines.length; i++) {
          const discipline = updatedTournament.disciplines[i];
          for (let j = 0; j < discipline.levels.length; j++) {
            const level = discipline.levels[j];
            for (let k = 0; k < level.poules.length; k++) {
              const p = level.poules[k];
              if (p.id === poule.id) {
                updatedTournament.disciplines[i].levels[j].poules[k] = updatedPoule;
                updated = true;
                break;
              }
            }
            if (updated) break;
          }
          if (updated) break;
        }
        
        if (updated) {
          await saveTournament(updatedTournament);
          setTournament(updatedTournament);
          setPoule(updatedPoule);
        }
      }
      
      toast({
        title: "All scores saved",
        description: "All match scores have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving all matches:', error);
      toast({
        title: "Error",
        description: "Failed to save match scores. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Calculate if all matches are completed
  const allMatchesCompleted = poule ? poule.matches.every(match => match.completed) : false;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container px-4 pt-24 pb-16 mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse flex space-x-2">
              <div className="h-3 w-3 bg-primary rounded-full"></div>
              <div className="h-3 w-3 bg-primary rounded-full"></div>
              <div className="h-3 w-3 bg-primary rounded-full"></div>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Alert variant="destructive" className="mb-6 max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            {user ? (
              <Button variant="outline" asChild>
                <Link to="/">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Tournament
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link to="/auth">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Log in
                </Link>
              </Button>
            )}
          </div>
        ) : poule ? (
          <>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  {user && (
                    <>
                      <Link to="/" className="hover:underline">Home</Link>
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                  <span>{breadcrumb.discipline}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>Level {breadcrumb.level}</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-1">Poule {poule.name}</h1>
                <p className="text-muted-foreground">
                  {poule.teams.length} teams, {poule.matches.length} matches
                </p>
              </div>
              
              <div className="flex gap-3">
                {/* Only show Back to Tournament button for authenticated users */}
                {user && (
                  <Button variant="outline" asChild>
                    <Link to="/">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back to Tournament
                    </Link>
                  </Button>
                )}
                
                {/* Always show Save All Scores button for any user */}
                <Button onClick={handleSaveScores}>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Scores
                </Button>
              </div>
            </div>
            
            {/* Team Standings */}
            <div className="mb-8">
              <TeamStandings standings={calculateStandings(poule)} />
            </div>
            
            {/* Winner Card */}
            <PouleWinnerCard 
              winner={allMatchesCompleted ? getPouleWinner(poule) : null} 
              allMatchesCompleted={allMatchesCompleted}
            />
            
            {/* Matches */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Matches</h2>
              
              {matches.map((match, matchIndex) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  matchIndex={matchIndex}
                  isAdmin={true} // Allow all users to update scores
                  onScoreChange={handleScoreChange}
                  onSaveMatch={handleSaveMatch}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-xl font-medium mb-2">Poule not found</h2>
              <p className="text-muted-foreground mb-4">The poule you're looking for doesn't exist or has been removed.</p>
              {user ? (
                <Button variant="outline" asChild>
                  <Link to="/">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Tournament
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link to="/auth">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Log in
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PouleDetails;
