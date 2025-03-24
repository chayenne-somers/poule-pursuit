
import { useEffect, useState } from 'react';
import { Tournament } from '@/types/tournament';
import { loadTournament, initializeTournament } from '@/utils/tournamentUtils';
import TournamentStructure from '@/components/TournamentStructure';
import NavBar from '@/components/NavBar';

const Index = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize tournament data if it doesn't exist
    initializeTournament();
    
    // Load tournament data
    const data = loadTournament();
    
    // Ensure we have a valid tournament structure
    if (data && data.disciplines) {
      setTournament(data);
    } else {
      // If we don't have valid data, reinitialize
      initializeTournament();
      setTournament(loadTournament());
    }
    
    setIsLoading(false);
  }, []);

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
        ) : tournament && tournament.disciplines ? (
          <TournamentStructure disciplines={tournament.disciplines} />
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
