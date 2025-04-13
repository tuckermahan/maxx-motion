import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Remove type imports that cause errors and we'll define types manually
type TimeRangeFilter = {
  startTime: string;
  endTime: string;
};

// Check if running in a simulator/emulator - simplified to avoid type errors
const isSimulator = () => {
  // In development mode, just disable health features
  // This avoids simulator errors and is a safe approach
  if (__DEV__) {
    return true;
  }
  return false;
};

// Only import health modules if not on simulator
let initialize: any = null;
let requestPermission: any = null;
let readRecords: any = null;

// Attempt to dynamically import health modules
if (!isSimulator()) {
  try {
    // Dynamic import to avoid errors during parsing
    const healthConnect = require('react-native-health-connect');
    initialize = healthConnect.initialize;
    requestPermission = healthConnect.requestPermission;
    readRecords = healthConnect.readRecords;
    console.log('Health modules loaded successfully');
  } catch (error) {
    console.log('Health modules not available:', error);
  }
}

// Define the health data types we want to read/write
export enum HealthMetric {
  STEPS = 'steps',
  DISTANCE = 'distance',
  HEART_RATE = 'heartRate',
  EXERCISE = 'exercise',
  CALORIES = 'calories',
}

class HealthService {
  isAvailable: boolean = false;

  constructor() {
    this.initialize();
  }

  async initialize() {
    // Immediately mark as unavailable on simulators
    if (isSimulator()) {
      console.log('Health Connect is not available in simulators');
      this.isAvailable = false;
      return;
    }

    // Health Connect is only available on iOS and Android
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      this.isAvailable = false;
      return;
    }

    try {
      // Only proceed if the initialize function is available
      if (!initialize) {
        console.log('Health Connect initialize function not available');
        this.isAvailable = false;
        return;
      }

      // Initialize the health connect client
      const initialized = await initialize();
      
      this.isAvailable = initialized;
      
      if (initialized) {
        console.log('Health Connect is available on this device');
      } else {
        console.log('Health Connect is not available on this device');
      }
    } catch (error) {
      console.error('Error initializing health service:', error);
      this.isAvailable = false;
    }
  }

  async requestPermissions() {
    if (!this.isAvailable || !requestPermission) {
      console.warn('Health service is not available on this device');
      return false;
    }

    try {
      // Request permissions for the health data we want to access
      const granted = await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'TotalCaloriesBurned' },
        { accessType: 'read', recordType: 'ExerciseSession' },
        { accessType: 'write', recordType: 'Steps' },
        { accessType: 'write', recordType: 'Distance' },
        { accessType: 'write', recordType: 'HeartRate' },
        { accessType: 'write', recordType: 'TotalCaloriesBurned' },
        { accessType: 'write', recordType: 'ExerciseSession' },
      ]);
      
      return Array.isArray(granted) && granted.length > 0;
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      return false;
    }
  }

  async getStepCount(startDate: Date, endDate: Date) {
    if (!this.isAvailable || !readRecords) {
      console.warn('Health service is not available on this device');
      return null;
    }

    try {
      const timeRangeFilter: TimeRangeFilter = {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      };
      
      const stepsResult = await readRecords('Steps', {
        timeRangeFilter,
      });
      
      return stepsResult;
    } catch (error) {
      console.error('Error reading step count:', error);
      return null;
    }
  }

  async getHeartRate(startDate: Date, endDate: Date) {
    if (!this.isAvailable || !readRecords) {
      console.warn('Health service is not available on this device');
      return null;
    }
    
    try {
      const timeRangeFilter: TimeRangeFilter = {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      };
      
      const heartRateResult = await readRecords('HeartRate', {
        timeRangeFilter,
      });
      
      return heartRateResult;
    } catch (error) {
      console.error('Error reading heart rate data:', error);
      return null;
    }
  }

  async getDistance(startDate: Date, endDate: Date) {
    if (!this.isAvailable || !readRecords) {
      console.warn('Health service is not available on this device');
      return null;
    }

    try {
      const timeRangeFilter: TimeRangeFilter = {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      };
      
      const distanceResult = await readRecords('Distance', {
        timeRangeFilter,
      });
      
      return distanceResult;
    } catch (error) {
      console.error('Error reading distance data:', error);
      return null;
    }
  }

  async getCaloriesBurned(startDate: Date, endDate: Date) {
    if (!this.isAvailable || !readRecords) {
      console.warn('Health service is not available on this device');
      return null;
    }

    try {
      const timeRangeFilter: TimeRangeFilter = {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      };
      
      const caloriesResult = await readRecords('TotalCaloriesBurned', {
        timeRangeFilter,
      });
      
      return caloriesResult;
    } catch (error) {
      console.error('Error reading calories data:', error);
      return null;
    }
  }

  async getWorkouts(startDate: Date, endDate: Date) {
    if (!this.isAvailable || !readRecords) {
      console.warn('Health service is not available on this device');
      return null;
    }

    try {
      const timeRangeFilter: TimeRangeFilter = {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      };
      
      const workoutsResult = await readRecords('ExerciseSession', {
        timeRangeFilter,
      });
      
      return workoutsResult;
    } catch (error) {
      console.error('Error reading workout data:', error);
      return null;
    }
  }
}

// Create singleton instance
export const healthService = new HealthService(); 