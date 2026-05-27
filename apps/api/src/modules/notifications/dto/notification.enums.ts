export const NotificationChannelDto = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
} as const;

export type NotificationChannelDto =
  (typeof NotificationChannelDto)[keyof typeof NotificationChannelDto];

export const NotificationStatusDto = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;

export type NotificationStatusDto =
  (typeof NotificationStatusDto)[keyof typeof NotificationStatusDto];
