export interface User {
  id: string;
  username: string;
  role: 'user' | 'admin';
}

export interface Team {
  _id: string;
  name: string;
  short: string;
  captain: string;
  headCoach: string;
  homeGround: string;
  titles: number;
  wins: number;
  losses: number;
  points: number;
  isSubscribed?: boolean;
  subscribedFields?: 'ALL' | string[] | null;
}

export interface FieldChange {
  field: string;
  newValue: any;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  teamId: {
    _id: string;
    name: string;
    short: string;
    captain?: string;
    headCoach?: string;
    homeGround?: string;
    titles?: number;
    wins?: number;
    losses?: number;
    points?: number;
  };
  changes: FieldChange[];
  read: boolean;
  createdAt: string;
}

export interface Batter {
  name: string;
  runs: number;
  balls: number;
  onStrike: boolean;
}

export interface Bowler {
  name: string;
  overs: number;
  runsConceded: number;
  wickets: number;
}

export interface LiveMatch {
  matchId: string;
  battingTeam: string;
  bowlingTeam: string;
  runs: number;
  wickets: number;
  oversBowled: string;
  totalOvers: number;
  batters: Batter[];
  bowler: Bowler;
  currentOverBalls: string[];
  updatedAt: string;
}
