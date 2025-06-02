import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminForm from '@/components/AdminForm';
import TournamentStructure from '@/components/TournamentStructure';
import { Tournament, Discipline, Level, Poule, Team } from '@/types/tournament';
import { loadTournamentData, saveTournamentData } from '@/utils/tournamentUtils';
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Settings, Users } from 'lucide-react';
import TeamsViewDialog from '@/components/TeamsViewDialog';

const Admin = () => {
  const [tournament, setTournament] = useState<Tournament>(loadTournamentData());
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formType, setFormType] = useState<'discipline' | 'level' | 'poule' | 'team'>('discipline');
  const [parentId, setParentId] = useState<string>('');
  const [showTeamsDialog, setShowTeamsDialog] = useState(false);
  const [selectedPouleForTeams, setSelectedPouleForTeams] = useState<string>('');
  const { toast } = useToast();

  const downloadData = () => {
    const dataStr = JSON.stringify(tournament, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'tournament-data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const uploadedData = JSON.parse(e.target?.result as string);
          setTournament(uploadedData);
          saveTournamentData(uploadedData);
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
    }
    
    setEditingItem(itemToEdit);
    setShowForm(true);
  };

  const handleDeleteItem = (type: 'discipline' | 'level' | 'poule' | 'team', id: string, parentId?: string) => {
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
    }
    
    setTournament(updatedTournament);
    saveTournamentData(updatedTournament);
    
    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted`,
      description: `The ${type} has been successfully deleted.`,
    });
  };

  const handleViewTeams = (pouleId: string) => {
    setSelectedPouleForTeams(pouleId);
    setShowTeamsDialog(true);
  };

  const handleFormSubmit = (formData: any) => {
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
      }
    }
    
    setTournament(updatedTournament);
    saveTournamentData(updatedTournament);
    setShowForm(false);
    setEditingItem(null);
    
    toast({
      title: editingItem ? "Item updated" : "Item added",
      description: `The ${formType} has been successfully ${editingItem ? 'updated' : 'added'}.`,
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
                onClick={() => {
                  setFormType('discipline');
                  setEditingItem(null);
                  setShowForm(true);
                }}
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
              tournament={tournament}
              isAdmin={true}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onViewTeams={handleViewTeams}
            />
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <AdminForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSubmit={handleFormSubmit}
          type={formType}
          editingItem={editingItem}
          disciplines={tournament.disciplines}
          parentId={parentId}
        />
      )}

      <TeamsViewDialog
        isOpen={showTeamsDialog}
        onClose={() => setShowTeamsDialog(false)}
        pouleId={selectedPouleForTeams}
        tournament={tournament}
        onUpdateTournament={(updatedTournament) => {
          setTournament(updatedTournament);
          saveTournamentData(updatedTournament);
        }}
      />
    </div>
  );
};

export default Admin;
