Profile page with useeffect to fetch data Profile.tsx
```
  // Load user game statistics
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const [leaderboardData, userGameRuns] = await Promise.all([
          getTopGameRuns(100), // Get more data for better stats
          getUserGameRuns(user.uid, 100),
        ]);

        const userLeaderboardEntries = leaderboardData.filter(
          (entry) => entry.userId === user.uid
        );

        if (userLeaderboardEntries.length > 0) {
          const bestScore = Math.max(
            ...userLeaderboardEntries.map((entry) => entry.finalScore)
          );
          const averageScore =
            userLeaderboardEntries.reduce(
              (sum, entry) => sum + entry.finalScore,
              0
            ) / userLeaderboardEntries.length;
          const totalGames = userLeaderboardEntries.length;
          const completedGames = userLeaderboardEntries.filter(
            (entry) => entry.gameEndReason === "completed"
          ).length;
          const failedGames = userLeaderboardEntries.filter(
            (entry) => entry.gameEndReason === "failed"
          ).length;

          // Calculate average completion time
          const avgCompletionTime =
            userLeaderboardEntries.reduce(
              (sum, entry) => sum + (entry.averageCompletionTime || 0),
              0
            ) / userLeaderboardEntries.length;

          setUserStats({
            bestScore,
            averageScore,
            totalGames,
            completedGames,
            failedGames,
            avgCompletionTime,
            recentGames: userLeaderboardEntries.slice(0, 5), // Last 5 games
          });
        }
      } catch (error) {
        console.error("Error loading user stats:", error);
        toast.error("Kunne ikke laste statistikk");
      } finally {
        setLoading(false);
      }
    };

    loadUserStats();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-foreground">
          Du må være logget inn for å se denne siden.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profil</h1>
        <p className="text-muted-foreground">
          Administrer din konto og innstillinger
        </p>
      </div>

      {/* Profile Card */}
      <Card className="mb-6">
        <CardContent className="p-6 flex flex justify-between">
          <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-primary"
            />
          ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <User size={24} className="text-primary-foreground" />
            </div>
          )}
          <div>
              <h2 className="text-xl font-bold text-foreground">
              {user.displayName || "Bruker"}
            </h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Account creation date */}
          {user.metadata?.creationTime && (
            <div className="flex items-center justify-center">
              <Badge
                variant="outline"
                className="px-4 py-2 border-primary text-primary"
              >
                  {formatDate(user.metadata.creationTime)}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Statistics */}
      {loading ? (
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Loader className="w-8 h-8 text-primary animate-spin" />
            <p className="text-lg text-muted-foreground">
              Laster statistikk...
            </p>
          </div>
          <ProfileStatsSkeleton />
        </div>
      ) : userStats ? (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Spillstatistikk
          </h3>

          <ProfileStats />
        </div>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Spillstatistikk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">
            Ingen spillstatistikk tilgjengelig ennå.
          </p>
            <p className="text-sm text-center mt-2 text-muted-foreground">
            Spill et spill for å se dine statistikk her!
          </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Kontoinnstillinger</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
        <button
          onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground py-3 px-4 rounded-lg transition-colors duration-200"
        >
          <LogOut size={20} />
          <span>Logg ut</span>
        </button>
          <button
            onClick={() => handleDeleteAccount(user)}
            className="w-full flex items-center justify-center gap-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-3 px-4 rounded-lg transition-colors duration-200"
          >
            <Trash2 size={20} />
            <span>Slett konto</span>
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
```


utils.ts
```
// Get user's game runs
export const getUserGameRuns = async (userId: string, limitCount: number = 50): Promise<GameRun[]> => {
  try {
    const q = query(
      collection(db, 'users', userId, 'gameRuns'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const gameRuns: GameRun[] = [];
    
    querySnapshot.forEach((doc) => {
      gameRuns.push(convertFirestoreToGameRun(doc));
    });
    
    return gameRuns;
  } catch (error) {
    console.error('Error fetching user game runs:', error);
    return [];
  }
}; 
```


