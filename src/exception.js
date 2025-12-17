/**
 * Exceptions of the MyJDownloader API.
 */
import * as C from './const.js';

export class MYJDException extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class MYJDConnectionException extends MYJDException {}
export class MYJDDeviceNotFoundException extends MYJDException {}
export class MYJDDecodeException extends MYJDException {}

export class MYJDApiException extends MYJDException {
    constructor(exceptionSource, ...args) {
        super(...args);
        this.source = exceptionSource.toUpperCase();
    }

    static getException(exceptionSource, exceptionType = C.EXCEPTION_UNKNOWN, ...args) {
        const ExceptionClass = EXCEPTION_CLASSES[exceptionType.toUpperCase()] || MYJDUnknownException;
        return new ExceptionClass(exceptionSource, ...args);
    }
}

export class MYJDApiCommandNotFoundException extends MYJDApiException {}
export class MYJDApiInterfaceNotFoundException extends MYJDApiException {}
export class MYJDAuthFailedException extends MYJDApiException {}
export class MYJDBadParametersException extends MYJDApiException {}
export class MYJDBadRequestException extends MYJDApiException {}
export class MYJDChallengeFailedException extends MYJDApiException {}
export class MYJDEmailForbiddenException extends MYJDApiException {}
export class MYJDEmailInvalidException extends MYJDApiException {}
export class MYJDErrorEmailNotConfirmedException extends MYJDApiException {}
export class MYJDFailedException extends MYJDApiException {}
export class MYJDFileNotFoundException extends MYJDApiException {}
export class MYJDInternalServerErrorException extends MYJDApiException {}
export class MYJDMaintenanceException extends MYJDApiException {}
export class MYJDMethodForbiddenException extends MYJDApiException {}
export class MYJDOfflineException extends MYJDApiException {}
export class MYJDOutdatedException extends MYJDApiException {}
export class MYJDOverloadException extends MYJDApiException {}
export class MYJDSessionException extends MYJDApiException {}
export class MYJDStorageAlreadyExistsException extends MYJDApiException {}
export class MYJDStorageInvalidKeyException extends MYJDApiException {}
export class MYJDStorageInvalidStorageIdException extends MYJDApiException {}
export class MYJDStorageKeyNotFoundException extends MYJDApiException {}
export class MYJDStorageLimitReachedException extends MYJDApiException {}
export class MYJDStorageNotFoundException extends MYJDApiException {}
export class MYJDTokenInvalidException extends MYJDApiException {}
export class MYJDTooManyRequestsException extends MYJDApiException {}
export class MYJDUnknownException extends MYJDApiException {}

export const EXCEPTION_CLASSES = {
    [C.EXCEPTION_API_COMMAND_NOT_FOUND]: MYJDApiCommandNotFoundException,
    [C.EXCEPTION_API_INTERFACE_NOT_FOUND]: MYJDApiInterfaceNotFoundException,
    [C.EXCEPTION_AUTH_FAILED]: MYJDAuthFailedException,
    [C.EXCEPTION_BAD_PARAMETERS]: MYJDBadParametersException,
    [C.EXCEPTION_BAD_REQUEST]: MYJDBadRequestException,
    [C.EXCEPTION_CHALLENGE_FAILED]: MYJDChallengeFailedException,
    [C.EXCEPTION_EMAIL_FORBIDDEN]: MYJDEmailForbiddenException,
    [C.EXCEPTION_EMAIL_INVALID]: MYJDEmailInvalidException,
    [C.EXCEPTION_ERROR_EMAIL_NOT_CONFIRMED]: MYJDErrorEmailNotConfirmedException,
    [C.EXCEPTION_FAILED]: MYJDFailedException,
    [C.EXCEPTION_FILE_NOT_FOUND]: MYJDFileNotFoundException,
    [C.EXCEPTION_INTERNAL_SERVER_ERROR]: MYJDInternalServerErrorException,
    [C.EXCEPTION_MAINTENANCE]: MYJDMaintenanceException,
    [C.EXCEPTION_METHOD_FORBIDDEN]: MYJDMethodForbiddenException,
    [C.EXCEPTION_OFFLINE]: MYJDOfflineException,
    [C.EXCEPTION_OUTDATED]: MYJDOutdatedException,
    [C.EXCEPTION_OVERLOAD]: MYJDOverloadException,
    [C.EXCEPTION_SESSION]: MYJDSessionException,
    [C.EXCEPTION_STORAGE_ALREADY_EXISTS]: MYJDStorageAlreadyExistsException,
    [C.EXCEPTION_STORAGE_INVALID_KEY]: MYJDStorageInvalidKeyException,
    [C.EXCEPTION_STORAGE_INVALID_STORAGEID]: MYJDStorageInvalidStorageIdException,
    [C.EXCEPTION_STORAGE_KEY_NOT_FOUND]: MYJDStorageKeyNotFoundException,
    [C.EXCEPTION_STORAGE_LIMIT_REACHED]: MYJDStorageLimitReachedException,
    [C.EXCEPTION_STORAGE_NOT_FOUND]: MYJDStorageNotFoundException,
    [C.EXCEPTION_TOKEN_INVALID]: MYJDTokenInvalidException,
    [C.EXCEPTION_TOO_MANY_REQUESTS]: MYJDTooManyRequestsException,
    [C.EXCEPTION_UNKNOWN]: MYJDUnknownException,
};