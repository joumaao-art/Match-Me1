/**
 * Messages Screen - Conversation list and chat.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, borderRadius, fontSize } from '../theme';
import type { Conversation, ChatMessage } from '../types';

const mockConversations: Conversation[] = [
  { id: '1', name: 'TechCorp', role: 'company', lastMessage: 'We would love to schedule an interview!', timestamp: '2:30 PM', unread: 2, online: true },
  { id: '2', name: 'DataFlow', role: 'company', lastMessage: 'Thank you for your application.', timestamp: '11:00 AM', unread: 0, online: false },
  { id: '3', name: 'Ahmed Hassan', role: 'job_seeker', lastMessage: 'I am available next week.', timestamp: 'Yesterday', unread: 1, online: true },
];

const mockMessages: ChatMessage[] = [
  { id: '1', content: 'Hi! We reviewed your profile and are very impressed.', sender: 'other', timestamp: '2:15 PM', read: true },
  { id: '2', content: 'Thank you! I am very interested in the position.', sender: 'me', timestamp: '2:20 PM', read: true },
  { id: '3', content: 'We would love to schedule an interview!', sender: 'other', timestamp: '2:30 PM', read: false },
];

export function MessagesScreen() {
  const { colors } = useTheme();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setMessages([...messages, msg]);
    setNewMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  if (selectedConversation) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Header */}
        <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedConversation(null)}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={[styles.chatName, { color: colors.text }]}>{selectedConversation.name}</Text>
            <Text style={[styles.chatStatus, { color: selectedConversation.online ? colors.success : colors.textSecondary }]}>
              {selectedConversation.online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.sender === 'me' ? styles.myMessage : styles.otherMessage]}>
              <View style={[
                styles.bubble,
                { backgroundColor: item.sender === 'me' ? colors.primary : colors.muted },
              ]}>
                <Text style={{ color: item.sender === 'me' ? colors.primaryForeground : colors.text, fontSize: fontSize.sm }}>
                  {item.content}
                </Text>
                <Text style={[styles.timestamp, { color: item.sender === 'me' ? colors.primaryForeground + '99' : colors.textSecondary }]}>
                  {item.timestamp} {item.sender === 'me' && (item.read ? '✓✓' : '✓')}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Input */}
        <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.messageInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary, opacity: newMessage.trim() ? 1 : 0.5 }]}
            onPress={handleSend}
            disabled={!newMessage.trim()}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
      <FlatList
        data={mockConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.conversationItem, { borderBottomColor: colors.border }]}
            onPress={() => setSelectedConversation(item)}
            activeOpacity={0.7}
          >
            <View style={styles.convAvatar}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
                <Text>{item.role === 'company' ? '🏢' : '👤'}</Text>
              </View>
              {item.online && <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />}
            </View>
            <View style={styles.convInfo}>
              <View style={styles.convHeader}>
                <Text style={[styles.convName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.convTime, { color: colors.textSecondary }]}>{item.timestamp}</Text>
              </View>
              <Text style={[styles.convMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>
            {item.unread > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: fontSize.xl, fontWeight: '700', padding: spacing.md },
  conversationItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  convAvatar: { position: 'relative', marginRight: spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  convInfo: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  convName: { fontSize: fontSize.sm, fontWeight: '600' },
  convTime: { fontSize: fontSize.xs },
  convMessage: { fontSize: fontSize.xs },
  unreadBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, gap: spacing.sm },
  backText: { fontSize: fontSize.md, fontWeight: '500' },
  chatHeaderInfo: {},
  chatName: { fontSize: fontSize.md, fontWeight: '600' },
  chatStatus: { fontSize: fontSize.xs },
  messagesList: { padding: spacing.md, gap: spacing.sm },
  messageBubble: { marginBottom: spacing.xs },
  myMessage: { alignItems: 'flex-end' },
  otherMessage: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', padding: spacing.sm, borderRadius: borderRadius.lg },
  timestamp: { fontSize: 10, marginTop: 2, textAlign: 'right' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderTopWidth: 1, gap: spacing.sm },
  messageInput: { flex: 1, height: 40, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, fontSize: fontSize.sm },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

export default MessagesScreen;