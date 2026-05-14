import axios from 'axios';

describe('GET /patterns', () => {
  it('returns an empty array when no patterns exist', async () => {
    const res = await axios.get(`/patterns`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual([]);
  });
});

describe('POST /patterns + GET /patterns/:id', () => {
  it('creates a pattern and retrieves it by id', async () => {
    const body = { name: 'Glider', width: 5, height: 5, liveCells: [[1, 0]] };
    const created = await axios.post(`/patterns`, body);

    expect(created.status).toBe(201);
    expect(created.data.id).toBeDefined();
    expect(created.data.name).toBe('Glider');

    const fetched = await axios.get(`/patterns/${created.data.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.data).toEqual(created.data);
  });

  it('returns 404 for an unknown id', async () => {
    await expect(axios.get(`/patterns/nonexistent-id`)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
