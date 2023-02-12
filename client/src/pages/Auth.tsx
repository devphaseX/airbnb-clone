import { useState, useId, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { createStore, useStore } from 'zustand';
import '../style/login.css';
import googleIcon from '../assets/google.svg';
import { Hide, Show } from '../ui/icon/password';
import { Input } from '../ui/input';
import { authRoutePattern } from '../util';
import { resumePage } from '../store/slice/resumePage';

type AuthStep = 'verify' | 'password' | 'register';

type AuthButtonMessage = Record<Exclude<AuthStep, 'complete'>, string>;
const authMessage = {
  verify: 'Continue',
  password: 'Log in',
  register: 'Agree and Continue',
} as const satisfies AuthButtonMessage;

type LoginFormData = { email: string; password: string };
type RegisterFormData = LoginFormData & {
  firstName: string;
  lastName: string;
  birthday: string;
};

type AuthFormData = LoginFormData | RegisterFormData;

type LockEmailStore = {
  email: string;
  setEmail: (email: string) => void;
  resetEmail: () => void;
};

const lockEmailStore = createStore<LockEmailStore>((set) => ({
  email: '',
  setEmail: (email: string) => set({ email }),
  resetEmail: () => set({ email: '' }),
}));

const Authenicate = () => {
  const [authStep, setAuthStep] = useState<AuthStep>('verify');
  const formProps = useForm<Partial<AuthFormData>>();
  const sectionRef = useRef<HTMLElement | null>(null);
  const { pathname } = useLocation();
  const prevPathname = useRef('');
  const { resetPath } = useStore(resumePage);
  const { resetEmail } = useStore(lockEmailStore);

  useEffect(() => {
    return () => {
      resetPath();
      resetEmail();
    };
  }, []);

  useEffect(() => {
    const pathMatch = authRoutePattern.exec(pathname);
    let path: string;
    if (
      !pathMatch ||
      prevPathname.current === (path = pathMatch[1].toLowerCase())
    ) {
      return;
    }
    if (
      path === 'login' &&
      (authStep === 'register' || authStep === 'password')
    ) {
      setAuthStep('verify');
    }
    prevPathname.current = path;
  }, [pathname]);

  useEffect(() => {
    if (authStep !== 'password' && sectionRef.current) {
      sectionRef.current.setAttribute('type', authStep);
    }
  }, [authStep]);

  useEffect(() => {
    if (!authRoutePattern.test(pathname)) resetEmail();
  }, []);

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
                <Register setStep={setAuthStep} />
              )}
            </div>
          </FormProvider>
        </div>
      </div>
    </section>
  );
};

type AuthStage = {
  step: Exclude<AuthStep, 'register' | 'complete'>;
  setStep: (nextStep: AuthStep) => void;
};

type LogUserInProps = AuthStage;

const LogUserIn = ({ step, setStep }: LogUserInProps) => {
  const { register, handleSubmit } = useForm<LoginFormData>();
  const [showPassword, setShowPassword] = useState(false);
  const { email, setEmail } = useStore(lockEmailStore);
  const { path } = useStore(resumePage);
  const navigate = useNavigate();
  const emailId = `email:${useId()}`;
  const passwordId = `password:${useId()}`;

  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          if (step === 'verify') {
            fetch('http://127.0.0.1:5001/auth/verify', {
              body: JSON.stringify({ email: data.email }),
              headers: new Headers([['content-type', 'application/json']]),
              method: 'POST',
            }).then((response) => {
              if (response.ok) {
                return response.json().then((data) => {
                  if (data.exist) {
                    setStep('password');
                  } else {
                    setEmail(data.email);
                    setStep('register');
                  }
                });
              }
            });
          } else if (step === 'password') {
            fetch('http://127.0.0.1:5001/auth/login', {
              body: JSON.stringify({
                email: data.email,
                password: data.password,
              }),
              headers: new Headers([['content-type', 'application/json']]),
              method: 'POST',
            }).then((response) => {
              if (response.ok) {
                return response.json().then((data) => {
                  navigate(path);
                });
              }
            });
          }
        })}
      >
        <h3 className="auth-welcome-message">Welcome to Airbnb</h3>
        {step === 'verify' ? (
          <Input
            key={emailId}
            type="email"
            inputClass="text__input"
            label="email"
            labelClass="text__input-label"
            placeholder="Email"
            defaultValue={email || ''}
            {...register('email')}
          />
        ) : (
          <Input
            key={passwordId}
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

type RegisterProps = Omit<AuthStage, 'step'>;
const Register = ({}: RegisterProps) => {
  const { register, handleSubmit } = useFormContext<RegisterFormData>();
  const [showPassword, setShowPassword] = useState(false);
  const { email } = useStore(lockEmailStore);

  const createFocusHandler =
    (force: boolean) =>
    ({ target }: React.FocusEvent<HTMLInputElement>) => {
      const nameElementWrapper = target.closest(
        '.name-wrapper'
      ) as HTMLDivElement | null;

      if (!nameElementWrapper) return;

      nameElementWrapper.toggleAttribute('last-input-active', force);
    };

  return (
    <form
      className="form__register"
      onSubmit={handleSubmit((formData) => {
        fetch('http://127.0.0.1:5001/auth/create', {
          method: 'POST',
          body: JSON.stringify({ ...formData, email }),
          headers: new Headers([['content-type', 'application/json']]),
        }).then((response) => {
          if (response.ok) {
            return response.json().then((data) => {
              console.log(data);
              // navigate(path);
            });
          }
        });
      })}
    >
      <div className="name-wrapper">
        <Input
          type="text"
          {...register('firstName')}
          label="first name"
          inputClass="text__input"
          labelClass="text__input-label"
          placeholder="first name"
        />
        <Input
          type="text"
          {...register('lastName')}
          label="last name"
          inputClass="text__input"
          labelClass="text__input-label"
          placeholder="last name"
          onInputFocus={createFocusHandler(true)}
          onInputBlur={createFocusHandler(false)}
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
          placeholder={email.toLowerCase() || 'Email'}
          {...register('email')}
          defaultValue={email || ''}
          disabled={email !== ''}
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
              className="password-icon password-register"
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
