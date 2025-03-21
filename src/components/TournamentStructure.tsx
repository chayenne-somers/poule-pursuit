
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Discipline, Level, Poule, NavigationState } from '@/types/tournament';
import { ChevronRight, Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TournamentStructureProps {
  disciplines: Discipline[];
  isAdmin?: boolean;
  navigationState?: NavigationState;
  onNavigationChange?: (newState: NavigationState) => void;
}

const TournamentStructure = ({ 
  disciplines, 
  isAdmin = false,
  navigationState,
  onNavigationChange 
}: TournamentStructureProps) => {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | undefined>(
    navigationState?.selectedDiscipline || (disciplines.length > 0 ? disciplines[0].id : undefined)
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

  const selectedDisciplineData = disciplines.find(d => d.id === selectedDiscipline);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <Tabs defaultValue={selectedDiscipline} onValueChange={handleDisciplineChange}>
          <div className="border-b">
            <ScrollArea orientation="horizontal" className="w-full overflow-auto pb-2">
              <TabsList className="inline-flex h-14 items-center justify-start rounded-none bg-transparent p-0">
                {disciplines.map((discipline) => (
                  <TabsTrigger
                    key={discipline.id}
                    value={discipline.id}
                    className={cn(
                      "h-14 rounded-none border-b-2 border-transparent px-6 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none",
                      "text-base font-medium transition-all"
                    )}
                  >
                    {discipline.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>
          
          {disciplines.map((discipline) => (
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

              {discipline.levels.length === 0 ? (
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
                  {discipline.levels.map((level) => (
                    <div key={level.id} className="animate-fade-in">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-secondary text-secondary-foreground">
                          Level {level.name}
                        </Badge>
                      </div>

                      {level.poules.length === 0 ? (
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
                          {level.poules.map((poule) => (
                            <Link
                              key={poule.id}
                              to={isAdmin ? "#" : `/poule/${poule.id}`}
                              className={!isAdmin ? "block" : "pointer-events-none"}
                            >
                              <Card className={cn(
                                "h-full transition-all duration-300 hover:shadow-lg border border-border/60",
                                !isAdmin && "hover:-translate-y-1"
                              )}>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-xl flex items-center justify-between">
                                    <span>{poule.name}</span>
                                    {!isAdmin && (
                                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </CardTitle>
                                  <CardDescription className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{poule.teams.length} teams</span>
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-sm text-muted-foreground">
                                    {poule.matches.filter(m => m.completed).length} / {poule.matches.length} matches completed
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
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
