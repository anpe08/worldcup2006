import crypto from 'crypto';
import { query } from './db';

// Generates SHA-256 hash of a PIN code
export function hashPin(pin) {
  if (!pin) return '';
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

// Verifies participant matches id and plaintext PIN code
export async function verifyParticipant(participantId, pin) {
  if (!participantId || !pin) return false;
  const hashed = hashPin(pin);
  try {
    const res = await query('SELECT 1 FROM participants WHERE id = $1 AND pin_code = $2', [participantId, hashed]);
    return res.rows.length > 0;
  } catch (err) {
    console.error('Error verifying participant:', err);
    return false;
  }
}
