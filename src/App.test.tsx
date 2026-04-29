import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders auth screen by default', () => {
  render(<App />);
  expect(screen.getByText(/sign in to your ai mail workspace/i)).toBeInTheDocument();
});
