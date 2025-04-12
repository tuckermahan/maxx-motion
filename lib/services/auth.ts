import { supabase } from '../supabase';
import { router } from 'expo-router';

// Check if a user exists in the database
export async function checkUserExists(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
  
  return !!data;
}

// Check if a user belongs to any event
export async function checkUserInEvent(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
    console.error('Error checking user event membership:', error);
  }
  
  return !!data;
}

// Check if a user belongs to any team
export async function checkUserInTeam(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
    console.error('Error checking user team membership:', error);
  }
  
  return !!data;
}

// Create a new user profile
export async function createUserProfile(userId: string, email: string, fullName: string, avatarUrl?: string): Promise<boolean> {
  try {
    console.log(`Creating profile for user ${userId} with email ${email}`);
    
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        email: email, // Include email from Google sign-in
        avatar_url: avatarUrl || null,
        is_admin: false,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error creating user profile:', error);
      
      // Try with minimal fields if the first attempt fails
      const { error: minimalError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          email: email // Still include email in the minimal version
        });
        
      if (minimalError) {
        console.error('Error creating minimal profile:', minimalError);
        return false;
      }
      
      console.log('Created minimal profile with ID, name, and email');
      return true;
    }
    
    console.log('Successfully created profile for:', email);
    return true;
  } catch (err) {
    console.error('Unexpected error creating user profile:', err);
    return false;
  }
}

// Handle auth routing
export async function handleAuthRouting() {
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.error('No active session found:', error);
      router.replace('/login');
      return;
    }
    
    const userId = session.user.id;
    const email = session.user.email || '';
    const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0];
    const avatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null;
    
    console.log('Auth routing for user:', userId);
    console.log('User email:', email);
    console.log('User metadata:', JSON.stringify(session.user.user_metadata));
    
    // Check if user exists in our profiles table by directly checking the table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking for existing profile:', profileError);
    }
    
    // User doesn't exist if no profile data is found
    const userExists = !!profileData;
    console.log('User exists in profiles?', userExists);
    
    if (!userExists) {
      // Create new profile with email from Google Auth
      console.log('Creating new profile for user:', userId, 'with email:', email);
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          email: email, // Include email from Google sign-in
          avatar_url: avatarUrl
          // Omitting is_admin, will default to false in the database
        });
      
      if (insertError) {
        console.error('Failed to create profile:', insertError);
        
        // If that failed, try with minimal fields but still include email
        const { error: minimalError } = await supabase
          .from('profiles')
          .insert({ 
            id: userId,
            email: email // Include email in minimal profile
          });
          
        if (minimalError) {
          console.error('Failed even with minimal profile:', minimalError);
        } else {
          console.log('Created minimal profile with ID and email');
        }
      } else {
        console.log('Successfully created profile with email');
      }
    } else if (profileData && !profileData.email && email) {
      // If the profile exists but doesn't have an email, update it
      console.log('Updating existing profile to add email');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ email: email })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Failed to update profile with email:', updateError);
      } else {
        console.log('Successfully updated profile with email');
      }
    }
    
    // Check if user is in an event
    const isInEvent = await checkUserInEvent(userId);
    console.log('User in event:', isInEvent);
    
    if (!isInEvent) {
      console.log('Redirecting to join-event');
      router.replace('/join-event' as any);
      return;
    }
    
    // Check if user is in a team
    const isInTeam = await checkUserInTeam(userId);
    console.log('User in team:', isInTeam);
    
    if (!isInTeam) {
      console.log('Redirecting to join-team');
      router.replace('/join-team' as any);
      return;
    }
    
    // User is in both event and team, redirect to dashboard
    console.log('Redirecting to dashboard');
    router.replace('/(tabs)');
    
  } catch (err) {
    console.error('Auth routing error:', err);
    router.replace('/login');
  }
}

// Get available events
export async function getAvailableEvents(status?: 'Active' | 'Upcoming' | 'Archive') {
  try {
    let query = supabase
      .from('events')
      .select('id, name, event_year, start_date, end_date, created_at, status');
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    } else {
      // Default to showing only Active and Upcoming events, explicitly exclude Archive
      query = query.not('status', 'eq', 'Archive');
    }
    
    // Order by newest first
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching events:', err);
    return [];
  }
}

// Get available teams
export async function getAvailableTeams() {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('id, team_name, created_at')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching teams:', err);
    return [];
  }
}

// Register a user for an event
export async function registerUserForEvent(userId: string, eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('event_registrations')
      .insert({
        user_id: userId,
        event_id: eventId,
        registered_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error registering user for event:', error);
      return false;
    }
    
    console.log('Successfully registered user for event');
    return true;
  } catch (err) {
    console.error('Unexpected error registering for event:', err);
    return false;
  }
}

// Add a user to a team
export async function addUserToTeam(userId: string, teamId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('team_members')
      .insert({
        user_id: userId,
        team_id: teamId,
        joined_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error adding user to team:', error);
      return false;
    }
    
    console.log('Successfully added user to team');
    return true;
  } catch (err) {
    console.error('Unexpected error adding user to team:', err);
    return false;
  }
}

// Check if user can join an event
export async function canUserJoinEvent(userId: string, eventId: string): Promise<boolean> {
  try {
    // Check if user is already registered for this event
    const { data, error } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error checking event registration:', error);
      return false;
    }
    
    // If no data found, user can join this event
    return !data;
  } catch (err) {
    console.error('Unexpected error checking event eligibility:', err);
    return false;
  }
}

