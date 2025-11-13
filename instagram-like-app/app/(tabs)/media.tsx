import { useState } from 'react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Linking, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RoleSwitcher } from '../../components/RoleSwitcher';
import { useApp } from '../../contexts/AppContext';
import { useResponsiveSpacing } from '../../hooks/use-responsive-spacing';
import { FileDescriptor } from '../../lib/api';

type PickerAsset = FileDescriptor | null;

export default function MediaScreen() {
  const { media, addMedia, deleteMedia, role, loading } = useApp();
  const layout = useResponsiveSpacing();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'image' | 'video'>('image');
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [file, setFile] = useState<PickerAsset>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const canCreate = role === 'admin';

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setDescription('');
    setType('image');
    setFile(null);
    setSubmitting(false);
  };

  const handleAddMedia = async () => {
    if (!title.trim()) {
      return;
    }
    try {
      setSubmitting(true);
      await addMedia({
        title: title.trim(),
        description: description.trim(),
        file: type === 'image' ? file : null,
        type,
      });
      resetForm();
      setCreateModalVisible(false);
    } catch (error) {
      console.warn('Failed to create media item', error);
      setSubmitting(false);
    }
  };

  const openMediaLink = (mediaUrl: string) => {
    Linking.openURL(mediaUrl).catch(() => undefined);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.fileName ?? 'media.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
      setUrl(asset.uri);
      setType('image');
    }
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
  const mediaHeight = layout.isCompact ? 200 : 240;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={contentStyle}>
        <RoleSwitcher />

        {canCreate && (
          <Pressable
            style={[styles.actionButton, constrainedWidth, isSubmitting && styles.disabledButton]}
            onPress={() => setCreateModalVisible(true)}
            disabled={isSubmitting}>
            <Text style={styles.actionButtonText}>{isSubmitting ? 'Publishing…' : 'New Media'}</Text>
          </Pressable>
        )}

        <Modal
          visible={isCreateModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setCreateModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={modalCardStyle}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Share new media</Text>
                <Pressable onPress={() => setCreateModalVisible(false)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
              </View>
              <View style={styles.toggleRow}>
                {(['image', 'video'] as const).map((option) => {
                  const isActive = option === type;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.toggleChip, isActive && styles.toggleChipActive]}
                      onPress={() => setType(option)}>
                      <Text style={[styles.toggleChipText, isActive && styles.toggleChipTextActive]}>
                        {option.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
              {type === 'video' ? (
                <TextInput placeholder="Video URL" value={url} onChangeText={setUrl} style={styles.input} />
              ) : (
                <>
                  <TextInput placeholder="Image caption" value={description} onChangeText={setDescription} style={styles.input} />
                  <View style={styles.imagePickerRow}>
                    <Pressable style={styles.secondaryButton} onPress={pickImage}>
                      <Text style={styles.secondaryButtonText}>{file ? 'Change image' : 'Pick from gallery'}</Text>
                    </Pressable>
                    {file && (
                      <Pressable onPress={() => setFile(null)}>
                        <Text style={styles.removeText}>Remove</Text>
                      </Pressable>
                    )}
                  </View>
                </>
              )}
              <TextInput
                placeholder="Description (optional)"
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.multilineInput]}
                multiline
              />
              <Pressable
                style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                onPress={handleAddMedia}
                disabled={isSubmitting}>
                <Text style={styles.primaryButtonText}>{isSubmitting ? 'Publishing…' : 'Publish media'}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <View style={[styles.sectionHeader, constrainedWidth]}>
          <Text style={styles.sectionTitle}>Media gallery</Text>
          <Text style={styles.sectionSubtitle}>
            {loading ? 'Loading gallery…' : 'Highlights from the community'}
          </Text>
        </View>

        {media.map((item) => (
          <View key={item.id} style={[styles.card, constrainedWidth]}>
            <View style={styles.cardHeader}>
              <Text style={styles.mediaTitle}>{item.title}</Text>
              {role === 'admin' && (
                <Pressable style={styles.deleteButton} onPress={() => deleteMedia(item.id)}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.mediaType}>{item.type.toUpperCase()}</Text>
            {item.type === 'image' ? (
              <Image
                source={{ uri: item.url }}
                style={[styles.mediaImage, { height: mediaHeight }]}
                contentFit="cover"
              />
            ) : (
              <Pressable style={styles.secondaryButton} onPress={() => openMediaLink(item.url)}>
                <Text style={styles.secondaryButtonText}>Play video</Text>
              </Pressable>
            )}
            {item.description ? <Text style={styles.mediaDescription}>{item.description}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#db2777',
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
    color: '#db2777',
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mediaTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#dc2626',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  mediaType: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
  mediaImage: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  mediaDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#db2777',
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
    backgroundColor: '#312e81',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  toggleChipActive: {
    backgroundColor: '#db2777',
    borderColor: '#db2777',
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
  removeText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});
