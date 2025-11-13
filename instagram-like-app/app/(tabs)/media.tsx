import { useState } from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Image } from 'expo-image';

import { RoleSwitcher } from '../../components/RoleSwitcher';
import { useApp } from '../../contexts/AppContext';

export default function MediaScreen() {
  const { media, addMedia, role } = useApp();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'image' | 'video'>('image');

  const canCreate = role === 'admin';

  const handleAddMedia = () => {
    if (!title.trim() || !url.trim()) {
      return;
    }

    addMedia({
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      type,
    });

    setTitle('');
    setUrl('');
    setDescription('');
    setType('image');
  };

  const openMedia = (mediaUrl: string) => {
    Linking.openURL(mediaUrl).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <RoleSwitcher />

        {canCreate && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Share new media</Text>
            <View style={styles.toggleRow}>
              {(['image', 'video'] as const).map((option) => {
                const isActive = option === type;
                return (
                  <Text
                    key={option}
                    style={[styles.toggleChip, isActive && styles.toggleChipActive]}
                    onPress={() => setType(option)}>
                    {option.toUpperCase()}
                  </Text>
                );
              })}
            </View>
            <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
            <TextInput placeholder="Media URL" value={url} onChangeText={setUrl} style={styles.input} />
            <TextInput
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.multilineInput]}
              multiline
            />
            <Text style={styles.primaryButton} onPress={handleAddMedia}>
              Publish media
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Media gallery</Text>
          <Text style={styles.sectionSubtitle}>Highlights from the community</Text>
        </View>

        {media.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.mediaTitle}>{item.title}</Text>
            <Text style={styles.mediaType}>{item.type.toUpperCase()}</Text>
            {item.type === 'image' ? (
              <Image source={{ uri: item.url }} style={styles.mediaImage} contentFit="cover" />
            ) : (
              <Text style={styles.secondaryButton} onPress={() => openMedia(item.url)}>
                Play video
              </Text>
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
    backgroundColor: '#db2777',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    fontWeight: '600',
    overflow: 'hidden',
  },
  mediaTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  mediaType: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
  mediaImage: {
    height: 220,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  mediaDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#312e81',
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
    backgroundColor: '#db2777',
    borderColor: '#db2777',
    color: '#fff',
  },
});
