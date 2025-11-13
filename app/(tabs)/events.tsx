import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RoleSwitcher } from '../../components/RoleSwitcher';
import { useApp } from '../../contexts/AppContext';

export default function EventsScreen() {
  const { events, addEvent, role } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [location, setLocation] = useState('');

  const canCreate = role === 'admin';

  const handleCreateEvent = () => {
    if (!title.trim() || !description.trim() || !startsAt.trim() || !location.trim()) {
      return;
    }

    addEvent({
      title: title.trim(),
      description: description.trim(),
      startsAt: new Date(startsAt).toISOString(),
      location: location.trim(),
    });

    setTitle('');
    setDescription('');
    setStartsAt('');
    setLocation('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <RoleSwitcher />

        {canCreate && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Schedule an event</Text>
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
            <Text style={styles.primaryButton} onPress={handleCreateEvent}>
              Publish event
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming events</Text>
          <Text style={styles.sectionSubtitle}>Community gatherings and important dates</Text>
        </View>

        {events.map((event) => {
          const readableDate = new Date(event.startsAt).toLocaleString();
          return (
            <View key={event.id} style={styles.card}>
              <Text style={styles.eventTitle}>{event.title}</Text>
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
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#16a34a',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    fontWeight: '600',
    overflow: 'hidden',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
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
});

