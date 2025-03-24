
import React from 'react';
import { Poule, Team } from '@/types/tournament';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, Plus } from 'lucide-react';

interface TeamsViewDialogProps {
  poule: Poule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTeam?: (pouleId: string) => void;
  onEditTeam?: (teamId: string, pouleId: string) => void;
  onDeleteTeam?: (teamId: string, pouleId: string) => void;
}

const TeamsViewDialog: React.FC<TeamsViewDialogProps> = ({
  poule,
  open,
  onOpenChange,
  onAddTeam,
  onEditTeam,
  onDeleteTeam
}) => {
  if (!poule) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Teams in Poule {poule.name}</span>
          </DialogTitle>
          <DialogDescription>
            {poule.teams.length} teams registered for this poule
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {poule.teams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No teams added to this poule yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poule.teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div className="font-medium">{team.players[0].name}</div>
                      <div className="text-sm text-muted-foreground">{team.players[1].name}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEditTeam && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditTeam(team.id, poule.id)}
                          >
                            Edit
                          </Button>
                        )}
                        {onDeleteTeam && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => onDeleteTeam(team.id, poule.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {onAddTeam && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => onAddTeam(poule.id)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Team
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TeamsViewDialog;
