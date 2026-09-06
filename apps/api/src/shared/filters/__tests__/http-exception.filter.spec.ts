import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';

import { HttpExceptionFilter } from '../http-exception.filter';

interface ErrorPayload {
  success: false;
  statusCode: number;
  error: { code: string; message: string; details?: unknown };
}

function payloadOf(json: jest.Mock<void, [unknown]>): ErrorPayload {
  return json.mock.calls[0]?.[0] as ErrorPayload;
}

function buildHost(path = '/api/media/missing') {
  const json = jest.fn<void, [unknown]>();
  const status = jest.fn<{ json: typeof json }, [number]>(() => ({ json }));
  const response = { status };
  const request = { url: path };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  it('formats an HttpException with a plain string response', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = buildHost();

    filter.catch(new NotFoundException('Media missing not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    const payload = payloadOf(json);
    expect(payload.statusCode).toBe(404);
    expect(payload.error.code).toBe('NOT_FOUND');
    expect(payload.error.message).toBe('Media missing not found');
  });

  it('uses the raw response as the message when it is a plain string', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = buildHost();

    filter.catch(new HttpException('Teapot', 418), host);

    expect(status).toHaveBeenCalledWith(418);
    expect(payloadOf(json).error.message).toBe('Teapot');
  });

  it('joins an array of validation messages and exposes them as details', () => {
    const filter = new HttpExceptionFilter();
    const { host, json } = buildHost();

    filter.catch(new BadRequestException(['altText should not be empty', 'mimeType is required']), host);

    const payload = payloadOf(json);
    expect(payload.error.message).toBe('altText should not be empty, mimeType is required');
    expect(payload.error.details).toEqual(['altText should not be empty', 'mimeType is required']);
  });

  it('falls back to the status-derived code when the response has no error field', () => {
    const filter = new HttpExceptionFilter();
    const { host, json } = buildHost();

    filter.catch(new BadRequestException({ message: 'Bad payload' }), host);

    expect(payloadOf(json).error.code).toBe('BAD_REQUEST');
  });

  it('keeps the default message and code for an object response with neither field, on an unmapped status', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = buildHost();

    filter.catch(new HttpException({}, 418), host);

    expect(status).toHaveBeenCalledWith(418);
    const payload = payloadOf(json);
    expect(payload.error.message).toBe('Internal server error');
    expect(payload.error.code).toBe('ERROR');
  });

  it('returns 500 and logs unhandled Error instances', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = buildHost();

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(500);
    const payload = payloadOf(json);
    expect(payload.statusCode).toBe(500);
    expect(payload.error.code).toBe('INTERNAL_ERROR');
  });

  it('returns 500 for a thrown value that is neither an HttpException nor an Error', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = buildHost();

    filter.catch('not-an-error', host);

    expect(status).toHaveBeenCalledWith(500);
    expect(payloadOf(json).statusCode).toBe(500);
  });
});
