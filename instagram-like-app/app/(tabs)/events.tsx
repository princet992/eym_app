import { useState } from 'react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RoleSwitcher } from '../../components/RoleSwitcher';
import { useApp } from '../../contexts/AppContext';
import { useResponsiveSpacing } from '../../hooks/use-responsive-spacing';

export default function EventsScreen() {
  const { events, addEvent, role } = useApp();
  const layout = useResponsiveSpacing();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [location, setLocation] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);

  const canCreate = role === 'admin';

  const resetEventForm = () => {
    setTitle('');
    setDescription('');
    setStartsAt('');
    setLocation('');
    setCoverImage(null);
  };

  const handleCreateEvent = () => {
    if (!title.trim() || !description.trim() || !startsAt.trim() || !location.trim()) {
      return;
    }

    const date = new Date(startsAt.trim());
    if (Number.isNaN(date.getTime())) {
      return;
    }

    addEvent({
      title: title.trim(),
      description: description.trim(),
      startsAt: date.toISOString(),
      location: location.trim(),
      coverImage: coverImage ?? undefined,
    });

    resetEventForm();
    setCreateModalVisible(false);
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
      setCoverImage(result.assets[0]?.uri ?? null);
    }
  };

  const contentStyle = [
    styles.container,
    {
      paddingHorizontal: layout.horizontal,
      paddingVertical: layout.vertical,
      gap: layout.gap,
    },
  ];
  const constrainedWidth = { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' };
  const modalCardStyle = [styles.modalCard, { width: layout.modalWidth }];
  const previewHeight = layout.isCompact ? 160 : 220;
  const cardImageHeight = layout.isCompact ? 180 : 240;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={contentStyle}>
        <RoleSwitcher />

        {canCreate && (
          <Pressable style={[styles.actionButton, constrainedWidth]} onPress={() => setCreateModalVisible(true)}>
            <Text style={styles.actionButtonText}>New Event</Text>
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
                <Text style={styles.modalTitle}>Schedule an event</Text>
                <Pressable onPress={() => setCreateModalVisible(false)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
              </View>
              <TextInput placeholder="Event name" value={title} onChangeText={setTitle} style={styles.input} />
              <TextInput
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.multilineInput]}
                multiline
              />
              <TextInput
                placeholder="Start date (e.g. 2025-11-25 18:00)"
                value={startsAt}
                onChangeText={setStartsAt}
                style={styles.input}
              />
              <TextInput placeholder="Location" value={location} onChangeText={setLocation} style={styles.input} />
              <View style={styles.imagePickerRow}>
                <Pressable style={styles.secondaryButton} onPress={pickImage}>
                  <Text style={styles.secondaryButtonText}>{coverImage ? 'Change image' : 'Add image'}</Text>
                </Pressable>
                {coverImage && (
                  <Pressable onPress={() => setCoverImage(null)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                )}
              </View>
              {coverImage && (
                <Image
                  source={{ uri: coverImage }}
                  style={[styles.previewImage, { height: previewHeight }]}
                  contentFit="cover"
                />
              )}
              <Pressable style={styles.primaryButton} onPress={handleCreateEvent}>
                <Text style={styles.primaryButtonText}>Publish event</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <View style={[styles.sectionHeader, constrainedWidth]}>
          <Text style={styles.sectionTitle}>Upcoming events</Text>
          <Text style={styles.sectionSubtitle}>Community gatherings and important dates</Text>
        </View>

        {events.map((event) => {
          const readableDate = new Date(event.startsAt).toLocaleString();
          return (
            <View key={event.id} style={[styles.card, constrainedWidth]}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              {event.coverImage ? (
                <Image
                  source={{ uri: event.coverImage }}
                  style={[styles.cardImage, { height: cardImageHeight }]}
                  contentFit="cover"
                />
              ) : null}
              <Text style={styles.eventDate}>{readableDate}</Text>
              <Text style={styles.eventLocation}>{event.location}</Text>
              <Text style={styles.eventDescription}>{event.description}</Text>
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
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#16a34a',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#16a34a',
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
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardImage: {
    width: '100%',
    borderRadius: 12,
  },
  eventDate: {
    fontSize: 15,
    color: '#1d4ed8',
  },
  eventLocation: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  eventDescription: {
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
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewImage: {
    width: '100%',
    borderRadius: 12,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#16a34a',
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
    backgroundColor: '#1f2937',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  removeText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});
