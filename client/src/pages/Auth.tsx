import { useState, useId, useRef, useEffect } from 'react';
import { LoaderFunctionArgs, redirect, useLocation } from 'react-router-dom';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { createStore, useStore } from 'zustand';
import '../style/login.css';
import googleIcon from '../assets/google.svg';
import { Hide, Show } from '../ui/icon/password';
import { TagInput } from '../ui/input';
import { authRoutePattern } from '../util';
import { preAuthPageStore } from '../store/slice/resumePage';
import { clientInfoStore } from '../store/slice/user';
import { logUserApi, verifyUserApi } from '../store/api';
import { registerUserApi } from '../store/api/registerApi';
import {
  AuthFormData,
  LoginFormData,
  RegisterFormData,
} from '../store/api/baseUrl';
import { userSession } from '../component/layout/ReAuthUser';
import backChevronIcon from '../assets/chevron.svg';
import { useBlockLinkNavigate } from '../hooks/useBlockLink';

type AuthStep = 'verify' | 'password' | 'register';

type AuthButtonMessage = Record<Exclude<AuthStep, 'complete'>, string>;
const authMessage = {
  verify: 'Continue',
  password: 'Log in',
  register: 'Agree and Continue',
} as const satisfies AuthButtonMessage;

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
  const { email, resetEmail } = useStore(lockEmailStore);
  const { resetPath } = useStore(preAuthPageStore);
  const navigate = useBlockLinkNavigate();

  useEffect(() => {
    return () => {
      //prevent entrant to already navigated page
      resetPath();
      resetEmail();
    };
  }, []);

  useEffect(() => {
    if (authStep !== 'password' && sectionRef.current) {
      sectionRef.current.setAttribute('type', authStep);
    }
    const path = authRoutePattern.exec(pathname)?.[1];
    if (!path) return;

    //reflect the path to signup when the register component is displayed.
    if (authStep === 'register' && path !== 'signup') {
      navigate({ to: '/signup' });
      //reflect the path to login when user is verified to have opened an account.
    } else if (authStep === 'password' && path === 'verify') {
      navigate({ to: '/login' });
      //revert an change in route if user is currently viewing the verify page and route does not match
    } else if (authStep === 'verify' && path !== 'verify') {
      navigate({ to: '/verify' });
    }
  }, [authStep]);

  useEffect(() => {
    const pathMatch = authRoutePattern.exec(pathname);
    if (!pathMatch) return;

    let path = pathMatch[1];

    //sync the path which the component displayed
    //when path changed to verify, auto changed dispay component to verify component
    if (
      path === 'verify' &&
      (authStep === 'register' || authStep === 'password')
    ) {
      setAuthStep('verify');
      //only navigate user to signup if there is a provided email and it isn't mark as registered
    } else if (path === 'signup' && email.trim()) {
      setAuthStep('register');
      //only navigate user to login if the verification report true for registered account
    } else if (!email.trim() && path === 'signup') {
      setAuthStep('verify');
    }
  }, [pathname]);

  useEffect(() => {
    if (!authRoutePattern.test(pathname)) resetEmail();
  }, []);

  return (
    <section className="auth-section" ref={sectionRef}>
      <div className="auth-section-wrapper section-wrapper">
        <div className="auth-wrapper">
          <div className="auth-type">
            {authStep !== 'verify' ? (
              <span
                className="back-button"
                onClick={() => setAuthStep('verify')}
              >
                <img src={backChevronIcon} alt="back button" />
              </span>
            ) : null}
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
  const { path } = useStore(preAuthPageStore);
  const navigate = useBlockLinkNavigate();
  const { pathname } = useLocation();
  const emailId = `email:${useId()}`;
  const passwordId = `password:${useId()}`;
  const setUser = useStore(clientInfoStore, (state) => state.setUser);
  const [abort, setAbort] = useState(new AbortController());
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) return;
    abort.abort();
    setAbort(new AbortController());
  }, [pathname, step]);

  return (
    <>
      <form
        onSubmit={handleSubmit(async (formData) => {
          setLoading(true);
          try {
            if (step === 'verify') {
              const response = await verifyUserApi(
                { email: formData.email },
                { signal: abort.signal }
              );

              if (response.ok) {
                const userStatus: {
                  exist: boolean;
                } = await response.json();

                setEmail(formData.email);
                if (userStatus.exist) {
                  setStep('password');
                } else {
                  setStep('register');
                }
              } else {
                //report that there is an issue signing them in
              }
            } else if (step === 'password') {
              const response = await logUserApi(
                { email, password: formData.password },
                { signal: abort.signal }
              );

              if (response.ok) {
                const user = (await response.json()).data;
                setUser(user);
                navigate({ to: path });
              } else {
                //report that there is an issue signing them in
              }
            }
          } finally {
            setLoading(false);
          }
        })}
      >
        <h3 className="auth-welcome-message">Welcome to Airbnb</h3>
        {step === 'verify' ? (
          <TagInput
            key={emailId}
            type="email"
            label="email"
            placeholder="Email"
            {...register('email')}
          />
        ) : (
          <TagInput
            key={passwordId}
            type={showPassword ? 'text' : 'password'}
            label="password"
            placeholder="Password"
            {...register('password')}
            Icon={() => (
              <span onClick={() => setShowPassword((status) => !status)}>
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
const Register = ({ setStep }: RegisterProps) => {
  const { register, handleSubmit, reset } = useFormContext<RegisterFormData>();
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

  useEffect(() => {
    return () =>
      reset({
        firstName: '',
        lastName: '',
        birthday: '',
        password: '',
      });
  }, []);

  return (
    <form
      className="form__register"
      onSubmit={handleSubmit(async (formData) => {
        const response = await registerUserApi({ ...formData, email });
        if (response.ok) setStep('password');
        else {
          //
        }
      })}
    >
      <div className="name-wrapper">
        <TagInput
          type="text"
          {...register('firstName')}
          label="first name"
          placeholder="first name"
        />
        <TagInput
          type="text"
          {...register('lastName')}
          label="last name"
          placeholder="last name"
          onFocus={createFocusHandler(true)}
          onBlur={createFocusHandler(false)}
        />
        <p>Make sure it matches the name on your Government ID card.</p>
      </div>
      <div>
        <TagInput
          type="text"
          label="Birthday"
          placeholder="Birthday"
          {...register('birthday')}
        />
        <p>
          To sign up,you need to be at least 18.Your birthday won't be shared
          with other people who use Airbnb.
        </p>
      </div>
      <div>
        <TagInput
          type="email"
          label="email"
          placeholder={email.toLowerCase() || 'Email'}
          {...register('email', { disabled: email !== '', value: email })}
        />
        <p>We'll email you tip confirmations and receipts.</p>
      </div>
      <div>
        <TagInput
          type={showPassword ? 'text' : 'password'}
          label="password"
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

async function shouldBlockAuthAccess() {
  await userSession.getState().waitForLoadingDone();
  const user = clientInfoStore.getState().user;
  const { path, resetPath } = preAuthPageStore.getState();

  if (user) {
    resetPath();
    return redirect(path ?? '/');
  }
  return null;
}

async function shouldGrantProtectAccess({ request }: LoaderFunctionArgs) {
  const pathname = new URL(request.url).pathname;
  await userSession.getState().waitForLoadingDone();
  const user = clientInfoStore.getState().user;
  const setResumePath = preAuthPageStore.getState().setPath;

  if (!user) {
    setResumePath(pathname);
    return redirect('/login');
  }

  return null;
}

export { Authenicate, shouldBlockAuthAccess, shouldGrantProtectAccess };
export type { RegisterFormData, LoginFormData };
