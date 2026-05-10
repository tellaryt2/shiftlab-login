export interface IFormInputs {
    phone: string;
    code: string;
}

export interface OtpResponse {
    success: boolean;
    reason?: string;
    retryDelay: number;
}

export interface SigninSuccessResponse {
    success: true;
    reason?: string;
    user: {
        _id: string;
        phone: string;
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        city: string;
    };
    token: string;
}

export interface SigninErrorResponse {
    success: false;
    reason: string; 
}
