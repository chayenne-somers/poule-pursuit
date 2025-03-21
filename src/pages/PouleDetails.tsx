
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  loadTournament, 
  saveTournament, 
  calculateStandings,
  TeamStanding
} from '@/utils/tournamentUtils';
import { Poule, Match, Team, SetResult } from '@/types/tournament';
import NavBar from '@/components/NavBar';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, ChevronRight, RefreshCw, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const PouleDetails = () => {
  const { pouleId } = useParams<{ pouleId: string }>();
  const [poule, setPoule] = useState<Poule | null>(null);
  const [discipline, setDiscipline] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!pouleId) return;
    
    const tournament = loadTournament();
    if (!tournament) {
      setIsLoading(false);
      return;
    }

    // Find the poule and its path in the tournament structure
    let foundPoule: Poule | null = null;
    let disciplineName = '';
    let levelName = '';

    tournament.disciplines.forEach(d => {
      d.levels.forEach(l => {
        const p = l.poules.find(p => p.id === pouleId);
        if (p) {
          // Ensure that each match has a sets array
          if (p.matches) {
            p.matches = p.matches.map(match => {
              if (!match.sets) {
                match.sets = [];
              }
              // Initialize 3 sets if there are none yet
              if (match.sets.length === 0) {
                match.sets = [
                  { scoreA: 0, scoreB: 0 },
                  { scoreA: 0, scoreB: 0 },
                  { scoreA: 0, scoreB: 0 }
                ];
              }
              return match;
            });
          }
          
          foundPoule = p;
          disciplineName = d.name;
          levelName = l.name;
        }
      });
    });

    if (foundPoule) {
      setPoule(foundPoule);
      setDiscipline(disciplineName);
      setLevel(levelName);
      
      // Sort matches by order
      const sortedMatches = [...foundPoule.matches].sort((a, b) => a.order - b.order);
      setMatches(sortedMatches);
      
      // Calculate standings
      setStandings(calculateStandings(foundPoule));
    }
    
    setIsLoading(false);
  }, [pouleId]);

  const getTeamName = (team: Team): string => {
    return `${team.players[0].name} & ${team.players[1].name}`;
  };

  const handleSetScoreChange = (matchIndex: number, setIndex: number, team: 'A' | 'B', value: string) => {
    if (!poule) return;
    
    const updatedMatches = [...matches];
    const match = updatedMatches[matchIndex];
    
    // Ensure sets array exists
    if (!match.sets) {
      match.sets = [
        { scoreA: 0, scoreB: 0 },
        { scoreA: 0, scoreB: 0 },
        { scoreA: 0, scoreB: 0 }
      ];
    }
    
    // Ensure this set exists
    if (!match.sets[setIndex]) {
      match.sets[setIndex] = { scoreA: 0, scoreB: 0 };
    }
    
    // Convert to number or set to 0 if invalid
    const score = value === '' ? 0 : Number(value);
    
    if (team === 'A') {
      match.sets[setIndex].scoreA = score;
    } else {
      match.sets[setIndex].scoreB = score;
    }
    
    // Mark as completed if all sets have scores
    match.completed = match.sets.length === 3 && 
      match.sets.every(set => 
        typeof set.scoreA === 'number' && 
        typeof set.scoreB === 'number'
      );
    
    setMatches(updatedMatches);
    
    // Update the poule in state
    const updatedPoule = { ...poule, matches: updatedMatches };
    setPoule(updatedPoule);
    
    // Recalculate standings
    setStandings(calculateStandings(updatedPoule));
  };

  const saveChanges = () => {
    if (!poule || !pouleId) return;
    
    const tournament = loadTournament();
    if (!tournament) return;
    
    // Find and update the poule in the tournament structure
    let updated = false;
    tournament.disciplines.forEach(d => {
      d.levels.forEach(l => {
        const pouleIndex = l.poules.findIndex(p => p.id === pouleId);
        if (pouleIndex !== -1) {
          l.poules[pouleIndex] = { ...poule, matches };
          updated = true;
        }
      });
    });
    
    if (updated) {
      saveTournament(tournament);
      toast({
        title: "Scores saved",
        description: "Match scores have been updated successfully",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container px-4 pt-24 pb-16 mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse flex space-x-2">
              <div className="h-3 w-3 bg-primary rounded-full"></div>
              <div className="h-3 w-3 bg-primary rounded-full"></div>
              <div className="h-3 w-3 bg-primary rounded-full"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!poule) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container px-4 pt-24 pb-16 mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Poule not found</p>
            <Link to="/">
              <Button variant="outline">Back to Overview</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container px-4 pt-24 pb-16 mx-auto max-w-5xl">
        <div className="flex flex-col space-y-4 mb-8 animate-fade-in">
          <Link 
            to="/" 
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Overview
          </Link>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2 mb-1">
              <Badge className="bg-secondary text-secondary-foreground">
                {discipline}
              </Badge>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <Badge className="bg-secondary text-secondary-foreground">
                Level {level}
              </Badge>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">Poule {poule.name}</h1>
            
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span>{poule.teams.length} teams</span>
              <span className="mx-2">•</span>
              <span>{poule.matches.filter(m => m.completed).length} of {poule.matches.length} matches completed</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 mb-8">
          <div className="md:col-span-4 animate-fade-in">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-primary" />
                  Matches
                </CardTitle>
                <CardDescription>
                  All matches for this poule in order of play
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {matches.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No matches available</p>
                  </div>
                ) : (
                  matches.map((match, matchIndex) => (
                    <div 
                      key={match.id} 
                      className={cn(
                        "p-4 border rounded-lg",
                        match.completed && "bg-green-50 dark:bg-green-950/20"
                      )}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="font-semibold">{getTeamName(match.teamA)}</div>
                        <div className="text-sm text-muted-foreground">vs</div>
                        <div className="font-semibold text-right">{getTeamName(match.teamB)}</div>
                      </div>
                      
                      <div className="space-y-2">
                        {[0, 1, 2].map((setIndex) => {
                          const set = match.sets && match.sets[setIndex] 
                            ? match.sets[setIndex] 
                            : { scoreA: 0, scoreB: 0 };
                            
                          return (
                            <div key={setIndex} className="flex items-center">
                              <div className="w-8 text-sm font-medium text-muted-foreground">
                                Set {setIndex + 1}
                              </div>
                              <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                                <Input
                                  type="number"
                                  min="0"
                                  className="text-center h-9"
                                  value={set.scoreA}
                                  onChange={(e) => handleSetScoreChange(matchIndex, setIndex, 'A', e.target.value)}
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                  type="number"
                                  min="0"
                                  className="text-center h-9"
                                  value={set.scoreB}
                                  onChange={(e) => handleSetScoreChange(matchIndex, setIndex, 'B', e.target.value)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
                
                <Button 
                  onClick={saveChanges} 
                  className="w-full mt-4"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Scores
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-3 animate-fade-in">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Standings
                </CardTitle>
                <CardDescription>
                  Current team rankings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {standings.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No standings available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-3 text-xs text-muted-foreground px-2">
                      <div>#</div>
                      <div>Team</div>
                      <div className="text-center">P</div>
                      <div className="text-center">W</div>
                      <div className="text-center">Sets</div>
                      <div className="text-center">Pts</div>
                    </div>
                    
                    <Separator />
                    
                    {standings.map((standing, index) => (
                      <div 
                        key={standing.team.id} 
                        className={cn(
                          "grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-3 items-center py-2 px-2 rounded-md",
                          index === 0 && "bg-accent/40"
                        )}
                      >
                        <div className="font-medium">{index + 1}</div>
                        <div className="font-medium truncate">{getTeamName(standing.team)}</div>
                        <div className="text-center">{standing.played}</div>
                        <div className="text-center">{standing.won}</div>
                        <div className="text-center">{standing.sets.won}-{standing.sets.lost}</div>
                        <div className="text-center font-bold">{standing.matchPoints}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Detailed Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-4">
                  {standings.map((standing) => (
                    <div key={standing.team.id} className="space-y-1">
                      <div className="font-medium">{getTeamName(standing.team)}</div>
                      <div className="grid grid-cols-2 gap-x-4 text-muted-foreground">
                        <div>Matches: {standing.won}-{standing.lost}</div>
                        <div>Sets: {standing.sets.won}-{standing.sets.lost}</div>
                        <div>Points: {standing.points.scored}-{standing.points.conceded}</div>
                        <div>Point diff: {standing.points.scored - standing.points.conceded}</div>
                      </div>
                      <Separator className="mt-3" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper component for save button
const Save = ({ className, ...props }: React.ComponentProps<typeof RefreshCw>) => (
  <RefreshCw className={cn("animate-none", className)} {...props} />
);

export default PouleDetails;
