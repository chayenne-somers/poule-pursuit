
import { Team } from '@/types/tournament';
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Trophy, Clock } from 'lucide-react';

interface PouleWinnerCardProps {
  winner: Team | null;
  allMatchesCompleted?: boolean;
}

const PouleWinnerCard = ({ winner, allMatchesCompleted = false }: PouleWinnerCardProps) => {
  // If all matches are completed and there's a winner, show the winner card
  if (allMatchesCompleted && winner) {
    return (
      <Card className="bg-green-50 border-green-200 mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-green-800 font-medium">Poule Winner</p>
              <p className="text-lg font-semibold">
                {winner.players[0].name} & {winner.players[1].name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If all matches are completed but there's no winner (tie), show a message
  if (allMatchesCompleted && !winner) {
    return (
      <Card className="bg-amber-50 border-amber-200 mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-amber-600" />
            <div>
              <p className="text-amber-800 font-medium">No clear winner</p>
              <p className="text-sm text-amber-700">
                There appears to be a tie in the standings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If matches are still in progress, show a "matches in progress" card
  return (
    <Card className="bg-blue-50 border-blue-200 mb-8">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-blue-600" />
          <div>
            <p className="text-blue-800 font-medium">Matches in progress</p>
            <p className="text-sm text-blue-700">
              Complete all matches to determine a winner
            </p>
          </div>
        </div>
      </CardContent>
      </Card>
  );
};

export default PouleWinnerCard;
