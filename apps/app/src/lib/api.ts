import { Platform } from 'react-native';
import { createClient } from '@repo/core';

// Android emulators reach the host machine at 10.0.2.2
export const API = process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000');
export const client = createClient(API);
