
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
  initializeTournament 
} from '@/utils/tournamentUtils';
import AdminAuth from '@/components/AdminAuth';
import TournamentStructure from '@/components/TournamentStructure';
import NavBar from '@/components/NavBar';

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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Save, Users, X } from 'lucide-react';

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
  
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    setIsAuthenticated(false);
    navigate('/');
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                          placeholder="Level name (e.g. 1, 2, 3, 4, 4+)"
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
                        <Select value={disciplineForPoule} onValueChange={(value) => {
                          setDisciplineForPoule(value);
                          setLevelForPoule(''); // Reset level when discipline changes
                        }}>
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
                        <Select value={levelForPoule} onValueChange={setLevelForPoule}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Level" />
                          </SelectTrigger>
                          <SelectContent>
                            {disciplineForPoule && tournament?.disciplines
                              .find(d => d.id === disciplineForPoule)?.levels
                              .map((level) => (
                                <SelectItem key={level.id} value={level.id}>
                                  Level {level.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Poule name (e.g. A, B, C)"
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
                      <Users className="h-5 w-5" />
                      <span>Add Team</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Team</DialogTitle>
                      <DialogDescription>
                        Add a team (2 players) to a poule.
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
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse flex space-x-2">
              <div className="h-3 w-3 bg-primary rounded-full"></div>
              <div className="h-3 w-3 bg-primary rounded-full"></div>
              <div className="h-3 w-3 bg-primary rounded-full"></div>
            </div>
          </div>
        ) : tournament ? (
          <>
            <h2 className="text-2xl font-semibold mb-6">Tournament Structure Preview</h2>
            <div className="bg-white rounded-lg border border-border/60 p-6 animate-fade-in">
              <TournamentStructure 
                disciplines={tournament.disciplines} 
                isAdmin={true}
                navigationState={navigationState}
                onNavigationChange={handleNavigationChange}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tournament data found.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
