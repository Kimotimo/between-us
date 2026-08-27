import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create-meeting" />
      <Stack.Screen name="add-participant" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
