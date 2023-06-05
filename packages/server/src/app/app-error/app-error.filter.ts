import { Catch, type ArgumentsHost, HttpException, InternalServerErrorException, HttpStatus } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import { createLogger } from '@/common/create-logger.js'
import { ClientError, ServerError, AppError } from './app-error.js'

/** @private */
interface HttpExceptionBody {
  readonly statusCode: number
  readonly status: string
  readonly errorCode?: string
  readonly message?: string
  readonly details?: readonly string[]
  readonly errorId: string
}

@Catch()
export class AppErrorFilter extends BaseExceptionFilter {
  protected readonly logger = createLogger(this.constructor.name)

  private logAppErrorHead(error: AppError): void {
    const head = error.getHead()

    if (error instanceof ClientError) {
      this.logger.warn(head)
    } else {
      this.logger.error(head)
    }
  }

  private logServerError(error: ServerError): void {
    for (const detail of error.getDetails()) {
      this.logger.error(detail)
    }

    if (error.stack != null) {
      this.logger.error(error.stack)
    }
  }

  protected logCaught(caught: unknown): void {
    if (!(caught instanceof AppError)) {
      this.logger.error(caught)
      this.logger.warn(`An error is thrown that's not an instance of ${AppError.name}`)

      return
    }

    this.logAppErrorHead(caught)

    if (caught instanceof ServerError) {
      this.logServerError(caught)
    }
  }

  private appErrorToHttpExceptionBody(error: AppError): HttpExceptionBody {
    const statusCode = +error.statusCode
    const body: HttpExceptionBody = {
      statusCode,
      status: HttpStatus[statusCode],
      errorId: error.id,
    }

    if (error instanceof ClientError) {
      return {
        ...body,
        errorCode: error.code,
        message: error.message,
        details: error.getDetails(),
      }
    }

    return body
  }

  protected caughtToHttpException(caught: unknown): HttpException {
    if (!(caught instanceof AppError)) {
      // No other info here, since it might be sensitive.
      // The assumption is that `caught` is properly logged.
      return new InternalServerErrorException()
    }

    const body = this.appErrorToHttpExceptionBody(caught)

    return new HttpException(body, body.statusCode)
  }

  catch(caught: unknown, host: ArgumentsHost): void {
    this.logCaught(caught)

    const exception = this.caughtToHttpException(caught)

    super.catch(exception, host)
  }
}
