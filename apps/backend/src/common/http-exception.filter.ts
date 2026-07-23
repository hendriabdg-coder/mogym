import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    const message = typeof raw === 'string' ? raw : (raw as any)?.message;
    response.status(status).json({
      success: false,
      error: Array.isArray(message) ? 'Validasi gagal' : message || 'Terjadi kesalahan internal',
      code: (raw as any)?.code || HttpStatus[status] || 'INTERNAL_SERVER_ERROR',
      ...(Array.isArray(message) ? { details: message } : {}),
    });
  }
}
