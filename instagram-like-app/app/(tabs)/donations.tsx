import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RoleSwitcher } from '../../components/RoleSwitcher';
import { useApp } from '../../contexts/AppContext';

const memberStatuses = ['active', 'pending', 'inactive'] as const;

type MemberStatus = (typeof memberStatuses)[number];

export default function DonationsScreen() {
  const { members, addOrUpdateMember, donations, logDonation, role } = useApp();
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [memberStatus, setMemberStatus] = useState<MemberStatus>('active');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMonth, setDonationMonth] = useState('');

  const canManage = role === 'admin';
  const canView = role === 'admin' || role === 'member';

  const selectedMemberName = useMemo(() => members.find((member) => member.id === selectedMemberId)?.name ?? '', [
    members,
    selectedMemberId,
  ]);

  const manageButtonLabel = editingMemberId ? 'Update member' : 'Save member';

  const resetMemberForm = () => {
    setMemberName('');
    setMemberEmail('');
    setMonthlyContribution('');
    setMemberStatus('active');
    setEditingMemberId(null);
  };

  const handleSaveMember = () => {
    if (!memberName.trim() || !memberEmail.trim() || !monthlyContribution.trim()) {
      return;
    }

    const contributionValue = Number.parseFloat(monthlyContribution);
    if (Number.isNaN(contributionValue)) {
      return;
    }

    addOrUpdateMember({
      id: editingMemberId ?? undefined,
      name: memberName.trim(),
      email: memberEmail.trim(),
      monthlyContribution: contributionValue,
      status: memberStatus,
    });

    resetMemberForm();
  };

  const handleEditMember = (memberId: string) => {
    const member = members.find((item) => item.id === memberId);
    if (!member) {
      return;
    }
    setMemberName(member.name);
    setMemberEmail(member.email);
    setMonthlyContribution(member.monthlyContribution.toString());
    setMemberStatus(member.status as MemberStatus);
    setEditingMemberId(member.id);
  };

  const handleLogDonation = () => {
    if (!selectedMemberId || !donationAmount.trim() || !donationMonth.trim()) {
      return;
    }

    const amountValue = Number.parseFloat(donationAmount);
    if (Number.isNaN(amountValue)) {
      return;
    }

    logDonation({
      memberId: selectedMemberId,
      amount: amountValue,
      month: donationMonth.trim(),
      notedBy: 'Admin',
    });

    setDonationAmount('');
    setDonationMonth('');
  };

  if (!canView) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <RoleSwitcher />
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Donations are restricted</Text>
            <Text style={styles.sectionSubtitle}>
              Only registered members can view contribution information. Switch to another role to preview this
              experience.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <RoleSwitcher />

        {canManage && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Manage members</Text>
            <TextInput placeholder="Full name" value={memberName} onChangeText={setMemberName} style={styles.input} />
            <TextInput placeholder="Email" value={memberEmail} onChangeText={setMemberEmail} style={styles.input} />
            <TextInput
              placeholder="Monthly contribution (USD)"
              value={monthlyContribution}
              onChangeText={setMonthlyContribution}
              style={styles.input}
              keyboardType="numeric"
            />
            <View style={styles.toggleRow}>
              {memberStatuses.map((status) => {
                const isActive = memberStatus === status;
                return (
                  <Text
                    key={status}
                    style={[styles.toggleChip, isActive && styles.toggleChipActive]}
                    onPress={() => setMemberStatus(status)}>
                    {status.toUpperCase()}
                  </Text>
                );
              })}
            </View>
            <Text style={styles.primaryButton} onPress={handleSaveMember}>
              {manageButtonLabel}
            </Text>
            {editingMemberId && (
              <Text style={styles.helperLink} onPress={resetMemberForm}>
                Cancel editing
              </Text>
            )}
            <View style={styles.memberList}>
              {members.map((member) => {
                const isSelected = member.id === editingMemberId;
                return (
                  <Text
                    key={`manage-${member.id}`}
                    style={[styles.memberChip, isSelected && styles.memberChipActive]}
                    onPress={() => handleEditMember(member.id)}>
                    {member.name}
                  </Text>
                );
              })}
            </View>
            <Text style={styles.helperText}>Tap a member to load their details for editing.</Text>
          </View>
        )}

        {canManage && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Record monthly payment</Text>
            <View style={styles.memberList}>
              {members.map((member) => {
                const isSelected = member.id === selectedMemberId;
                return (
                  <Text
                    key={member.id}
                    style={[styles.memberChip, isSelected && styles.memberChipActive]}
                    onPress={() => setSelectedMemberId(member.id)}>
                    {member.name}
                  </Text>
                );
              })}
            </View>
            <Text style={styles.helperText}>
              Selected member: {selectedMemberName || 'Tap a member above to select'}
            </Text>
            <TextInput
              placeholder="Amount"
              value={donationAmount}
              onChangeText={setDonationAmount}
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Month (YYYY-MM)"
              value={donationMonth}
              onChangeText={setDonationMonth}
              style={styles.input}
            />
            <Text style={styles.secondaryButton} onPress={handleLogDonation}>
              Log payment
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Member roster</Text>
          <Text style={styles.sectionSubtitle}>Monthly contributions and current status</Text>
        </View>

        {members.map((member) => (
          <View key={member.id} style={styles.card}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberEmail}>{member.email}</Text>
            <Text style={styles.memberMeta}>Status: {member.status.toUpperCase()}</Text>
            <Text style={styles.memberMeta}>Monthly: ${member.monthlyContribution.toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment history</Text>
          <Text style={styles.sectionSubtitle}>Auditable record of donations</Text>
        </View>

        {donations.map((donation) => {
          const member = members.find((item) => item.id === donation.memberId);
          return (
            <View key={donation.id} style={styles.card}>
              <Text style={styles.memberName}>{member?.name ?? 'Unknown member'}</Text>
              <Text style={styles.memberMeta}>Month: {donation.month}</Text>
              <Text style={styles.memberMeta}>Amount: ${donation.amount.toFixed(2)}</Text>
              <Text style={styles.memberMeta}>Recorded by: {donation.notedBy}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 16,
    gap: 16,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f766e',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    fontWeight: '600',
    overflow: 'hidden',
  },
  secondaryButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#0f172a',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    fontWeight: '600',
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontWeight: '700',
    color: '#4b5563',
  },
  toggleChipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
    color: '#fff',
  },
  memberList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#1f2937',
    fontWeight: '600',
  },
  memberChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
    color: '#fff',
  },
  memberName: {
    fontSize: 20,
    fontWeight: '700',
  },
  memberEmail: {
    fontSize: 15,
    color: '#1d4ed8',
  },
  memberMeta: {
    fontSize: 15,
    color: '#374151',
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
  },
  helperLink: {
    fontSize: 14,
    color: '#0f766e',
    fontWeight: '600',
  },
});
