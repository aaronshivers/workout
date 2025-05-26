import { Dumbbell, Calendar, FileText, Edit, User, LogOut, Home, LogIn } from 'lucide-react';

export const navItems = [
  // Unauthenticated links
  {
    title: 'Home',
    url: '/',
    icon: Home,
    ariaLabel: 'Navigate to Home',
    authRequired: false,
  },
  {
    title: 'Login',
    url: '/login',
    icon: LogIn,
    ariaLabel: 'Navigate to Login',
    authRequired: false,
  },
  // Authenticated links
  {
    title: 'Current Workout',
    url: '/log-workout',
    icon: Dumbbell,
    ariaLabel: 'Navigate to Current Workout',
    authRequired: true,
  },
  {
    title: 'Mesocycles',
    url: '/history',
    icon: Calendar,
    ariaLabel: 'Navigate to Mesocycles',
    authRequired: true,
  },
  {
    title: 'Templates',
    url: '/templates',
    icon: FileText,
    ariaLabel: 'Navigate to Templates',
    authRequired: true,
  },
  {
    title: 'Custom Exercises',
    url: '/custom-exercises',
    icon: Edit,
    ariaLabel: 'Navigate to Custom Exercises',
    authRequired: true,
  },
  {
    title: 'Plan a New Mesocycle',
    url: '/create-workout',
    icon: Calendar,
    ariaLabel: 'Navigate to Plan a New Mesocycle',
    authRequired: true,
  },
];

export const userItems = [
  {
    title: 'Profile',
    url: '/dashboard/profile',
    icon: User,
    ariaLabel: 'Navigate to Profile',
    authRequired: true,
  },
  {
    title: 'Sign Out',
    url: null,
    icon: LogOut,
    ariaLabel: 'Log out of your account',
    authRequired: true,
  },
];
