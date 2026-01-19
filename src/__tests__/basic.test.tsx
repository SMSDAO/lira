// Basic smoke test to verify Jest configuration
describe('Lira Protocol - Setup', () => {
  it('Jest is configured correctly', () => {
    expect(true).toBe(true);
  });

  it('can perform basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('test').toBeTruthy();
    expect(null).toBeNull();
  });

  it('can test arrays and objects', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);

    const obj = { name: 'Lira', version: '1.0.0' };
    expect(obj).toHaveProperty('name');
    expect(obj.version).toBe('1.0.0');
  });
});
