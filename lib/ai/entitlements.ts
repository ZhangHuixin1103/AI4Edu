import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  defaultType: {
<<<<<<< Updated upstream
    maxMessagesPerDay: Infinity,
=======
    maxMessagesPerDay: 10,
>>>>>>> Stashed changes
    availableChatModelIds: ['Llama-3.1-Math'],
  },

  /*
   * For users without an account
   */
  guest: {
<<<<<<< Updated upstream
    maxMessagesPerDay: Infinity,
=======
    maxMessagesPerDay: 20,
>>>>>>> Stashed changes
    availableChatModelIds: ['Llama-3.1-Math'],
  },

  /*
   * For users with an account
   */
  regular: {
<<<<<<< Updated upstream
    maxMessagesPerDay: Infinity,
=======
    maxMessagesPerDay: 100,
>>>>>>> Stashed changes
    availableChatModelIds: ['Llama-3.1-Math'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
