
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Poule, Team } from "@/types/tournament";
import { Edit, Trash2 } from "lucide-react";

interface TeamsViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poule: Poule | null;
  onEdit?: (teamId: string) => void;
  onDelete?: (teamId: string) => void;
}

const TeamsViewDialog: React.FC<TeamsViewDialogProps> = ({ 
  open, 
  onOpenChange, 
  poule,
  onEdit,
  onDelete
}) => {
  if (!poule) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Teams in {poule.name}</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          {poule.teams.length === 0 ? (
            <p className="text-center text-muted-foreground p-4">
              No teams in this poule
            </p>
          ) : (
            <div className="space-y-2">
              {poule.teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-3 bg-muted/40 rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-medium">{team.players[0].name} & {team.players[1].name}</p>
                  </div>
                  <div className="flex gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(team.id)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(team.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamsViewDialog;
