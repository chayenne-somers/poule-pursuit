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
import AdminForm from '@/components/AdminForm';
import { useAuth } from '@/hooks/use-auth';

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
  
  // New state variables for form inputs
  const [formName, setFormName] = useState('');
  const [selectedDisciplineForForm, setSelectedDisciplineForForm] = useState('');
  const [selectedLevelForForm, setSelectedLevelForForm] = useState('');
  const [player1NameForm, setPlayer1NameForm] = useState('');
  const [player2NameForm, setPlayer2NameForm] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    const fetchTournament = async () => {
      const storedTournament = await loadTournament();
      if (storedTournament) {
        setTournament(storedTournament);
      }
    };
    
    if (user) {
      fetchTournament();
    }
  }, [user]);

  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuth');
    setIsLoggedIn(!!storedAuth);
  }, []);

  // Reset form state when dialog opens/closes
  useEffect(() => {
    if (editDialogVisible) {
      // Reset form fields
      setFormName('');
      setSelectedDisciplineForForm('');
      setSelectedLevelForForm('');
      setPlayer1NameForm('');
      setPlayer2NameForm('');
      
      // Pre-fill form for edit mode
      if (itemId && tournament) {
        if (itemType === 'discipline') {
          const discipline = tournament.disciplines.find(d => d.id === itemId);
          if (discipline) setFormName(discipline.name);
        } else if (itemType === 'level' && itemParentId) {
          const discipline = tournament.disciplines.find(d => d.id === itemParentId);
          if (discipline) {
            const level = discipline.levels.find(l => l.id === itemId);
            if (level) {
              setFormName(level.name);
              setSelectedDisciplineForForm(itemParentId);
            }
          }
        } else if (itemType === 'poule' && itemParentId) {
          // Find the poule through levels
          for (const discipline of tournament.disciplines) {
            for (const level of discipline.levels) {
              if (level.id === itemParentId) {
                const poule = level.poules.find(p => p.id === itemId);
                if (poule) {
                  setFormName(poule.name);
                  setSelectedDisciplineForForm(discipline.id);
                  setSelectedLevelForForm(level.id);
                  break;
                }
              }
            }
          }
        } else if (itemType === 'team' && itemParentId) {
          // Find the team through poules
          for (const discipline of tournament.disciplines) {
            for (const level of discipline.levels) {
              for (const poule of level.poules) {
                if (poule.id === itemParentId) {
                  const team = poule.teams.find(t => t.id === itemId);
                  if (team && team.players.length >= 2) {
                    setPlayer1NameForm(team.players[0].name);
                    setPlayer2NameForm(team.players[1].name);
                    setSelectedDisciplineForForm(discipline.id);
                    setSelectedLevelForForm(level.id);
                    setFormName(poule.id); // Using formName to store poule id for teams
                    break;
                  }
                }
              }
            }
          }
        }
      }
    }
  }, [editDialogVisible, itemId, itemType, itemParentId, tournament]);

  const handleNavigationChange = (newState: NavigationState) => {
    setNavigationState(newState);
  };

  const handleCreateTournament = async () => {
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
      await saveTournament(newTournament);
      setCreateDialogVisible(false);
      toast({
        title: "Tournament Created",
        description: `Tournament "${tournamentName}" has been created.`,
      });
    }
  };

  const handleSaveTournament = async () => {
    if (tournament) {
      await saveTournament(tournament);
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

  const handleSaveForm = async () => {
    if (!tournament) return;
    
    const updatedTournament = { ...tournament };
    
    // Create or edit based on itemType
    if (itemType === 'discipline') {
      if (!formName.trim()) {
        toast({
          title: "Error",
          description: "Please enter a discipline name",
          variant: "destructive"
        });
        return;
      }
      
      if (itemId) {
        // Edit existing discipline
        const disciplineIndex = updatedTournament.disciplines.findIndex(d => d.id === itemId);
        if (disciplineIndex !== -1) {
          updatedTournament.disciplines[disciplineIndex].name = formName.trim();
        }
      } else {
        // Create new discipline
        const newDiscipline: Discipline = {
          id: generateId(),
          name: formName.trim(),
          levels: [
            { id: generateId(), name: "1", poules: [] },
            { id: generateId(), name: "2", poules: [] },
            { id: generateId(), name: "3", poules: [] },
            { id: generateId(), name: "4", poules: [] },
            { id: generateId(), name: "4+", poules: [] }
          ]
        };
        updatedTournament.disciplines.push(newDiscipline);
      }
    } 
    else if (itemType === 'level') {
      if (!formName.trim() || !selectedDisciplineForForm) {
        toast({
          title: "Error",
          description: "Please enter a level name and select a discipline",
          variant: "destructive"
        });
        return;
      }
      
      const disciplineIndex = updatedTournament.disciplines.findIndex(d => d.id === selectedDisciplineForForm);
      if (disciplineIndex === -1) return;
      
      if (itemId) {
        // Edit existing level
        const levelIndex = updatedTournament.disciplines[disciplineIndex].levels.findIndex(l => l.id === itemId);
        if (levelIndex !== -1) {
          updatedTournament.disciplines[disciplineIndex].levels[levelIndex].name = formName.trim();
        }
      } else {
        // Create new level
        const newLevel: Level = {
          id: generateId(),
          name: formName.trim(),
          poules: []
        };
        updatedTournament.disciplines[disciplineIndex].levels.push(newLevel);
      }
    } 
    else if (itemType === 'poule') {
      if (!formName.trim() || !selectedDisciplineForForm || !selectedLevelForForm) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive"
        });
        return;
      }
      
      const disciplineIndex = updatedTournament.disciplines.findIndex(d => d.id === selectedDisciplineForForm);
      if (disciplineIndex === -1) return;
      
      const levelIndex = updatedTournament.disciplines[disciplineIndex].levels.findIndex(l => l.id === selectedLevelForForm);
      if (levelIndex === -1) return;
      
      if (itemId) {
        // Edit existing poule
        const pouleIndex = updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules.findIndex(p => p.id === itemId);
        if (pouleIndex !== -1) {
          updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].name = formName.trim();
        }
      } else {
        // Create new poule
        const newPoule: Poule = {
          id: generateId(),
          name: formName.trim(),
          teams: [],
          matches: []
        };
        updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules.push(newPoule);
      }
    }
    else if (itemType === 'team') {
      if (!player1NameForm.trim() || !player2NameForm.trim() || !formName) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive"
        });
        return;
      }
      
      // Find the poule with the given ID
      let foundPoule: Poule | null = null;
      let disciplineIndex = -1;
      let levelIndex = -1;
      let pouleIndex = -1;
      
      for (let i = 0; i < updatedTournament.disciplines.length; i++) {
        for (let j = 0; j < updatedTournament.disciplines[i].levels.length; j++) {
          for (let k = 0; k < updatedTournament.disciplines[i].levels[j].poules.length; k++) {
            if (updatedTournament.disciplines[i].levels[j].poules[k].id === formName) {
              foundPoule = updatedTournament.disciplines[i].levels[j].poules[k];
              disciplineIndex = i;
              levelIndex = j;
              pouleIndex = k;
              break;
            }
          }
          if (foundPoule) break;
        }
        if (foundPoule) break;
      }
      
      if (!foundPoule) return;
      
      const player1: Player = {
        id: generateId(),
        name: player1NameForm.trim()
      };
      
      const player2: Player = {
        id: generateId(),
        name: player2NameForm.trim()
      };
      
      if (itemId) {
        // Edit existing team
        const teamIndex = foundPoule.teams.findIndex(t => t.id === itemId);
        if (teamIndex !== -1) {
          foundPoule.teams[teamIndex].players = [player1, player2];
          // Regenerate matches when team changes
          foundPoule.matches = generateMatches(foundPoule);
        }
      } else {
        // Create new team
        const newTeam: Team = {
          id: generateId(),
          players: [player1, player2]
        };
        
        updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].teams.push(newTeam);
        // Regenerate matches when team is added
        updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].matches = 
          generateMatches(updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex]);
      }
    }
    
    setTournament(updatedTournament);
    await saveTournament(updatedTournament);
    setEditDialogVisible(false);
    
    toast({
      title: "Success",
      description: `${itemId ? "Updated" : "Created"} ${itemType} successfully.`,
    });
  };

  const confirmDeleteItem = async () => {
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
    await saveTournament(updatedTournament);
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

  const handleRefreshData = () => {
    // This is a simple method to trigger reloading data
    // It's used by the AdminForm component to refresh the main view
    const storedTournament = loadTournament();
    if (storedTournament) {
      setTournament(storedTournament);
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
              <div className="flex flex-wrap gap-4 mb-8">
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
                <div className="ml-auto">
                  <Button onClick={handleSaveTournament} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Tournament
                  </Button>
                </div>
              </div>
              
              <div className="mt-8">
                <AdminForm onDataChange={handleRefreshData} />
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
            <DialogDescription>
              Enter a name for your new tournament.
            </DialogDescription>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{itemId ? "Edit" : "Create"} {itemType.charAt(0).toUpperCase() + itemType.slice(1)}</DialogTitle>
            <DialogDescription>
              Fill in the details below to {itemId ? "update" : "create"} a {itemType}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {itemType === 'discipline' && (
              <div className="grid gap-2">
                <label htmlFor="name">Discipline Name</label>
                <Input
                  id="name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter discipline name"
                />
              </div>
            )}

            {itemType === 'level' && (
              <>
                <div className="grid gap-2">
                  <label htmlFor="discipline">Discipline</label>
                  <Select value={selectedDisciplineForForm} onValueChange={setSelectedDisciplineForForm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournament?.disciplines.map((discipline) => (
                        <SelectItem key={discipline.id} value={discipline.id}>
                          {discipline.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="name">Level Name</label>
                  <Input
                    id="name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter level name"
                  />
                </div>
              </>
            )}

            {itemType === 'poule' && (
              <>
                <div className="grid gap-2">
                  <label htmlFor="discipline">Discipline</label>
                  <Select value={selectedDisciplineForForm} onValueChange={setSelectedDisciplineForForm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournament?.disciplines.map((discipline) => (
                        <SelectItem key={discipline.id} value={discipline.id}>
                          {discipline.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="level">Level</label>
                  <Select 
                    value={selectedLevelForForm} 
                    onValueChange={setSelectedLevelForForm}
                    disabled={!selectedDisciplineForForm}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedDisciplineForForm && tournament?.disciplines
                        .find(d => d.id === selectedDisciplineForForm)?.levels
                        .map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            Level {level.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="name">Poule Name</label>
                  <Input
                    id="name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter poule name"
                  />
                </div>
              </>
            )}

            {itemType === 'team' && (
              <>
                <div className="grid gap-2">
                  <label htmlFor="poule">Poule</label>
                  <Select value={formName} onValueChange={setFormName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Poule" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournament?.disciplines.flatMap(d => 
                        d.levels.flatMap(l => 
                          l.poules.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {d.name} - Level {l.name} - {p.name}
                            </SelectItem>
                          ))
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="player1">Player 1 Name</label>
                  <Input
                    id="player1"
                    type="text"
                    value={player1NameForm}
                    onChange={(e) => setPlayer1NameForm(e.target.value)}
                    placeholder="Enter player 1 name"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="player2">Player 2 Name</label>
                  <Input
                    id="player2"
                    type="text"
                    value={player2NameForm}
                    onChange={(e) => setPlayer2NameForm(e.target.value)}
                    placeholder="Enter player 2 name"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogVisible(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveForm}>
              {itemId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
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
