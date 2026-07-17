/**
 * Job Seeker Swipe Screen - Tinder-style job discovery.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, borderRadius, fontSize } from '../theme';
import type { JobCard } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const mockJobs: JobCard[] = [
  {
    id: '1', company_name: 'TechCorp', logo_url: '', industry: 'Technology', country: 'UAE', city: 'Dubai',
    employment_type: 'full-time', min_experience: 3, max_experience: 5, job_title: 'Senior Frontend Developer',
    job_description: 'We are looking for an experienced frontend developer to join our team.',
    required_skills: ['React', 'TypeScript', 'Tailwind CSS'], salary_min: 8000, salary_max: 12000,
    compatibility_score: 92,
  },
  {
    id: '2', company_name: 'DataFlow', logo_url: '', industry: 'Data Analytics', country: 'Saudi Arabia', city: 'Riyadh',
    employment_type: 'full-time', min_experience: 2, max_experience: 4, job_title: 'Full Stack Engineer',
    job_description: 'Join our growing team to build scalable data platforms.',
    required_skills: ['Node.js', 'Python', 'PostgreSQL', 'React'], salary_min: 7000, salary_max: 10000,
    compatibility_score: 85,
  },
  {
    id: '3', company_name: 'FinanceHub', logo_url: '', industry: 'Finance', country: 'UAE', city: 'Abu Dhabi',
    employment_type: 'remote', min_experience: 1, max_experience: 3, job_title: 'Mobile Developer',
    job_description: 'Build cross-platform mobile applications for our fintech products.',
    required_skills: ['React Native', 'Flutter', 'Firebase'], salary_min: 6000, salary_max: 9000,
    compatibility_score: 78,
  },
];

export function SeekerSwipeScreen() {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      handleSwipe('right');
    });
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      handleSwipe('left');
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      Alert.alert('Interested! 💼', `You showed interest in ${mockJobs[currentIndex]?.job_title}`);
    }
    setCurrentIndex((prev) => prev + 1);
    position.setValue({ x: 0, y: 0 });
  };

  const currentJob = mockJobs[currentIndex];

  if (!currentJob) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>💼</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No more jobs</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Check back later for new opportunities
          </Text>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.primary }]}
            onPress={() => setCurrentIndex(0)}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Start Over</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.screenTitle, { color: colors.text }]}>Discover Jobs</Text>

      <View style={styles.cardContainer}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            { transform: [{ translateX: position.x }, { rotate }] },
          ]}
        >
          {/* Match Score */}
          <View style={styles.cardHeader}>
            <View style={styles.companyInfo}>
              <View style={[styles.companyLogo, { backgroundColor: colors.primary + '15' }]}>
                <Text style={{ fontSize: 20 }}>🏢</Text>
              </View>
              <View>
                <Text style={[styles.companyName, { color: colors.text }]}>{currentJob.company_name}</Text>
                <Text style={[styles.industry, { color: colors.textSecondary }]}>{currentJob.industry}</Text>
              </View>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreValue, { color: colors.primary }]}>{currentJob.compatibility_score}%</Text>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Match</Text>
            </View>
          </View>

          {/* Job Title */}
          <Text style={[styles.jobTitle, { color: colors.text }]}>{currentJob.job_title}</Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>📍 {currentJob.city}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>💼 {currentJob.employment_type}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                📚 {currentJob.min_experience}-{currentJob.max_experience} yrs
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>{currentJob.job_description}</Text>

          {/* Skills */}
          <View style={styles.skillsContainer}>
            {currentJob.required_skills.map((skill) => (
              <View key={skill} style={[styles.skillBadge, { borderColor: colors.border }]}>
                <Text style={[styles.skillText, { color: colors.text }]}>{skill}</Text>
              </View>
            ))}
          </View>

          {/* Salary */}
          {currentJob.salary_min && (
            <View style={[styles.salaryContainer, { backgroundColor: colors.muted }]}>
              <Text style={[styles.salaryText, { color: colors.text }]}>
                ${currentJob.salary_min.toLocaleString()} - ${currentJob.salary_max?.toLocaleString()} / month
              </Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton, { borderColor: colors.destructive }]}
          onPress={swipeLeft}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 24 }}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.success }]}
          onPress={swipeRight}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 24 }}>✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  screenTitle: { fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.md },
  cardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: SCREEN_WIDTH - 48, padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 1, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  companyInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  companyLogo: { width: 44, height: 44, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  companyName: { fontSize: fontSize.md, fontWeight: '600' },
  industry: { fontSize: fontSize.xs },
  scoreContainer: { alignItems: 'flex-end' },
  scoreValue: { fontSize: fontSize.xxl, fontWeight: '700' },
  scoreLabel: { fontSize: fontSize.xs },
  jobTitle: { fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  badgeText: { fontSize: fontSize.xs },
  description: { fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.md },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  skillBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, borderWidth: 1 },
  skillText: { fontSize: fontSize.xs },
  salaryContainer: { padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  salaryText: { fontSize: fontSize.sm, fontWeight: '500' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.lg },
  actionButton: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  rejectButton: { borderWidth: 2 },
  acceptButton: {},
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.xs },
  emptyDesc: { fontSize: fontSize.sm, marginBottom: spacing.lg },
  resetButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
});

export default SeekerSwipeScreen;