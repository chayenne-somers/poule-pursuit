import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tournament, 
  Discipline, 
  Level, 
  Poule, 
  Team, 
  Player, 
  NavigationState 
} from '@/types/tournament';
import { 
  loadTournament, 
  saveTournament, 
  generateId, 
  generateMatches, 
  initializeTournament,
  calculateStandings
} from '@/utils/tournamentUtils';
import AdminAuth from '@/components/AdminAuth';
import TournamentStructure from '@/components/TournamentStructure';
import TeamStandings from '@/components/TeamStandings';
import NavBar from '@/components/NavBar';
import TeamsViewDialog from '@/components/TeamsViewDialog';
import TeamCsvImport from '@/components/TeamCsvImport';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Save, Users, X, Trash2, Edit, Upload } from 'lucide-react';

[Previous code continues exactly as before until the handleRemoveAllTeams function, which is added just before the return statement]

  // Add a new function to handle removing all teams from a poule
  const handleRemoveAllTeams = (pouleId: string) => {
    if (!tournament) return;
    
    const updatedTournament = { ...tournament };
    
    // Find the poule in the tournament structure
    let pouleFound = false;
    let disciplineIndex = -1;
    let levelIndex = -1;
    let pouleIndex = -1;
    
    // Find the poule and its indices
    for (let i = 0; i < updatedTournament.disciplines.length; i++) {
      const discipline = updatedTournament.disciplines[i];
      for (let j = 0; j < discipline.levels.length; j++) {
        const level = discipline.levels[j];
        for (let k = 0; k < level.poules.length; k++) {
          const poule = level.poules[k];
          if (poule.id === pouleId) {
            pouleFound = true;
            disciplineIndex = i;
            levelIndex = j;
            pouleIndex = k;
            break;
          }
        }
        if (pouleFound) break;
      }
      if (pouleFound) break;
    }
    
    if (pouleFound) {
      // Clear all teams and matches
      updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].teams = [];
      updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].matches = [];
      
      setTournament(updatedTournament);
      saveTournament(updatedTournament);
      
      toast({
        title: "All teams removed",
        description: "All teams and matches have been removed from the poule",
      });
      
      // Close the dialog after removing teams
      setTeamsViewDialogOpen(false);
    }
  };

[Previous return statement and JSX continues exactly as before, but with the TeamsViewDialog component updated to include the new onRemoveAllTeams prop:]

        <TeamsViewDialog
          open={teamsViewDialogOpen}
          onOpenChange={setTeamsViewDialogOpen}
          poule={currentPoule}
          onEdit={(teamId) => handleEditItem('team', teamId, currentPoule?.id)}
          onDelete={(teamId) => handleDeleteItem('team', teamId, currentPoule?.id)}
          onRemoveAllTeams={handleRemoveAllTeams}
        />

[Rest of the file continues exactly as before]
