import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import axios, { AxiosError } from 'axios';
import type { 
    IFormInputs, 
    OtpResponse, 
    SigninErrorResponse, 
    SigninSuccessResponse 
} from '../types/types';

type SigninResponse = SigninSuccessResponse | SigninErrorResponse;

const Login: React.FC = () => {
    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues,
        trigger,
        resetField,
    } = useForm<IFormInputs>({
        defaultValues: {
            phone: '',
            code: '',
        },
        mode: 'onChange',
    });

    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [retrySecondsLeft, setRetrySecondsLeft] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (retrySecondsLeft <= 0) return;
            const timer = setTimeout(() => {
            setRetrySecondsLeft((prev) => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [retrySecondsLeft]);

    const onPhoneChange = (value: string, onChange: (value: string) => void) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        onChange(digits);
        trigger('phone');
    };

    const onCodeChange = (value: string, onChange: (value: string) => void) => {
        const digits = value.replace(/\D/g, '').slice(0, 6);
        onChange(digits);
        trigger('code');
    };

    const sendOtpRequest = async (phone: string) => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const response = await axios.post<OtpResponse>('/api/auth/otp', { phone });
            if (response.data.success) {
                setIsCodeSent(true);
                const delaySec = Math.floor(response.data.retryDelay / 1000);
                setRetrySecondsLeft(delaySec);
                resetField('code');
                setErrorMessage(null);
            } else {
                setErrorMessage(response.data.reason || 'Не удалось отправить код. Попробуйте позже.');
                setIsCodeSent(false);
            }
        } catch (err) {
            const axiosErr = err as AxiosError<{ message?: string }>;
            setErrorMessage(axiosErr.response?.data?.message || 'Ошибка сети. Проверьте соединение.');
            setIsCodeSent(false);
        } finally {
            setIsLoading(false);
        }
    };

    const signinRequest = async (phone: string, code: string) => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const response = await axios.post<SigninResponse>('/api/users/signin', {
                phone,
                code: Number(code), 
            });

            if (response.data.success) {
                if (response.data.token) {
                    localStorage.setItem('authToken', response.data.token);
                }
                console.log('Авторизация успешна:', response.data.user);
                alert('Успешный вход! Добро пожаловать.');
                setIsCodeSent(false);
                setRetrySecondsLeft(0);
                setValue('phone', '');
                setValue('code', '');
            } else {
                setErrorMessage(response.data.reason || 'Неверный проверочный код.');
            }
        } catch (err) {
            const axiosErr = err as AxiosError<{ reason?: string; message?: string }>;
            if (axiosErr.response?.data?.reason) {
                setErrorMessage(axiosErr.response.data.reason);
            } else {
                setErrorMessage(axiosErr.response?.data?.message || 'Ошибка авторизации. Попробуйте позже.');
            }
            console.error('Ошибка авторизации:', axiosErr.response?.data);
        } finally {
            setIsLoading(false);    
        }
    };

    const onSubmit = async (data: IFormInputs) => {
        if (data.phone.length !== 11) {
            setErrorMessage('Номер телефона должен содержать 11 цифр.');
            return;
        }
            if (!isCodeSent) {
            await sendOtpRequest(data.phone);
        } else {
            if (data.code.length !== 6) {
                setErrorMessage('Код должен состоять из 6 цифр.');
                return;
            }
            await signinRequest(data.phone, data.code);
        }
    };

    const handleResendCode = async () => {
        if (retrySecondsLeft > 0) return;
            const phone = getValues('phone');
        if (!phone || phone.length !== 11) {
            setErrorMessage('Сначала введите корректный номер телефона.');
            return;
        }
        await sendOtpRequest(phone);
    };
  
    return (
        <div className='container'>
            <form className='form login' onSubmit={handleSubmit(onSubmit)}>
                <div className='login__body'>
                    <h2 className='login__title'>
                    Вход
                    </h2>
                    <div className='login__inner'>
                        <div className='login__field'>
                            <label className='login__field-label' htmlFor="phone">
                                Введите номер телефона для входа в личный кабинет
                            </label>
                            <Controller
                                name="phone"
                                control={control}
                                rules={{
                                    required: 'Поле является обязательным',
                                    minLength: {
                                        value: 11,
                                        message: 'Номер телефона должен содержать 11 цифр',
                                    },
                                    maxLength: {
                                        value: 11,
                                        message: 'Номер телефона должен содержать 11 цифр',
                                    },
                                }}
                                render={({ field }) => (
                                    <input
                                        id="phone"
                                        type="tel"
                                        placeholder="Телефон"
                                        className={`login__field-input ${errors.phone ? 'login__field-input--error' : ''}`}
                                        value={field.value}
                                        onChange={(e) => onPhoneChange(e.target.value, field.onChange)}
                                        onBlur={field.onBlur}
                                        disabled={isLoading}
                                        autoComplete="off"
                                    />
                                )}
                            />
                        </div>
                        {isCodeSent && (
                            <div className='login__field'>
                                <label className='login__field-label visually-hidden' htmlFor="code">
                                    Проверочный код
                                </label>
                                <Controller
                                    name="code"
                                    control={control}
                                    rules={{
                                        required: 'Код должен содержать 6 цифр',
                                        minLength: {
                                            value: 6,
                                            message: 'Код должен содержать 6 цифр',
                                        },
                                        maxLength: {
                                            value: 6,
                                            message: 'Код должен содержать 6 цифр',
                                        },
                                    }}
                                    render={({ field }) => (
                                        <input
                                            id="code"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Проверочный код"
                                            className={`login__field-input ${errors.code ? 'login__field-input--error' : ''}`}
                                            value={field.value}
                                            onChange={(e) => onCodeChange(e.target.value, field.onChange)}
                                            onBlur={field.onBlur}
                                            disabled={isLoading}
                                            autoComplete="off"
                                        />
                                    )}
                                />
                                {errors.code && (
                                    <span className='login__errorMessage'>{errors.code.message}</span>
                                )}
                            </div>
                        )}
                        <button
                            type="submit"
                            className={`login__button button ${isLoading ? 'visually-hidden' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? 'Загрузка...'
                                : !isCodeSent
                                    ? 'Продолжить'
                                    : 'Войти'
                                }
                        </button>
                        {errorMessage && (
                            <div className='login__error'>{errorMessage}</div>
                        )}
                    </div>
                </div>
                {isCodeSent && (
                    <div className='login__request'>
                        {retrySecondsLeft > 0 ? (
                            <p className='login__request-message'>
                                Запросить код повторно можно через {retrySecondsLeft} секунд
                            </p>
                        ) : (
                            <button
                                type="button"
                                className='login__request-button button'
                                onClick={handleResendCode}
                                disabled={isLoading}
                            >
                                Запросить код ещё раз
                            </button>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};

export default Login;