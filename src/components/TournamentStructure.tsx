
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Discipline, Level, Poule, NavigationState } from '@/types/tournament';
import { ChevronRight, Trophy, Users, Award, Trash, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getPouleWinner } from '@/utils/tournamentUtils';

interface TournamentStructureProps {
  disciplines: Discipline[];
  isAdmin?: boolean;
  navigationState?: NavigationState;
  onNavigationChange?: (newState: NavigationState) => void;
  onEditItem?: (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => void;
  onDeleteItem?: (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => void;
}

const TournamentStructure = ({ 
  disciplines = [], 
  isAdmin = false,
  navigationState,
  onNavigationChange,
  onEditItem,
  onDeleteItem
}: TournamentStructureProps) => {
  // Ensure disciplines is always an array, even if undefined is passed
  const safeDisciplines = Array.isArray(disciplines) ? disciplines : [];
  
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | undefined>(
    navigationState?.selectedDiscipline || (safeDisciplines.length > 0 ? safeDisciplines[0]?.id : undefined)
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

  useEffect(() => {
    // Update selected discipline if disciplines change
    if (safeDisciplines.length > 0 && !selectedDiscipline) {
      setSelectedDiscipline(safeDisciplines[0]?.id);
    }
  }, [safeDisciplines, selectedDiscipline]);

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

  const selectedDisciplineData = safeDisciplines.find(d => d.id === selectedDiscipline);

  // If there are no disciplines, show a message
  if (safeDisciplines.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <Card className="border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No disciplines defined yet</p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground">
                Add disciplines in the admin panel
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <Tabs 
          defaultValue={selectedDiscipline} 
          value={selectedDiscipline}
          onValueChange={handleDisciplineChange}
        >
          <div className="border-b">
            <ScrollArea className="w-full overflow-auto pb-2">
              <TabsList className="inline-flex h-14 items-center justify-start rounded-none bg-transparent p-0">
                {safeDisciplines.map((discipline) => (
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
          
          {safeDisciplines.map((discipline) => {
            // Ensure levels is always an array
            const levels = Array.isArray(discipline.levels) ? discipline.levels : [];
            
            return (
              <TabsContent 
                key={discipline.id} 
                value={discipline.id}
                className={cn(
                  "mt-6 animate-fade-in",
                  animateCards && "animate-fade-in"
                )}
              >
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold tracking-tight">{discipline.name}</h2>
                </div>

                {levels.length === 0 ? (
                  <Card className="border border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground mb-4">No levels defined yet</p>
                      {isAdmin && (
                        <p className="text-sm text-muted-foreground">
                          Add levels in the admin panel
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-8">
                    {levels.map((level) => {
                      // Ensure poules is always an array
                      const poules = Array.isArray(level.poules) ? level.poules : [];
                      
                      return (
                        <div key={level.id} className="animate-fade-in">
                          <div className="flex items-center gap-2 mb-4">
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

                          {poules.length === 0 ? (
                            <Card className="border border-dashed">
                              <CardContent className="flex flex-col items-center justify-center py-8">
                                <p className="text-muted-foreground mb-2">No poules defined yet</p>
                                {isAdmin && (
                                  <p className="text-sm text-muted-foreground">
                                    Add poules in the admin panel
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {poules.map((poule) => {
                                // Ensure teams and matches are arrays
                                const teams = Array.isArray(poule.teams) ? poule.teams : [];
                                const matches = Array.isArray(poule.matches) ? poule.matches : [];
                                const winner = getPouleWinner(poule);
                                
                                return (
                                  <Link
                                    key={poule.id}
                                    to={isAdmin ? "#" : `/poule/${poule.id}`}
                                    className={!isAdmin ? "block" : "pointer-events-none"}
                                    onClick={(e) => {
                                      if (isAdmin) {
                                        e.preventDefault();
                                      }
                                    }}
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
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  e.preventDefault();
                                                  onEditItem && onEditItem('poule', poule.id, level.id);
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
                                                  e.preventDefault();
                                                  onDeleteItem && onDeleteItem('poule', poule.id, level.id);
                                                }}
                                              >
                                                <Trash className="h-3.5 w-3.5" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                          )}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                          <Users className="h-3.5 w-3.5" />
                                          <span>{teams.length} teams</span>
                                        </CardDescription>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-sm text-muted-foreground">
                                          {matches.filter(m => m.completed).length} / {matches.length} matches completed
                                        </div>
                                      </CardContent>
                                      {winner && (
                                        <CardFooter className="pt-0 pb-4 border-t border-border/30 mt-2">
                                          <div className="flex items-center text-amber-600 gap-1.5">
                                            <Award className="h-4 w-4" />
                                            <span className="font-medium">Winner: {winner.players[0].name} & {winner.players[1].name}</span>
                                          </div>
                                        </CardFooter>
                                      )}
                                    </Card>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default TournamentStructure;
