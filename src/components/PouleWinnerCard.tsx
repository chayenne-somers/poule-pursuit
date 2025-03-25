
import { Team } from '@/types/tournament';
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Trophy } from 'lucide-react';

interface PouleWinnerCardProps {
  winner: Team | null;
}

const PouleWinnerCard = ({ winner }: PouleWinnerCardProps) => {
  if (!winner) return null;
  
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
};

export default PouleWinnerCard;
