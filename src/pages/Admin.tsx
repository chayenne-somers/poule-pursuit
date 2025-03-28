
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
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Save, Users, X, Trash2, Edit, Upload } from 'lucide-react';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navigationState, setNavigationState] = useState<NavigationState>({});
  
  // Dialog states
  const [addDisciplineDialogOpen, setAddDisciplineDialogOpen] = useState(false);
  const [addLevelDialogOpen, setAddLevelDialogOpen] = useState(false);
  const [addPouleDialogOpen, setAddPouleDialogOpen] = useState(false);
  const [addTeamDialogOpen, setAddTeamDialogOpen] = useState(false);
  
  // Edit dialog states
  const [editDisciplineDialogOpen, setEditDisciplineDialogOpen] = useState(false);
  const [editLevelDialogOpen, setEditLevelDialogOpen] = useState(false);
  const [editPouleDialogOpen, setEditPouleDialogOpen] = useState(false);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Edit/delete state
  const [currentItemType, setCurrentItemType] = useState<'discipline' | 'level' | 'poule' | 'team' | null>(null);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  
  // Form states
  const [newDisciplineName, setNewDisciplineName] = useState('');
  const [newLevelName, setNewLevelName] = useState('');
  const [disciplineForLevel, setDisciplineForLevel] = useState('');
  const [newPouleName, setNewPouleName] = useState('');
  const [disciplineForPoule, setDisciplineForPoule] = useState('');
  const [levelForPoule, setLevelForPoule] = useState('');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [pouleForTeam, setPouleForTeam] = useState('');
  
  // Edit form states
  const [editDisciplineName, setEditDisciplineName] = useState('');
  const [editLevelName, setEditLevelName] = useState('');
  const [editPouleName, setEditPouleName] = useState('');
  const [editPlayer1Name, setEditPlayer1Name] = useState('');
  const [editPlayer2Name, setEditPlayer2Name] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // New state for teams view dialog
  const [teamsViewDialogOpen, setTeamsViewDialogOpen] = useState(false);
  const [currentPoule, setCurrentPoule] = useState<Poule | null>(null);

  // New state for CSV import dialog
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState(false);

  useEffect(() => {
    // Check if admin is authenticated
    const adminAuth = sessionStorage.getItem('isAdminAuthenticated');
    setIsAuthenticated(adminAuth === 'true');
    
    // Initialize tournament data if it doesn't exist
    initializeTournament();
    
    // Load tournament data
    const data = loadTournament();
    setTournament(data);
    setIsLoading(false);
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    // Reload tournament data
    const data = loadTournament();
    setTournament(data);
  };

  const handleSaveTournament = () => {
    if (tournament) {
      saveTournament(tournament);
      toast({
        title: "Changes saved",
        description: "Tournament data has been updated successfully",
      });
    }
  };

  const handleAddDiscipline = () => {
    if (!newDisciplineName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a discipline name",
        variant: "destructive",
      });
      return;
    }

    const newDiscipline: Discipline = {
      id: generateId(),
      name: newDisciplineName.trim(),
      levels: []
    };

    // Add predefined levels for the discipline
    const levels: Level[] = [
      { id: `${newDiscipline.id}_l1`, name: "1", poules: [] },
      { id: `${newDiscipline.id}_l2`, name: "2", poules: [] },
      { id: `${newDiscipline.id}_l3`, name: "3", poules: [] },
      { id: `${newDiscipline.id}_l4`, name: "4", poules: [] },
      { id: `${newDiscipline.id}_l5`, name: "4+", poules: [] }
    ];

    newDiscipline.levels = levels;

    const updatedTournament = {
      ...tournament!,
      disciplines: [...tournament!.disciplines, newDiscipline]
    };

    setTournament(updatedTournament);
    saveTournament(updatedTournament);
    
    setNewDisciplineName('');
    setAddDisciplineDialogOpen(false);
    
    toast({
      title: "Discipline added",
      description: `${newDisciplineName} has been added to the tournament`,
    });
  };

  const handleAddLevel = () => {
    if (!disciplineForLevel) {
      toast({
        title: "Error",
        description: "Please select a discipline",
        variant: "destructive",
      });
      return;
    }

    if (!newLevelName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a level name",
        variant: "destructive",
      });
      return;
    }

    const updatedTournament = { ...tournament! };
    const disciplineIndex = updatedTournament.disciplines.findIndex(
      d => d.id === disciplineForLevel
    );

    if (disciplineIndex === -1) return;

    const newLevel: Level = {
      id: generateId(),
      name: newLevelName.trim(),
      poules: []
    };

    updatedTournament.disciplines[disciplineIndex].levels.push(newLevel);
    setTournament(updatedTournament);
    saveTournament(updatedTournament);
    
    setNewLevelName('');
    setDisciplineForLevel('');
    setAddLevelDialogOpen(false);
    
    toast({
      title: "Level added",
      description: `Level ${newLevelName} has been added to the discipline`,
    });
  };

  const handleAddPoule = () => {
    if (!disciplineForPoule || !levelForPoule) {
      toast({
        title: "Error",
        description: "Please select both discipline and level",
        variant: "destructive",
      });
      return;
    }

    if (!newPouleName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a poule name",
        variant: "destructive",
      });
      return;
    }

    const updatedTournament = { ...tournament! };
    const disciplineIndex = updatedTournament.disciplines.findIndex(
      d => d.id === disciplineForPoule
    );

    if (disciplineIndex === -1) return;

    const levelIndex = updatedTournament.disciplines[disciplineIndex].levels.findIndex(
      l => l.id === levelForPoule
    );

    if (levelIndex === -1) return;

    const newPoule: Poule = {
      id: generateId(),
      name: newPouleName.trim(),
      teams: [],
      matches: []
    };

    updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules.push(newPoule);
    setTournament(updatedTournament);
    saveTournament(updatedTournament);
    
    setNewPouleName('');
    setDisciplineForPoule('');
    setLevelForPoule('');
    setAddPouleDialogOpen(false);
    
    toast({
      title: "Poule added",
      description: `Poule ${newPouleName} has been added to the level`,
    });
  };

  const handleAddTeam = () => {
    if (!pouleForTeam) {
      toast({
        title: "Error",
        description: "Please select a poule",
        variant: "destructive",
      });
      return;
    }

    if (!player1Name.trim() || !player2Name.trim()) {
      toast({
        title: "Error",
        description: "Please enter names for both players",
        variant: "destructive",
      });
      return;
    }

    // Find the poule and its path in the tournament structure
    let foundPoule: Poule | null = null;
    let disciplineIndex = -1;
    let levelIndex = -1;
    let pouleIndex = -1;

    for (let i = 0; i < tournament!.disciplines.length; i++) {
      const discipline = tournament!.disciplines[i];
      for (let j = 0; j < discipline.levels.length; j++) {
        const level = discipline.levels[j];
        for (let k = 0; k < level.poules.length; k++) {
          const poule = level.poules[k];
          if (poule.id === pouleForTeam) {
            foundPoule = poule;
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
      name: player1Name.trim()
    };

    const player2: Player = {
      id: generateId(),
      name: player2Name.trim()
    };

    const newTeam: Team = {
      id: generateId(),
      players: [player1, player2]
    };

    const updatedTournament = { ...tournament! };
    updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].teams.push(newTeam);
    
    // Generate matches for the updated poule
    const updatedPoule = updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex];
    updatedPoule.matches = generateMatches(updatedPoule);
    
    setTournament(updatedTournament);
    saveTournament(updatedTournament);
    
    setPlayer1Name('');
    setPlayer2Name('');
    setPouleForTeam('');
    setAddTeamDialogOpen(false);
    
    toast({
      title: "Team added",
      description: `Team ${player1Name} & ${player2Name} has been added to the poule`,
    });
  };

  // Handle edit functions
  const handleEditItem = (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => {
    setCurrentItemType(type);
    setCurrentItemId(id);
    setCurrentParentId(parentId || null);
    
    // Find the item and set the edit form state
    if (type === 'discipline') {
      const discipline = tournament!.disciplines.find(d => d.id === id);
      if (discipline) {
        setEditDisciplineName(discipline.name);
        setEditDisciplineDialogOpen(true);
      }
    } else if (type === 'level') {
      const discipline = tournament!.disciplines.find(d => d.id === parentId);
      if (discipline) {
        const level = discipline.levels.find(l => l.id === id);
        if (level) {
          setEditLevelName(level.name);
          setEditLevelDialogOpen(true);
        }
      }
    } else if (type === 'poule') {
      let foundPoule: Poule | null = null;
      
      // Find the poule
      for (const discipline of tournament!.disciplines) {
        for (const level of discipline.levels) {
          if (level.id === parentId) {
            foundPoule = level.poules.find(p => p.id === id) || null;
            break;
          }
        }
        if (foundPoule) break;
      }
      
      if (foundPoule) {
        setEditPouleName(foundPoule.name);
        setEditPouleDialogOpen(true);
      }
    } else if (type === 'team') {
      let foundTeam: Team | null = null;
      
      // Find the team
      for (const discipline of tournament!.disciplines) {
        for (const level of discipline.levels) {
          for (const poule of level.poules) {
            if (poule.id === parentId) {
              foundTeam = poule.teams.find(t => t.id === id) || null;
              break;
            }
          }
          if (foundTeam) break;
        }
        if (foundTeam) break;
      }
      
      if (foundTeam) {
        setEditPlayer1Name(foundTeam.players[0].name);
        setEditPlayer2Name(foundTeam.players[1].name);
        setEditTeamDialogOpen(true);
      }
    }
  };
  
  const handleEditConfirm = () => {
    if (!tournament || !currentItemType || !currentItemId) return;
    
    const updatedTournament = { ...tournament };
    
    if (currentItemType === 'discipline') {
      const disciplineIndex = updatedTournament.disciplines.findIndex(d => d.id === currentItemId);
      if (disciplineIndex === -1) return;
      
      updatedTournament.disciplines[disciplineIndex].name = editDisciplineName.trim();
      setEditDisciplineDialogOpen(false);
      
      toast({
        title: "Discipline updated",
        description: `The discipline has been renamed to ${editDisciplineName}`,
      });
    } else if (currentItemType === 'level') {
      if (!currentParentId) return;
      
      const disciplineIndex = updatedTournament.disciplines.findIndex(d => d.id === currentParentId);
      if (disciplineIndex === -1) return;
      
      const levelIndex = updatedTournament.disciplines[disciplineIndex].levels.findIndex(l => l.id === currentItemId);
      if (levelIndex === -1) return;
      
      updatedTournament.disciplines[disciplineIndex].levels[levelIndex].name = editLevelName.trim();
      setEditLevelDialogOpen(false);
      
      toast({
        title: "Level updated",
        description: `The level has been renamed to ${editLevelName}`,
      });
    } else if (currentItemType === 'poule') {
      if (!currentParentId) return;
      
      let foundPoule = false;
      let disciplineIndex = -1;
      let levelIndex = -1;
      let pouleIndex = -1;
      
      // Find indices for the poule
      for (let i = 0; i < updatedTournament.disciplines.length; i++) {
        const discipline = updatedTournament.disciplines[i];
        for (let j = 0; j < discipline.levels.length; j++) {
          const level = discipline.levels[j];
          if (level.id === currentParentId) {
            pouleIndex = level.poules.findIndex(p => p.id === currentItemId);
            if (pouleIndex !== -1) {
              foundPoule = true;
              disciplineIndex = i;
              levelIndex = j;
              break;
            }
          }
        }
        if (foundPoule) break;
      }
      
      if (!foundPoule) return;
      
      updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].name = editPouleName.trim();
      setEditPouleDialogOpen(false);
      
      toast({
        title: "Poule updated",
        description: `The poule has been renamed to ${editPouleName}`,
      });
    } else if (currentItemType === 'team') {
      if (!currentParentId) return;
      
      let foundTeam = false;
      let disciplineIndex = -1;
      let levelIndex = -1;
      let pouleIndex = -1;
      let teamIndex = -1;
      
      // Find indices for the team
      for (let i = 0; i < updatedTournament.disciplines.length; i++) {
        const discipline = updatedTournament.disciplines[i];
        for (let j = 0; j < discipline.levels.length; j++) {
          const level = discipline.levels[j];
          for (let k = 0; k < level.poules.length; k++) {
            const poule = level.poules[k];
            if (poule.id === currentParentId) {
              teamIndex = poule.teams.findIndex(t => t.id === currentItemId);
              if (teamIndex !== -1) {
                foundTeam = true;
                disciplineIndex = i;
                levelIndex = j;
                pouleIndex = k;
                break;
              }
            }
          }
          if (foundTeam) break;
        }
        if (foundTeam) break;
      }
      
      if (!foundTeam) return;
      
      updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].teams[teamIndex].players[0].name = editPlayer1Name.trim();
      updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].teams[teamIndex].players[1].name = editPlayer2Name.trim();
      setEditTeamDialogOpen(false);
      
      toast({
        title: "Team updated",
        description: `The team players have been updated`,
      });
    }
    
    setTournament(updatedTournament);
    saveTournament(updatedTournament);
    
    // Reset current item
    setCurrentItemType(null);
    setCurrentItemId(null);
    setCurrentParentId(null);
  };
  
  // Handle delete functions
  const handleDeleteItem = (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => {
    setCurrentItemType(type);
    setCurrentItemId(id);
    setCurrentParentId(parentId || null);
    setDeleteConfirmOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    if (!tournament || !currentItemType || !currentItemId) return;
    
    const updatedTournament = { ...tournament };
    
    if (currentItemType === 'discipline') {
      updatedTournament.disciplines = updatedTournament.disciplines.filter(d => d.id !== currentItemId);
      
      toast({
        title: "Discipline deleted",
        description: "The discipline and all its levels, poules, and teams have been removed",
      });
    } else if (currentItemType === 'level') {
      if (!currentParentId) return;
      
      const disciplineIndex = updatedTournament.disciplines.findIndex(d => d.id === currentParentId);
      if (disciplineIndex === -1) return;
      
      updatedTournament.disciplines[disciplineIndex].levels = 
        updatedTournament.disciplines[disciplineIndex].levels.filter(l => l.id !== currentItemId);
      
      toast({
        title: "Level deleted",
        description: "The level and all its poules and teams have been removed",
      });
    } else if (currentItemType === 'poule') {
      if (!currentParentId) return;
      
      let levelFound = false;
      
      // Find and remove the poule
      for (let i = 0; i < updatedTournament.disciplines.length; i++) {
        const discipline = updatedTournament.disciplines[i];
        for (let j = 0; j < discipline.levels.length; j++) {
          const level = discipline.levels[j];
          if (level.id === currentParentId) {
            updatedTournament.disciplines[i].levels[j].poules = level.poules.filter(p => p.id !== currentItemId);
            levelFound = true;
            break;
          }
        }
        if (levelFound) break;
      }
      
      toast({
        title: "Poule deleted",
        description: "The poule and all its teams have been removed",
      });
    } else if (currentItemType === 'team') {
      if (!currentParentId) return;
      
      let pouleFound = false;
      
      // Find and remove the team
      for (let i = 0; i < updatedTournament.disciplines.length; i++) {
        const discipline = updatedTournament.disciplines[i];
        for (let j = 0; j < discipline.levels.length; j++) {
          const level = discipline.levels[j];
          for (let k = 0; k < level.poules.length; k++) {
            const poule = level.poules[k];
            if (poule.id === currentParentId) {
              // Remove the team
              const updatedTeams = poule.teams.filter(t => t.id !== currentItemId);
              updatedTournament.disciplines[i].levels[j].poules[k].teams = updatedTeams;
              
              // Regenerate matches
              const updatedPoule = {
                ...updatedTournament.disciplines[i].levels[j].poules[k],
                teams: updatedTeams
              };
              updatedTournament.disciplines[i].levels[j].poules[k].matches = generateMatches(updatedPoule);
              
              pouleFound = true;
              break;
            }
          }
          if (pouleFound) break;
        }
        if (pouleFound) break;
      }
      
      toast({
        title: "Team deleted",
        description: "The team has been removed and matches have been regenerated",
      });
    }
    
    setTournament(updatedTournament);
    saveTournament(updatedTournament);
    
    // Reset dialogs and current item
    setDeleteConfirmOpen(false);
    setCurrentItemType(null);
    setCurrentItemId(null);
    setCurrentParentId(null);
  };

  const handleNavigationChange = (newState: NavigationState) => {
    setNavigationState(newState);
  };

  const getPoulesForSelect = (): { value: string; label: string; }[] => {
    const poules: { value: string; label: string; }[] = [];

    tournament?.disciplines.forEach(discipline => {
      discipline.levels.forEach(level => {
        level.poules.forEach(poule => {
          poules.push({
            value: poule.id,
            label: `${discipline.name} - Level ${level.name} - ${poule.name}`
          });
        });
      });
    });

    return poules;
  };

  const getTeamsForPoule = (pouleId: string): { value: string; label: string; }[] => {
    const teams: { value: string; label: string; }[] = [];

    // Find the poule and get its teams
    tournament?.disciplines.forEach(discipline => {
      discipline.levels.forEach(level => {
        level.poules.forEach(poule => {
          if (poule.id === pouleId) {
            poule.teams.forEach(team => {
              teams.push({
                value: team.id,
                label: `${team.players[0].name} & ${team.players[1].name}`
              });
            });
          }
        });
      });
    });

    return teams;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    setIsAuthenticated(false);
    navigate('/');
  };

  // Handle viewing teams in a poule
  const handleViewTeams = (pouleId: string) => {
    if (!tournament) return;
    
    // Find the poule
    let foundPoule: Poule | null = null;
    
    for (const discipline of tournament.disciplines) {
      for (const level of discipline.levels) {
        for (const poule of level.poules) {
          if (poule.id === pouleId) {
            foundPoule = poule;
            break;
          }
        }
        if (foundPoule) break;
      }
      if (foundPoule) break;
    }
    
    if (foundPoule) {
      setCurrentPoule(foundPoule);
      setTeamsViewDialogOpen(true);
    }
  };
  
  // Remove the optimize match order function since we've implemented the ordering directly in generateMatches
  const handleOptimizeMatches = (pouleId: string) => {
    // This function is now obsolete as we handle match ordering directly in generateMatches
    // We'll keep an empty function for now, and this UI element will be removed
  };

  // New function to get all poules with their paths for the CSV import component
  const getAllPoules = (): { id: string; name: string; path: string }[] => {
    const allPoules: { id: string; name: string; path: string }[] = [];
    
    tournament?.disciplines.forEach(discipline => {
      discipline.levels.forEach(level => {
        level.poules.forEach(poule => {
          allPoules.push({
            id: poule.id,
            name: poule.name,
            path: `${discipline.name} - Level ${level.name}`
          });
        });
      });
    });
    
    return allPoules;
  };
  
  // Handle the import of teams from CSV
  const handleImportTeams = (pouleId: string, teams: Team[]) => {
    if (!tournament) return;
    
    const updatedTournament = { ...tournament };
    let pouleFound = false;
    let disciplineIndex = -1;
    let levelIndex = -1;
    let pouleIndex = -1;
    
    // Find the poule in the tournament structure
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
    
    if (!pouleFound) return;
    
    // Add teams to the poule
    const updatedPoule = updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex];
    const existingTeams = updatedPoule.teams || [];
    
    // Add the new teams
    updatedPoule.teams = [...existingTeams, ...teams];
    
    // Regenerate matches
    updatedPoule.matches = generateMatches(updatedPoule);
    
    // Update the tournament state and save
    setTournament(updatedTournament);
    saveTournament(updatedTournament);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container px-4 pt-24 pb-16 mx-auto">
          <AdminAuth onAuthenticated={handleAuthenticated} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container px-4 pt-24 pb-16 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage tournament disciplines, levels, poules, and teams
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="transition-all duration-200"
            >
              Logout
            </Button>
            <Button 
              className="transition-all duration-200 relative overflow-hidden group"
              onClick={handleSaveTournament}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </span>
              <span className="absolute inset-0 bg-primary/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 mb-12 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Add Tournament Components</CardTitle>
              <CardDescription>
                Create new disciplines, levels, poules, and teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:border-primary transition-all" 
                  onClick={() => setCsvImportDialogOpen(true)}
                >
                  <Upload className="h-5 w-5" />
                  <span>Import Teams (CSV)</span>
                </Button>
                
                <Dialog open={addDisciplineDialogOpen} onOpenChange={setAddDisciplineDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 hover:border-primary transition-all">
                      <PlusCircle className="h-5 w-5" />
                      <span>Add Discipline</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Discipline</DialogTitle>
                      <DialogDescription>
                        Create a new tournament discipline.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Input
                          placeholder="Discipline name"
                          value={newDisciplineName}
                          onChange={(e) => setNewDisciplineName(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddDisciplineDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddDiscipline}>
                        Add Discipline
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={addLevelDialogOpen} onOpenChange={setAddLevelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 hover:border-primary transition-all">
                      <PlusCircle className="h-5 w-5" />
                      <span>Add Level</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Level</DialogTitle>
                      <DialogDescription>
                        Create a new level within a discipline.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Select value={disciplineForLevel} onValueChange={setDisciplineForLevel}>
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
                      <div className="space-y-2">
                        <Input
                          placeholder="Level name"
                          value={newLevelName}
                          onChange={(e) => setNewLevelName(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddLevelDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddLevel}>
                        Add Level
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={addPouleDialogOpen} onOpenChange={setAddPouleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 hover:border-primary transition-all">
                      <PlusCircle className="h-5 w-5" />
                      <span>Add Poule</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Poule</DialogTitle>
                      <DialogDescription>
                        Create a new poule within a level.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Select value={disciplineForPoule} onValueChange={setDisciplineForPoule}>
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
                      {disciplineForPoule && (
                        <div className="space-y-2">
                          <Select value={levelForPoule} onValueChange={setLevelForPoule}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                            <SelectContent>
                              {tournament?.disciplines
                                .find(d => d.id === disciplineForPoule)
                                ?.levels.map((level) => (
                                  <SelectItem key={level.id} value={level.id}>
                                    Level {level.name}
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Input
                          placeholder="Poule name"
                          value={newPouleName}
                          onChange={(e) => setNewPouleName(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddPouleDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddPoule}>
                        Add Poule
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={addTeamDialogOpen} onOpenChange={setAddTeamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 hover:border-primary transition-all">
                      <PlusCircle className="h-5 w-5" />
                      <span>Add Team</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Team</DialogTitle>
                      <DialogDescription>
                        Create a new team within a poule.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Select value={pouleForTeam} onValueChange={setPouleForTeam}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Poule" />
                          </SelectTrigger>
                          <SelectContent>
                            {getPoulesForSelect().map((poule) => (
                              <SelectItem key={poule.value} value={poule.value}>
                                {poule.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Player 1 name"
                          value={player1Name}
                          onChange={(e) => setPlayer1Name(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Player 2 name"
                          value={player2Name}
                          onChange={(e) => setPlayer2Name(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddTeamDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddTeam}>
                        Add Team
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Structure */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Structure</CardTitle>
              <CardDescription>
                View and manage disciplines, levels, poules, and teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading tournament data...</div>
              ) : (
                <TournamentStructure 
                  tournament={tournament!}
                  navigationState={navigationState}
                  onNavigationChange={handleNavigationChange}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                  onViewTeams={handleViewTeams}
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Edit Discipline Dialog */}
        <Dialog open={editDisciplineDialogOpen} onOpenChange={setEditDisciplineDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Discipline</DialogTitle>
              <DialogDescription>
                Update the discipline's name.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Discipline name"
                  value={editDisciplineName}
                  onChange={(e) => setEditDisciplineName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDisciplineDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditConfirm}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Level Dialog */}
        <Dialog open={editLevelDialogOpen} onOpenChange={setEditLevelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Level</DialogTitle>
              <DialogDescription>
                Update the level's name.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Level name"
                  value={editLevelName}
                  onChange={(e) => setEditLevelName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditLevelDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditConfirm}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Poule Dialog */}
        <Dialog open={editPouleDialogOpen} onOpenChange={setEditPouleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Poule</DialogTitle>
              <DialogDescription>
                Update the poule's name.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Poule name"
                  value={editPouleName}
                  onChange={(e) => setEditPouleName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditPouleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditConfirm}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Team Dialog */}
        <Dialog open={editTeamDialogOpen} onOpenChange={setEditTeamDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>
                Update the team player names.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Player 1 name"
                  value={editPlayer1Name}
                  onChange={(e) => setEditPlayer1Name(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Player 2 name"
                  value={editPlayer2Name}
                  onChange={(e) => setEditPlayer2Name(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTeamDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditConfirm}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {currentItemType === 'discipline' && "Delete Discipline"}
                {currentItemType === 'level' && "Delete Level"}
                {currentItemType === 'poule' && "Delete Poule"}
                {currentItemType === 'team' && "Delete Team"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {currentItemType === 'discipline' && "This will delete the discipline and all its levels, poules, and teams. This action cannot be undone."}
                {currentItemType === 'level' && "This will delete the level and all its poules and teams. This action cannot be undone."}
                {currentItemType === 'poule' && "This will delete the poule and all its teams. This action cannot be undone."}
                {currentItemType === 'team' && "This will delete the team. This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* CSV Import Dialog */}
        <Dialog open={csvImportDialogOpen} onOpenChange={setCsvImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Teams from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file to import multiple teams at once.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <TeamCsvImport 
                poules={getAllPoules()} 
                onImport={(pouleId, teams) => {
                  handleImportTeams(pouleId, teams);
                  setCsvImportDialogOpen(false);
                  toast({
                    title: "Teams imported",
                    description: `Successfully added ${teams.length} teams`,
                  });
                }}
                onCancel={() => setCsvImportDialogOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Teams View Dialog */}
        <TeamsViewDialog 
          open={teamsViewDialogOpen}
          onOpenChange={setTeamsViewDialogOpen}
          poule={currentPoule}
        />
      </main>
    </div>
  );
};

export default Admin;