// Check if user can join a team
export async function canUserJoinTeam(userId: string, teamId: string): Promise<boolean> {
  try {
    // Check if user is already a member of this team
    const { data, error } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error checking team membership:', error);
      return false;
    }
    
    // If no data found, user can join this team
    return !data;
  } catch (err) {
    console.error('Unexpected error checking team eligibility:', err);
    return false;
  }
}

// Get both events and teams in a single call
export async function getEventAndTeamData() {
  try {
    // Run both queries in parallel
    const [eventsResult, teamsResult] = await Promise.all([
      getAvailableEvents(),
      getAvailableTeams()
    ]);
    
    return {
      events: eventsResult,
      teams: teamsResult
    };
  } catch (err) {
    console.error('Unexpected error fetching events and teams:', err);
    return {
      events: [],
      teams: []
    };
  }
}

// Debug function to help understand table structure
export async function inspectTableStructure(tableName: string) {
  try {
    // Try to get one row from the table to see its structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
      
    if (error) {
      console.error(`Error inspecting table ${tableName}:`, error);
      return {
        success: false,
        error
      };
    }
    
    // If we got data, show the keys
    const structure = data && data.length > 0 
      ? Object.keys(data[0]) 
      : ['No rows found'];
      
    console.log(`Structure of ${tableName} table:`, structure);
    
    return {
      success: true,
      structure,
      sample: data
    };
  } catch (err) {
    console.error(`Error in inspectTableStructure for ${tableName}:`, err);
    return {
      success: false,
      error: err
    };
  }
}

// Get teams for a specific event
export async function getTeamsForEvent(eventId: string) {
  try {
    console.log('Fetching teams for event ID:', eventId);
    
    // First inspect the teams table to confirm structure
    const inspectResult = await inspectTableStructure('teams');
    const structure = inspectResult.success && inspectResult.structure ? inspectResult.structure : [];
    console.log('Teams table structure:', structure);
    
    // Show the actual sample team data for debugging
    if (inspectResult.success && inspectResult.sample) {
      console.log('Sample team data:', JSON.stringify(inspectResult.sample));
    }
    
    // Get all teams to debug
    const { data: allTeams } = await supabase.from('teams').select('*');
    console.log('All teams in database:', JSON.stringify(allTeams));
    
    // If the teams table has an event_id field, use it directly
    if (structure.includes('event_id')) {
      console.log('Using direct event_id relationship in teams table');
      
      // Query teams that belong to this event
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, team_name, created_at, event_id')
        .eq('event_id', eventId);
        
      if (teamsError) {
        console.error('Error fetching teams for event:', teamsError);
        return [];
      }
      
      console.log(`Found ${teamsData?.length || 0} teams with event_id=${eventId}:`, JSON.stringify(teamsData));
      return teamsData || [];
    } else {
      console.warn('Teams table does not have an event_id field. Available fields:', structure.join(', '));
      
      // Try with a fallback approach for debugging
      const allTeamsQuery = await supabase
        .from('teams')
        .select('*');
        
      if (allTeamsQuery.error) {
        console.error('Error fetching all teams:', allTeamsQuery.error);
      } else if (allTeamsQuery.data) {
        console.log(`Got ${allTeamsQuery.data.length} teams in total`);
        
        // If we have event_id field somewhere else, try to identify it
        const firstTeam = allTeamsQuery.data[0];
        console.log('First team data:', JSON.stringify(firstTeam));
        
        // If event_id isn't found, we'll return a subset for testing
        // In production, you would implement proper filtering based on your schema
        return allTeamsQuery.data.slice(0, 3);
      }
      
      // Fallback to empty array if all else fails
      return [];
    }
  } catch (err) {
    console.error('Unexpected error in getTeamsForEvent:', err);
    return [];
  }
}

// Developer helper: Update teams to link them to events for testing
export async function updateTeamsWithEventIds() {
  try {
    console.log('Starting team-event relationship setup...');
    
    // Get all teams and events
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, team_name');
      
    if (teamsError) {
      console.error('Failed to fetch teams:', teamsError);
      return false;
    }
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name');
      
    if (eventsError) {
      console.error('Failed to fetch events:', eventsError);
      return false;
    }
    
    console.log(`Found ${teams.length} teams and ${events.length} events`);
    
    if (teams.length === 0 || events.length === 0) {
      console.log('No teams or events found to link');
      return false;
    }
    
    // Check if teams table has event_id field
    const inspectResult = await inspectTableStructure('teams');
    if (!inspectResult.success || 
        !inspectResult.structure || 
        !inspectResult.structure.includes('event_id')) {
      console.error('Teams table does not have an event_id field. Available fields:', 
        inspectResult.structure?.join(', '));
      return false;
    }
    
    // For testing: Distribute teams somewhat evenly across events
    let updateCount = 0;
    
    for (let i = 0; i < teams.length; i++) {
      // Assign event based on index (simple round-robin)
      const eventIndex = i % events.length;
      const team = teams[i];
      const event = events[eventIndex];
      
      console.log(`Assigning team "${team.team_name}" to event "${event.name}"`);
      
      const { error: updateError } = await supabase
        .from('teams')
        .update({ event_id: event.id })
        .eq('id', team.id);
        
      if (updateError) {
        console.error(`Failed to update team ${team.id}:`, updateError);
      } else {
        updateCount++;
      }
    }
    
    console.log(`Successfully updated ${updateCount} of ${teams.length} teams with event IDs`);
    return updateCount > 0;
  } catch (err) {
    console.error('Error updating teams with event IDs:', err);
    return false;
  }
} 