import { useRef, useState, type ChangeEvent } from 'react';

interface City {
  name: string;
  countryName: string;
  population: number;
}

interface CitiesResponse {
  letter: string;
  count: number;
  cities: City[];
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: CitiesResponse }
  | { status: 'error'; message: string };

const LETTER = /^\p{L}$/u;

export default function App() {
  const [letter, setLetter] = useState('');
  const [state, setState] = useState<State>({ status: 'idle' });
  const controllerRef = useRef<AbortController | null>(null);

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    // keep only the last typed character, so typing a new letter replaces the old one
    const value = Array.from(e.target.value).at(-1) ?? '';
    setLetter(value);

    controllerRef.current?.abort();
    if (!LETTER.test(value)) {
      setState({ status: 'idle' });
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: 'loading' });

    try {
      const res = await fetch(`/api/cities?letter=${encodeURIComponent(value)}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      setState({ status: 'success', data: (await res.json()) as CitiesResponse });
    } catch (err) {
      if (controller.signal.aborted) return;
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  const invalid = letter !== '' && !LETTER.test(letter);

  return (
    <main className="app">
      <h1>Cities by first letter</h1>
      <label htmlFor="letter">Type a letter to count the 50 most populous cities that start with it.</label>
      <input
        id="letter"
        className="letter"
        value={letter}
        onChange={handleChange}
        autoComplete="off"
        autoFocus
      />

      <section aria-live="polite">
        {invalid && <p className="muted">Only letters are supported. Try "c".</p>}
        {state.status === 'loading' && <p className="muted">Counting…</p>}
        {state.status === 'error' && <p role="alert">Could not load cities: {state.message}</p>}
        {state.status === 'success' && <Result data={state.data} />}
      </section>
    </main>
  );
}

function Result({ data }: { data: CitiesResponse }) {
  const label = data.count === 1 ? 'city starts' : 'cities start';

  return (
    <>
      <p className="count">
        <strong>{data.count}</strong> {label} with {data.letter.toUpperCase()}
      </p>
      <ul>
        {data.cities.map((city) => (
          <li key={`${city.name}-${city.countryName}`}>
            {city.name} <span className="muted">{city.countryName}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
