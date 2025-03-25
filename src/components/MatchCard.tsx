
import { useState } from 'react';
import { Match, SetScore } from '@/types/tournament';
import { isSetComplete, isMatchComplete, getSetsWon, didTeamWinMatch } from '@/utils/tournamentUtils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Save } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  matchIndex: number;
  isAdmin: boolean;
  onScoreChange: (matchIndex: number, setIndex: number, team: 'A' | 'B', value: string) => void;
  onSaveMatch: (matchIndex: number) => void;
}

const MatchCard = ({ match, matchIndex, isAdmin, onScoreChange, onSaveMatch }: MatchCardProps) => {
  const { setsWonA, setsWonB } = getSetsWon(match);
  const teamAWon = didTeamWinMatch(match, true);
  const teamBWon = didTeamWinMatch(match, false);

  return (
    <Card 
      key={match.id} 
      className={`
        ${match.completed ? 'border-2' : 'border'}
        ${teamAWon ? 'border-green-500' : teamBWon ? 'border-blue-500' : 'border-border'}
      `}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Match {matchIndex + 1}</CardTitle>
          <div className="flex items-center gap-2">
            {match.completed && (
              <Badge className={teamAWon ? 'bg-green-500' : 'bg-blue-500'}>
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            {isAdmin && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onSaveMatch(matchIndex)}
                className="h-8 px-3"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Save
              </Button>
            )}
          </div>
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
              <div key={setIndex} className="w-14">
                {isAdmin ? (
                  <Input
                    type="number"
                    min="0"
                    value={set.scoreA !== undefined ? set.scoreA : ''}
                    onChange={(e) => onScoreChange(matchIndex, setIndex, 'A', e.target.value)}
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
              <div key={setIndex} className="w-14">
                {isAdmin ? (
                  <Input
                    type="number"
                    min="0"
                    value={set.scoreB !== undefined ? set.scoreB : ''}
                    onChange={(e) => onScoreChange(matchIndex, setIndex, 'B', e.target.value)}
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
  );
};

export default MatchCard;
