import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RoleSwitcher } from '../../components/RoleSwitcher';
import { useApp } from '../../contexts/AppContext';

export default function PostsScreen() {
  const { posts, addPost, addCommentToPost, role } = useApp();
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);

  const canCreatePost = role === 'admin';

  const authorLabel = useMemo(() => {
    if (role === 'admin') return 'Admin';
    if (role === 'member') return 'Member';
    return 'Community Guest';
  }, [role]);

  const resetPostForm = () => {
    setPostTitle('');
    setPostContent('');
    setPostImage(null);
  };

  const handleCreatePost = () => {
    if (!postTitle.trim() || !postContent.trim()) {
      return;
    }
    addPost({
      title: postTitle.trim(),
      content: postContent.trim(),
      image: postImage ?? undefined,
    });
    resetPostForm();
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
      setPostImage(result.assets[0]?.uri ?? null);
    }
  };

  const handleComment = (postId: string) => {
    const draft = commentDrafts[postId];
    if (!draft || !draft.trim()) {
      return;
    }
    addCommentToPost(postId, {
      author: authorLabel,
      message: draft.trim(),
    });
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <RoleSwitcher />

        {canCreatePost && (
          <Pressable style={styles.actionButton} onPress={() => setCreateModalVisible(true)}>
            <Text style={styles.actionButtonText}>New Post</Text>
          </Pressable>
        )}

        <Modal
          visible={isCreateModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setCreateModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create an update</Text>
                <Pressable onPress={() => setCreateModalVisible(false)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
              </View>
              <TextInput
                placeholder="Post title"
                value={postTitle}
                onChangeText={setPostTitle}
                style={styles.input}
              />
              <TextInput
                placeholder="Share what's new"
                value={postContent}
                onChangeText={setPostContent}
                style={[styles.input, styles.multilineInput]}
                multiline
              />
              <View style={styles.imagePickerRow}>
                <Pressable style={styles.secondaryButton} onPress={pickImage}>
                  <Text style={styles.secondaryButtonText}>{postImage ? 'Change image' : 'Add image'}</Text>
                </Pressable>
                {postImage && (
                  <Pressable onPress={() => setPostImage(null)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                )}
              </View>
              {postImage && <Image source={{ uri: postImage }} style={styles.previewImage} contentFit="cover" />}
              <Pressable style={styles.primaryButton} onPress={handleCreatePost}>
                <Text style={styles.primaryButtonText}>Publish post</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest posts</Text>
          <Text style={styles.sectionSubtitle}>Updates authored by the admin team</Text>
        </View>

        {posts.map((post) => (
          <View key={post.id} style={styles.card}>
            <Text style={styles.postTitle}>{post.title}</Text>
            {post.image ? <Image source={{ uri: post.image }} style={styles.cardImage} contentFit="cover" /> : null}
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.commentsHeader}>
              <Text style={styles.cardSubtitle}>Comments</Text>
              <Text style={styles.commentCount}>{post.comments.length}</Text>
            </View>
            {post.comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentAuthor}>{comment.author}</Text>
                <Text style={styles.commentMessage}>{comment.message}</Text>
                <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleString()}</Text>
              </View>
            ))}
            <View style={styles.commentComposer}>
              <TextInput
                placeholder="Add a comment"
                value={commentDrafts[post.id] ?? ''}
                onChangeText={(value) => setCommentDrafts((prev) => ({ ...prev, [post.id]: value }))}
                style={[styles.input, styles.commentInput]}
              />
              <Pressable style={styles.secondaryButton} onPress={() => handleComment(post.id)}>
                <Text style={styles.secondaryButtonText}>Post comment</Text>
              </Pressable>
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
    backgroundColor: '#f3f4f6',
  },
  container: {
    padding: 16,
    gap: 16,
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
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
    color: '#6366f1',
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
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardImage: {
    height: 200,
    borderRadius: 12,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#374151',
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
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  commentComposer: {
    gap: 8,
  },
  comment: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 4,
    backgroundColor: '#f9fafb',
  },
  commentAuthor: {
    fontWeight: '600',
  },
  commentMessage: {
    fontSize: 15,
    color: '#374151',
  },
  commentDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  commentInput: {
    backgroundColor: '#fff',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
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
    backgroundColor: '#111827',
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
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentCount: {
    backgroundColor: '#e0e7ff',
    color: '#1d4ed8',
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
