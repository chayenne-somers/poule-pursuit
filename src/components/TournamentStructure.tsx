
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Discipline, Level, Poule, NavigationState } from '@/types/tournament';
import { ChevronRight, Trophy, Users, Award, Trash, Edit, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getPouleWinner } from '@/utils/tournamentUtils';

interface TournamentStructureProps {
  disciplines: Discipline[];
  tournament?: { disciplines: Discipline[] };
  isAdmin?: boolean;
  navigationState?: NavigationState;
  onNavigationChange?: (newState: NavigationState) => void;
  onEditItem?: (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => void;
  onDeleteItem?: (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => void;
  onViewTeams?: (pouleId: string) => void;
  onAddNew?: (type: 'discipline' | 'level' | 'poule' | 'team', parentId?: string) => void;
}

const TournamentStructure = ({ 
  disciplines, 
  tournament,
  isAdmin = false,
  navigationState,
  onNavigationChange,
  onEditItem,
  onDeleteItem,
  onViewTeams,
  onAddNew
}: TournamentStructureProps) => {
  const allDisciplines = tournament?.disciplines || disciplines;
  
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | undefined>(
    navigationState?.selectedDiscipline || (allDisciplines.length > 0 ? allDisciplines[0].id : undefined)
  );
  
  const [animateCards, setAnimateCards] = useState(false);
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    
    setAnimateCards(true);
    const timer = setTimeout(() => setAnimateCards(false), 300);
    
    return () => clearTimeout(timer);
  }, [selectedDiscipline]);

  const handleDisciplineChange = (disciplineId: string) => {
    setSelectedDiscipline(disciplineId);
    
    if (onNavigationChange) {
      onNavigationChange({
        ...navigationState,
        selectedDiscipline: disciplineId,
        selectedLevel: undefined,
        selectedPoule: undefined
      });
    }
  };

  const selectedDisciplineData = allDisciplines.find(d => d.id === selectedDiscipline);

  const getTeamNames = (poule: Poule) => {
    const winner = getPouleWinner(poule);
    if (!winner) return null;
    return `${winner.players[0].name} & ${winner.players[1].name}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <Tabs defaultValue={selectedDiscipline} onValueChange={handleDisciplineChange}>
          <div className="border-b">
            <ScrollArea className="w-full overflow-auto pb-2">
              <TabsList className="inline-flex h-14 items-center justify-start rounded-none bg-transparent p-0">
                {allDisciplines.map((discipline) => (
                  <TabsTrigger
                    key={discipline.id}
                    value={discipline.id}
                    className={cn(
                      "h-14 rounded-none border-b-2 border-transparent px-6 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none",
                      "text-base font-medium transition-all relative group"
                    )}
                  >
                    {discipline.name}
                    {isAdmin && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditItem && onEditItem('discipline', discipline.id);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem && onDeleteItem('discipline', discipline.id);
                          }}
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>
          
          {allDisciplines.map((discipline) => (
            <TabsContent 
              key={discipline.id} 
              value={discipline.id}
              className={cn(
                "mt-6 animate-fade-in",
                animateCards && "animate-fade-in"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold tracking-tight">{discipline.name}</h2>
                </div>
                {isAdmin && onAddNew && (
                  <Button onClick={() => onAddNew('level', discipline.id)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Level
                  </Button>
                )}
              </div>

              {discipline.levels.length === 0 ? (
                <Card className="border border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground mb-4">No levels defined yet</p>
                    {isAdmin && onAddNew && (
                      <Button onClick={() => onAddNew('level', discipline.id)} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Level
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  {discipline.levels.map((level) => (
                    <div key={level.id} className="animate-fade-in">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-secondary text-secondary-foreground">
                            Level {level.name}
                          </Badge>
                          {isAdmin && (
                            <div className="flex items-center">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 ml-2"
                                onClick={() => onEditItem && onEditItem('level', level.id, discipline.id)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => onDeleteItem && onDeleteItem('level', level.id, discipline.id)}
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {isAdmin && onAddNew && (
                          <Button onClick={() => onAddNew('poule', level.id)} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Poule
                          </Button>
                        )}
                      </div>

                      {level.poules.length === 0 ? (
                        <Card className="border border-dashed">
                          <CardContent className="flex flex-col items-center justify-center py-8">
                            <p className="text-muted-foreground mb-2">No poules defined yet</p>
                            {isAdmin && onAddNew && (
                              <Button onClick={() => onAddNew('poule', level.id)} variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Poule
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {level.poules.map((poule) => {
                            const winner = getPouleWinner(poule);
                            const winnerNames = getTeamNames(poule);
                            
                            return (
                              <div 
                                key={poule.id} 
                                className="block"
                              >
                                <Card className={cn(
                                  "h-full transition-all duration-300 hover:shadow-lg border border-border/60",
                                  !isAdmin && "hover:-translate-y-1",
                                  winner && "border-amber-300"
                                )}>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-xl flex items-center justify-between">
                                      <span>{poule.name}</span>
                                      {isAdmin ? (
                                        <div className="flex items-center">
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7"
                                            onClick={() => onViewTeams && onViewTeams(poule.id)}
                                          >
                                            <Users className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7"
                                            onClick={() => onEditItem && onEditItem('poule', poule.id, level.id)}
                                          >
                                            <Edit className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7"
                                            onClick={() => onDeleteItem && onDeleteItem('poule', poule.id, level.id)}
                                          >
                                            <Trash className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Link to={`/poule/${poule.id}`}>
                                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </Link>
                                      )}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-1">
                                      <Users className="h-3.5 w-3.5" />
                                      <span>{poule.teams.length} teams</span>
                                      {isAdmin && onAddNew && (
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="ml-auto h-6 px-2 text-xs"
                                          onClick={() => onAddNew('team', poule.id)}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Team
                                        </Button>
                                      )}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="text-sm text-muted-foreground">
                                      {poule.matches.filter(m => m.completed).length} / {poule.matches.length} matches completed
                                    </div>
                                  </CardContent>
                                  {winner && (
                                    <CardFooter className="pt-0 pb-4 border-t border-border/30 mt-2">
                                      <div className="flex items-center text-amber-600 gap-1.5">
                                        <Award className="h-4 w-4" />
                                        <span className="font-medium">Winner: {winnerNames}</span>
                                      </div>
                                    </CardFooter>
                                  )}
                                </Card>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default TournamentStructure;
