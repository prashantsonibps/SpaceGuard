const API_BASE_URL = 'http://localhost:8000';

export interface User {
  id: string;
  balance: number;
  created_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  event_id: string;
  event_type: string;
  amount: number;
  outcome: string;
  status: string;
  created_at: string;
  payout: number;
}

export const api = {
  async initUser(userId: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/init`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to init user');
    return response.json();
  },

  async getUser(userId: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!response.ok) throw new Error('Failed to get user');
    return response.json();
  },

  async placeBet(userId: string, eventId: string, eventType: string, amount: number, outcome: string): Promise<Bet> {
    const response = await fetch(`${API_BASE_URL}/bets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        event_id: eventId,
        event_type: eventType,
        amount,
        outcome,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to place bet');
    }
    return response.json();
  },

  async getUserBets(userId: string): Promise<Bet[]> {
    const response = await fetch(`${API_BASE_URL}/bets/${userId}`);
    if (!response.ok) throw new Error('Failed to get bets');
    return response.json();
  }
};
