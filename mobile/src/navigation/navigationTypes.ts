import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  RecoverPassword: undefined;
  ResetPassword: { token: string };
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  InstitutionDetail: { institutionId: string };
  Courses: undefined;
  Favorites: undefined;
  EditProfile: undefined;
};

export type MainTabParamList = {
  Faculdades: undefined;
  Quiz: undefined;
  Carreiras: undefined;
  Perfil: undefined;
};
