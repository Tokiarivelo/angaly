import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { SharpInspirationImagePreprocessor } from '../../infrastructure/services/sharp-inspiration-image-preprocessor';

const makeImage = (width: number, height: number, format: 'png' | 'jpeg' = 'png') =>
  sharp({ create: { width, height, channels: 4, background: { r: 200, g: 30, b: 60, alpha: 0.5 } } })
    [format]()
    .toBuffer();

describe('SharpInspirationImagePreprocessor', () => {
  const preprocessor = new SharpInspirationImagePreprocessor(new ConfigService({}));

  afterEach(() => jest.restoreAllMocks());

  it('caps the longest side at 1024px, keeps the ratio and outputs a JPEG', async () => {
    const result = await preprocessor.downscale(await makeImage(3000, 2000));

    expect(Math.max(result.width, result.height)).toBe(1024);
    expect(result.width).toBe(1024);
    expect(result.height).toBe(683);
    expect(result.mimeType).toBe('image/jpeg');
    expect((await sharp(result.buffer).metadata()).format).toBe('jpeg');
  });

  it('never upscales a small image', async () => {
    const result = await preprocessor.downscale(await makeImage(400, 300));
    expect([result.width, result.height]).toEqual([400, 300]);
  });

  it('honours INSPIRATION_IMAGE_MAX_PX', async () => {
    const small = new SharpInspirationImagePreprocessor(
      new ConfigService({ INSPIRATION_IMAGE_MAX_PX: '512' }),
    );
    const result = await small.downscale(await makeImage(2000, 2000));
    expect(result.width).toBe(512);
  });

  it('rejects data that is not an image', async () => {
    await expect(preprocessor.downscale(Buffer.from('not an image'))).rejects.toThrow();
  });

  it('downloads an image and rejects non-image content types', async () => {
    const png = await makeImage(10, 10);
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } }),
    );
    await expect(preprocessor.fetchOriginal('https://cdn.angaly.test/a.png')).resolves.toEqual(png);

    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('<html>', { headers: { 'content-type': 'text/html' } }),
    );
    await expect(preprocessor.fetchOriginal('https://cdn.angaly.test/a.html')).rejects.toThrow(
      'pas une image',
    );
  });

  it('rejects files above the size limit', async () => {
    const tiny = new SharpInspirationImagePreprocessor(
      new ConfigService({ INSPIRATION_IMAGE_MAX_BYTES: '5' }),
    );
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(new Uint8Array(100), { headers: { 'content-type': 'image/png' } }),
    );
    await expect(tiny.fetchOriginal('https://cdn.angaly.test/big.png')).rejects.toThrow('volumineuse');
  });

  it('refuses unsafe URLs before any network call', async () => {
    const spy = jest.spyOn(global, 'fetch');
    await expect(preprocessor.fetchOriginal('ftp://internal/a.png')).rejects.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });
});
