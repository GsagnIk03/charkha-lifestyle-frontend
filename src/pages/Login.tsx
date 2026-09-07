import { useState } from 'react';

/**
 * Visual reference: artboard "Sign In" at
 * https://claude.ai/code/artifact/0a1f84d7-6dee-43e5-8d32-6c514f68b1a1
 *
 * Auth is Cognito (email+password + Google as a federated identity
 * provider). The cleanest path is Cognito's Hosted UI — redirect to it for
 * both flows rather than hand-rolling the Google OAuth dance — swap this
 * form's submit handler for that redirect once the User Pool exists.
 */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: call Cognito's InitiateAuth (via aws-amplify/auth or
    // amazon-cognito-identity-js) with email/password.
    console.log('sign in', email, password);
  }

  return (
    <div style={{ maxWidth: 380, margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Sign in to your account</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ border: '1px solid var(--border)', padding: 12 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ border: '1px solid var(--border)', padding: 12 }}
        />
        <button
          type="submit"
          style={{ height: 50, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600 }}
        >
          Sign In
        </button>
        <button
          type="button"
          // TODO: redirect to the Cognito Hosted UI with identity_provider=Google
          style={{ height: 50, background: 'none', border: '1px solid var(--border)', fontWeight: 600 }}
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}
