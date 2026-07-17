/**
 * Company Dashboard Screen.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, borderRadius, fontSize } from '../theme';

export function CompanyDashboardScreen() {
  const { colors } = useTheme();

  const stats = [
    { label: 'Active Vacancies', value: '5', color: colors.primary },
    { label: 'Candidates', value: '47', color: colors.accent },
    { label: 'Interviews', value: '8', color: colors.success },
    { label: 'Hired', value: '2', color: '#8B5CF6' },
  ];

  const topCandidates = [
    { name: 'Ahmed Hassan', skills: 'React, TypeScript', score: 94, status: 'New' },
    { name: 'Sara Al-Rashid', skills: 'Python, ML', score: 87, status: 'Interview' },
    { name: 'Omar Khalil', skills: 'Java, AWS', score: 82, status: 'Accepted' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Top Candidates */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Matched Candidates</Text>
      {topCandidates.map((candidate) => (
        <View key={candidate.name} style={[styles.candidateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.candidateInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
              <Text>👤</Text>
            </View>
            <View style={styles.candidateDetails}>
              <Text style={[styles.candidateName, { color: colors.text }]}>{candidate.name}</Text>
              <Text style={[styles.candidateSkills, { color: colors.textSecondary }]}>{candidate.skills}</Text>
            </View>
          </View>
          <View style={styles.candidateMeta}>
            <View style={[styles.statusBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>{candidate.status}</Text>
            </View>
            <Text style={[styles.score, { color: colors.primary }]}>{candidate.score}%</Text>
          </View>
        </View>
      ))}

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.primary + '10' }]} activeOpacity={0.7}>
          <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>📝</Text>
          <Text style={[styles.actionText, { color: colors.primary }]}>Post Vacancy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.accent + '10' }]} activeOpacity={0.7}>
          <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>👥</Text>
          <Text style={[styles.actionText, { color: colors.accent }]}>View Candidates</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.success + '10' }]} activeOpacity={0.7}>
          <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>📊</Text>
          <Text style={[styles.actionText, { color: colors.success }]}>Analytics</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { width: '48%', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.xxl, fontWeight: '700' },
  statLabel: { fontSize: fontSize.xs, marginTop: spacing.xs, textAlign: 'center' },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.md },
  candidateCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.sm },
  candidateInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  candidateDetails: { flex: 1 },
  candidateName: { fontSize: fontSize.sm, fontWeight: '500' },
  candidateSkills: { fontSize: fontSize.xs },
  candidateMeta: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginBottom: 4 },
  statusText: { fontSize: fontSize.xs },
  score: { fontSize: fontSize.sm, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  actionCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  actionText: { fontSize: fontSize.xs, fontWeight: '600' },
});

export default CompanyDashboardScreen;