ProfileStats.tsx
```
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { StatsCard } from "@/components/stats/StatsCard";
import { PerformanceChart } from "./PerformanceChart";
import { AccuracyChart } from "./AccuracyChart";
import { TimelineChart } from "./TimelineChart";
import { calculateStats } from "@/lib/gameStatsUtils";
import { getUserGameRuns } from "@/lib/firebase-service";
import { useAuth } from "@/hooks/use-auth";
import { GameRun } from "@/stores/game-store";
import { Star } from "lucide-react";

const ProfileStats = () => {
  const { user } = useAuth();
  const [gameRuns, setGameRuns] = useState<GameRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's game runs from Firebase
  useEffect(() => {
    const fetchGameRuns = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userGameRuns = await getUserGameRuns(user.uid, 100); // Get last 100 games
        setGameRuns(userGameRuns);
      } catch (err) {
        console.error("Error fetching game runs:", err);
        setError("Failed to load game statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchGameRuns();
  }, [user?.uid]);

  // Use real data if available, otherwise show empty state
  const stats =
    gameRuns.length > 0
      ? calculateStats(gameRuns)
      : {
          userDisplayName: user?.displayName || "Player",
          gamesPlayed: 0,
          highestScore: 0,
          averageScore: 0,
          totalBombs: 0,
          correctOrderRate: 0,
          perfectRuns: 0,
          totalPlayTime: 0,
          averageSessionLength: 0,
          performanceData: [],
          accuracyData: [],
          levelPerformance: [],
          recentActivity: [],
          totalCoins: 0,
          powerModeActivations: 0,
          bonusRounds: 0,
          avgCorrectBombsPerLevel: 0,
          perfectBombRuns: 0,
          fastestRun: 0,
          averageCompletionTime: 0,
          speedRuns: 0,
        };

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="px-4 py-2">
              {stats.userDisplayName}
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              Error Loading Data
            </Badge>
          </div>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">Prøv igjen senere.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show empty state if no games played
  if (gameRuns.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="px-4 py-2">
              {stats.userDisplayName}
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              Ingen spill spilt ennå
            </Badge>
          </div>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Du har ikke spilt noen spill ennå. Start et spill for å se din
              statistikk her!
            </p>
            <p className="text-sm text-muted-foreground">
              Dine prestasjonsmålinger, diagrammer og oppnåelser vil vises når
              du fullfører ditt første spill.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Badge variant="secondary" className="px-4 py-2">
            {stats.userDisplayName}
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            {stats.gamesPlayed} Spill spilt
          </Badge>
        </div>
      </div>

      {/* OVERALL PROGRESS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Høyeste poengsum"
          value={stats.highestScore.toLocaleString()}
          icon={<Star className="w-5 h-5 text-yellow-500" />}
          trend={
            stats.averageScore > 0
              ? `+${Math.round(
                  ((stats.highestScore - stats.averageScore) /
                    stats.averageScore) *
                    100
                )}%`
              : "N/A"
          }
        />
        <StatsCard
          title="Total bomber"
          value={stats.totalBombs.toLocaleString()}
          icon={<div className="w-5 h-5 bg-red-500 rounded-full" />}
          trend={`${stats.correctOrderRate}% accuracy`}
        />
        <StatsCard
          title="Perfekte spill"
          value={stats.perfectRuns.toString()}
          icon={<div className="w-5 h-5 bg-green-500 rounded-full" />}
          trend={
            stats.gamesPlayed > 0
              ? `${Math.round(
                  (stats.perfectRuns / stats.gamesPlayed) * 100
                )}% of games`
              : "N/A"
          }
        />
        <StatsCard
          title="Total spilletid"
          value={`${Math.round(stats.totalPlayTime / 60)}h ${
            stats.totalPlayTime % 60
          }m`}
          icon={<div className="w-5 h-5 bg-blue-500 rounded-full" />}
          trend={
            stats.gamesPlayed > 0
              ? `${Math.round(stats.averageSessionLength)}m avg`
              : "N/A"
          }
        />
      </div>

      {/* PERFORMANCE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Poengprestasjon over tid</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={stats.performanceData.reverse()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nøyaktighet og fullføringsrate</CardTitle>
          </CardHeader>
          <CardContent>
            <AccuracyChart data={stats.accuracyData} />
          </CardContent>
        </Card>
      </div>

      {/* DETAILED STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Prestasjon per nivå</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.levelPerformance.map((level, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{level.mapName}</span>
                  <Badge variant="outline">
                    {level.bestScore.toLocaleString()}
                  </Badge>
                </div>
                <Progress value={level.completionRate} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{level.completionRate}% completion</span>
                  <span>{level.attempts} attempts</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nylige aktivitet</CardTitle>
          </CardHeader>
          <CardContent>
            <TimelineChart data={stats.recentActivity} />
          </CardContent>
        </Card>
      </div>

      {/* ADDITIONAL STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bombe samling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Nøyaktighet</span>
              <span className="font-bold text-green-600">
                {stats.correctOrderRate}%
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Gjennomsnittlig nøyaktighet per nivå</span>
              <span className="font-bold">{stats.avgCorrectBombsPerLevel}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Perfekte bombe 'runs'</span>
              <span className="font-bold text-blue-600">
                {stats.perfectBombRuns}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Effekt og mynter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Total mynter</span>
              <span className="font-bold text-yellow-600">
                {stats.totalCoins}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Effekt brukt</span>
              <span className="font-bold text-purple-600">
                {stats.powerModeActivations}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Bonus runder</span>
              <span className="font-bold text-orange-600">
                {stats.bonusRounds}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hastighet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Raskeste tid</span>
              <span className="font-bold text-green-600">
                {stats.fastestRun}s
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Gjennomsnittlig tid</span>
              <span className="font-bold">{stats.averageCompletionTime}s</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Hastighetspill</span>
              <span className="font-bold text-blue-600">{stats.speedRuns}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileStats;

```


