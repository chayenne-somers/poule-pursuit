
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  isSetComplete,
  isMatchComplete
} from '@/utils/tournamentUtils';
import TeamStandings from '@/components/TeamStandings';
import NavBar from '@/components/NavBar';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { 
  Trophy, 
  ChevronLeft, 
  Save,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const PouleDetails = () => {
  const { pouleId } = useParams<{ pouleId: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [poule, setPoule] = useState<Poule | null>(null);
  const [breadcrumb, setBreadcrumb] = useState({ discipline: '', level: '' });
  const [matches, setMatches] = useState<Match[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  // Load tournament data and check if user is admin
  useEffect(() => {
    const data = loadTournament();
    setTournament(data);
    
    // Check if user is admin
    const isAdminAuthenticated = sessionStorage.getItem('isAdminAuthenticated') === 'true';
    setIsAdmin(isAdminAuthenticated);
    
    // Find poule and set breadcrumb
    if (data && pouleId) {
      let foundPoule: Poule | null = null;
      let disciplineName = '';
      let levelName = '';
      
      for (const discipline of data.disciplines) {
        for (const level of discipline.levels) {
          for (const poule of level.poules) {
            if (poule.id === pouleId) {
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
      }
    }
  }, [pouleId]);

  // Handle score changes
  const handleScoreChange = (matchIndex: number, setIndex: number, team: 'A' | 'B', value: string) => {
    const updatedMatches = [...matches];
    const match = { ...updatedMatches[matchIndex] };
    
    const sets = [...match.sets];
    const set = { ...sets[setIndex] };
    
    // Update the score
    if (team === 'A') {
      set.scoreA = value === '' ? undefined : parseInt(value);
    } else {
      set.scoreB = value === '' ? undefined : parseInt(value);
    }
    
    sets[setIndex] = set;
    match.sets = sets;
    
    // Check if match is complete (a team has won 2 sets)
    match.completed = isMatchComplete(match);
    
    updatedMatches[matchIndex] = match;
    setMatches(updatedMatches);
  };

  const handleSaveScores = () => {
    if (!tournament || !poule) return;
    
    // Update poule with new matches
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
      // Save tournament
      saveTournament(updatedTournament);
      setTournament(updatedTournament);
      setPoule(updatedPoule);
      
      toast({
        title: "Scores saved",
        description: "Match scores have been updated successfully",
      });
    }
  };

  // Get the number of sets won by each team in a match
  const getSetsWon = (match: Match) => {
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
  const didTeamWinMatch = (match: Match, isTeamA: boolean) => {
    const { setsWonA, setsWonB } = getSetsWon(match);
    return isTeamA ? setsWonA >= 2 : setsWonB >= 2;
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container px-4 pt-24 pb-16 mx-auto">
        {poule ? (
          <>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Link to="/" className="hover:underline">Home</Link>
                  <ArrowRight className="h-3 w-3" />
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
                <Button variant="outline" asChild>
                  <Link to="/">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Tournament
                  </Link>
                </Button>
                
                {isAdmin && (
                  <Button onClick={handleSaveScores}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Scores
                  </Button>
                )}
              </div>
            </div>
            
            {/* Team Standings */}
            <div className="mb-8">
              <TeamStandings standings={calculateStandings(poule)} />
            </div>
            
            {/* Winner Card */}
            {getPouleWinner(poule) && (
              <div className="mb-8">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="text-green-800 font-medium">Poule Winner</p>
                        <p className="text-lg font-semibold">
                          {getPouleWinner(poule)?.players[0].name} & {getPouleWinner(poule)?.players[1].name}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Matches */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Matches</h2>
              
              {matches.map((match, matchIndex) => {
                const { setsWonA, setsWonB } = getSetsWon(match);
                const teamAWon = didTeamWinMatch(match, true);
                const teamBWon = didTeamWinMatch(match, false);
                
                return (
                  <Card key={match.id} className={`
                    ${match.completed ? 'border-2' : 'border'}
                    ${teamAWon ? 'border-green-500' : teamBWon ? 'border-blue-500' : 'border-border'}
                  `}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Match {matchIndex + 1}</CardTitle>
                        {match.completed && (
                          <Badge className={teamAWon ? 'bg-green-500' : 'bg-blue-500'}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        Order: {match.order}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center font-medium">Team</div>
                        <div className="text-center font-medium">Sets ({match.sets.length})</div>
                        <div className="text-center font-medium">Result</div>
                      </div>
                      
                      {/* Team A */}
                      <div className="grid grid-cols-3 gap-4 mb-6 items-center">
                        <div className={`${teamAWon ? 'font-semibold text-green-600' : ''}`}>
                          {match.teamA.players[0].name} & <br />
                          {match.teamA.players[1].name}
                        </div>
                        <div className="flex justify-center gap-2">
                          {match.sets.map((set, setIndex) => (
                            <div key={setIndex} className="w-12">
                              {isAdmin ? (
                                <Input
                                  type="number"
                                  min="0"
                                  value={set.scoreA !== undefined ? set.scoreA : ''}
                                  onChange={(e) => handleScoreChange(matchIndex, setIndex, 'A', e.target.value)}
                                  className="h-8 text-center"
                                />
                              ) : (
                                <div className="border rounded px-2 py-1 text-center">
                                  {set.scoreA !== undefined ? set.scoreA : '-'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="text-center">
                          <span className={`text-lg ${teamAWon ? 'font-bold text-green-600' : ''}`}>
                            {setsWonA}
                          </span> sets won
                        </div>
                      </div>
                      
                      {/* Team B */}
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div className={`${teamBWon ? 'font-semibold text-blue-600' : ''}`}>
                          {match.teamB.players[0].name} & <br />
                          {match.teamB.players[1].name}
                        </div>
                        <div className="flex justify-center gap-2">
                          {match.sets.map((set, setIndex) => (
                            <div key={setIndex} className="w-12">
                              {isAdmin ? (
                                <Input
                                  type="number"
                                  min="0"
                                  value={set.scoreB !== undefined ? set.scoreB : ''}
                                  onChange={(e) => handleScoreChange(matchIndex, setIndex, 'B', e.target.value)}
                                  className="h-8 text-center"
                                />
                              ) : (
                                <div className="border rounded px-2 py-1 text-center">
                                  {set.scoreB !== undefined ? set.scoreB : '-'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="text-center">
                          <span className={`text-lg ${teamBWon ? 'font-bold text-blue-600' : ''}`}>
                            {setsWonB}
                          </span> sets won
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse flex space-x-2">
              <div className="h-3 w-3 bg-primary rounded-full"></div>
              <div className="h-3 w-3 bg-primary rounded-full"></div>
              <div className="h-3 w-3 bg-primary rounded-full"></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PouleDetails;
