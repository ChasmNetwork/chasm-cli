import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PROJECT_ID:
    process.env.PROJECT_ID || '3927416055498f63e68253c829c4cc8e',
  INFURA_KEY:
    process.env.INFURA_KEY || 'c216fe4145c548a89df18b344d5f1efe',
  CONTRACT:
    process.env.CONTRDACT ||
    '0xf9676b36436dd61417994a2fec27194810641a2e',
  BACKEND_URL:
    process.env.BACKEND_URL || 'https://orchestrator.chasm.net/web',
};
