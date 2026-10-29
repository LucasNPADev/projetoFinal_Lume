import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { colors, useTheme } from '../theme';
import { CareersScreen } from '../screens/CareersScreen';
import { CoursesScreen } from '../screens/CoursesScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { InstitutionDetailScreen } from '../screens/InstitutionDetailScreen';
import { InstitutionsScreen } from '../screens/InstitutionsScreen';
import { LoginScreen, RecoverPasswordScreen, RegisterScreen, ResetPasswordScreen } from '../screens/AuthScreens';
import { ProfileScreen } from '../screens/ProfileScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { MainTabParamList, RootStackParamList } from './navigationTypes';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

const tabIcons: Record<keyof MainTabParamList, string> = {
  Faculdades: '⌂',
  Quiz: '◎',
  Carreiras: '▣',
  Perfil: '♙',
};

function MainTabs() {
  useTheme();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.subtle,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 19, lineHeight: 22 }}>{tabIcons[route.name]}</Text>
        ),
      })}
    >
      <Tabs.Screen name="Faculdades" component={InstitutionsScreen} />
      <Tabs.Screen name="Quiz" component={QuizScreen} />
      <Tabs.Screen name="Carreiras" component={CareersScreen} />
      <Tabs.Screen name="Perfil" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  const { mode } = useTheme();
  const { user } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.onPrimary,
        headerTitleStyle: { color: colors.onPrimary, fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="InstitutionDetail"
            component={InstitutionDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Courses" component={CoursesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar conta' }} />
          <Stack.Screen name="RecoverPassword" component={RecoverPasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}
