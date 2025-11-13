import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RoleSwitcher } from '../../components/RoleSwitcher';
import { useApp } from '../../contexts/AppContext';
import { useResponsiveSpacing } from '../../hooks/use-responsive-spacing';
import { FileDescriptor } from '../../lib/api';

type MemberStatus = 'active' | 'pending' | 'inactive';

type PickerAsset = FileDescriptor | null;

export default function MembersScreen() {
  const { members, role, addOrUpdateMember, removeMember, loading } = useApp();
  const layout = useResponsiveSpacing();
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [memberStatus, setMemberStatus] = useState<MemberStatus>('active');
  const [roleLabel, setRoleLabel] = useState('Member');
  const [avatar, setAvatar] = useState<PickerAsset>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const canManage = role === 'admin';

  const modalTitle = useMemo(
    () => (editingMemberId ? 'Update member' : 'Register member'),
    [editingMemberId],
  );

  const openCreateModal = () => {
    setEditingMemberId(null);
    setMemberName('');
    setMemberEmail('');
    setPhoneNumber('');
    setMonthlyContribution('');
    setMemberStatus('active');
    setRoleLabel('Member');
    setAvatar(null);
    setModalVisible(true);
  };

  const openEditModal = (memberId: string) => {
    const member = members.find((item) => item.id === memberId);
    if (!member) {
      return;
    }
    setEditingMemberId(member.id);
    setMemberName(member.name);
    setMemberEmail(member.email);
    setPhoneNumber(member.phoneNumber ?? '');
    setMonthlyContribution(member.monthlyContribution ? String(member.monthlyContribution) : '');
    setMemberStatus(member.status);
    setRoleLabel(member.roleLabel ?? 'Member');
    setAvatar(member.avatar ? { uri: member.avatar } : null);
    setModalVisible(true);
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setAvatar({
        uri: asset.uri,
        name: asset.fileName ?? 'avatar.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  const handleSaveMember = async () => {
    if (!memberName.trim() || !memberEmail.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      await addOrUpdateMember({
        id: editingMemberId ?? undefined,
        name: memberName.trim(),
        email: memberEmail.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        roleLabel,
        status: memberStatus,
        avatar,
      });
      setModalVisible(false);
    } catch (error) {
      console.warn('Failed to save member', error);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteMember = (memberId: string) => {
    const member = members.find((item) => item.id === memberId);
    Alert.alert(
      'Remove member',
      `Remove ${member?.name ?? 'this member'} from the roster? Their payment history will also be cleared.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMember(memberId),
        },
      ],
    );
  };

  const constrainedWidth = { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' };
  const contentStyle = [
    styles.container,
    {
      paddingHorizontal: layout.horizontal,
      paddingVertical: layout.vertical,
      gap: layout.gap,
    },
  ];
  const modalCardStyle = [styles.modalCard, { width: layout.modalWidth }];
  const avatarSize = layout.isCompact ? 56 : 64;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={contentStyle}>
        <RoleSwitcher />

        {canManage && (
          <Pressable
            style={[styles.actionButton, constrainedWidth, isSubmitting && styles.disabledButton]}
            onPress={openCreateModal}
            disabled={isSubmitting}>
            <Text style={styles.actionButtonText}>{isSubmitting ? 'Saving…' : 'New Member'}</Text>
          </Pressable>
        )}

        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={modalCardStyle}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modalTitle}</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
              </View>
              <TextInput placeholder="Full name" value={memberName} onChangeText={setMemberName} style={styles.input} />
              <TextInput placeholder="Email" value={memberEmail} onChangeText={setMemberEmail} style={styles.input} />
              <TextInput
                placeholder="Phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={styles.input}
                keyboardType="phone-pad"
              />
              <TextInput
                placeholder="Monthly contribution (display only)"
                value={monthlyContribution}
                onChangeText={setMonthlyContribution}
                style={styles.input}
                editable={false}
              />
              <TextInput
                placeholder="Role (e.g. President)"
                value={roleLabel}
                onChangeText={setRoleLabel}
                style={styles.input}
              />
              <View style={styles.toggleRow}>
                {(['active', 'pending', 'inactive'] as const).map((status) => {
                  const isActive = status === memberStatus;
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
              <View style={styles.imagePickerRow}>
                <Pressable style={styles.secondaryButton} onPress={handlePickAvatar}>
                  <Text style={styles.secondaryButtonText}>{avatar ? 'Change photo' : 'Add photo'}</Text>
                </Pressable>
                {avatar && (
                  <Pressable onPress={() => setAvatar(null)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                )}
              </View>
              {avatar && (
                <Image
                  source={{ uri: avatar.uri }}
                  style={[styles.avatarPreview, { width: avatarSize * 1.6, height: avatarSize * 1.6 }]}
                  contentFit="cover"
                />
              )}
              <Pressable
                style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                onPress={handleSaveMember}
                disabled={isSubmitting}>
                <Text style={styles.primaryButtonText}>{isSubmitting ? 'Saving…' : modalTitle}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <View style={[styles.sectionHeader, constrainedWidth]}>
          <Text style={styles.sectionTitle}>Member roster</Text>
          <Text style={styles.sectionSubtitle}>
            {loading ? 'Loading roster…' : 'View and maintain the active membership list'}
          </Text>
        </View>

        {members.map((member) => (
          <View key={member.id} style={[styles.card, constrainedWidth]}>
            <View style={styles.cardHeader}>
              {member.avatar ? (
                <Image
                  source={{ uri: member.avatar }}
                  style={[styles.cardAvatar, { width: avatarSize, height: avatarSize }]}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatarFallback, { width: avatarSize, height: avatarSize }]}> 
                  <Text style={styles.avatarFallbackText}>{member.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
                {member.phoneNumber ? <Text style={styles.memberMeta}>Phone: {member.phoneNumber}</Text> : null}
                {member.roleLabel ? <Text style={styles.memberMeta}>Role: {member.roleLabel}</Text> : null}
                <Text style={styles.memberMeta}>Status: {member.status.toUpperCase()}</Text>
              </View>
              {canManage && (
                <View style={styles.actionColumn}>
                  <Pressable style={styles.secondaryButton} onPress={() => openEditModal(member.id)}>
                    <Text style={styles.secondaryButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable style={styles.dangerButton} onPress={() => confirmDeleteMember(member.id)}>
                    <Text style={styles.dangerButtonText}>Remove</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        ))}
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
  actionButton: {
    backgroundColor: '#0f766e',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    alignSelf: 'center',
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
    color: '#0f766e',
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
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  cardAvatar: {
    borderRadius: 999,
  },
  avatarFallback: {
    borderRadius: 999,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 24,
  },
  actionColumn: {
    gap: 8,
    alignItems: 'flex-end',
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
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9fafb',
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
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarPreview: {
    borderRadius: 999,
    alignSelf: 'center',
  },
  removeText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});
