
import { useEffect, useState } from 'react';
import { Tournament } from '@/types/tournament';
import { loadTournament, initializeTournament, saveTournament } from '@/utils/tournamentUtils';
import TournamentStructure from '@/components/TournamentStructure';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/hooks/use-auth';

const Index = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isSpectator } = useAuth();

  useEffect(() => {
    const fetchTournament = async () => {
      setIsLoading(true);
      
      try {
        // Initialize tournament data if it doesn't exist
        const newTournament = initializeTournament();
        
        // Load tournament data
        const data = await loadTournament();
        
        // Ensure we have a valid tournament structure
        if (data && data.disciplines) {
          setTournament(data);
        } else {
          // If we don't have valid data, save and use the initialized tournament
          if (user) {
            await saveTournament(newTournament);
          }
          setTournament(newTournament);
        }
      } catch (error) {
        console.error("Error loading tournament:", error);
        // Fallback to initialized tournament
        const newTournament = initializeTournament();
        setTournament(newTournament);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Allow both authenticated users and spectators to view the tournament
    if (user || isSpectator) {
      fetchTournament();
    }
  }, [user, isSpectator]);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container px-4 pt-24 pb-16 mx-auto">
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Tournament {isSpectator ? 'Overview' : 'Manager'}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {isSpectator 
              ? 'View all disciplines, levels, and poules in the tournament. Click on a poule to see matches and scores.'
              : 'View all disciplines, levels, and poules in the tournament. Click on a poule to see matches and scores.'
            }
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
          <TournamentStructure 
            disciplines={tournament.disciplines} 
            isAdmin={false} // Spectators never have admin privileges
          />
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
