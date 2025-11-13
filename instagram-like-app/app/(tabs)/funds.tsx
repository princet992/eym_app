import { useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RoleSwitcher } from '../../components/RoleSwitcher';
import { ReliefFund, useApp } from '../../contexts/AppContext';

const emptyBankDetail = { bankName: '', accountName: '', accountNumber: '', ifsc: '', swift: '' };

type EditableFund = {
  id?: string;
  title: string;
  description: string;
  goal: string;
  raised: string;
  contactEmail: string;
  bankDetails: typeof emptyBankDetail[];
};

const defaults: EditableFund = {
  title: '',
  description: '',
  goal: '',
  raised: '',
  contactEmail: '',
  bankDetails: [{ ...emptyBankDetail }],
};

export default function ReliefFundScreen() {
  const { reliefFunds, role, addOrUpdateReliefFund, removeReliefFund } = useApp();
  const [fundDraft, setFundDraft] = useState<EditableFund>(defaults);
  const [isModalVisible, setModalVisible] = useState(false);

  const canManage = role === 'admin';

  const modalTitle = useMemo(() => (fundDraft.id ? 'Update appeal' : 'Launch new appeal'), [fundDraft.id]);

  const openCreateModal = () => {
    setFundDraft(defaults);
    setModalVisible(true);
  };

  const openEditModal = (fund: ReliefFund) => {
    setFundDraft({
      id: fund.id,
      title: fund.title,
      description: fund.description,
      goal: fund.goal.toString(),
      raised: fund.raised.toString(),
      contactEmail: fund.contactEmail ?? '',
      bankDetails: fund.bankDetails.map((detail) => ({
        bankName: detail.bankName,
        accountName: detail.accountName,
        accountNumber: detail.accountNumber,
        ifsc: detail.ifsc ?? '',
        swift: detail.swift ?? '',
      })),
    });
    setModalVisible(true);
  };

  const updateBankDetail = (index: number, field: keyof typeof emptyBankDetail, value: string) => {
    setFundDraft((prev) => {
      const next = [...prev.bankDetails];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, bankDetails: next };
    });
  };

  const addBankDetailRow = () => {
    setFundDraft((prev) => ({ ...prev, bankDetails: [...prev.bankDetails, { ...emptyBankDetail }] }));
  };

  const removeBankDetailRow = (index: number) => {
    setFundDraft((prev) => ({
      ...prev,
      bankDetails: prev.bankDetails.filter((_, idx) => idx !== index),
    }));
  };

  const handleSaveFund = () => {
    if (!fundDraft.title.trim() || !fundDraft.description.trim()) {
      return;
    }

    const goalValue = Number.parseFloat(fundDraft.goal || '0');
    const raisedValue = Number.parseFloat(fundDraft.raised || '0');

    addOrUpdateReliefFund({
      id: fundDraft.id,
      title: fundDraft.title.trim(),
      description: fundDraft.description.trim(),
      goal: Number.isNaN(goalValue) ? 0 : goalValue,
      raised: Number.isNaN(raisedValue) ? 0 : raisedValue,
      bankDetails: fundDraft.bankDetails
        .filter((detail) => detail.bankName.trim() && detail.accountNumber.trim())
        .map((detail) => ({
          bankName: detail.bankName.trim(),
          accountName: detail.accountName.trim(),
          accountNumber: detail.accountNumber.trim(),
          ifsc: detail.ifsc?.trim() || undefined,
          swift: detail.swift?.trim() || undefined,
        })),
      contactEmail: fundDraft.contactEmail.trim() || undefined,
    });

    setModalVisible(false);
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <RoleSwitcher />

        {canManage && (
          <Pressable style={styles.actionButton} onPress={openCreateModal}>
            <Text style={styles.actionButtonText}>New Appeal</Text>
          </Pressable>
        )}

        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{modalTitle}</Text>
                  <Pressable onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalCloseText}>Close</Text>
                  </Pressable>
                </View>
                <TextInput
                  placeholder="Appeal title"
                  value={fundDraft.title}
                  onChangeText={(value) => setFundDraft((prev) => ({ ...prev, title: value }))}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Describe how the funds will be used"
                  value={fundDraft.description}
                  onChangeText={(value) => setFundDraft((prev) => ({ ...prev, description: value }))}
                  style={[styles.input, styles.multilineInput]}
                  multiline
                />
                <View style={styles.inlineInputs}>
                  <TextInput
                    placeholder="Goal (USD)"
                    value={fundDraft.goal}
                    onChangeText={(value) => setFundDraft((prev) => ({ ...prev, goal: value }))}
                    style={[styles.input, styles.inlineInput]}
                    keyboardType="numeric"
                  />
                  <TextInput
                    placeholder="Raised (USD)"
                    value={fundDraft.raised}
                    onChangeText={(value) => setFundDraft((prev) => ({ ...prev, raised: value }))}
                    style={[styles.input, styles.inlineInput]}
                    keyboardType="numeric"
                  />
                </View>
                <TextInput
                  placeholder="Contact email"
                  value={fundDraft.contactEmail}
                  onChangeText={(value) => setFundDraft((prev) => ({ ...prev, contactEmail: value }))}
                  style={styles.input}
                  keyboardType="email-address"
                />

                <View style={styles.bankHeaderRow}>
                  <Text style={styles.bankHeader}>Banking details</Text>
                  <Pressable style={styles.secondaryButton} onPress={addBankDetailRow}>
                    <Text style={styles.secondaryButtonText}>Add bank</Text>
                  </Pressable>
                </View>

                {fundDraft.bankDetails.map((detail, index) => (
                  <View key={index} style={styles.bankCard}>
                    <View style={styles.bankCardHeader}>
                      <Text style={styles.bankCardTitle}>Bank #{index + 1}</Text>
                      {fundDraft.bankDetails.length > 1 && (
                        <Pressable onPress={() => removeBankDetailRow(index)}>
                          <Text style={styles.bankRemoveText}>Remove</Text>
                        </Pressable>
                      )}
                    </View>
                    <TextInput
                      placeholder="Bank name"
                      value={detail.bankName}
                      onChangeText={(value) => updateBankDetail(index, 'bankName', value)}
                      style={styles.input}
                    />
                    <TextInput
                      placeholder="Account name"
                      value={detail.accountName}
                      onChangeText={(value) => updateBankDetail(index, 'accountName', value)}
                      style={styles.input}
                    />
                    <TextInput
                      placeholder="Account number"
                      value={detail.accountNumber}
                      onChangeText={(value) => updateBankDetail(index, 'accountNumber', value)}
                      style={styles.input}
                    />
                    <View style={styles.inlineInputs}>
                      <TextInput
                        placeholder="IFSC"
                        value={detail.ifsc}
                        onChangeText={(value) => updateBankDetail(index, 'ifsc', value)}
                        style={[styles.input, styles.inlineInput]}
                      />
                      <TextInput
                        placeholder="SWIFT"
                        value={detail.swift}
                        onChangeText={(value) => updateBankDetail(index, 'swift', value)}
                        style={[styles.input, styles.inlineInput]}
                      />
                    </View>
                  </View>
                ))}

                <Pressable style={styles.primaryButton} onPress={handleSaveFund}>
                  <Text style={styles.primaryButtonText}>{fundDraft.id ? 'Update appeal' : 'Publish appeal'}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Modal>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active relief appeals</Text>
          <Text style={styles.sectionSubtitle}>
            Share these details with supporters to coordinate swift relief funding.
          </Text>
        </View>

        {reliefFunds.map((fund) => (
          <View key={fund.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={styles.fundTitle}>{fund.title}</Text>
                <Text style={styles.fundDescription}>{fund.description}</Text>
                <View style={styles.goalRow}>
                  <Text style={styles.goalText}>Goal: {formatCurrency(fund.goal)}</Text>
                  <Text style={styles.goalRaised}>Raised: {formatCurrency(fund.raised)}</Text>
                </View>
                {fund.contactEmail ? <Text style={styles.contactText}>Contact: {fund.contactEmail}</Text> : null}
              </View>
              {canManage && (
                <View style={styles.actionColumn}>
                  <Pressable style={styles.secondaryButton} onPress={() => openEditModal(fund)}>
                    <Text style={styles.secondaryButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable style={styles.dangerButton} onPress={() => removeReliefFund(fund.id)}>
                    <Text style={styles.dangerButtonText}>Remove</Text>
                  </Pressable>
                </View>
              )}
            </View>
            <View style={styles.bankTable}>
              <View style={[styles.bankRow, styles.bankHeaderRowCompact]}>
                <Text style={[styles.bankCell, styles.bankCellWide]}>Bank</Text>
                <Text style={[styles.bankCell, styles.bankCellWide]}>Account name</Text>
                <Text style={styles.bankCell}>Account #</Text>
                <Text style={styles.bankCell}>IFSC</Text>
                <Text style={styles.bankCell}>SWIFT</Text>
              </View>
              {fund.bankDetails.map((detail, index) => (
                <View
                  key={`${fund.id}-${index}`}
                  style={[styles.bankRow, index % 2 === 0 ? styles.bankRowEven : styles.bankRowOdd]}>
                  <Text style={[styles.bankCell, styles.bankCellWide]}>{detail.bankName}</Text>
                  <Text style={[styles.bankCell, styles.bankCellWide]}>{detail.accountName}</Text>
                  <Text style={styles.bankCell}>{detail.accountNumber}</Text>
                  <Text style={styles.bankCell}>{detail.ifsc ?? '—'}</Text>
                  <Text style={styles.bankCell}>{detail.swift ?? '—'}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {reliefFunds.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.helperText}>No disaster appeals yet. Admins can publish the first one.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  container: {
    padding: 16,
    gap: 16,
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#9333ea',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    padding: 24,
    justifyContent: 'center',
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseText: {
    color: '#9333ea',
    fontWeight: '600',
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
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  actionColumn: {
    gap: 8,
    alignItems: 'flex-end',
  },
  fundTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  fundDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  goalRow: {
    flexDirection: 'row',
    gap: 16,
  },
  goalText: {
    fontWeight: '600',
    color: '#0f172a',
  },
  goalRaised: {
    fontWeight: '600',
    color: '#16a34a',
  },
  contactText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  bankTable: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bankRow: {
    flexDirection: 'row',
  },
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankHeaderRowCompact: {
    backgroundColor: '#1f2937',
  },
  bankCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  },
  bankCellWide: {
    flex: 1.2,
  },
  bankRowEven: {
    backgroundColor: '#f1f5f9',
  },
  bankRowOdd: {
    backgroundColor: '#fff',
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
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inlineInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineInput: {
    flex: 1,
  },
  bankHeader: {
    fontSize: 18,
    fontWeight: '700',
  },
  bankCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  bankCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankCardTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  bankRemoveText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#9333ea',
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
    backgroundColor: '#1d4ed8',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#fff',
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
  helperText: {
    fontSize: 15,
    color: '#6b7280',
  },
});
