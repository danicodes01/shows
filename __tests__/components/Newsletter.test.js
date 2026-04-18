import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Newsletter from '@/components/input/newsletter';
import '@testing-library/jest-dom';

jest.mock('next/router', () => require('next-router-mock'));

jest.mock('@/components/shows/show-item', () => ({ show }) => (
  <div>{show.title}</div>
));

describe('Newsletter', () => {
  test('renders the newsletter form', () => {
    render(<Newsletter />);

    expect(screen.getByPlaceholderText(/your email/i)).toBeInTheDocument();
    expect(screen.getAllByText(/register/i)).toHaveLength(2); // Adjust if necessary
  });

  test('submits the form and changes placeholder text', async () => {
    render(<Newsletter />);

    const emailInput = screen.getByPlaceholderText(/your email/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    // Change the email to test@gmail.com
    fireEvent.change(emailInput, { target: { value: 'test@gmail.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveAttribute('placeholder', 'nom nom nom');
      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
});
