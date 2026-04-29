export type NotificationType = 'scoreJump' | 'moonMilestone' | 'pressureAlert' | 'locationUpdate';

export interface AppNotification {
  readonly id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly icon: string;
  readonly locationId?: string;
  readonly locationName?: string;
  readonly actionUrl?: string;
  readonly timestamp: string;
  readonly read: boolean;
}

export interface NotificationPreferences {
  readonly notificationsEnabled: boolean;
  readonly scoreJump: boolean;
  readonly moonMilestone: boolean;
  readonly pressureAlert: boolean;
  readonly locationUpdate: boolean;
  readonly mutedLocationIds: readonly string[];
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  notificationsEnabled: false,
  scoreJump: true,
  moonMilestone: true,
  pressureAlert: true,
  locationUpdate: true,
  mutedLocationIds: [],
};
