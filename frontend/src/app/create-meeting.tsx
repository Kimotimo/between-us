import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '@/config';

export default function CreateMeetingScreen() {
  const router = useRouter();
  const [meetingName, setMeetingName] = useState('');

  const handleCreateMeeting = async () => {
    if (!meetingName.trim()) {
      Alert.alert('모임 이름을 입력해주세요');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingName: meetingName,
          meetingTime: new Date().toISOString(),
          capacity: 5,
        }),
      });

      const data = await response.json();
      console.log(data);

      // 성공하면 참가자 추가 화면으로 이동 (모임 id를 같이 넘김)
      router.push(`/add-participant?meetingId=${data.id}`);
    } catch (error) {
      console.error(error);
      Alert.alert('모임 생성에 실패했어요');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>모임 만들기</Text>

      <TextInput
        style={styles.input}
        placeholder="모임 이름을 입력하세요"
        value={meetingName}
        onChangeText={setMeetingName}
      />

      <Pressable style={styles.button} onPress={handleCreateMeeting}>
        <Text style={styles.buttonText}>다음</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FEE500',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});