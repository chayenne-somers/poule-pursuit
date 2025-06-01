
import { TeamStanding } from '@/types/tournament';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TeamStandingsProps {
  standings: TeamStanding[];
}

const TeamStandings = ({ standings }: TeamStandingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Standings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Pos</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-center">Played</TableHead>
              <TableHead className="text-center">Wins</TableHead>
              <TableHead className="text-center">Sets W</TableHead>
              <TableHead className="text-center">Sets L</TableHead>
              <TableHead className="text-center">Set Saldo</TableHead>
              <TableHead className="text-center">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((standing, index) => (
              <TableRow key={standing.team.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  {standing.team.players[0].name} & {standing.team.players[1].name}
                </TableCell>
                <TableCell className="text-center">{standing.played}</TableCell>
                <TableCell className="text-center">{standing.matchesWon}</TableCell>
                <TableCell className="text-center">{standing.setsWon}</TableCell>
                <TableCell className="text-center">{standing.setsLost}</TableCell>
                <TableCell className="text-center">{standing.setSaldo}</TableCell>
                <TableCell className="text-center">{standing.pointsScored}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TeamStandings;
