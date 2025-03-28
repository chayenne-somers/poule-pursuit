
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseTeamCsv, convertCsvToTeams, getTeamCsvTemplate } from "@/utils/csvUtils";
import { Poule, Team } from "@/types/tournament";
import { generateMatches } from "@/utils/tournamentUtils";
import { FileUp, Download, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TeamCsvImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poules: { id: string; name: string; path: string }[];
  onImportComplete: (pouleId: string, teams: Team[]) => void;
}

const TeamCsvImport: React.FC<TeamCsvImportProps> = ({
  open,
  onOpenChange,
  poules,
  onImportComplete
}) => {
  const [selectedPouleId, setSelectedPouleId] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{ player1Name: string; player2Name: string }[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setCsvFile(null);
      setPreviewData(null);
      return;
    }

    setCsvFile(file);
    
    // Parse the file for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsedData = parseTeamCsv(content);
      setPreviewData(parsedData);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = getTeamCsvTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teams_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!csvFile || !selectedPouleId) {
      toast({
        title: "Missing information",
        description: "Please select a poule and upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const content = await csvFile.text();
      const parsedData = parseTeamCsv(content);
      
      if (!parsedData || parsedData.length === 0) {
        toast({
          title: "Invalid CSV format",
          description: "Please check the file format and try again",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const teams = convertCsvToTeams(parsedData);
      onImportComplete(selectedPouleId, teams);
      
      toast({
        title: "Teams imported successfully",
        description: `${teams.length} teams have been added to the selected poule`,
      });
      
      // Reset state
      setCsvFile(null);
      setPreviewData(null);
      setSelectedPouleId("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred while importing teams",
        variant: "destructive"
      });
      console.error("Import error:", error);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Teams from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with team data to import into a poule.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="poule-select">Select Poule</Label>
            <Select value={selectedPouleId} onValueChange={setSelectedPouleId}>
              <SelectTrigger id="poule-select">
                <SelectValue placeholder="Choose a poule" />
              </SelectTrigger>
              <SelectContent>
                {poules.map((poule) => (
                  <SelectItem key={poule.id} value={poule.id}>
                    {poule.path} - {poule.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                title="Download Template"
                onClick={downloadTemplate}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The CSV must have columns for player1 and player2
            </p>
          </div>

          {previewData && (
            <div className="space-y-2 border rounded-md p-3">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Preview ({previewData.length} teams)
              </h4>
              <div className="max-h-32 overflow-y-auto text-xs">
                {previewData.slice(0, 5).map((team, index) => (
                  <div key={index} className="py-1 border-b border-dashed last:border-0">
                    {team.player1Name} & {team.player2Name}
                  </div>
                ))}
                {previewData.length > 5 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    ...and {previewData.length - 5} more teams
                  </p>
                )}
              </div>
            </div>
          )}

          {csvFile && !previewData && (
            <div className="text-sm text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Invalid CSV format. Please check the file and try again.
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!csvFile || !selectedPouleId || !previewData || isLoading}>
            {isLoading ? "Importing..." : "Import Teams"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamCsvImport;
