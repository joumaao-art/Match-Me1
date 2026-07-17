/**
 * Subscription Screen - Plan selection and billing.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, borderRadius, fontSize } from '../theme';
import { SUBSCRIPTION } from '../config/constants';

export function SubscriptionScreen() {
  const { colors } = useTheme();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const price = billingCycle === 'monthly' ? SUBSCRIPTION.PREMIUM_MONTHLY_PRICE : SUBSCRIPTION.PREMIUM_YEARLY_PRICE;

  const freeFeatures = [
    'Limited job postings (3/month)',
    'Message matched candidates only',
    'Hidden contact information',
    'Basic analytics',
  ];

  const premiumFeatures = [
    'Unlimited job postings',
    'Message anyone directly',
    'Full contact details visible',
    'Advanced analytics & reports',
    'Priority ranking in search',
    'Export candidate data (CSV/PDF)',
  ];

  const handleUpgrade = () => {
    Alert.alert('Upgrade', 'Redirecting to checkout...');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Subscription</Text>

      {/* Billing Toggle */}
      <View style={[styles.toggle, { backgroundColor: colors.muted }]}>
        <TouchableOpacity
          style={[styles.toggleOption, billingCycle === 'monthly' && { backgroundColor: colors.card }]}
          onPress={() => setBillingCycle('monthly')}
        >
          <Text style={[styles.toggleText, { color: billingCycle === 'monthly' ? colors.text : colors.textSecondary }]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOption, billingCycle === 'yearly' && { backgroundColor: colors.card }]}
          onPress={() => setBillingCycle('yearly')}
        >
          <Text style={[styles.toggleText, { color: billingCycle === 'yearly' ? colors.text : colors.textSecondary }]}>
            Yearly (-20%)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Free Plan */}
      <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
        <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.currentBadgeText}>Current Plan</Text>
        </View>
        <Text style={[styles.planName, { color: colors.text }]}>🛡️ Free</Text>
        <Text style={[styles.planPrice, { color: colors.text }]}>$0<Text style={styles.planPeriod}>/month</Text></Text>
        {freeFeatures.map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={[styles.featureIcon, { color: colors.textSecondary }]}>•</Text>
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Premium Plan */}
      <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.accent }]}>
        <View style={[styles.popularBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.currentBadgeText}>Popular</Text>
        </View>
        <Text style={[styles.planName, { color: colors.text }]}>👑 Premium</Text>
        <Text style={[styles.planPrice, { color: colors.text }]}>
          ${price}<Text style={styles.planPeriod}>/month</Text>
        </Text>
        {billingCycle === 'yearly' && (
          <Text style={[styles.billedText, { color: colors.textSecondary }]}>
            Billed ${price * 12}/year
          </Text>
        )}
        {premiumFeatures.map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={[styles.featureIcon, { color: colors.success }]}>✓</Text>
            <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
          </View>
        ))}
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
          onPress={handleUpgrade}
          activeOpacity={0.8}
        >
          <Text style={[styles.upgradeText, { color: colors.primaryForeground }]}>👑 Upgrade to Premium</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Info */}
      <Text style={[styles.paymentInfo, { color: colors.textSecondary }]}>
        Secure payment powered by Stripe
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.lg },
  toggle: { flexDirection: 'row', borderRadius: borderRadius.full, padding: 4, marginBottom: spacing.lg },
  toggleOption: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.full, alignItems: 'center' },
  toggleText: { fontSize: fontSize.sm, fontWeight: '500' },
  planCard: { padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 2, marginBottom: spacing.md, position: 'relative' },
  currentBadge: { position: 'absolute', top: -12, left: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  popularBadge: { position: 'absolute', top: -12, right: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  currentBadgeText: { color: '#fff', fontSize: fontSize.xs, fontWeight: '600' },
  planName: { fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.sm },
  planPrice: { fontSize: fontSize.xxxl, fontWeight: '700', marginBottom: spacing.sm },
  planPeriod: { fontSize: fontSize.sm, fontWeight: '400' },
  billedText: { fontSize: fontSize.xs, marginBottom: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  featureIcon: { fontSize: fontSize.sm },
  featureText: { fontSize: fontSize.sm },
  upgradeButton: { marginTop: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  upgradeText: { fontSize: fontSize.md, fontWeight: '600' },
  paymentInfo: { textAlign: 'center', fontSize: fontSize.xs, marginTop: spacing.md, marginBottom: spacing.xl },
});

export default SubscriptionScreen;