import { useState, useCallback, useMemo } from 'react';
import {
  aiMatchingEngine,
  AIMatchingEngine,
  SeekerAIProfile,
  VacancyAIProfile,
  MatchExplanation,
  InteractionSignal,
} from './ai-matching-engine';

export interface UseAIMatchingReturn {
  // Core matching
  calculateMatch: (seeker: SeekerAIProfile, vacancy: VacancyAIProfile) => MatchExplanation;
  getRecommendations: (seeker: SeekerAIProfile, vacancies: VacancyAIProfile[]) => { vacancy: VacancyAIProfile; explanation: MatchExplanation }[];
  getCandidateRankings: (vacancy: VacancyAIProfile, seekers: SeekerAIProfile[]) => { seeker: SeekerAIProfile; explanation: MatchExplanation }[];

  // Learning
  recordInteraction: (signal: Omit<InteractionSignal, 'timestamp'>) => void;
  learningStats: ReturnType<AIMatchingEngine['getLearningStats']> | null;
  resetLearning: () => void;
}

/**
 * React hook for AI-powered matching
 */
export function useAIMatching(userId: string): UseAIMatchingReturn {
  const [version, setVersion] = useState(0);

  const calculateMatch = useCallback((seeker: SeekerAIProfile, vacancy: VacancyAIProfile) => {
    return aiMatchingEngine.calculateMatch(seeker, vacancy);
  }, []);

  const getRecommendations = useCallback((seeker: SeekerAIProfile, vacancies: VacancyAIProfile[]) => {
    return aiMatchingEngine.getRecommendations(seeker, vacancies);
  }, [version]);

  const getCandidateRankings = useCallback((vacancy: VacancyAIProfile, seekers: SeekerAIProfile[]) => {
    return aiMatchingEngine.getCandidateRankings(vacancy, seekers);
  }, [version]);

  const recordInteraction = useCallback((signal: Omit<InteractionSignal, 'timestamp'>) => {
    aiMatchingEngine.recordInteraction({ ...signal, timestamp: Date.now() });
    setVersion(v => v + 1);
  }, []);

  const learningStats = useMemo(() => {
    return aiMatchingEngine.getLearningStats(userId);
  }, [userId, version]);

  const resetLearning = useCallback(() => {
    aiMatchingEngine.resetLearning(userId);
    setVersion(v => v + 1);
  }, [userId]);

  return {
    calculateMatch,
    getRecommendations,
    getCandidateRankings,
    recordInteraction,
    learningStats,
    resetLearning,
  };
}