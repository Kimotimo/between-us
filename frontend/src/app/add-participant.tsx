import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_URL } from '@/config';

export default function AddParticipantScreen() {
  const router = useRouter();
  const { meetingId } = useLocalSearchParams();

  console.log("전달받은 meetingId:", meetingId);

  const [guestName, setGuestName] = useState('');
  const [startArea, setStartArea] = useState('');

  const handleAddParticipant = async () => {
    if (!guestName.trim() || !startArea.trim()) {
      Alert.alert('이름과 출발지를 모두 입력해주세요');
      return;
    }

    try {
      console.log("1단계: 참가자 생성 시작");
      const participantResponse = await fetch(`${API_URL}/meetings/${meetingId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: guestName,
          transportType: '대중교통',
        }),
      });
      const participant = await participantResponse.json();
      console.log("1단계 완료:", participant);

      console.log("2단계: 주소 검색 시작");
      const searchResponse = await fetch(`${API_URL}/search/address?query=${encodeURIComponent(startArea)}`);
      const results = await searchResponse.json();
      console.log("2단계 완료:", results);

      if (results.length === 0) {
        Alert.alert('해당 주소를 찾을 수 없어요');
        return;
      }

      const firstResult = results[0];

      console.log("3단계: 출발지 저장 시작");
      const locationResponse = await fetch(`${API_URL}/participants/${participant.id}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startArea: firstResult.address,
          latitude: firstResult.latitude,
          longitude: firstResult.longitude,
        }),
      });
      const locationResult = await locationResponse.json();
      console.log("3단계 완료:", locationResult);

      setGuestName('');
      setStartArea('');
      Alert.alert('출발지가 추가됐어요!');
    } catch (error) {
      console.error("에러 발생:", error);
      Alert.alert('참가자 추가에 실패했어요');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>출발지 추가</Text>

      <TextInput
        style={styles.input}
        placeholder="이름 (예: 참가자1)"
        value={guestName}
        onChangeText={setGuestName}
      />
      <TextInput
        style={styles.input}
        placeholder="출발지 (예: 강남역)"
        value={startArea}
        onChangeText={setStartArea}
      />

      <Pressable style={styles.button} onPress={handleAddParticipant}>
        <Text style={styles.buttonText}>추가하기</Text>
      </Pressable>

      <Pressable
        style={styles.nextButton}
        onPress={() => router.push(`/result?meetingId=${meetingId}`)}
      >
        <Text style={styles.nextButtonText}>중간지점 계산하기 →</Text>
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
    marginBottom: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    padding: 12,
  },
  nextButtonText: {
    fontSize: 14,
    color: '#666',
  },
});
