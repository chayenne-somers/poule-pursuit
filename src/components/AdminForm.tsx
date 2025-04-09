
import React, { useEffect, useState } from 'react';
import { loadTournament, saveTournament, generateId, generateMatches } from '@/utils/tournamentUtils';
import { Discipline, Level, Poule, Team, Player, Tournament } from '@/types/tournament';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface AdminFormProps {
  onDataChange: () => void;
}

const AdminForm: React.FC<AdminFormProps> = ({ onDataChange }) => {
  const [disciplineName, setDisciplineName] = useState('');
  const [levelName, setLevelName] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [pouleName, setPouleName] = useState('');
  const [disciplineForPoule, setDisciplineForPoule] = useState('');
  const [levelForPoule, setLevelForPoule] = useState('');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [pouleForTeam, setPouleForTeam] = useState('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const data = await loadTournament();
        setTournament(data);
      } catch (error) {
        console.error("Error loading tournament data:", error);
        toast({
          title: "Error",
          description: "Failed to load tournament data",
          variant: "destructive",
        });
      }
    };
    
    fetchTournament();
  }, [toast]);

  const handleAddDiscipline = async () => {
    if (!disciplineName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a discipline name",
        variant: "destructive",
      });
      return;
    }

    if (!tournament) {
      toast({
        title: "Error",
        description: "Tournament data not loaded",
        variant: "destructive",
      });
      return;
    }

    const newDiscipline: Discipline = {
      id: generateId(),
      name: disciplineName.trim(),
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
      ...tournament,
      disciplines: [...tournament.disciplines, newDiscipline]
    };

    await saveTournament(updatedTournament);
    setTournament(updatedTournament);
    setDisciplineName('');
    onDataChange();
    
    toast({
      title: "Discipline added",
      description: `${disciplineName} has been added to the tournament`,
    });
  };

  const handleAddLevel = async () => {
    if (!tournament) return;
    
    if (!selectedDiscipline) {
      toast({
        title: "Error",
        description: "Please select a discipline",
        variant: "destructive",
      });
      return;
    }

    if (!levelName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a level name",
        variant: "destructive",
      });
      return;
    }

    const updatedTournament = { ...tournament };
    const disciplineIndex = updatedTournament.disciplines.findIndex(
      d => d.id === selectedDiscipline
    );

    if (disciplineIndex === -1) return;

    const newLevel: Level = {
      id: generateId(),
      name: levelName.trim(),
      poules: []
    };

    updatedTournament.disciplines[disciplineIndex].levels.push(newLevel);
    await saveTournament(updatedTournament);
    
    setTournament(updatedTournament);
    setLevelName('');
    setSelectedDiscipline('');
    onDataChange();
    
    toast({
      title: "Level added",
      description: `Level ${levelName} has been added to the discipline`,
    });
  };

  const handleAddPoule = async () => {
    if (!tournament) return;
    
    if (!disciplineForPoule || !levelForPoule) {
      toast({
        title: "Error",
        description: "Please select both discipline and level",
        variant: "destructive",
      });
      return;
    }

    if (!pouleName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a poule name",
        variant: "destructive",
      });
      return;
    }

    const updatedTournament = { ...tournament };
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
      name: pouleName.trim(),
      teams: [],
      matches: []
    };

    updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules.push(newPoule);
    await saveTournament(updatedTournament);
    
    setTournament(updatedTournament);
    setPouleName('');
    setDisciplineForPoule('');
    setLevelForPoule('');
    onDataChange();
    
    toast({
      title: "Poule added",
      description: `Poule ${pouleName} has been added to the level`,
    });
  };

  const handleAddTeam = async () => {
    if (!tournament) return;
    
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

    for (let i = 0; i < tournament.disciplines.length; i++) {
      const discipline = tournament.disciplines[i];
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

    const updatedTournament = { ...tournament };
    updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex].teams.push(newTeam);
    
    // Generate matches for the updated poule
    const updatedPoule = updatedTournament.disciplines[disciplineIndex].levels[levelIndex].poules[pouleIndex];
    updatedPoule.matches = generateMatches(updatedPoule);
    
    await saveTournament(updatedTournament);
    
    setTournament(updatedTournament);
    setPlayer1Name('');
    setPlayer2Name('');
    setPouleForTeam('');
    onDataChange();
    
    toast({
      title: "Team added",
      description: `Team ${player1Name} & ${player2Name} has been added to the poule`,
    });
  };

  const getPoulesForSelect = (): { value: string; label: string; }[] => {
    if (!tournament) return [];
    
    const poules: { value: string; label: string; }[] = [];

    tournament.disciplines.forEach(discipline => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add Discipline</h3>
        <div className="space-y-2">
          <Input 
            placeholder="Discipline name" 
            value={disciplineName}
            onChange={(e) => setDisciplineName(e.target.value)}
          />
          <Button onClick={handleAddDiscipline}>Add Discipline</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add Level</h3>
        <div className="space-y-2">
          <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
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
          <Input 
            placeholder="Level name" 
            value={levelName}
            onChange={(e) => setLevelName(e.target.value)}
          />
          <Button onClick={handleAddLevel}>Add Level</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add Poule</h3>
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
          <Select 
            value={levelForPoule} 
            onValueChange={setLevelForPoule}
            disabled={!disciplineForPoule}
          >
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
          <Input 
            placeholder="Poule name" 
            value={pouleName}
            onChange={(e) => setPouleName(e.target.value)}
          />
          <Button onClick={handleAddPoule}>Add Poule</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add Team</h3>
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
          <Input 
            placeholder="Player 1 name" 
            value={player1Name}
            onChange={(e) => setPlayer1Name(e.target.value)}
          />
          <Input 
            placeholder="Player 2 name" 
            value={player2Name}
            onChange={(e) => setPlayer2Name(e.target.value)}
          />
          <Button onClick={handleAddTeam}>Add Team</Button>
        </div>
      </div>
    </div>
  );
};

export default AdminForm;
