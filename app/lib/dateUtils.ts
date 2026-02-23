import { Timestamp } from 'firebase/firestore';

export const formatFirebaseDate = (timestamp: any): string => {
  if (!timestamp) return 'N/A';

  try {
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    return 'N/A';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};


export const firebaseTimestampToMillis = (timestamp: any): number | null => {
  if (!timestamp) return null;

  try {
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      return timestamp.seconds * 1000;
    }
    if (typeof timestamp === 'number') {
      return timestamp;
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp).getTime();
    }
    return null;
  } catch (error) {
    console.error('Error converting timestamp:', error);
    return null;
  }
};
