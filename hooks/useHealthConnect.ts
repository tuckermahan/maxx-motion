import { useState, useEffect } from 'react';
import { healthService } from '../lib/healthService';

export function useHealthConnect() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if health service is available
    const checkAvailability = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Wait for health service to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsAvailable(healthService.isAvailable);
        
        // If available, check if permissions are granted
        if (healthService.isAvailable) {
          const granted = await healthService.requestPermissions();
          setIsPermissionGranted(granted);
        }
      } catch (err) {
        setError('Error initializing health service');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, []);

  // Function to request permissions
  const requestPermissions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const granted = await healthService.requestPermissions();
      setIsPermissionGranted(granted);
      return granted;
    } catch (err) {
      setError('Error requesting health permissions');
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get step count for a date range
  const getStepCount = async (startDate: Date, endDate: Date) => {
    try {
      setIsLoading(true);
      setError(null);
      const steps = await healthService.getStepCount(startDate, endDate);
      return steps;
    } catch (err) {
      setError('Error getting step count');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get heart rate for a date range
  const getHeartRate = async (startDate: Date, endDate: Date) => {
    try {
      setIsLoading(true);
      setError(null);
      const heartRate = await healthService.getHeartRate(startDate, endDate);
      return heartRate;
    } catch (err) {
      setError('Error getting heart rate');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get distance for a date range
  const getDistance = async (startDate: Date, endDate: Date) => {
    try {
      setIsLoading(true);
      setError(null);
      const distance = await healthService.getDistance(startDate, endDate);
      return distance;
    } catch (err) {
      setError('Error getting distance');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get calories burned for a date range
  const getCaloriesBurned = async (startDate: Date, endDate: Date) => {
    try {
      setIsLoading(true);
      setError(null);
      const calories = await healthService.getCaloriesBurned(startDate, endDate);
      return calories;
    } catch (err) {
      setError('Error getting calories burned');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get workouts for a date range
  const getWorkouts = async (startDate: Date, endDate: Date) => {
    try {
      setIsLoading(true);
      setError(null);
      const workouts = await healthService.getWorkouts(startDate, endDate);
      return workouts;
    } catch (err) {
      setError('Error getting workouts');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAvailable,
    isPermissionGranted,
    isLoading,
    error,
    requestPermissions,
    getStepCount,
    getHeartRate,
    getDistance,
    getCaloriesBurned,
    getWorkouts,
  };
} 