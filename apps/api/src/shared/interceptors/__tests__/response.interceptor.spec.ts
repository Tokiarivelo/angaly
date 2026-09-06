import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

import { ResponseInterceptor } from '../response.interceptor';

describe('ResponseInterceptor', () => {
  it('wraps the handler payload in a { success, data } envelope', (done) => {
    const interceptor = new ResponseInterceptor<{ id: string }>();
    const callHandler: CallHandler<{ id: string }> = { handle: () => of({ id: 'media-1' }) };

    interceptor.intercept({} as ExecutionContext, callHandler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: { id: 'media-1' } });
      done();
    });
  });
});
