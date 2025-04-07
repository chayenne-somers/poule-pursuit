
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

    // Now initializeTournament properly returns a Tournament object
    const newTournament = initializeTournament();
    // And here we save the tournament with the name
    if (newTournament) {
      setTournament(newTournament);
      saveTournament(newTournament);
      setCreateDialogVisible(false);
      toast({
        title: "Tournament Created",
        description: `Tournament "${tournamentName}" has been created.`,
      });
    }
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
          // Fixed: Correctly reference discipline.levels
          const discipline = updatedTournament.disciplines.find(d => {
            return d.levels.find(l => {
              return l.poules.find(p => p.id === deleteItemId);
            });
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
          // Fixed: Correctly reference discipline.levels
          const discipline = updatedTournament.disciplines.find(d => {
            return d.levels.find(l => {
              return l.poules.find(p => p.id === deleteItemParentId);
            });
          });

          if (discipline) {
            const level = discipline.levels.find(l => l.poules.find(p => p.id === deleteItemParentId));
            if (level) {
              const poule = level.poules.find(p => p.id === deleteItemParentId);
              if (poule) {
                poule.teams = poule.teams.filter(t => t.id !== deleteItemId);
                poule.matches = generateMatches(poule);
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

  // Function to handle removing all teams from a poule
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
        description: "All teams and matches have been removed from the poule"
      });
      
      // Close the dialog after removing teams
      setTeamsViewDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </header>
        
        <div className="mt-6">
          {isLoggedIn ? (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => handleAddItem('discipline')} className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create New Discipline
                </Button>
                <Button onClick={() => handleAddItem('level')} className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create New Level
                </Button>
                <Button onClick={() => handleAddItem('poule')} className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create New Poule
                </Button>
                {/* Fix: Properly access poules through discipline.levels */}
                <TeamCsvImport 
                  poules={tournament?.disciplines.flatMap(d => 
                    d.levels.flatMap(l => 
                      l.poules.map(p => ({
                        id: p.id,
                        name: p.name,
                        path: `${d.name} - Level ${l.name}`
                      }))
                    )
                  ) || []}
                  onImportComplete={(teamsWithPoules) => {
                    if (!tournament) return;
                    
                    const updatedTournament = { ...tournament };
                    
                    // Process the imported teams
                    teamsWithPoules.forEach(({ pouleId, teams }) => {
                      // Find the poule
                      for (const discipline of updatedTournament.disciplines) {
                        for (const level of discipline.levels) {
                          const poule = level.poules.find(p => p.id === pouleId);
                          if (poule) {
                            // Add the teams to the poule
                            poule.teams = [...poule.teams, ...teams];
                            // Regenerate matches
                            poule.matches = generateMatches(poule);
                            return;
                          }
                        }
                      }
                    });
                    
                    setTournament(updatedTournament);
                    saveTournament(updatedTournament);
                  }}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveTournament} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Tournament
                </Button>
              </div>
              
              <div className="mt-8">
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
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      No tournament created. Create one to start.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <AdminAuth onAuthenticated={() => setIsLoggedIn(true)} />
          )}
        </div>
      </div>

      <Dialog open={createDialogVisible} onOpenChange={setCreateDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tournament</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name">Tournament Name</label>
              <Input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogVisible(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTournament}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogVisible} onOpenChange={setEditDialogVisible}>
        {editDialogVisible && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                {itemType}
                {itemId}
                {itemParentId}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog open={deleteAlertDialogVisible} onOpenChange={setDeleteAlertDialogVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TeamsViewDialog
        open={teamsViewDialogOpen}
        onOpenChange={setTeamsViewDialogOpen}
        poule={currentPoule}
        onEdit={(teamId) => handleEditItem('team', teamId, currentPoule?.id)}
        onDelete={(teamId) => handleDeleteItem('team', teamId, currentPoule?.id)}
        onRemoveAllTeams={handleRemoveAllTeams}
      />
    </div>
  );
};

export default Admin;
