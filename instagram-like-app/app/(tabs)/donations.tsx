import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RoleSwitcher } from '../../components/RoleSwitcher';
import { useApp } from '../../contexts/AppContext';
import { useResponsiveSpacing } from '../../hooks/use-responsive-spacing';

const memberStatuses = ['active', 'pending', 'inactive'] as const;

type MemberStatus = (typeof memberStatuses)[number];

type PaymentStatus = 'Paid' | 'Pending';

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
    loading,
  } = useApp();
  const layout = useResponsiveSpacing();
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [memberStatus, setMemberStatus] = useState<MemberStatus>('active');
  const [roleLabel, setRoleLabel] = useState('Member');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationStatus, setDonationStatus] = useState<PaymentStatus>('Paid');
  const [donationMonth, setDonationMonth] = useState('');
  const [editingDonationId, setEditingDonationId] = useState<string | null>(null);
  const [isSubmittingMember, setSubmittingMember] = useState(false);
  const [isSubmittingDonation, setSubmittingDonation] = useState(false);

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
    setRoleLabel('Member');
    setEditingMemberId(null);
    setSubmittingMember(false);
  };

  const handleSaveMember = async () => {
    if (!memberName.trim() || !memberEmail.trim()) {
      return;
    }

    try {
      setSubmittingMember(true);
      await addOrUpdateMember({
        id: editingMemberId ?? undefined,
        name: memberName.trim(),
        email: memberEmail.trim(),
        status: memberStatus,
        roleLabel,
      });
      resetMemberForm();
    } catch (error) {
      console.warn('Failed to save member', error);
      setSubmittingMember(false);
    }
  };

  const handleEditMember = (memberId: string) => {
    const member = members.find((item) => item.id === memberId);
    if (!member) {
      return;
    }
    setMemberName(member.name);
    setMemberEmail(member.email);
    setMonthlyContribution(member.monthlyContribution ? String(member.monthlyContribution) : '');
    setMemberStatus(member.status);
    setRoleLabel(member.roleLabel ?? 'Member');
    setEditingMemberId(member.id);
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMember(memberId);
    if (selectedMemberId === memberId) {
      setSelectedMemberId(null);
    }
    if (editingMemberId === memberId) {
      resetMemberForm();
    }
  };

  const startEditingDonation = (donationId: string) => {
    const donation = donations.find((item) => item.id === donationId);
    if (!donation) {
      return;
    }
    setEditingDonationId(donation.id);
    setSelectedMemberId(donation.memberId);
    setDonationAmount(String(donation.amount));
    setDonationMonth(donation.month ?? '');
    setDonationStatus(donation.monthlyStatus === 'Paid' ? 'Paid' : 'Pending');
  };

  const cancelDonationEdit = () => {
    setEditingDonationId(null);
    setSelectedMemberId(null);
    setDonationAmount('');
    setDonationMonth('');
    setDonationStatus('Paid');
    setSubmittingDonation(false);
  };

  const handleLogDonation = async () => {
    if (!selectedMemberId || !donationAmount.trim()) {
      return;
    }

    const amountValue = Number.parseFloat(donationAmount);
    if (Number.isNaN(amountValue)) {
      return;
    }

    try {
      setSubmittingDonation(true);
      if (editingDonationId) {
        await updateDonation({
          id: editingDonationId,
          amount: amountValue,
          month: donationMonth.trim(),
          status: donationStatus,
        });
      } else {
        await logDonation({
          memberId: selectedMemberId,
          amount: amountValue,
          month: donationMonth.trim(),
          status: donationStatus,
        });
      }
      cancelDonationEdit();
    } catch (error) {
      console.warn('Failed to record donation', error);
      setSubmittingDonation(false);
    }
  };

  const handleRemoveDonation = async (donationId: string) => {
    await removeDonation(donationId);
    if (editingDonationId === donationId) {
      cancelDonationEdit();
    }
  };

  if (!canView) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: layout.horizontal,
            paddingVertical: layout.vertical,
            gap: layout.gap,
          }}>
          <RoleSwitcher />
          <View style={[styles.card, { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' }]}>
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

  const constrainedWidth = { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' };
  const contentStyle = [
    styles.container,
    {
      paddingHorizontal: layout.horizontal,
      paddingVertical: layout.vertical,
      gap: layout.gap,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={contentStyle}>
        <RoleSwitcher />

        {canManage && (
          <View style={[styles.card, constrainedWidth]}>
            <Text style={styles.cardTitle}>Manage members</Text>
            <TextInput placeholder="Full name" value={memberName} onChangeText={setMemberName} style={styles.input} />
            <TextInput placeholder="Email" value={memberEmail} onChangeText={setMemberEmail} style={styles.input} />
            <TextInput
              placeholder="Monthly contribution (display only)"
              value={monthlyContribution}
              onChangeText={setMonthlyContribution}
              editable={false}
              style={styles.input}
            />
            <TextInput placeholder="Role label" value={roleLabel} onChangeText={setRoleLabel} style={styles.input} />
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
            <Pressable
              style={[styles.primaryButton, isSubmittingMember && styles.disabledButton]}
              onPress={handleSaveMember}
              disabled={isSubmittingMember}>
              <Text style={styles.primaryButtonText}>
                {isSubmittingMember ? 'Saving…' : manageButtonLabel}
              </Text>
            </Pressable>
            {editingMemberId && (
              <Pressable onPress={resetMemberForm}>
                <Text style={styles.helperLink}>Cancel editing</Text>
              </Pressable>
            )}
            <View style={[styles.memberList, { columnGap: layout.gap, rowGap: layout.gap }]}>
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
          <View style={[styles.card, constrainedWidth]}>
            <Text style={styles.cardTitle}>{editingDonationId ? 'Update payment' : 'Record monthly payment'}</Text>
            <View style={[styles.memberList, { columnGap: layout.gap, rowGap: layout.gap }]}>
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
            <View style={styles.toggleRow}>
              {(['Paid', 'Pending'] as const).map((status) => {
                const isActive = status === donationStatus;
                return (
                  <Pressable
                    key={status}
                    style={[styles.toggleChip, isActive && styles.toggleChipActive]}
                    onPress={() => setDonationStatus(status)}>
                    <Text style={[styles.toggleChipText, isActive && styles.toggleChipTextActive]}>{status}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              style={[styles.secondaryButton, isSubmittingDonation && styles.disabledButton]}
              onPress={handleLogDonation}
              disabled={isSubmittingDonation}>
              <Text style={styles.secondaryButtonText}>
                {isSubmittingDonation ? 'Saving…' : editingDonationId ? 'Save payment' : 'Log payment'}
              </Text>
            </Pressable>
            {editingDonationId && (
              <Pressable onPress={cancelDonationEdit}>
                <Text style={styles.helperLink}>Cancel payment editing</Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={[styles.sectionHeader, constrainedWidth]}>
          <Text style={styles.sectionTitle}>Member roster</Text>
          <Text style={styles.sectionSubtitle}>{loading ? 'Loading roster…' : 'Monthly contributions and status'}</Text>
        </View>

        {members.map((member) => (
          <View key={member.id} style={[styles.card, constrainedWidth]}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberEmail}>{member.email}</Text>
            <Text style={styles.memberMeta}>Status: {member.status.toUpperCase()}</Text>
            {member.roleLabel ? <Text style={styles.memberMeta}>Role: {member.roleLabel}</Text> : null}
          </View>
        ))}

        <View style={[styles.sectionHeader, constrainedWidth]}>
          <Text style={styles.sectionTitle}>Payment history</Text>
          <Text style={styles.sectionSubtitle}>Name, month, status, amount, and actions</Text>
        </View>

        {donations.length === 0 ? (
          <View style={[styles.card, constrainedWidth]}>
            <Text style={styles.helperText}>No payments recorded yet.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.table, { minWidth: layout.contentMaxWidth }]}>
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text style={[styles.tableCell, styles.tableCellName]}>Name</Text>
                <Text style={styles.tableCell}>Month</Text>
                <Text style={styles.tableCell}>Status</Text>
                <Text style={styles.tableCell}>Amount</Text>
                <Text style={[styles.tableCell, styles.tableCellNotes]}>Noted by</Text>
                {canManage && <Text style={[styles.tableCell, styles.tableCellActions]}>Actions</Text>}
              </View>
              {donations.map((record, index) => (
                <View
                  key={record.id}
                  style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                  <Text style={[styles.tableCell, styles.tableCellName]}>{record.memberName}</Text>
                  <Text style={styles.tableCell}>{record.month || '—'}</Text>
                  <Text style={styles.tableCell}>{record.monthlyStatus}</Text>
                  <Text style={styles.tableCell}>${record.amount.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellNotes]}>{record.notedBy}</Text>
                  {canManage && (
                    <View style={[styles.tableCell, styles.tableCellActions]}>
                      <Pressable style={styles.tableAction} onPress={() => startEditingDonation(record.id)}>
                        <Text style={styles.tableActionText}>Edit</Text>
                      </Pressable>
                      <Pressable style={styles.tableActionDanger} onPress={() => handleRemoveDonation(record.id)}>
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
  disabledButton: {
    opacity: 0.5,
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
