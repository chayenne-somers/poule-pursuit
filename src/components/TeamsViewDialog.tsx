
import React from 'react';
import { Poule, Team } from '@/types/tournament';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TeamsViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poule: Poule | null;
  onEdit: (teamId: string) => void;
  onDelete: (teamId: string) => void;
  onRemoveAllTeams: (pouleId: string) => void;
}

const TeamsViewDialog: React.FC<TeamsViewDialogProps> = ({
  open,
  onOpenChange,
  poule,
  onEdit,
  onDelete,
  onRemoveAllTeams,
}) => {
  const [confirmRemoveAllOpen, setConfirmRemoveAllOpen] = React.useState(false);
  
  if (!poule) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teams in {poule.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {poule.teams.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No teams in this poule</p>
          ) : (
            <ul className="space-y-2">
              {poule.teams.map((team) => (
                <li key={team.id} className="flex justify-between items-center p-3 rounded-md border">
                  <span>
                    {team.players[0].name} & {team.players[1].name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(team.id)} className="h-8 px-2">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(team.id)} className="h-8 px-2 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Add remove all teams button */}
        <div className="flex justify-end mt-2">
          <AlertDialog open={confirmRemoveAllOpen} onOpenChange={setConfirmRemoveAllOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                disabled={poule.teams.length === 0}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Remove All Teams
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove all teams</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove all teams from this poule? This will also delete all matches.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    onRemoveAllTeams(poule.id);
                    setConfirmRemoveAllOpen(false);
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamsViewDialog;
