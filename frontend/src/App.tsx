import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import { api } from './services/api';
import { Team } from './types';
import { Navbar } from './components/Navbar';
import { AuthPage } from './components/AuthPage';
import { LiveScorecard } from './components/LiveScorecard';
import { MyTeamsGrid } from './components/MyTeamsGrid';
import { DiscoverTeams } from './components/DiscoverTeams';
import { NotificationsPanel } from './components/NotificationsPanel';
import { FieldFilterModal } from './components/FieldFilterModal';
import { StatsCharts } from './components/StatsCharts';
import { AdminPanelModal } from './components/AdminPanelModal';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { refreshNotifications, lastTeamUpdateNotification } = useSocket();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [recentlyUpdatedTeamId, setRecentlyUpdatedTeamId] = useState<string | null>(null);

  // Field Filter Modal state
  const [selectedTeamForFields, setSelectedTeamForFields] = useState<Team | null>(null);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);

  const fetchTeams = async () => {
    if (!user) return;
    setLoadingTeams(true);
    try {
      const data = await api.getTeams();
      setTeams(data);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTeams();
    }
  }, [user]);

  // Dynamically update team stats when Change Stream push notification arrives
  useEffect(() => {
    if (lastTeamUpdateNotification && lastTeamUpdateNotification.teamId) {
      const updatedTeamId =
        typeof lastTeamUpdateNotification.teamId === 'string'
          ? lastTeamUpdateNotification.teamId
          : lastTeamUpdateNotification.teamId._id;

      if (updatedTeamId) {
        setTeams((prevTeams) =>
          prevTeams.map((team) => {
            if (team._id === updatedTeamId) {
              const updated = { ...team };
              lastTeamUpdateNotification.changes.forEach((c) => {
                (updated as any)[c.field] = c.newValue;
              });
              return updated;
            }
            return team;
          })
        );

        setRecentlyUpdatedTeamId(updatedTeamId);
        const timer = setTimeout(() => {
          setRecentlyUpdatedTeamId(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastTeamUpdateNotification]);

  const handleSubscribe = async (teamId: string) => {
    try {
      await api.subscribeTeam(teamId, 'ALL');
      await fetchTeams();
    } catch (err) {
      console.error('Subscribe error:', err);
    }
  };

  const handleUnsubscribe = async (teamId: string) => {
    try {
      await api.unsubscribeTeam(teamId);
      await fetchTeams();
    } catch (err) {
      console.error('Unsubscribe error:', err);
    }
  };

  const handleOpenFieldModal = (team: Team) => {
    setSelectedTeamForFields(team);
    setIsFieldModalOpen(true);
  };

  const handleSaveFields = async (teamId: string, fields: 'ALL' | string[]) => {
    await api.updateSubscription(teamId, fields);
    await fetchTeams();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-500 font-sans">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-9 h-9 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading IPL Match Centre...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans antialiased">
      {/* Top Navigation */}
      <Navbar
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Live Match Scorecard Stream */}
        <LiveScorecard />

        {/* My Subscribed Teams */}
        <MyTeamsGrid
          teams={teams}
          loading={loadingTeams}
          recentlyUpdatedTeamId={recentlyUpdatedTeamId}
          onManageFields={handleOpenFieldModal}
          onUnsubscribe={handleUnsubscribe}
          onQuickUpdateField={handleSaveFields}
        />

        {/* Statistical Insights & Charts */}
        <StatsCharts teams={teams} loading={loadingTeams} />

        {/* All 10 IPL Franchises */}
        <DiscoverTeams
          teams={teams}
          loading={loadingTeams}
          recentlyUpdatedTeamId={recentlyUpdatedTeamId}
          onSubscribe={handleSubscribe}
          onUnsubscribe={handleUnsubscribe}
          onManageFields={handleOpenFieldModal}
        />
      </main>

      {/* Slide-out Notifications Panel */}
      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Field-level Subscription Filter Modal */}
      <FieldFilterModal
        team={selectedTeamForFields}
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        onSave={handleSaveFields}
      />

      {/* Admin Test & Mutation Simulator Modal */}
      <AdminPanelModal
        teams={teams}
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onTeamUpdated={fetchTeams}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/90 bg-white py-6 text-center text-xs text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>IPL Match Centre & Real-time Notification Platform</span>
          <span className="font-mono text-[11px] text-slate-400">
            Powered by MongoDB Atlas Change Streams & Raw WebSocket
          </span>
        </div>
      </footer>
    </div>
  );
};
