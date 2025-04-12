import { Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function Home() {
  return (
    <View>
      <Text>Welcome to the Fitness Challenge!</Text>
    </View>
  );
}