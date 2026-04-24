import { doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Generates a padded custom ID using a Firestore transaction.
 * 
 * @param prefix The alphanumeric prefix for the collection (e.g. "ANST" for students)
 * @returns A promise that resolves to the generated ID (e.g. "ANST001")
 */
export const generateCustomId = async (prefix: string): Promise<string> => {
  const counterRef = doc(db, '_counters', prefix);

  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let newCount = 1;

    if (counterDoc.exists()) {
      newCount = (counterDoc.data().count || 0) + 1;
    }

    transaction.set(counterRef, { count: newCount }, { merge: true });

    // Pad with leading zeros up to 3 digits (e.g., 1 -> 001, 12 -> 012)
    const paddedCount = newCount.toString().padStart(3, '0');
    return `${prefix}${paddedCount}`;
  });
};
