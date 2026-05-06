import type { ComponentProps } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export type MimidiRouteId =
  | 'perform'
  | 'smc-pad'
  | 'plugins'
  | 'edit'
  | 'settings';

export type MimidiTabDefinition = {
  href: string;
  icon:
    | {
        family: 'ionicons';
        name: ComponentProps<typeof Ionicons>['name'];
      }
    | {
        family: 'material';
        name: ComponentProps<typeof MaterialCommunityIcons>['name'];
      };
  id: MimidiRouteId;
  label: string;
};

export const mimidiTabs: MimidiTabDefinition[] = [
  {
    id: 'perform',
    label: 'Piano',
    href: '/(tabs)',
    icon: { family: 'material', name: 'piano' },
  },
  {
    id: 'smc-pad',
    label: 'SMC Pad',
    href: '/(tabs)/smc-pad',
    icon: { family: 'material', name: 'view-grid-outline' },
  },
  {
    id: 'plugins',
    label: 'Plugins',
    href: '/(tabs)/plugins',
    icon: { family: 'material', name: 'power-plug-outline' },
  },
  {
    id: 'edit',
    label: 'Timelines',
    href: '/(tabs)/edit',
    icon: { family: 'material', name: 'pulse' },
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/(tabs)/settings',
    icon: { family: 'ionicons', name: 'settings-sharp' },
  },
];
