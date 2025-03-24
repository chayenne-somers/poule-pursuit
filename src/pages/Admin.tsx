import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Discipline, Level, Poule, Team, Tournament } from '@/types/tournament';
import { loadTournament, saveTournament, generateId } from '@/utils/tournamentUtils';
import TournamentStructure from '@/components/TournamentStructure';
import AdminForm from '@/components/AdminForm';
import TeamsViewDialog from '@/components/TeamsViewDialog';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Plus, LogOut } from 'lucide-react';

const Admin = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [poules, setPoules] = useState<Poule[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | undefined>(undefined);
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>(undefined);
  const [selectedPoule, setSelectedPoule] = useState<string | undefined>(undefined);
  const [currentPoule, setCurrentPoule] = useState<Poule | null>(null);
  const [teamsViewDialogOpen, setTeamsViewDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formType, setFormType] = useState<'discipline' | 'level' | 'poule' | 'team'>('discipline');
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteItemType, setDeleteItemType] = useState<'discipline' | 'level' | 'poule' | 'team' | null>(null);
  const [deleteItemParentId, setDeleteItemParentId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [navigationState, setNavigationState] = useState({
    selectedDiscipline: undefined,
    selectedLevel: undefined,
    selectedPoule: undefined
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('isAdminAuthenticated') === 'true';
      setIsAuthenticated(storedAuth);
    
    const data = loadTournament();
    setTournament(data);
    setDisciplines(data?.disciplines || []);
  }, []);

  useEffect(() => {
    if (tournament) {
      setDisciplines(tournament.disciplines);
      
      // Update levels and poules based on selected discipline and level
      if (selectedDiscipline) {
        const selectedDisciplineData = tournament.disciplines.find(d => d.id === selectedDiscipline);
        setLevels(selectedDisciplineData?.levels || []);
      } else {
        setLevels([]);
      }
      
      if (selectedLevel) {
        const selectedLevelData = levels.find(l => l.id === selectedLevel);
        setPoules(selectedLevelData?.poules || []);
      } else {
        setPoules([]);
      }
    }
  }, [tournament, selectedDiscipline, selectedLevel, levels]);

  const handleAuthenticated = () => {
    sessionStorage.setItem('isAdminAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleSaveTournament = (updatedTournament: Tournament) => {
    saveTournament(updatedTournament);
    setTournament(updatedTournament);
    setDisciplines(updatedTournament.disciplines);
  };

  const handleAddDiscipline = (newDiscipline: Omit<Discipline, 'id'>) => {
    if (!tournament) return;
    
    const discipline: Discipline = {
      id: generateId(),
      ...newDiscipline,
      levels: []
    };
    
    const updatedTournament: Tournament = {
      ...tournament,
      disciplines: [...tournament.disciplines, discipline]
    };
    
    handleSaveTournament(updatedTournament);
    
    toast({
      title: "Discipline added",
      description: "New discipline has been added successfully",
    });
  };

  const handleAddLevel = (newLevel: Omit<Level, 'id'>, disciplineId: string) => {
    if (!tournament) return;
    
    const level: Level = {
      id: generateId(),
      ...newLevel,
      poules: []
    };
    
    const updatedTournament: Tournament = { ...tournament };
    
    const disciplineIndex = updatedTournament.disciplines.findIndex(d => d.id === disciplineId);
    
    if (disciplineIndex !== -1) {
      updatedTournament.disciplines[disciplineIndex].levels = [
        ...updatedTournament.disciplines[disciplineIndex].levels,
        level
      ];
      
      handleSaveTournament(updatedTournament);
      
      toast({
        title: "Level added",
        description: "New level has been added successfully",
      });
    }
  };

  const handleAddPoule = (newPoule: Omit<Poule, 'id' | 'matches'>, levelId: string, disciplineId: string) => {
    if (!tournament) return;
    
    const poule: Poule = {
      id: generateId(),
      ...newPoule,
      teams: [],
      matches: []
    };
    
    const updatedTournament: Tournament = { ...tournament };
    
    const disciplineIndex = updatedTournament.disciplines.findIndex(d => d.id === disciplineId);
    
    if (disciplineIndex !== -1) {
      const levelIndex = updatedTournament.disciplines[disciplineIndex].levels.findIndex(l => l.id === levelId);
      
      if (levelIndex !== -1) {
        updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules = [
          ...updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules,
          poule
        ];
        
        handleSaveTournament(updatedTournament);
        
        toast({
          title: "Poule added",
          description: "New poule has been added successfully",
        });
      }
    }
  };

  const handleAddTeam = (newTeam: Omit<Team, 'id'>, pouleId: string, levelId: string, disciplineId: string) => {
    if (!tournament) return;
    
    const team: Team = {
      id: generateId(),
      ...newTeam
    };
    
    const updatedTournament: Tournament = { ...tournament };
    
    const disciplineIndex = updatedTournament.disciplines.findIndex(d => d.id === disciplineId);
    
    if (disciplineIndex !== -1) {
      const levelIndex = updatedTournament.disciplines[disciplineIndex].levels.findIndex(l => l.id === levelId);
      
      if (levelIndex !== -1) {
        const pouleIndex = updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules.findIndex(p => p.id === pouleId);
        
        if (pouleIndex !== -1) {
          updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].teams = [
            ...updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].teams,
            team
          ];
          
          // Generate matches for the poule
          // updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].matches = generateMatches(updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex]);
          
          // Generate matches for the poule
          const poule = updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex];
          updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].matches = generateMatches(poule);
          
          handleSaveTournament(updatedTournament);
          
          toast({
            title: "Team added",
            description: "New team has been added successfully",
          });
        }
      }
    }
  };

  const handleEditItem = (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => {
    setFormType(type);
    setEditItemId(id);
    setIsDialogOpen(true);
  };

  const handleEditConfirm = (editedItem: any, type: string, parentId?: string) => {
    if (!tournament) return;
    
    const updatedTournament = { ...tournament };
    
    switch (type) {
      case 'discipline':
        const disciplineIndex = updatedTournament.disciplines.findIndex(d => d.id === editedItem.id);
        if (disciplineIndex !== -1) {
          updatedTournament.disciplines[disciplineIndex] = {
            ...updatedTournament.disciplines[disciplineIndex],
            ...editedItem
          };
        }
        break;
      case 'level':
        const disciplineIdForLevel = parentId;
        if (!disciplineIdForLevel) return;
        
        const disciplineIndexForLevel = updatedTournament.disciplines.findIndex(d => d.id === disciplineIdForLevel);
        if (disciplineIndexForLevel !== -1) {
          const levelIndex = updatedTournament.disciplines[disciplineIndexForLevel].levels.findIndex(l => l.id === editedItem.id);
          if (levelIndex !== -1) {
            updatedTournament.disciplines[disciplineIndexForLevel].levels[levelIndex] = {
              ...updatedTournament.disciplines[disciplineIndexForLevel].levels[levelIndex],
              ...editedItem
            };
          }
        }
        break;
      case 'poule':
        const disciplineIdForPoule = parentId?.split('_')[0];
        const levelIdForPoule = parentId;
        if (!disciplineIdForPoule || !levelIdForPoule) return;
        
        const disciplineIndexForPoule = updatedTournament.disciplines.findIndex(d => d.id === disciplineIdForPoule);
        if (disciplineIndexForPoule !== -1) {
          const levelIndex = updatedTournament.disciplines[disciplineIndexForPoule].levels.findIndex(l => l.id === levelIdForPoule);
          if (levelIndex !== -1) {
            const pouleIndex = updatedTournament.disciplines[disciplineIndexForPoule].levels[levelIndex].poules.findIndex(p => p.id === editedItem.id);
            if (pouleIndex !== -1) {
              updatedTournament.disciplines[disciplineIndexForPoule].levels[levelIndex].poules[pouleIndex] = {
                ...updatedTournament.disciplines[disciplineIndexForPoule].levels[levelIndex].poules[pouleIndex],
                ...editedItem
              };
            }
          }
        }
        break;
      case 'team':
        // Logic to edit a team (if needed)
        break;
      default:
        break;
    }
    
    handleSaveTournament(updatedTournament);
    setIsDialogOpen(false);
    setEditItemId(null);
    
    toast({
      title: `${type} updated`,
      description: `${type} has been updated successfully`,
    });
  };

  const handleDeleteItem = (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => {
    setDeleteItemType(type);
    setDeleteItemId(id);
    setDeleteItemParentId(parentId || null);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!tournament || !deleteItemId || !deleteItemType) return;
    
    const updatedTournament = { ...tournament };
    
    switch (deleteItemType) {
      case 'discipline':
        updatedTournament.disciplines = updatedTournament.disciplines.filter(d => d.id !== deleteItemId);
        break;
      case 'level':
        const disciplineIdForLevel = deleteItemParentId;
        if (!disciplineIdForLevel) return;
        
        const disciplineIndexForLevel = updatedTournament.disciplines.findIndex(d => d.id === disciplineIdForLevel);
        if (disciplineIndexForLevel !== -1) {
          updatedTournament.disciplines[disciplineIndexForLevel].levels = updatedTournament.disciplines[disciplineIndexForLevel].levels.filter(l => l.id !== deleteItemId);
        }
        break;
      case 'poule':
        const disciplineIdForPoule = deleteItemParentId?.split('_')[0];
        const levelIdForPoule = deleteItemParentId;
        if (!disciplineIdForPoule || !levelIdForPoule) return;
        
        const disciplineIndexForPoule = updatedTournament.disciplines.findIndex(d => d.id === disciplineIdForPoule);
        if (disciplineIndexForPoule !== -1) {
          const levelIndex = updatedTournament.disciplines[disciplineIndexForPoule].levels.findIndex(l => l.id === levelIdForPoule);
          if (levelIndex !== -1) {
            updatedTournament.disciplines[disciplineIndexForPoule].levels[levelIndex].poules = updatedTournament.disciplines[disciplineIndexForPoule].levels[levelIndex].poules.filter(p => p.id !== deleteItemId);
          }
        }
        break;
      case 'team':
        // Logic to delete a team (if needed)
        break;
      default:
        break;
    }
    
    handleSaveTournament(updatedTournament);
    setIsDeleteDialogOpen(false);
    setDeleteItemType(null);
    setDeleteItemId(null);
    setDeleteItemParentId(null);
    
    toast({
      title: `${deleteItemType} deleted`,
      description: `${deleteItemType} has been deleted successfully`,
    });
  };

  const handleNavigationChange = (newState: any) => {
    setNavigationState(newState);
    setSelectedDiscipline(newState.selectedDiscipline);
    setSelectedLevel(newState.selectedLevel);
    setSelectedPoule(newState.selectedPoule);
  };

  const getPoulesForSelect = (levelId: string): Poule[] => {
    if (!tournament) return [];
    
    for (const discipline of tournament.disciplines) {
      for (const level of discipline.levels) {
        if (level.id === levelId) {
          return level.poules;
        }
      }
    }
    
    return [];
  };

  const getTeamsForPoule = (pouleId: string): Team[] => {
    if (!tournament) return [];
    
    for (const discipline of tournament.disciplines) {
      for (const level of discipline.levels) {
        for (const poule of level.poules) {
          if (poule.id === pouleId) {
            return poule.teams;
          }
        }
      }
    }
    
    return [];
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
  
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-center mb-4">Admin Login</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>
            <Button className="w-full" onClick={handleAuthenticated}>
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tournament Structure */}
        <div className="md:col-span-1">
          <TournamentStructure
            disciplines={disciplines}
            isAdmin={true}
            navigationState={navigationState}
            onNavigationChange={handleNavigationChange}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onViewTeams={handleViewTeams}
          />
        </div>
        
        {/* Add New Item Form */}
        <div className="md:col-span-1">
          <AdminForm
            onAddDiscipline={handleAddDiscipline}
            onAddLevel={handleAddLevel}
            onAddPoule={handleAddPoule}
            onAddTeam={handleAddTeam}
            selectedDiscipline={selectedDiscipline}
            selectedLevel={selectedLevel}
            selectedPoule={selectedPoule}
            getPoulesForSelect={getPoulesForSelect}
            getTeamsForPoule={getTeamsForPoule}
          />
        </div>
      </div>
      
      {/* Edit Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit {formType}</DialogTitle>
            <DialogDescription>
              Make changes to your {formType} here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <EditForm
            type={formType}
            itemId={editItemId}
            tournament={tournament}
            onEditConfirm={handleEditConfirm}
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Confirmation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteItemType}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p>Please confirm that you want to delete this {deleteItemType}.</p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Teams View Dialog */}
      <TeamsViewDialog
        isOpen={teamsViewDialogOpen}
        onClose={() => setTeamsViewDialogOpen(false)}
        teams={currentPoule?.teams || []}
      />
    </div>
  );
};

