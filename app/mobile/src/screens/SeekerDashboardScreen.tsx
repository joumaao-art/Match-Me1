/**
 * Job Seeker Dashboard Screen.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, borderRadius, fontSize } from '../theme';

export function SeekerDashboardScreen() {
  const { colors } = useTheme();

  const stats = [
    { label: 'Matched Jobs', value: '12', color: colors.primary },
    { label: 'Applications', value: '28', color: colors.accent },
    { label: 'Interviews', value: '3', color: colors.success },
  ];

  const recentMatches = [
    { company: 'TechCorp', role: 'Senior Frontend Developer', score: 92, status: 'Interview' },
    { company: 'DataFlow', role: 'Full Stack Engineer', score: 85, status: 'Accepted' },
    { company: 'FinanceHub', role: 'Mobile Developer', score: 78, status: 'New' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Profile Strength */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.profileHeader}>
          <Text style={[styles.profileLabel, { color: colors.text }]}>Profile Strength</Text>
          <Text style={[styles.profileValue, { color: colors.primary }]}>75%</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '75%' }]} />
        </View>
        <Text style={[styles.profileHint, { color: colors.textSecondary }]}>
          Add certifications to improve your score
        </Text>
      </View>

      {/* Recent Matches */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Matches</Text>
      {recentMatches.map((match) => (
        <View key={match.company} style={[styles.matchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.matchInfo}>
            <View style={[styles.matchIcon, { backgroundColor: colors.primary + '15' }]}>
              <Text>🏢</Text>
            </View>
            <View style={styles.matchDetails}>
              <Text style={[styles.matchRole, { color: colors.text }]}>{match.role}</Text>
              <Text style={[styles.matchCompany, { color: colors.textSecondary }]}>{match.company}</Text>
            </View>
          </View>
          <View style={styles.matchMeta}>
            <View style={[styles.statusBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>{match.status}</Text>
            </View>
            <Text style={[styles.matchScore, { color: colors.primary }]}>{match.score}%</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.xxl, fontWeight: '700' },
  statLabel: { fontSize: fontSize.xs, marginTop: spacing.xs },
  profileCard: { padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.lg },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  profileLabel: { fontSize: fontSize.sm, fontWeight: '500' },
  profileValue: { fontSize: fontSize.sm, fontWeight: '700' },
  progressBar: { height: 8, borderRadius: 4, marginBottom: spacing.sm },
  progressFill: { height: 8, borderRadius: 4 },
  profileHint: { fontSize: fontSize.xs },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.md },
  matchCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.sm },
  matchInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  matchIcon: { width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  matchDetails: { flex: 1 },
  matchRole: { fontSize: fontSize.sm, fontWeight: '500' },
  matchCompany: { fontSize: fontSize.xs },
  matchMeta: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginBottom: 4 },
  statusText: { fontSize: fontSize.xs },
  matchScore: { fontSize: fontSize.xs, fontWeight: '600' },
});

export default SeekerDashboardScreen;