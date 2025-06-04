
import { Link } from 'react-router-dom';
import { Discipline } from '@/types/tournament';
import { getPouleWinner, isMatchComplete } from '@/utils/tournamentUtils';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Target } from 'lucide-react';

interface TournamentStructureProps {
  disciplines: Discipline[];
}

const TournamentStructure = ({ disciplines }: TournamentStructureProps) => {
  return (
    <div className="space-y-8">
      {disciplines.map((discipline) => (
        <Card key={discipline.id} className="overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {discipline.name}
            </CardTitle>
            <CardDescription>
              {discipline.levels.length} level(s) available
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6">
              {discipline.levels.map((level) => (
                <div key={level.id} className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Level {level.name}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {level.poules.map((poule) => {
                      // Check if all matches in the poule are completed
                      const allMatchesCompleted = poule.matches.every(match => isMatchComplete(match));
                      const winner = allMatchesCompleted ? getPouleWinner(poule) : null;
                      
                      return (
                        <Link
                          key={poule.id}
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
