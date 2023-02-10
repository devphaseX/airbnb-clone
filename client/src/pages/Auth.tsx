import { useState } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import '../style/login.css';
import googleIcon from '../assets/google.svg';
import { Hide, Show } from '../ui/icon/password';
import { Input } from '../ui/input';
import { useEffect } from 'react';
import { useRef } from 'react';

type AuthStep = 'verify' | 'password' | 'register';

type AuthButtonMessage = Record<AuthStep, string>;
const authMessage = {
  verify: 'Continue',
  password: 'Log in',
  register: 'Agree and Continue',
} as const satisfies AuthButtonMessage;

type LoginFormData = { email: string; password: string };
type RegisterFormData = LoginFormData & {
  first_name: string;
  last_name: string;
  birthday: string;
};

type AuthFormData = LoginFormData | RegisterFormData;

const Authenicate = () => {
  const [authStep, setAuthStep] = useState<AuthStep>('verify');
  const formProps = useForm<Partial<AuthFormData>>({ values: { email: '' } });
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (authStep !== 'password' && sectionRef.current) {
      sectionRef.current.setAttribute('type', authStep);
    }
  }, [authStep]);

  return (
    <section className="auth-section" ref={sectionRef}>
      <div className="auth-section-wrapper section-wrapper">
        <div className="auth-wrapper">
          <div className="auth-type">
            <h4 className="auth-type__title">
              {authStep !== 'register'
                ? 'Log in or sign up'
                : 'Finish siginig up'}
            </h4>
          </div>

          <FormProvider {...formProps}>
            <div className="form-wrapper">
              {authStep !== 'register' ? (
                <LogUserIn step={authStep} setStep={setAuthStep} />
              ) : (
                <Register />
              )}
            </div>
          </FormProvider>
        </div>
      </div>
    </section>
  );
};

type LogUserInProps = {
  step: Exclude<AuthStep, 'register'>;
  setStep: (nextStep: AuthStep) => void;
};

const LogUserIn = ({ step, setStep }: LogUserInProps) => {
  const { register, handleSubmit, unregister: unregisterInputEl } = useForm();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (step === 'verify') {
      unregisterInputEl('email');
      unregisterInputEl('password');
    }
  }, []);

  return (
    <>
      <form
        onSubmit={handleSubmit((_data) => {
          setStep('register');
        })}
      >
        <h3 className="auth-welcome-message">Welcome to Airbnb</h3>
        {step === 'verify' ? (
          <Input
            type="email"
            inputClass="text__input"
            label="email"
            labelClass="text__input-label"
            placeholder="Email"
            {...register('email')}
          />
        ) : (
          <Input
            type={showPassword ? 'text' : 'password'}
            inputClass="text__input"
            label="password"
            labelClass="text__input-label"
            placeholder="Password"
            {...register('password')}
            Icon={() => (
              <span
                className="password-icon"
                onClick={() => setShowPassword((status) => !status)}
              >
                {showPassword ? <Show /> : <Hide />}
              </span>
            )}
          />
        )}

        <button className="auth__verify-btn" type="submit">
          {authMessage[step]}
        </button>
      </form>
      <ExternalPlatformAuth />
    </>
  );
};

const ExternalPlatformAuth = () => (
  <div className="auth__external-wrapper">
    <p>or</p>
    <div className="auth__external-links">
      {externalAuths.map((authProps) => (
        <ExternalAuth {...authProps} key={authProps.href} />
      ))}
    </div>
  </div>
);

const Register = () => {
  const { getValues, register, unregister } =
    useFormContext<RegisterFormData>();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    unregister('email');
    unregister('password');
    unregister('first_name');
    unregister('last_name');
    unregister('birthday');
  }, []);
  return (
    <form className="form__register">
      <div className="name-wrapper">
        <Input
          type="text"
          {...register('first_name')}
          label="first name"
          inputClass="text__input"
          labelClass="text__input-label"
          placeholder="first name"
        />
        <Input
          type="text"
          {...register('last_name')}
          label="last name"
          inputClass="text__input"
          labelClass="text__input-label"
          placeholder="last name"
        />
        <p>Make sure it matches the name on your Government ID card.</p>
      </div>
      <div>
        <Input
          type="text"
          inputClass="text__input"
          label="Birthday"
          labelClass="text__input-label"
          placeholder="Birthday"
          {...register('birthday')}
        />
        <p>
          To sign up,you need to be at least 18.Your birthday won't be shared
          with other people who use Airbnb.
        </p>
      </div>
      <div>
        <Input
          type="email"
          inputClass="text__input"
          label="email"
          labelClass="text__input-label"
          placeholder="Email"
          {...register('email')}
          defaultValue={getValues().email}
        />
        <p>We'll email you tip confirmations and receipts.</p>
      </div>
      <div>
        <Input
          type={showPassword ? 'text' : 'password'}
          inputClass="text__input"
          label="password"
          labelClass="text__input-label"
          placeholder="Password"
          {...register('password')}
          Icon={() => (
            <span
              className="password-register"
              onClick={() => setShowPassword((status) => !status)}
            >
              {showPassword ? 'hide' : 'show'}
            </span>
          )}
        />
      </div>

      <div className="register_finalize">
        <div className="term-and-condition">
          <p style={{ whiteSpace: 'pre-line' }}>
            By selecting <span>Agree and continue</span>,I agree to Airbnb's
            <a> Terms of Service, Payments Terms of Service, and</a>
            <a> Nondiscrimination Policy.</a>
            and acknowledge the <a>Privacy Policy</a>
          </p>
        </div>
        <button className="auth__verify-btn" type="submit">
          {authMessage.register}
        </button>
      </div>
    </form>
  );
};

type ExternalAuthProp = {
  title: string;
  imgSrc: string;
  href: string;
  name: string;
};

const externalAuths: Array<ExternalAuthProp> = [
  {
    name: 'Google',
    title: 'continue with google',
    href: '',
    imgSrc: googleIcon,
  },
];

const ExternalAuth = ({ name, title, href, imgSrc }: ExternalAuthProp) => (
  <a href={href} className="external-auth">
    <span className="external__icon">
      <img src={imgSrc} alt={name} />
    </span>
    <p>{title}</p>
  </a>
);

export { Authenicate };
