/**
 * @jest-environment node
 */

import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';

function makeRequest(body: object): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

function geminiOk(text: string) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      candidates: [{ content: { parts: [{ text }] } }],
    }),
  };
}

describe('POST /api/chat', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
    process.env.GEMINI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it('returns 400 when message is missing', async () => {
    const res = await POST(makeRequest({ platforms: ['Instagram'] }));
    expect(res.status).toBe(400);
    expect((await res.json()).response).toBe('Missing message or platforms in request body.');
  });

  it('returns 400 when platforms is missing', async () => {
    const res = await POST(makeRequest({ message: 'What data does Instagram collect?' }));
    expect(res.status).toBe(400);
    expect((await res.json()).response).toBe('Missing message or platforms in request body.');
  });

  it('returns 500 when GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await POST(makeRequest({ message: 'test', platforms: ['Instagram'] }));
    expect(res.status).toBe(500);
    expect((await res.json()).response).toBe('Server misconfiguration: GEMINI_API_KEY is not set.');
  });

  it('returns the AI response text on success', async () => {
    mockFetch.mockResolvedValueOnce(geminiOk('Instagram collects your location and browsing data.'));
    const res = await POST(makeRequest({ message: 'What does Instagram collect?', platforms: ['Instagram'] }));
    expect(res.status).toBe(200);
    expect((await res.json()).response).toBe('Instagram collects your location and browsing data.');
  });

  it('includes all selected platforms in the Gemini system prompt', async () => {
    mockFetch.mockResolvedValueOnce(geminiOk('Answer'));
    await POST(makeRequest({ message: 'What data is collected?', platforms: ['Snapchat', 'Facebook', 'Instagram'] }));
    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.system_instruction.parts[0].text).toContain('Snapchat, Facebook, Instagram');
  });

  it('returns the Gemini error when the Gemini API responds with an error status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ error: { message: 'Quota exceeded' } }),
    });
    const res = await POST(makeRequest({ message: 'test', platforms: ['Instagram'] }));
    expect(res.status).toBe(429);
    expect((await res.json()).response).toContain('Quota exceeded');
  });

  it('returns 500 when Gemini response contains no text', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ candidates: [] }),
    });
    const res = await POST(makeRequest({ message: 'test', platforms: ['Instagram'] }));
    expect(res.status).toBe(500);
    expect((await res.json()).response).toBe('Gemini returned an empty or unexpected response.');
  });

  it('returns 500 on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));
    const res = await POST(makeRequest({ message: 'test', platforms: ['Instagram'] }));
    expect(res.status).toBe(500);
    expect((await res.json()).response).toContain('Network failure');
  });
});