interface EditFormProps {
  type: string;
  itemId: string | null;
  tournament: Tournament | null;
  onEditConfirm: (editedItem: any, type: string, parentId?: string) => void;
  onClose: () => void;
}

const EditForm: React.FC<EditFormProps> = ({ type, itemId, tournament, onEditConfirm, onClose }) => {
  const [name, setName] = useState('');
  
  useEffect(() => {
    if (itemId && tournament) {
      let item;
      let parentId;
      
      switch (type) {
        case 'discipline':
          item = tournament.disciplines.find(d => d.id === itemId);
          break;
        case 'level':
          for (const discipline of tournament.disciplines) {
            const level = discipline.levels.find(l => l.id === itemId);
            if (level) {
              item = level;
              parentId = discipline.id;
              break;
            }
          }
          break;
        case 'poule':
          for (const discipline of tournament.disciplines) {
            for (const level of discipline.levels) {
              const poule = level.poules.find(p => p.id === itemId);
              if (poule) {
                item = poule;
                parentId = level.id;
                break;
              }
            }
            if (item) break;
          }
          break;
        default:
          break;
      }
      
      if (item) {
        setName(item.name || '');
      }
    }
  }, [itemId, type, tournament]);
  
  const handleSave = () => {
    if (itemId) {
      onEditConfirm({ id: itemId, name }, type, getParentId(type, itemId, tournament));
      onClose();
    }
  };
  
  const getParentId = (type: string, itemId: string, tournament: Tournament | null): string | undefined => {
    if (!tournament) return undefined;
    
    switch (type) {
      case 'level':
        for (const discipline of tournament.disciplines) {
          if (discipline.levels.find(level => level.id === itemId)) {
            return discipline.id;
          }
        }
        break;
      case 'poule':
        for (const discipline of tournament.disciplines) {
          for (const level of discipline.levels) {
            if (level.poules.find(poule => poule.id === itemId)) {
              return level.id;
            }
          }
        }
        break;
      default:
        return undefined;
    }
    
    return undefined;
  };
  
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name
        </Label>
        <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
};

export default Admin;
