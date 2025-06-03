import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminForm from '@/components/AdminForm';
import TournamentStructure from '@/components/TournamentStructure';
import { Tournament, Discipline, Level, Poule, Team } from '@/types/tournament';
import { loadTournament, saveTournament, initializeTournament } from '@/utils/tournamentUtils';
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Settings, Users, Save } from 'lucide-react';
import TeamsViewDialog from '@/components/TeamsViewDialog';

const Admin = () => {
  const [tournament, setTournament] = useState<Tournament>(initializeTournament());
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formType, setFormType] = useState<'discipline' | 'level' | 'poule' | 'team'>('discipline');
  const [parentId, setParentId] = useState<string>('');
  const [showTeamsDialog, setShowTeamsDialog] = useState(false);
  const [selectedPouleForTeams, setSelectedPouleForTeams] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load tournament data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const tournamentData = await loadTournament();
        setTournament(tournamentData);
      } catch (error) {
        console.error('Error loading tournament data:', error);
        toast({
          title: "Error loading data",
          description: "Failed to load tournament data",
          variant: "destructive"
        });
      }
    };
    loadData();
  }, []);

  const saveData = async (updatedTournament: Tournament) => {
    try {
      setIsSaving(true);
      await saveTournament(updatedTournament);
      console.log('Tournament data saved successfully');
    } catch (error) {
      console.error('Error saving tournament data:', error);
      toast({
        title: "Error saving data",
        description: "Failed to save tournament data",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    try {
      setIsSaving(true);
      await saveTournament(tournament);
      toast({
        title: "Data saved",
        description: "Tournament data has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving tournament data:', error);
      toast({
        title: "Error saving data",
        description: "Failed to save tournament data",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadData = () => {
    const dataStr = JSON.stringify(tournament, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'tournament-data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const uploadedData = JSON.parse(e.target?.result as string);
          setTournament(uploadedData);
          await saveData(uploadedData);
          toast({
            title: "Data imported successfully",
            description: "Tournament data has been loaded from file",
          });
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Invalid file format",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleAddNew = (type: 'discipline' | 'level' | 'poule' | 'team', parentId?: string) => {
    setFormType(type);
    setParentId(parentId || '');
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditItem = (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => {
    setFormType(type);
    setParentId(parentId || '');
    
    let itemToEdit = null;
    if (type === 'discipline') {
      itemToEdit = tournament.disciplines.find(d => d.id === id);
    } else if (type === 'level') {
      const discipline = tournament.disciplines.find(d => d.id === parentId);
      itemToEdit = discipline?.levels.find(l => l.id === id);
    } else if (type === 'poule') {
      const discipline = tournament.disciplines.find(d => d.levels.some(l => l.id === parentId));
      const level = discipline?.levels.find(l => l.id === parentId);
      itemToEdit = level?.poules.find(p => p.id === id);
    } else if (type === 'team') {
      // Find team in any poule
      for (const discipline of tournament.disciplines) {
        for (const level of discipline.levels) {
          for (const poule of level.poules) {
            const team = poule.teams.find(t => t.id === id);
            if (team) {
              itemToEdit = team;
              setParentId(poule.id);
              break;
            }
          }
        }
      }
    }
    
    setEditingItem(itemToEdit);
    setShowForm(true);
  };

  const handleDeleteItem = async (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => {
    let updatedTournament = { ...tournament };
    
    if (type === 'discipline') {
      updatedTournament.disciplines = updatedTournament.disciplines.filter(d => d.id !== id);
    } else if (type === 'level') {
      updatedTournament.disciplines = updatedTournament.disciplines.map(d => 
        d.id === parentId 
          ? { ...d, levels: d.levels.filter(l => l.id !== id) }
          : d
      );
    } else if (type === 'poule') {
      updatedTournament.disciplines = updatedTournament.disciplines.map(d => ({
        ...d,
        levels: d.levels.map(l => 
          l.id === parentId 
            ? { ...l, poules: l.poules.filter(p => p.id !== id) }
            : l
        )
      }));
    } else if (type === 'team') {
      // Remove team from its poule
      updatedTournament.disciplines = updatedTournament.disciplines.map(d => ({
        ...d,
        levels: d.levels.map(l => ({
          ...l,
          poules: l.poules.map(p => 
            p.id === parentId
              ? { ...p, teams: p.teams.filter(t => t.id !== id) }
              : p
          )
        }))
      }));
    }
    
    setTournament(updatedTournament);
    await saveData(updatedTournament);
    
    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted`,
      description: `The ${type} has been successfully deleted.`,
    });
  };

  const handleViewTeams = (pouleId: string) => {
    setSelectedPouleForTeams(pouleId);
    setShowTeamsDialog(true);
  };

  const handleFormSubmit = async (formData: any) => {
    let updatedTournament = { ...tournament };
    
    if (editingItem) {
      // Update existing item
      if (formType === 'discipline') {
        updatedTournament.disciplines = updatedTournament.disciplines.map(d => 
          d.id === editingItem.id ? { ...d, ...formData } : d
        );
      } else if (formType === 'level') {
        updatedTournament.disciplines = updatedTournament.disciplines.map(d => 
          d.id === parentId 
            ? { ...d, levels: d.levels.map(l => l.id === editingItem.id ? { ...l, ...formData } : l) }
            : d
        );
      } else if (formType === 'poule') {
        updatedTournament.disciplines = updatedTournament.disciplines.map(d => ({
          ...d,
          levels: d.levels.map(l => 
            l.id === parentId 
              ? { ...l, poules: l.poules.map(p => p.id === editingItem.id ? { ...p, ...formData } : p) }
              : l
          )
        }));
      } else if (formType === 'team') {
        const updatedTeam = {
          ...editingItem,
          players: [
            { ...editingItem.players[0], name: formData.player1Name },
            { ...editingItem.players[1], name: formData.player2Name }
          ]
        };
        updatedTournament.disciplines = updatedTournament.disciplines.map(d => ({
          ...d,
          levels: d.levels.map(l => ({
            ...l,
            poules: l.poules.map(p => 
              p.id === parentId
                ? { ...p, teams: p.teams.map(t => t.id === editingItem.id ? updatedTeam : t) }
                : p
            )
          }))
        }));
      }
    } else {
      // Add new item
      if (formType === 'discipline') {
        const newDiscipline: Discipline = {
          id: Date.now().toString(),
          name: formData.name,
          levels: []
        };
        updatedTournament.disciplines.push(newDiscipline);
      } else if (formType === 'level') {
        const newLevel: Level = {
          id: Date.now().toString(),
          name: formData.name,
          poules: []
        };
        updatedTournament.disciplines = updatedTournament.disciplines.map(d => 
          d.id === parentId ? { ...d, levels: [...d.levels, newLevel] } : d
        );
      } else if (formType === 'poule') {
        const newPoule: Poule = {
          id: Date.now().toString(),
          name: formData.name,
          teams: [],
          matches: []
        };
        updatedTournament.disciplines = updatedTournament.disciplines.map(d => ({
          ...d,
          levels: d.levels.map(l => 
            l.id === parentId ? { ...l, poules: [...l.poules, newPoule] } : l
          )
        }));
      } else if (formType === 'team') {
        const newTeam: Team = {
          id: Date.now().toString(),
          players: [
            { id: Date.now().toString() + '_1', name: formData.player1Name },
            { id: Date.now().toString() + '_2', name: formData.player2Name }
          ] as [any, any]
        };
        updatedTournament.disciplines = updatedTournament.disciplines.map(d => ({
          ...d,
          levels: d.levels.map(l => ({
            ...l,
            poules: l.poules.map(p => 
              p.id === formData.pouleId ? { ...p, teams: [...p.teams, newTeam] } : p
            )
          }))
        }));
      }
    }
    
    setTournament(updatedTournament);
    await saveData(updatedTournament);
    setShowForm(false);
    setEditingItem(null);
    
    toast({
      title: editingItem ? "Item updated" : "Item added",
      description: `The ${formType} has been successfully ${editingItem ? 'updated' : 'added'}.`,
    });
  };

  const handleTeamEdit = (teamId: string) => {
    handleEditItem('team', teamId);
  };

  const handleTeamDelete = async (teamId: string) => {
    // Find the poule containing this team
    let pouleId = '';
    for (const discipline of tournament.disciplines) {
      for (const level of discipline.levels) {
        for (const poule of level.poules) {
          if (poule.teams.some(t => t.id === teamId)) {
            pouleId = poule.id;
            break;
          }
        }
      }
    }
    
    if (pouleId) {
      await handleDeleteItem('team', teamId, pouleId);
    }
  };

  const handleRemoveAllTeams = async (pouleId: string) => {
    let updatedTournament = { ...tournament };
    
    updatedTournament.disciplines = updatedTournament.disciplines.map(d => ({
      ...d,
      levels: d.levels.map(l => ({
        ...l,
        poules: l.poules.map(p => 
          p.id === pouleId ? { ...p, teams: [], matches: [] } : p
        )
      }))
    }));
    
    setTournament(updatedTournament);
    await saveData(updatedTournament);
    
    toast({
      title: "All teams removed",
      description: "All teams have been removed from the poule.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage tournament structure and settings</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleManualSave} 
              variant="default" 
              size="sm"
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={downloadData} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button 
              onClick={() => document.getElementById('file-upload')?.click()} 
              variant="outline" 
              size="sm"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Add new tournament elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => handleAddNew('discipline')}
                className="w-full justify-start"
                variant="outline"
              >
                Add New Discipline
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Statistics
              </CardTitle>
              <CardDescription>
                Tournament overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Disciplines:</span>
                  <span className="font-medium">{tournament.disciplines.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Levels:</span>
                  <span className="font-medium">
                    {tournament.disciplines.reduce((sum, d) => sum + d.levels.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Poules:</span>
                  <span className="font-medium">
                    {tournament.disciplines.reduce((sum, d) => 
                      sum + d.levels.reduce((levelSum, l) => levelSum + l.poules.length, 0), 0
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tournament Structure</CardTitle>
            <CardDescription>
              Manage disciplines, levels, poules, and teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TournamentStructure 
              disciplines={tournament.disciplines}
              isAdmin={true}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onViewTeams={handleViewTeams}
              onAddNew={handleAddNew}
            />
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <AdminForm
          type={formType}
          parentId={parentId}
          editingItem={editingItem}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          tournament={tournament}
        />
      )}

      <TeamsViewDialog
        open={showTeamsDialog}
        onOpenChange={setShowTeamsDialog}
        poule={tournament.disciplines
          .flatMap(d => d.levels)
          .flatMap(l => l.poules)
          .find(p => p.id === selectedPouleForTeams) || null}
        onEdit={handleTeamEdit}
        onDelete={handleTeamDelete}
        onRemoveAllTeams={handleRemoveAllTeams}
      />
    </div>
  );
};

export default Admin;
