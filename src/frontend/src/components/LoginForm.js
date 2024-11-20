import React, { useState } from 'react';
import { customTheme } from '../styles/theme';

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  const styles = {
    container: {
      padding: customTheme.spacing.xl,
      textAlign: 'center',
      backgroundColor: customTheme.colors.surface,
      borderRadius: customTheme.borderRadius.lg,
      maxWidth: '400px',
      margin: '48px auto',
      boxShadow: `0 4px 6px ${customTheme.colors.shadow.light}, 0 10px 15px ${customTheme.colors.shadow.medium}`,
    },
    title: {
      color: customTheme.colors.text.primary,
      fontSize: '28px',
      fontWeight: '600',
      marginBottom: customTheme.spacing.xl,
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: customTheme.spacing.md,
    },
    input: {
      width: '92%',
      padding: '12px',
      border: `1px solid ${customTheme.colors.border}`,
      borderRadius: customTheme.borderRadius.full,
      fontSize: '15px',
      backgroundColor: 'white',
      transition: 'all 0.2s ease',
      margin: '0 auto',
      '&:focus': {
        borderColor: customTheme.colors.primary,
        boxShadow: `0 0 0 3px ${customTheme.colors.shadow.light}`,
      },
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: customTheme.colors.primary,
      color: 'white',
      border: 'none',
      borderRadius: customTheme.borderRadius.full,
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginTop: customTheme.spacing.md,
      '&:hover': {
        backgroundColor: customTheme.colors.hover.primary,
        transform: 'translateY(-1px)',
      },
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Please Log In</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Login</button>
      </form>
    </div>
  );
}

export default LoginForm;
