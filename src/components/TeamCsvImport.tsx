
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseTeamCsv, convertCsvWithPoulesToTeams, getTeamCsvTemplate } from "@/utils/csvUtils";
import { Team } from "@/types/tournament";
import { FileUp, Download, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamCsvImportProps {
  onImportComplete: (teamsWithPoules: {pouleId: string, teams: Team[]}[]) => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  poules: { id: string; name: string; path: string }[];
}

const TeamCsvImport: React.FC<TeamCsvImportProps> = ({
  poules,
  onImportComplete,
  onCancel
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{ player1Name: string; player2Name: string; pouleName: string }[] | null>(null);
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
      try {
        const parsedData = parseTeamCsv(content);
        setPreviewData(parsedData);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        setPreviewData(null);
        toast({
          title: "Error parsing CSV",
          description: "Please check the file format and try again",
          variant: "destructive"
        });
      }
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
    if (!csvFile || !poules || poules.length === 0) {
      toast({
        title: "Missing information",
        description: "Please upload a CSV file",
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

      const teamsWithPoules = convertCsvWithPoulesToTeams(parsedData, poules);
      
      if (teamsWithPoules.length === 0) {
        toast({
          title: "No valid teams found",
          description: "Please check that poule names in the CSV match existing poules",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      onImportComplete(teamsWithPoules);
      
      toast({
        title: "Teams imported successfully",
        description: `${parsedData.length} teams have been imported`,
      });
      
      // Reset state
      setCsvFile(null);
      setPreviewData(null);
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

  const getPouleNameFromPath = (pouleName: string): string => {
    // Find the poule display path
    const poule = poules.find(p => p.name === pouleName);
    if (!poule) return pouleName;
    return `${poule.path} - ${poule.name}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
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
            The CSV must have columns for player1, player2, and poule
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
                  {team.player1Name} & {team.player2Name} → {getPouleNameFromPath(team.pouleName)}
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
        <Button onClick={handleImport} disabled={!csvFile || !previewData || isLoading}>
          {isLoading ? "Importing..." : "Import Teams"}
        </Button>
      </div>
    </div>
  );
};

export default TeamCsvImport;
