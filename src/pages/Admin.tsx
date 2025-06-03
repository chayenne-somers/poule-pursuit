import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminForm from '@/components/AdminForm';
import TournamentStructure from '@/components/TournamentStructure';
import { Tournament } from '@/types/tournament';
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Settings, Users, Save } from 'lucide-react';
import TeamsViewDialog from '@/components/TeamsViewDialog';
import {
  loadTournamentFromDB,
  createDiscipline,
  updateDiscipline,
  deleteDiscipline,
  createLevel,
  updateLevel,
  deleteLevel,
  createPoule,
  updatePoule,
  deletePoule,
  createTeam,
  updateTeam,
  deleteTeam,
  removeAllTeamsFromPoule
} from '@/utils/supabaseUtils';

const Admin = () => {
  const [tournament, setTournament] = useState<Tournament>({ disciplines: [] });
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formType, setFormType] = useState<'discipline' | 'level' | 'poule' | 'team'>('discipline');
  const [parentId, setParentId] = useState<string>('');
  const [showTeamsDialog, setShowTeamsDialog] = useState(false);
  const [selectedPouleForTeams, setSelectedPouleForTeams] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load tournament data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const tournamentData = await loadTournamentFromDB();
        setTournament(tournamentData);
      } catch (error) {
        console.error('Error loading tournament data:', error);
        toast({
          title: "Error loading data",
          description: "Failed to load tournament data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const refreshTournamentData = async () => {
    try {
      const tournamentData = await loadTournamentFromDB();
      setTournament(tournamentData);
    } catch (error) {
      console.error('Error refreshing tournament data:', error);
      toast({
        title: "Error refreshing data",
        description: "Failed to refresh tournament data",
        variant: "destructive"
      });
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
    try {
      setLoading(true);
      
      if (type === 'discipline') {
        await deleteDiscipline(id);
      } else if (type === 'level') {
        await deleteLevel(id);
      } else if (type === 'poule') {
        await deletePoule(id);
      } else if (type === 'team') {
        await deleteTeam(id);
      }
      
      await refreshTournamentData();
      
      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted`,
        description: `The ${type} has been successfully deleted.`,
      });
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to delete ${type}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTeams = (pouleId: string) => {
    setSelectedPouleForTeams(pouleId);
    setShowTeamsDialog(true);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      setLoading(true);
      
      if (editingItem) {
        // Update existing item
        if (formType === 'discipline') {
          await updateDiscipline(editingItem.id, formData.name);
        } else if (formType === 'level') {
          await updateLevel(editingItem.id, formData.name);
        } else if (formType === 'poule') {
          await updatePoule(editingItem.id, formData.name);
        } else if (formType === 'team') {
          await updateTeam(editingItem.id, formData.player1Name, formData.player2Name);
        }
      } else {
        // Add new item
        if (formType === 'discipline') {
          await createDiscipline(formData.name);
        } else if (formType === 'level') {
          await createLevel(formData.parentId, formData.name);
        } else if (formType === 'poule') {
          await createPoule(formData.parentId, formData.name);
        } else if (formType === 'team') {
          await createTeam(formData.pouleId, formData.player1Name, formData.player2Name);
        }
      }
      
      await refreshTournamentData();
      setShowForm(false);
      setEditingItem(null);
      
      toast({
        title: editingItem ? "Item updated" : "Item added",
        description: `The ${formType} has been successfully ${editingItem ? 'updated' : 'added'}.`,
      });
    } catch (error) {
      console.error(`Error ${editingItem ? 'updating' : 'creating'} ${formType}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${editingItem ? 'update' : 'create'} ${formType}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeamEdit = (teamId: string) => {
    handleEditItem('team', teamId);
  };

  const handleTeamDelete = async (teamId: string) => {
    await handleDeleteItem('team', teamId);
  };

  const handleRemoveAllTeams = async (pouleId: string) => {
    try {
      setLoading(true);
      await removeAllTeamsFromPoule(pouleId);
      await refreshTournamentData();
      
      toast({
        title: "All teams removed",
        description: "All teams have been removed from the poule.",
      });
    } catch (error) {
      console.error('Error removing all teams:', error);
      toast({
        title: "Error",
        description: "Failed to remove all teams",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
          // Note: File upload functionality would need to be implemented to work with the new DB structure
          toast({
            title: "Import notice",
            description: "File import needs to be updated for the new database structure",
            variant: "destructive"
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
              onClick={refreshTournamentData} 
              variant="default" 
              size="sm"
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Loading...' : 'Refresh Data'}
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
                disabled={loading}
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
            {loading ? (
              <div className="text-center py-8">Loading tournament data...</div>
            ) : (
              <TournamentStructure 
                disciplines={tournament.disciplines}
                isAdmin={true}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
                onViewTeams={handleViewTeams}
                onAddNew={handleAddNew}
              />
            )}
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
