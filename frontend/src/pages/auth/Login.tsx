import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand p-10">
      <div className="w-[380px] rounded-l border border-sand-line bg-paper-raised p-10">
        <h1 className="mb-1.5 font-serif text-2xl">Welcome back</h1>
        <p className="mb-5 text-[13.5px] text-ink-soft">Log in to your student account</p>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-[12.5px] font-semibold">Email</label>
          <input
            className="w-full rounded-lg border border-sand-line bg-paper px-3 py-2.5 text-sm focus:outline focus:outline-2 focus:outline-signal"
            placeholder="you@university.edu"
          />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[12.5px] font-semibold">Password</label>
          <input
            type="password"
            className="w-full rounded-lg border border-sand-line bg-paper px-3 py-2.5 text-sm focus:outline focus:outline-2 focus:outline-signal"
            placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
          />
        </div>
        <div className="my-2.5 mb-4.5 flex items-center justify-between text-[12.5px] text-ink-soft">
          <label className="flex items-center gap-1.5"><input type="checkbox" /> Remember me</label>
          <span className="font-semibold text-signal">Forgot password?</span>
        </div>
        <button onClick={() => navigate('/student')} className="btn btn-primary w-full py-3">
          Log in
        </button>
        <p className="mt-4 text-center text-[12.5px]">
          No account? <span className="font-semibold text-signal">Create one</span>
        </p>
      </div>
    </div>
  );
}
