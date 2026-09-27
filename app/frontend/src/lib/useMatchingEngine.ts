import { useState, useEffect, useCallback, useRef } from 'react';
import {
  matchingEngine,
  MatchingEngine,
  SwipeDirection,
  SwipeEntityType,
  SwipeRecord,
  MatchRecord,
  MatchNotification,
  SeekerProfile,
  VacancyProfile,
  WeightConfig,
  DEFAULT_WEIGHTS,
} from './matching-engine';

export interface UseMatchingEngineReturn {
  // Swipe actions
  swipe: (targetId: string, targetType: SwipeEntityType, direction: SwipeDirection, vacancyId?: string) => { match: MatchRecord | null } | null;
  undoLastSwipe: () => SwipeRecord | null;
  undoLastPass: () => SwipeRecord | null;
  canUndoPass: () => boolean;
  hasSwipedOn: (targetId: string) => boolean;

  // Match data
  matches: MatchRecord[];
  swipeHistory: SwipeRecord[];
  notifications: MatchNotification[];
  unreadCount: number;

  // Scoring
  calculateScore: (seeker: SeekerProfile, vacancy: VacancyProfile) => number;
  getRecommendedJobs: (seeker: SeekerProfile, vacancies: VacancyProfile[]) => { vacancy: VacancyProfile; score: number }[];
  getRecommendedCandidates: (vacancy: VacancyProfile, seekers: SeekerProfile[]) => { seeker: SeekerProfile; score: number }[];

  // Configuration
  weights: WeightConfig;
  updateWeights: (weights: Partial<WeightConfig>) => void;

  // Notifications
  markNotificationRead: (id: string) => void;

  // Stats
  stats: {
    totalSwipes: number;
    rightSwipes: number;
    leftSwipes: number;
    activeMatches: number;
    expiredMatches: number;
    matchRate: string;
  };
}

/**
 * React hook for the MatchMe matching engine
 */
export function useMatchingEngine(
  userId: string,
  userType: SwipeEntityType
): UseMatchingEngineReturn {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<SwipeRecord[]>([]);
  const [notifications, setNotifications] = useState<MatchNotification[]>([]);
  const [weights, setWeights] = useState<WeightConfig>(DEFAULT_WEIGHTS);
  const engineRef = useRef<MatchingEngine>(matchingEngine);

  // Load initial data
  useEffect(() => {
    setMatches(engineRef.current.getMatches(userId, userType));
    setSwipeHistory(engineRef.current.getSwipeHistory(userId));
    setNotifications(engineRef.current.getNotifications(userId));
    setWeights(engineRef.current.getWeights());
  }, [userId, userType]);

  // Subscribe to real-time notifications
  useEffect(() => {
    const unsubscribe = engineRef.current.subscribe(userId, (notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (notification.type === 'new_match') {
        setMatches(engineRef.current.getMatches(userId, userType));
      }
    });
    return unsubscribe;
  }, [userId, userType]);

  // Periodically check for expired matches
  useEffect(() => {
    const interval = setInterval(() => {
      const expired = engineRef.current.expireMatches();
      if (expired.length > 0) {
        setMatches(engineRef.current.getMatches(userId, userType));
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [userId, userType]);

  const swipe = useCallback((
    targetId: string,
    targetType: SwipeEntityType,
    direction: SwipeDirection,
    vacancyId?: string
  ) => {
    try {
      const result = engineRef.current.swipe(userId, userType, targetId, targetType, direction, vacancyId);
      setSwipeHistory(engineRef.current.getSwipeHistory(userId));
      if (result.match) {
        setMatches(engineRef.current.getMatches(userId, userType));
      }
      return { match: result.match };
    } catch (err: any) {
      if (err.message === 'DUPLICATE_SWIPE') return null;
      throw err;
    }
  }, [userId, userType]);

  const undoLastSwipe = useCallback(() => {
    const undone = engineRef.current.undoLastSwipe(userId);
    if (undone) {
      setSwipeHistory(engineRef.current.getSwipeHistory(userId));
      setMatches(engineRef.current.getMatches(userId, userType));
    }
    return undone;
  }, [userId, userType]);

  const undoLastPass = useCallback(() => {
    const undone = engineRef.current.undoLastPass(userId);
    if (undone) setSwipeHistory(engineRef.current.getSwipeHistory(userId));
    return undone;
  }, [userId]);

  const canUndoPass = useCallback(() => engineRef.current.canUndoPass(userId), [userId]);

  const hasSwipedOn = useCallback((targetId: string) => {
    return engineRef.current.hasSwipedOn(userId, targetId);
  }, [userId]);

  const calculateScore = useCallback((seeker: SeekerProfile, vacancy: VacancyProfile) => {
    return engineRef.current.calculateCompatibility(seeker, vacancy);
  }, []);

  const getRecommendedJobs = useCallback((seeker: SeekerProfile, vacancies: VacancyProfile[]) => {
    return engineRef.current.getRecommendedJobs(seeker, vacancies);
  }, []);

  const getRecommendedCandidates = useCallback((vacancy: VacancyProfile, seekers: SeekerProfile[]) => {
    return engineRef.current.getRecommendedCandidates(vacancy, seekers);
  }, []);

  const updateWeights = useCallback((newWeights: Partial<WeightConfig>) => {
    engineRef.current.updateWeights(newWeights);
    setWeights(engineRef.current.getWeights());
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    engineRef.current.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const stats = engineRef.current.getStats(userId, userType);

  return {
    swipe,
    undoLastSwipe,
    undoLastPass,
    canUndoPass,
    hasSwipedOn,
    matches,
    swipeHistory,
    notifications,
    unreadCount,
    calculateScore,
    getRecommendedJobs,
    getRecommendedCandidates,
    weights,
    updateWeights,
    markNotificationRead,
    stats,
  };
}