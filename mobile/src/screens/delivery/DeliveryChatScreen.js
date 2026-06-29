import { useCallback, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer, EmptyState } from '../../components/UI';
import client from '../../api/client';
import { colors } from '../../theme';

export default function DeliveryChatScreen() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  const load = useCallback(async () => {
    const { data } = await client.get('/chat/mine');
    setMessages(data.messages || []);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const send = async () => {
    if (!text.trim()) return;
    await client.post('/chat/mine', { body: text });
    setText('');
    load();
  };

  return (
    <ScreenContainer scroll={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<EmptyState text="No messages yet. Say hello to the JEDIDA admin team." />}
          renderItem={({ item }) => (
            <View style={{
              alignSelf: item.sender_id === item.user_id ? 'flex-end' : 'flex-start',
              backgroundColor: colors.creamDim, padding: 10, borderRadius: 10, marginBottom: 8, maxWidth: '80%'
            }}>
              <Text>{item.body}</Text>
            </View>
          )}
        />
        <View style={{ flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderColor: colors.line }}>
          <TextInput
            style={{ flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 14, backgroundColor: '#fff' }}
            value={text} onChangeText={setText} placeholder="Message the admin team…"
          />
          <TouchableOpacity onPress={send} style={{ backgroundColor: colors.forest, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 10 }}>
            <Text style={{ color: colors.cream, fontWeight: '700' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
