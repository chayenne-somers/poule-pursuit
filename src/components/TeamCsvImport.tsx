
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseTeamCsv, convertCsvToTeams, getTeamCsvTemplate } from "@/utils/csvUtils";
import { Team } from "@/types/tournament";
import { FileUp, Download, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TeamCsvImportProps {
  poules: { id: string; name: string; path: string }[];
  onImportComplete: (pouleId: string, teams: Team[]) => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TeamCsvImport: React.FC<TeamCsvImportProps> = ({
  poules,
  onImportComplete,
  onCancel
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
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="poule-select">Select Poule</Label>
          <select 
            id="poule-select" 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedPouleId}
            onChange={(e) => setSelectedPouleId(e.target.value)}
          >
            <option value="">Choose a poule</option>
            {poules.map((poule) => (
              <option key={poule.id} value={poule.id}>
                {poule.path} - {poule.name}
              </option>
            ))}
          </select>
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

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleImport} disabled={!csvFile || !selectedPouleId || !previewData || isLoading}>
          {isLoading ? "Importing..." : "Import Teams"}
        </Button>
      </div>
    </div>
  );
};

export default TeamCsvImport;
