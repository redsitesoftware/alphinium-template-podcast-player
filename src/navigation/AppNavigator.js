import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import EpisodeListScreen from '../screens/EpisodeListScreen';
import PlayerScreen from '../screens/PlayerScreen';
import StreamScreen from '../screens/StreamScreen';
import { colors } from '../data/podcastData';

const Stack = createStackNavigator();

// Deep-link config so /stream URL routes to StreamScreen on web
const linking = {
  prefixes: [],
  config: {
    screens: {
      Home:     '',
      Episodes: 'episodes',
      Player:   'player/:episodeId',
      Stream:   'stream',
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface, shadowColor: 'transparent' },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '800' },
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home"     component={HomeScreen}        options={{ headerShown: false }} />
        <Stack.Screen name="Episodes" component={EpisodeListScreen} />
        <Stack.Screen name="Player"   component={PlayerScreen} />
        <Stack.Screen name="Stream"   component={StreamScreen}      options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
