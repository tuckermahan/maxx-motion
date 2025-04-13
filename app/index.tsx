import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { handleAuthRouting } from '../lib/services/auth';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    // Check auth status and redirect if needed
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (data.session) {
          // User is logged in, route them accordingly
          await handleAuthRouting();
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    // Play video when component mounts
    if (videoRef.current) {
      videoRef.current.playAsync().catch(error => 
        console.log("Error playing video:", error)
      );
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.subtitle}>Checking login status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Video */}
      <Video
        ref={videoRef}
        style={styles.backgroundVideo}
        source={require('../assets/videos/your-video.mov')}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        isMuted={true}
      />
      
      {/* Content overlay */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>MAXX Motion</Text>
        <Text style={styles.subtitle}>Welcome to your move more competition app</Text>
        
        <View style={styles.buttonContainer}>
          <Link href="/login" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Go to Login</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent overlay
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 20,
  },
  button: {
    backgroundColor: '#0a7ea4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});