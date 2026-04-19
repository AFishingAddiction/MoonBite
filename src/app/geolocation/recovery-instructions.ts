export interface RecoveryInstructions {
  title: string;
  steps: string[];
}

const INSTRUCTIONS: Record<string, RecoveryInstructions> = {
  android: {
    title: 'Enable location for MoonBite on Android',
    steps: [
      'Open Chrome and tap the three-dot menu',
      'Go to Settings > Site settings > Location',
      'Find MoonBite and change it to "Allow"',
      'Return to MoonBite and tap "Try Again"',
    ],
  },
  ios: {
    title: 'Enable location for MoonBite on iOS',
    steps: [
      'Open the Settings app',
      'Tap Privacy & Security > Location Services',
      'Make sure Location Services is turned on',
      'Scroll down and tap Chrome (or Safari)',
      'Select "While Using the App"',
      'Return to MoonBite and tap "Try Again"',
    ],
  },
  desktop: {
    title: 'Enable location for MoonBite',
    steps: [
      'Click the lock icon (or info icon) in the address bar',
      'Find "Location" in the permissions list',
      'Change it from "Block" to "Allow"',
      'Refresh the page and tap "Try Again"',
    ],
  },
};

export function getRecoveryInstructions(platform: string): RecoveryInstructions {
  return INSTRUCTIONS[platform] ?? INSTRUCTIONS['desktop'];
}
