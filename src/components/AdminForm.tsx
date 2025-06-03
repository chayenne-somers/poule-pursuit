
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tournament } from '@/types/tournament';

interface AdminFormProps {
  type: 'discipline' | 'level' | 'poule' | 'team';
  parentId?: string;
  editingItem?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  tournament: Tournament;
}

const AdminForm: React.FC<AdminFormProps> = ({
  type,
  parentId,
  editingItem,
  onSubmit,
  onCancel,
  tournament
}) => {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      if (type === 'team') {
        setFormData({
          player1Name: editingItem.players[0]?.name || '',
          player2Name: editingItem.players[1]?.name || ''
        });
      } else {
        setFormData({
          name: editingItem.name || ''
        });
      }
    } else {
      if (type === 'team') {
        setFormData({
          player1Name: '',
          player2Name: '',
          pouleId: parentId || ''
        });
      } else {
        setFormData({
          name: '',
          parentId: parentId || ''
        });
      }
    }
  }, [editingItem, type, parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    const action = editingItem ? 'Edit' : 'Add';
    return `${action} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  };

  const getPoulesForSelect = () => {
    const poules: { value: string; label: string }[] = [];
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

  const getDisciplinesForSelect = () => {
    return tournament.disciplines.map(d => ({
      value: d.id,
      label: d.name
    }));
  };

  const getLevelsForSelect = (disciplineId: string) => {
    const discipline = tournament.disciplines.find(d => d.id === disciplineId);
    return discipline?.levels.map(l => ({
      value: l.id,
      label: `Level ${l.name}`
    })) || [];
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'team' ? (
            <>
              {!editingItem && (
                <div>
                  <label className="text-sm font-medium">Select Poule</label>
                  <Select 
                    value={formData.pouleId || ''} 
                    onValueChange={(value) => setFormData({ ...formData, pouleId: value })}
                    required
                  >
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
              )}
              
              <div>
                <label className="text-sm font-medium">Player 1 Name</label>
                <Input 
                  value={formData.player1Name || ''}
                  onChange={(e) => setFormData({ ...formData, player1Name: e.target.value })}
                  placeholder="Enter player 1 name"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Player 2 Name</label>
                <Input 
                  value={formData.player2Name || ''}
                  onChange={(e) => setFormData({ ...formData, player2Name: e.target.value })}
                  placeholder="Enter player 2 name"
                  required
                />
              </div>
            </>
          ) : (
            <>
              {type === 'level' && !editingItem && (
                <div>
                  <label className="text-sm font-medium">Select Discipline</label>
                  <Select 
                    value={formData.parentId || ''} 
                    onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDisciplinesForSelect().map((discipline) => (
                        <SelectItem key={discipline.value} value={discipline.value}>
                          {discipline.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {type === 'poule' && !editingItem && (
                <>
                  <div>
                    <label className="text-sm font-medium">Select Discipline</label>
                    <Select 
                      value={formData.disciplineId || ''} 
                      onValueChange={(value) => setFormData({ ...formData, disciplineId: value, parentId: '' })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Discipline" />
                      </SelectTrigger>
                      <SelectContent>
                        {getDisciplinesForSelect().map((discipline) => (
                          <SelectItem key={discipline.value} value={discipline.value}>
                            {discipline.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Select Level</label>
                    <Select 
                      value={formData.parentId || ''} 
                      onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                      disabled={!formData.disciplineId}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.disciplineId && getLevelsForSelect(formData.disciplineId).map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <div>
                <label className="text-sm font-medium">
                  {type.charAt(0).toUpperCase() + type.slice(1)} Name
                </label>
                <Input 
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`Enter ${type} name`}
                  required
                />
              </div>
            </>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (editingItem ? 'Update' : 'Add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminForm;
