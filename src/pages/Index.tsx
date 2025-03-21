
import { useEffect, useState } from 'react';
import { Tournament } from '@/types/tournament';
import { loadTournament, initializeTournament } from '@/utils/tournamentUtils';
import TournamentStructure from '@/components/TournamentStructure';
import NavBar from '@/components/NavBar';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize tournament data if it doesn't exist
    try {
      initializeTournament();
      
      // Load tournament data
      const data = loadTournament();
      setTournament(data);
    } catch (err) {
      console.error("Error loading tournament data:", err);
      setError("Failed to load tournament data");
      toast({
        title: "Error loading data",
        description: "There was a problem loading the tournament data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container px-4 pt-24 pb-16 mx-auto">
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Tournament Manager</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            View all disciplines, levels, and poules in the tournament. Click on a poule to see matches and scores.
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse flex space-x-2">
              <div className="h-3 w-3 bg-primary rounded-full"></div>
              <div className="h-3 w-3 bg-primary rounded-full"></div>
              <div className="h-3 w-3 bg-primary rounded-full"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </div>
        ) : tournament ? (
          <TournamentStructure disciplines={tournament.disciplines || []} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tournament data found.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
