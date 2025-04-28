import { Auth } from 'aws-amplify';

export async function signUp(email, password) {
  try {
    await Auth.signUp({
      username: email,
      password,
      attributes: { email },
    });
    console.log('Sign-up successful, verify email');
  } catch (error) {
    throw error;
  }
}

export async function confirmSignUp(email, code) {
  try {
    await Auth.confirmSignUp(email, code);
    console.log('Account confirmed');
  } catch (error) {
    throw error;
  }
}

export async function signIn(email, password) {
  try {
    await Auth.signIn(email, password);
    console.log('Signed in');
  } catch (error) {
    throw error;
  }
}

export async function signOut() {
  try {
    await Auth.signOut();
    console.log('Signed out');
  } catch (error) {
    throw error;
  }
}

export async function checkAuth() {
  try {
    return await Auth.currentAuthenticatedUser();
  } catch {
    throw new Error('Not signed in');
  }
}
