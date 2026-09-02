import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { API_URL } from '@/config';

type LocationResult = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export default function HomeScreen() {
  const [inputs, setInputs] = useState(['', '']); // 기본 2개 입력창
  const [markers, setMarkers] = useState<LocationResult[]>([]);
  const [midpoint, setMidpoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const addInput = () => {
    if (inputs.length >= 6) {
      Alert.alert('최대 6명까지 입력할 수 있어요');
      return;
    }
    setInputs([...inputs, '']);
  };

  const removeInput = (index: number) => {
    if (inputs.length <= 2) return; // 최소 2개는 유지
    setInputs(inputs.filter((_, i) => i !== index));
  };

  const updateInput = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const handleFindMidpoint = async () => {
    const filledInputs = inputs.filter((v) => v.trim() !== '');
    if (filledInputs.length < 2) {
      Alert.alert('출발지를 2개 이상 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      // 1. 모임 자동 생성 (사용자에게는 노출 안 됨)
      const meetingResponse = await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingName: '빠른 검색',
          meetingTime: new Date().toISOString(),
          capacity: filledInputs.length,
        }),
      });
      const meeting = await meetingResponse.json();

      // 2. 각 출발지마다: 검색 -> 참가자 생성 -> 출발지 저장
      const resolvedMarkers: LocationResult[] = [];

      for (const address of filledInputs) {
        const searchResponse = await fetch(
          `${API_URL}/search/address?query=${encodeURIComponent(address)}`
        );
        const results = await searchResponse.json();

        if (results.length === 0) {
          Alert.alert(`"${address}"를 찾을 수 없어요`);
          continue;
        }

        const place = results[0];

        const participantResponse = await fetch(
          `${API_URL}/meetings/${meeting.id}/participants`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guestName: address, transportType: '대중교통' }),
          }
        );
        const participant = await participantResponse.json();

        await fetch(`${API_URL}/participants/${participant.id}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startArea: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
          }),
        });

        resolvedMarkers.push(place);
      }

      setMarkers(resolvedMarkers);

      // 3. 중간지점 계산
      const midpointResponse = await fetch(`${API_URL}/meetings/${meeting.id}/midpoint`);
      const midpointData = await midpointResponse.json();
      setMidpoint(midpointData.midpoint);
    } catch (error) {
      console.error(error);
      Alert.alert('중간지점을 계산하는 중 오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 상단: 입력 영역 */}
      <View style={styles.inputSection}>
        <ScrollView>
          {inputs.map((value, index) => (
            <View key={index} style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={`출발지 ${index + 1}`}
                value={value}
                onChangeText={(text) => updateInput(index, text)}
              />
              {inputs.length > 2 && (
                <Pressable onPress={() => removeInput(index)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>×</Text>
                </Pressable>
              )}
            </View>
          ))}
        </ScrollView>

        <Pressable onPress={addInput} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ 출발지 추가</Text>
        </Pressable>

        <Pressable
          onPress={handleFindMidpoint}
          style={styles.findButton}
          disabled={loading}
        >
          <Text style={styles.findButtonText}>
            {loading ? '계산 중...' : '중간지점 찾기'}
          </Text>
        </Pressable>
      </View>

      {/* 하단: 지도 영역 */}
      <View style={styles.mapSection}>
        <MapView
          style={styles.map}
          region={
            midpoint
              ? {
                  latitude: midpoint.latitude,
                  longitude: midpoint.longitude,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                }
              : {
                  latitude: 37.5665,
                  longitude: 126.978,
                  latitudeDelta: 0.2,
                  longitudeDelta: 0.2,
                }
          }
        >
          {markers.map((marker, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
              title={marker.name}
              pinColor="blue"
            />
          ))}
          {midpoint && (
            <Marker
              coordinate={midpoint}
              title="중간지점"
              pinColor="red"
            />
          )}
        </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inputSection: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    maxHeight: '45%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  removeButton: {
    paddingHorizontal: 10,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#999',
  },
  addButton: {
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#0066FF',
    fontSize: 14,
  },
  findButton: {
    backgroundColor: '#FEE500',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  findButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  mapSection: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});