Firestore record (example):
```
averageCompletionTime
0
(number)


completedLevels
0
(number)


createdAt
August 8, 2025 at 11:10:36 AM UTC+2
(timestamp)


endTime
August 8, 2025 at 11:10:35 AM UTC+2
(timestamp)


finalScore
118200
(number)


gameEndReason
"failed"
(string)



levelHistory
(array)


lives
0
(number)


multiplier
1
(number)


sessionId
"session_1754644080513_lyik42fw6"
(string)


startTime
August 8, 2025 at 11:08:00 AM UTC+2
(timestamp)


totalBombs
0
(number)


totalCoinsCollected
0
(number)


totalCorrectOrders
0
(number)


totalLevels
6
(number)


totalPowerModeActivations
0
(number)


updatedAt
August 8, 2025 at 11:10:36 AM UTC+2
(timestamp)


userDisplayName
"Jonas Andersen"
(string)


userEmail
"jonasponasanders1@gmail.com"
(string)


userId
"i9AT8JgddMh4hRFxtOA9PPRPRUN2"
```

GameStatsUtils.ts:
```

// Mock data generator and statistics calculator
export interface GameRun {
    averageCompletionTime: number;
    completedLevels: number;
    createdAt: Date;
    endTime: Date;
    finalScore: number;
    gameEndReason: string;
    levelHistory: LevelData[];
    sessionId: string;
    startTime: Date;
    totalBombs: number;
    totalCoinsCollected: number;
    totalCorrectOrders: number;
    totalLevels: number;
    totalPowerModeActivations: number;
    updatedAt: Date;
    userDisplayName: string;
    userEmail: string;
    userId: string;
  }
  
  export interface LevelData {
    bonus: number;
    correctOrderCount: number;
    hasBonus: boolean;
    level: number;
    mapName: string;
    score: number;
    totalBombs: number;
    lives: number;
    multiplier: number;
  }
  
  // Generate mock data
  export const mockGameData: GameRun[] = [
    {
      averageCompletionTime: 43,
      completedLevels: 1,
      createdAt: new Date('2025-07-01T01:56:29Z'),
      endTime: new Date('2025-07-01T01:57:12Z'),
      finalScore: 9100,
      gameEndReason: "failed",
      levelHistory: [
        {
          bonus: 0,
          correctOrderCount: 17,
          hasBonus: false,
          level: 1,
          mapName: "Startup Norge",
          score: 8600,
          totalBombs: 23,
          lives: 0,
          multiplier: 1,
        }
      ],
      sessionId: "session_1751327789913_sbt2vrt7z",
      startTime: new Date('2025-07-01T01:56:29Z'),
      totalBombs: 23,
      totalCoinsCollected: 0,
      totalCorrectOrders: 17,
      totalLevels: 7,
      totalPowerModeActivations: 0,
      updatedAt: new Date('2025-07-01T01:57:12Z'),
      userDisplayName: "Jonas Andersen",
      userEmail: "jonasponasanders1@gmail.com",
      userId: "ZbS93RhWhucV35vLnxKYqQTYyYk1"
    },
    // Additional mock games
    {
      averageCompletionTime: 52,
      completedLevels: 3,
      createdAt: new Date('2025-06-30T15:20:00Z'),
      endTime: new Date('2025-06-30T15:22:36Z'),
      finalScore: 15400,
      gameEndReason: "completed",
      levelHistory: [
        {
          bonus: 500,
          correctOrderCount: 19,
          hasBonus: true,
          level: 1,
          mapName: "Techno Valley",
          score: 5200,
          totalBombs: 20,
          lives: 2,
          multiplier: 1.2,
        },
        {
          bonus: 300,
          correctOrderCount: 15,
          hasBonus: true,
          level: 2,
          mapName: "Crystal Caves",
          score: 4800,
          totalBombs: 18,
          lives: 1,
          multiplier: 1.1,
        },
        {
          bonus: 0,
          correctOrderCount: 22,
          hasBonus: false,
          level: 3,
          mapName: "Neon City",
          score: 5400,
          totalBombs: 25,
          lives: 3,
          multiplier: 1.0,
        }
      ],
      sessionId: "session_1751227789913_abc123",
      startTime: new Date('2025-06-30T15:20:00Z'),
      totalBombs: 63,
      totalCoinsCollected: 12,
      totalCorrectOrders: 56,
      totalLevels: 3,
      totalPowerModeActivations: 2,
      updatedAt: new Date('2025-06-30T15:22:36Z'),
      userDisplayName: "Jonas Andersen",
      userEmail: "jonasponasanders1@gmail.com",
      userId: "ZbS93RhWhucV35vLnxKYqQTYyYk1"
    },
    {
      averageCompletionTime: 38,
      completedLevels: 2,
      createdAt: new Date('2025-06-29T19:45:00Z'),
      endTime: new Date('2025-06-29T19:46:16Z'),
      finalScore: 12300,
      gameEndReason: "failed",
      levelHistory: [
        {
          bonus: 200,
          correctOrderCount: 21,
          hasBonus: true,
          level: 1,
          mapName: "Arctic Base",
          score: 6100,
          totalBombs: 24,
          lives: 1,
          multiplier: 1.3,
        },
        {
          bonus: 0,
          correctOrderCount: 16,
          hasBonus: false,
          level: 2,
          mapName: "Desert Storm",
          score: 6200,
          totalBombs: 22,
          lives: 0,
          multiplier: 1.0,
        }
      ],
      sessionId: "session_1751127789913_def456",
      startTime: new Date('2025-06-29T19:45:00Z'),
      totalBombs: 46,
      totalCoinsCollected: 8,
      totalCorrectOrders: 37,
      totalLevels: 5,
      totalPowerModeActivations: 1,
      updatedAt: new Date('2025-06-29T19:46:16Z'),
      userDisplayName: "Jonas Andersen",
      userEmail: "jonasponasanders1@gmail.com",
      userId: "ZbS93RhWhucV35vLnxKYqQTYyYk1"
    }
  ];
  
  export const calculateStats = (gameData: GameRun[]) => {
    const totalGames = gameData.length;
    const totalBombs = gameData.reduce((sum, game) => sum + game.totalBombs, 0);
    const totalCorrectOrders = gameData.reduce((sum, game) => sum + game.totalCorrectOrders, 0);
    const totalPlayTime = gameData.reduce((sum, game) => {
      const duration = (game.endTime.getTime() - game.startTime.getTime()) / 1000 / 60; // minutes
      return sum + duration;
    }, 0);
  
    const highestScore = Math.max(...gameData.map(game => game.finalScore));
    const averageScore = gameData.reduce((sum, game) => sum + game.finalScore, 0) / totalGames;
    const correctOrderRate = Math.round((totalCorrectOrders / totalBombs) * 100);
    const perfectRuns = gameData.filter(game => 
      game.levelHistory.every(level => level.correctOrderCount === level.totalBombs)
    ).length;
  
    // Performance data for chart
    const performanceData = gameData.map((game, index) => ({
      game: index + 1,
      score: game.finalScore,
      date: game.createdAt.toLocaleDateString()
    }));
  
    // Accuracy data for chart
    const levelNames = [...new Set(gameData.flatMap(game => 
      game.levelHistory.map(level => level.mapName)
    ))];
    
    const accuracyData = levelNames.map(levelName => {
      const levelAttempts = gameData.flatMap(game => 
        game.levelHistory.filter(level => level.mapName === levelName)
      );
      const accuracy = levelAttempts.length > 0 
        ? Math.round((levelAttempts.reduce((sum, level) => 
            sum + (level.correctOrderCount / level.totalBombs), 0) / levelAttempts.length) * 100)
        : 0;
      
      return {
        level: levelName,
        accuracy,
        completion: Math.round((levelAttempts.filter(level => 
          level.correctOrderCount === level.totalBombs).length / levelAttempts.length) * 100)
      };
    });
  
    // Level performance
    const levelPerformance = levelNames.map(levelName => {
      const levelAttempts = gameData.flatMap(game => 
        game.levelHistory.filter(level => level.mapName === levelName)
      );
      const bestScore = Math.max(...levelAttempts.map(level => level.score));
      const completionRate = Math.round((levelAttempts.filter(level => 
        level.correctOrderCount === level.totalBombs).length / levelAttempts.length) * 100);
      
      return {
        mapName: levelName,
        bestScore,
        completionRate,
        attempts: levelAttempts.length
      };
    });
  
    // Recent activity for timeline
    const recentActivity = gameData.slice(-7).map(game => ({
      date: game.createdAt.toLocaleDateString(),
      games: 1,
      score: game.finalScore
    }));
  
    return {
      userDisplayName: gameData[0]?.userDisplayName || "Player",
      gamesPlayed: totalGames,
      highestScore,
      averageScore: Math.round(averageScore),
      totalBombs,
      correctOrderRate,
      perfectRuns,
      totalPlayTime: Math.round(totalPlayTime),
      averageSessionLength: Math.round(totalPlayTime / totalGames),
      performanceData,
      accuracyData,
      levelPerformance,
      recentActivity,
      totalCoins: gameData.reduce((sum, game) => sum + game.totalCoinsCollected, 0),
      powerModeActivations: gameData.reduce((sum, game) => sum + game.totalPowerModeActivations, 0),
      bonusRounds: gameData.reduce((sum, game) => 
        sum + game.levelHistory.filter(level => level.hasBonus).length, 0),
      avgCorrectBombsPerLevel: Math.round(totalCorrectOrders / gameData.reduce((sum, game) => 
        sum + game.levelHistory.length, 0)),
      perfectBombRuns: gameData.reduce((sum, game) => 
        sum + game.levelHistory.filter(level => level.correctOrderCount === level.totalBombs).length, 0),
      fastestRun: Math.min(...gameData.map(game => game.averageCompletionTime)),
      averageCompletionTime: Math.round(gameData.reduce((sum, game) => 
        sum + game.averageCompletionTime, 0) / totalGames),
      speedRuns: gameData.filter(game => game.averageCompletionTime < 45).length
    };
  };
  
```