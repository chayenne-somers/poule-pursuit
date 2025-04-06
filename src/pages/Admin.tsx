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

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tournamentName, setTournamentName] = useState('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [navigationState, setNavigationState] = useState<NavigationState>({});
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [itemType, setItemType] = useState<'discipline' | 'level' | 'poule' | 'team'>('discipline');
  const [itemId, setItemId] = useState<string | null>(null);
  const [itemParentId, setItemParentId] = useState<string | null>(null);
  const [deleteAlertDialogVisible, setDeleteAlertDialogVisible] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteItemType, setDeleteItemType] = useState<'discipline' | 'level' | 'poule' | 'team'>('discipline');
  const [deleteItemParentId, setDeleteItemParentId] = useState<string | null>(null);
  const [teamsViewDialogOpen, setTeamsViewDialogOpen] = useState(false);
  const [currentPoule, setCurrentPoule] = useState<Poule | null>(null);

  useEffect(() => {
    const storedTournament = loadTournament();
    if (storedTournament) {
      setTournament(storedTournament);
    }
  }, []);

  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuth');
    setIsLoggedIn(!!storedAuth);
  }, []);

  const handleNavigationChange = (newState: NavigationState) => {
    setNavigationState(newState);
  };

  const handleCreateTournament = () => {
    if (tournamentName.trim() === '') {
      toast({
        title: "Error",
        description: "Tournament name cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    const newTournament = initializeTournament(tournamentName);
    setTournament(newTournament);
    saveTournament(newTournament);
    setCreateDialogVisible(false);
    toast({
      title: "Tournament Created",
      description: `Tournament "${tournamentName}" has been created.`,
    });
  };

  const handleSaveTournament = () => {
    if (tournament) {
      saveTournament(tournament);
      toast({
        title: "Tournament Saved",
        description: "Tournament progress has been saved.",
      });
    }
  };

  const handleAddItem = (type: 'discipline' | 'level' | 'poule' | 'team', parentId?: string) => {
		setItemType(type);
    setItemId(null);
    setItemParentId(parentId || null);
		setEditDialogVisible(true);
  };

  const handleEditItem = (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => {
		setItemType(type);
    setItemId(id);
    setItemParentId(parentId || null);
		setEditDialogVisible(true);
  };

  const handleDeleteItem = (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => {
    setDeleteAlertDialogVisible(true);
    setDeleteItemType(type);
    setDeleteItemId(id);
    setDeleteItemParentId(parentId || null);
  };

  const confirmDeleteItem = () => {
    if (!tournament || !deleteItemId || !deleteItemType) return;

    let updatedTournament = { ...tournament };

    switch (deleteItemType) {
      case 'discipline':
        updatedTournament.disciplines = updatedTournament.disciplines.filter(d => d.id !== deleteItemId);
        break;
      case 'level':
        if (deleteItemParentId) {
          const discipline = updatedTournament.disciplines.find(d => d.id === deleteItemParentId);
          if (discipline) {
            discipline.levels = discipline.levels.filter(l => l.id !== deleteItemId);
          }
        }
        break;
      case 'poule':
        if (deleteItemParentId) {
          const discipline = updatedTournament.disciplines.find(d => {
            return discipline.levels.find(l => {
              return l.poules.find(p => p.id === deleteItemId);
            })
          });

          if (discipline) {
            const level = discipline.levels.find(l => l.poules.find(p => p.id === deleteItemId));
            if (level) {
              level.poules = level.poules.filter(p => p.id !== deleteItemId);
            }
          }
        }
        break;
      case 'team':
        if (deleteItemParentId) {
          const discipline = updatedTournament.disciplines.find(d => {
            return discipline.levels.find(l => {
              return l.poules.find(p => p.id === deleteItemParentId);
            })
          });

          if (discipline) {
            const level = discipline.levels.find(l => l.poules.find(p => p.id === deleteItemParentId));
            if (level) {
              const poule = level.poules.find(p => p.id === deleteItemParentId);
              if (poule) {
                poule.teams = poule.teams.filter(t => t.id !== deleteItemId);
                poule.matches = generateMatches(poule.teams);
                calculateStandings(poule);
              }
            }
          }
        }
        break;
    }

    setTournament(updatedTournament);
    saveTournament(updatedTournament);
    setDeleteAlertDialogVisible(false);
    setDeleteItemType('discipline');
    setDeleteItemId(null);
    setDeleteItemParentId(null);

    toast({
      title: "Item Deleted",
      description: "The item has been successfully deleted.",
    });
  };

  const handleViewTeams = (pouleId: string) => {
    if (!tournament) return;
    
    // Find the poule in the tournament structure
    let pouleToView: Poule | null = null;
    
    for (const discipline of tournament.disciplines) {
      for (const level of discipline.levels) {
        const foundPoule = level.poules.find(poule => poule.id === pouleId);
        if (foundPoule) {
          pouleToView = foundPoule;
          break;
        }
      }
      if (pouleToView) break;
    }
    
    if (pouleToView) {
      setCurrentPoule(pouleToView);
      setTeamsViewDialogOpen(true);
    }
  };

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

  return (
    
      
        
          Admin Panel
        
        
          {isLoggedIn ? (
            
              
                
                  
                    Create New Discipline
                  
                  
                    Create New Level
                  
                  
                    Create New Poule
                  
                  
                    Import Teams from CSV
                  
                
                
                  
                    Save Tournament
                  
                
              
              
                {tournament ? (
                  <TournamentStructure
                    disciplines={tournament.disciplines}
                    tournament={tournament}
                    isAdmin={true}
                    navigationState={navigationState}
                    onNavigationChange={handleNavigationChange}
                    onEditItem={handleEditItem}
                    onDeleteItem={handleDeleteItem}
                    onViewTeams={handleViewTeams}
                  />
                ) : (
                  
                    No tournament created. Create one to start.
                  
                )}
              
            
          ) : (
            <AdminAuth onLogin={() => setIsLoggedIn(true)} />
          )}
        
      

      
        
          
            Create New Tournament
          
          
            
              Tournament Name
              <Input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
              />
            
          
          
            
              Cancel
              Create
            
          
        
      

      
        {editDialogVisible && (
          
            
              Edit Item
            
            
              
                {itemType}
                {itemId}
                {itemParentId}
              
            
          
        )}
      

      
        
          
            
              
                Are you sure you want to delete this item? This action cannot be undone.
              
            
            
              
                Cancel
                Delete
              
            
          
        
      

        <TeamsViewDialog
          open={teamsViewDialogOpen}
          onOpenChange={setTeamsViewDialogOpen}
          poule={currentPoule}
          onEdit={(teamId) => handleEditItem('team', teamId, currentPoule?.id)}
          onDelete={(teamId) => handleDeleteItem('team', teamId, currentPoule?.id)}
          onRemoveAllTeams={handleRemoveAllTeams}
        />
    
  );
};

export default Admin;
