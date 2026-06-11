import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  // Two groups — admin creates all accounts, no self-registration
  groups: ['Admins', 'Engineers'],
});
