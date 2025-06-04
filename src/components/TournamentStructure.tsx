
import { Link } from 'react-router-dom';
import { Discipline } from '@/types/tournament';
import { getPouleWinner, isMatchComplete, areAllMatchesComplete } from '@/utils/tournamentUtils';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Target, Plus, Edit, Trash2, Eye } from 'lucide-react';

interface TournamentStructureProps {
  disciplines: Discipline[];
  isAdmin?: boolean;
  onEditItem?: (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => void;
  onDeleteItem?: (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => void;
  onViewTeams?: (pouleId: string) => void;
  onAddNew?: (type: 'discipline' | 'level' | 'poule' | 'team', parentId?: string) => void;
}

const TournamentStructure = ({ 
  disciplines, 
  isAdmin = false, 
  onEditItem, 
  onDeleteItem, 
  onViewTeams, 
  onAddNew 
}: TournamentStructureProps) => {
  return (
    <div className="space-y-8">
      {disciplines.map((discipline) => (
        <Card key={discipline.id} className="overflow-hidden">
          <CardHeader className="bg-primary/5">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {discipline.name}
                </CardTitle>
                <CardDescription>
                  {discipline.levels.length} level(s) available
                </CardDescription>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditItem?.('discipline', discipline.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeleteItem?.('discipline', discipline.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAddNew?.('level', discipline.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Level
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6">
              {discipline.levels.map((level) => (
                <div key={level.id} className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-lg font-semibold">
                      Level {level.name}
                    </h3>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditItem?.('level', level.id, discipline.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteItem?.('level', level.id, discipline.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onAddNew?.('poule', level.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Poule
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {level.poules.map((poule) => {
                      // Check if all matches in the poule are completed
                      const allMatchesCompleted = areAllMatchesComplete(poule);
                      const winner = allMatchesCompleted ? getPouleWinner(poule) : null;
                      
                      return (
                        <div key={poule.id} className="relative">
                          {isAdmin ? (
                            <Card className="h-full hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-base">
                                    Poule {poule.name}
                                  </CardTitle>
                                  {winner && (
                                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                                      <Trophy className="h-3 w-3 mr-1" />
                                      Winner
                                    </Badge>
                                  )}
                                </div>
                                <CardDescription className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {poule.teams.length} teams, {poule.matches.length} matches
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pt-0">
                                {winner ? (
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-green-700">
                                      🏆 {winner.players[0].name} & {winner.players[1].name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      All matches completed
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">
                                    {allMatchesCompleted ? 'No clear winner' : 'Matches in progress...'}
                                  </div>
                                )}
                                <div className="flex gap-2 mt-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onEditItem?.('poule', poule.id, level.id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onDeleteItem?.('poule', poule.id, level.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onViewTeams?.(poule.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => onAddNew?.('team', poule.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Team
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <Link
                              to={`/poule/${poule.id}`}
                              className="block transition-transform hover:scale-105"
                            >
                              <Card className="h-full hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                  <div className="flex justify-between items-start">
                                    <CardTitle className="text-base">
                                      Poule {poule.name}
                                    </CardTitle>
                                    {winner && (
                                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                                        <Trophy className="h-3 w-3 mr-1" />
                                        Winner
                                      </Badge>
                                    )}
                                  </div>
                                  <CardDescription className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {poule.teams.length} teams, {poule.matches.length} matches
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  {winner ? (
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-green-700">
                                        🏆 {winner.players[0].name} & {winner.players[1].name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        All matches completed
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">
                                      {allMatchesCompleted ? 'No clear winner' : 'Matches in progress...'}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TournamentStructure;
