import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { API_URL } from '@/config';

export default function ResultScreen() {
  const { meetingId } = useLocalSearchParams();
  const [midpoint, setMidpoint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMidpoint = async () => {
      try {
        const response = await fetch(`${API_URL}/meetings/${meetingId}/midpoint`);
        const data = await response.json();
        setMidpoint(data.midpoint);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMidpoint();
  }, [meetingId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>중간지점 계산 중...</Text>
      </View>
    );
  }

  if (!midpoint) {
    return (
      <View style={styles.centered}>
        <Text>중간지점을 계산할 수 없어요</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: midpoint.latitude,
          longitude: midpoint.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{
            latitude: midpoint.latitude,
            longitude: midpoint.longitude,
          }}
          title="중간지점"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
