import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RoleSwitcher } from '../../components/RoleSwitcher';
import { useApp } from '../../contexts/AppContext';

const memberStatuses = ['active', 'pending', 'inactive'] as const;

type MemberStatus = (typeof memberStatuses)[number];

type DonationSummary = {
  id: string;
  memberId: string;
  name: string;
  month: string;
  paid: number;
  unpaid: number;
  extra: number;
  notedBy: string;
};

export default function DonationsScreen() {
  const {
    members,
    addOrUpdateMember,
    removeMember,
    donations,
    logDonation,
    updateDonation,
    removeDonation,
    role,
  } = useApp();
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [memberStatus, setMemberStatus] = useState<MemberStatus>('active');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMonth, setDonationMonth] = useState('');
  const [editingDonationId, setEditingDonationId] = useState<string | null>(null);

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

  const handleRemoveMember = (memberId: string) => {
    removeMember(memberId);
    if (selectedMemberId === memberId) {
      setSelectedMemberId(null);
    }
    if (editingMemberId === memberId) {
      resetMemberForm();
    }
  };

  const startEditingDonation = (summary: DonationSummary) => {
    setEditingDonationId(summary.id);
    setSelectedMemberId(summary.memberId);
    setDonationAmount(summary.paid.toString());
    setDonationMonth(summary.month);
  };

  const cancelDonationEdit = () => {
    setEditingDonationId(null);
    setSelectedMemberId(null);
    setDonationAmount('');
    setDonationMonth('');
  };

  const handleLogDonation = () => {
    if (!selectedMemberId || !donationAmount.trim() || !donationMonth.trim()) {
      return;
    }

    const amountValue = Number.parseFloat(donationAmount);
    if (Number.isNaN(amountValue)) {
      return;
    }

    if (editingDonationId) {
      updateDonation(editingDonationId, {
        memberId: selectedMemberId,
        amount: amountValue,
        month: donationMonth.trim(),
        notedBy: 'Admin',
      });
      cancelDonationEdit();
    } else {
      logDonation({
        memberId: selectedMemberId,
        amount: amountValue,
        month: donationMonth.trim(),
        notedBy: 'Admin',
      });
      setDonationAmount('');
      setDonationMonth('');
    }
  };

  const donationSummaries: DonationSummary[] = useMemo(() => {
    return donations.map((donation) => {
      const member = members.find((item) => item.id === donation.memberId);
      const monthlyTarget = member?.monthlyContribution ?? 0;
      const unpaid = Math.max(monthlyTarget - donation.amount, 0);
      const extra = donation.amount > monthlyTarget ? donation.amount - monthlyTarget : 0;

      return {
        id: donation.id,
        memberId: donation.memberId,
        name: member?.name ?? 'Unknown member',
        month: donation.month,
        paid: donation.amount,
        unpaid,
        extra,
        notedBy: donation.notedBy,
      };
    });
  }, [donations, members]);

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
                  <Pressable
                    key={status}
                    style={[styles.toggleChip, isActive && styles.toggleChipActive]}
                    onPress={() => setMemberStatus(status)}>
                    <Text style={[styles.toggleChipText, isActive && styles.toggleChipTextActive]}>
                      {status.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.primaryButton} onPress={handleSaveMember}>
              <Text style={styles.primaryButtonText}>{manageButtonLabel}</Text>
            </Pressable>
            {editingMemberId && (
              <Pressable onPress={resetMemberForm}>
                <Text style={styles.helperLink}>Cancel editing</Text>
              </Pressable>
            )}
            <View style={styles.memberList}>
              {members.map((member) => {
                const isSelected = member.id === editingMemberId;
                return (
                  <View key={`manage-${member.id}`} style={styles.memberRow}>
                    <Pressable
                      style={[styles.memberChip, isSelected && styles.memberChipActive]}
                      onPress={() => handleEditMember(member.id)}>
                      <Text style={[styles.memberChipText, isSelected && styles.memberChipTextActive]}>{member.name}</Text>
                    </Pressable>
                    <Pressable style={styles.dangerButton} onPress={() => handleRemoveMember(member.id)}>
                      <Text style={styles.dangerButtonText}>Remove</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
            <Text style={styles.helperText}>Tap a member to load their details. Removing also clears payments.</Text>
          </View>
        )}

        {canManage && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{editingDonationId ? 'Update payment' : 'Record monthly payment'}</Text>
            <View style={styles.memberList}>
              {members.map((member) => {
                const isSelected = member.id === selectedMemberId;
                return (
                  <Pressable
                    key={member.id}
                    style={[styles.memberChip, isSelected && styles.memberChipActive]}
                    onPress={() => setSelectedMemberId(member.id)}>
                    <Text style={[styles.memberChipText, isSelected && styles.memberChipTextActive]}>{member.name}</Text>
                  </Pressable>
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
            <Pressable style={styles.secondaryButton} onPress={handleLogDonation}>
              <Text style={styles.secondaryButtonText}>{editingDonationId ? 'Save payment' : 'Log payment'}</Text>
            </Pressable>
            {editingDonationId && (
              <Pressable onPress={cancelDonationEdit}>
                <Text style={styles.helperLink}>Cancel payment editing</Text>
              </Pressable>
            )}
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
          <Text style={styles.sectionSubtitle}>Name, month, paid, unpaid, extra, and actions</Text>
        </View>

        {donationSummaries.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.helperText}>No payments recorded yet.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text style={[styles.tableCell, styles.tableCellName]}>Name</Text>
                <Text style={styles.tableCell}>Month</Text>
                <Text style={styles.tableCell}>Paid</Text>
                <Text style={styles.tableCell}>Unpaid</Text>
                <Text style={styles.tableCell}>Extra</Text>
                <Text style={[styles.tableCell, styles.tableCellNotes]}>Noted by</Text>
                {canManage && <Text style={[styles.tableCell, styles.tableCellActions]}>Actions</Text>}
              </View>
              {donationSummaries.map((record, index) => (
                <View
                  key={record.id}
                  style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                  <Text style={[styles.tableCell, styles.tableCellName]}>{record.name}</Text>
                  <Text style={styles.tableCell}>{record.month}</Text>
                  <Text style={styles.tableCell}>${record.paid.toFixed(2)}</Text>
                  <Text style={styles.tableCell}>${record.unpaid.toFixed(2)}</Text>
                  <Text style={styles.tableCell}>${record.extra.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellNotes]}>{record.notedBy}</Text>
                  {canManage && (
                    <View style={[styles.tableCell, styles.tableCellActions]}>
                      <Pressable style={styles.tableAction} onPress={() => startEditingDonation(record)}>
                        <Text style={styles.tableActionText}>Edit</Text>
                      </Pressable>
                      <Pressable style={styles.tableActionDanger} onPress={() => removeDonation(record.id)}>
                        <Text style={styles.tableActionDangerText}>Delete</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
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
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#0f172a',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  toggleChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  toggleChipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  toggleChipText: {
    fontWeight: '700',
    color: '#4b5563',
  },
  toggleChipTextActive: {
    color: '#fff',
  },
  memberList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  memberChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  memberChipText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  memberChipTextActive: {
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
  dangerButton: {
    backgroundColor: '#b91c1c',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  table: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderRow: {
    backgroundColor: '#0f172a',
  },
  tableRowEven: {
    backgroundColor: '#f8fafc',
  },
  tableRowOdd: {
    backgroundColor: '#fff',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  tableCellName: {
    flex: 1.4,
    fontWeight: '600',
  },
  tableCellNotes: {
    flex: 1.2,
  },
  tableCellActions: {
    flex: 1.2,
    flexDirection: 'row',
    gap: 8,
  },
  tableAction: {
    backgroundColor: '#1d4ed8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tableActionText: {
    color: '#fff',
    fontWeight: '600',
  },
  tableActionDanger: {
    backgroundColor: '#dc2626',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tableActionDangerText: {
    color: '#fff',
    fontWeight: '600',
  },
});
