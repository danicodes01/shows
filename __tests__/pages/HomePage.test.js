/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import HomePage from '@/pages/index';
import { useRouter } from 'next/router';
import util from 'util'; 

global.TextEncoder = util.TextEncoder; 

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockShows = [
  {
    _id: '668073a2c086525e8e38ff58',
    title: 'Guest Event: Rock & Roll Aerial Fantasy October 17',
    date: '2024-10-17T00:00:00.000Z',
    genre: 'Burlesque',
    location: 'The Slipper Room',
    time: '7:00 PM',
    price: '$30 - $120',
    isFeatured: true,
    image: 'https://static.wixstatic.com/media/10871e_e1614271a1a145639edeaad3fa30dd4e~mv2.jpeg/v1/fill/w_490,h_492,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/10871e_e1614271a1a145639edeaad3fa30dd4e~mv2.jpeg',
    excerpt: '<p>Join us for Rock’n’Roll Aerial Fantasy and become a part of the show with our delicious and talented host Lydia Vengeance singing a bevy of classic Rock’n’Roll songs live and Matt Hogan slaying you with his guitar on stage! Experience the hottest aerial, circus and burlesque performers anywhere!</p><br><br><ul><li><a href="https://www.slipperroom.com/event-details/guest-event-rock-roll-aerial-fantasy-may-23-1">BUY TICKETS</a></li></ul>',
    rating: 0,
  },
  {
    _id: '667decfec086525e8e38fe10',
    title: 'Mess, The Templars, No Time, Vaxine, 45 Adapters',
    date: '2024-12-14T00:00:00.000Z',
    genre: 'gig',
    location: 'The Brooklyn Monarch',
    time: '6:00pm',
    price: '$36.57',
    isFeatured: true,
    image: 'https://dice-media.imgix.net/attachments/2024-05-29/219e19c4-9900-4395-8795-921728685368.jpg?rect=0%2C300%2C2400%2C2400&w=500&h=500',
    excerpt: '<p>Authentic Productions NYC Presents</p><p>Mess</p><p>The Templars</p><p>No Time</p><p>Vaxine</p><p>45 Adapters</p><br><br><ul><li><a href="https://link.dice.fm/Ebe9da25cd12?pid=679d6ca0">BUY TICKETS</a></li></ul>',
    rating: 0,
  }
];

describe('HomePage', () => {
  beforeEach(() => {
    useRouter.mockImplementation(() => ({
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
      pathname: '',
    }));
  });

  test('renders the newsletter and featured shows', () => {
    render(<HomePage shows={mockShows} />);

    expect(screen.getByText(/register and we might send you our weekly top shows/i)).toBeInTheDocument();
    expect(screen.getByText(/recommended events.../i)).toBeInTheDocument();
    expect(screen.getByText(/Rock & Roll Aerial Fantasy October 17/i)).toBeInTheDocument();
    expect(screen.getByText(/Mess, The Templars, No Time, Vaxine, 45 Adapters/i)).toBeInTheDocument();
  });
});
