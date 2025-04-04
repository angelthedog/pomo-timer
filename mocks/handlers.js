import { rest } from 'msw';

export const handlers = [
  // Mock API endpoints
  rest.get('/api/settings/default', (req, res, ctx) => {
    return res(
      ctx.json({
        workMinutes: 25,
        breakMinutes: 5,
        noiseCancellation: false,
        pinkNoiseEnabled: true,
        pinkNoiseType: 'Rainfall'
      })
    );
  }),
  
  rest.post('/api/settings/save', (req, res, ctx) => {
    return res(
      ctx.json({ success: true })
    );
  }),
  
  rest.post('/api/timer/log', (req, res, ctx) => {
    return res(
      ctx.json({ success: true })
    );
  }),
  
  // Add more handlers as needed
];
