import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockColor = {
  id: 'abc-123',
  date: '2026-03-05T06:00:00.000Z',
  rgb: { r: 163, g: 146, b: 104 },
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: jest.fn(() => 'test-user-uuid-1234'),
};

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] ?? null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock navigator.mediaDevices (camera unavailable by default in jsdom)
Object.defineProperty(navigator, 'mediaDevices', {
  value: { getUserMedia: jest.fn() },
  writable: true,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetchSuccess(data) {
  global.fetch.mockResolvedValueOnce({
    json: async () => ({ success: true, data }),
  });
}

function mockFetchError(error = 'Something went wrong') {
  global.fetch.mockResolvedValueOnce({
    json: async () => ({ success: false, error }),
  });
}

function mockFetchNetworkFailure() {
  global.fetch.mockRejectedValueOnce(new Error('Network error'));
}

async function renderApp() {
  mockFetchSuccess(mockColor);
  let result;
  await act(async () => {
    result = render(<App />);
  });
  return result;
}

async function uploadImage(file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })) {
  const input = document.querySelector('input[type="file"]');
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });
  return file;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});

// ── Component Rendering ───────────────────────────────────────────────────────

describe('Component Rendering', () => {
  test('shows loading spinner on initial render', () => {
    global.fetch.mockReturnValueOnce(new Promise(() => {})); // never resolves
    render(<App />);
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  test('renders header with logo and attempts', async () => {
    await renderApp();
    expect(screen.getByText('colorhunt')).toBeInTheDocument();
    expect(screen.getByText(/left today/i)).toBeInTheDocument();
  });

  test('renders hunt view after color loads', async () => {
    await renderApp();
    expect(screen.getByText("today's color")).toBeInTheDocument();
    expect(screen.getByText('163 · 146 · 104')).toBeInTheDocument();
  });

  test('renders color swatch with correct background color', async () => {
    await renderApp();
    const swatch = document.querySelector('.color-swatch');
    expect(swatch).toHaveStyle('background-color: rgb(163, 146, 104)');
  });

  test('renders instructions text', async () => {
    await renderApp();
    expect(screen.getByText(/find something in the world/i)).toBeInTheDocument();
    expect(screen.getByText(/photograph it/i)).toBeInTheDocument();
  });

  test('renders upload button when camera is unavailable', async () => {
    await renderApp();
    expect(screen.getByText(/upload a photo/i)).toBeInTheDocument();
  });

  test('shows 6 attempts remaining by default', async () => {
    await renderApp();
    expect(screen.getByText(/6/)).toBeInTheDocument();
  });
});

// ── API Calls / Data Fetching ─────────────────────────────────────────────────

describe('API Calls', () => {
  test('fetches target color on mount', async () => {
    await renderApp();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/target?timezone_offset=')
    );
  });

  test('includes timezone offset in target fetch', async () => {
    await renderApp();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toMatch(/timezone_offset=-?\d/);
  });

  test('shows error message when target fetch fails', async () => {
    mockFetchNetworkFailure();
    await act(async () => { render(<App />); });
    await waitFor(() => {
      expect(screen.getByText(/could not load today's color/i)).toBeInTheDocument();
    });
  });

  test('shows error when server returns success: false', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'DB error' }),
    });
    await act(async () => { render(<App />); });
    // Should fall back to hunt phase with error
    await waitFor(() => {
      expect(screen.getByText(/could not load today's color/i)).toBeInTheDocument();
    });
  });

  test('calls /api/analysis with correct fields on submit', async () => {
    await renderApp();
    await uploadImage();

    // Mock the analysis response
    mockFetchSuccess({ score: 450, attemptsRemaining: 5 });

    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    const [url, options] = global.fetch.mock.calls[1];
    expect(url).toContain('/api/analysis');
    expect(options.method).toBe('POST');

    const body = options.body;
    expect(body.get('user_id')).toBeTruthy();
    expect(body.get('image')).toBeTruthy();
    expect(body.get('timezone_offset')).toBeTruthy();
  });

  test('creates and stores guest user ID in localStorage', async () => {
    await renderApp();
    await uploadImage();
    mockFetchSuccess({ score: 200, attemptsRemaining: 5 });

    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'colorhunt_user_id',
      'test-user-uuid-1234'
    );
  });

  test('reuses existing guest user ID from localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('existing-user-id');
    await renderApp();
    await uploadImage();
    mockFetchSuccess({ score: 200, attemptsRemaining: 5 });

    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    const body = global.fetch.mock.calls[1][1].body;
    expect(body.get('user_id')).toBe('existing-user-id');
  });

  test('shows error message when analysis fails', async () => {
    await renderApp();
    await uploadImage();
    mockFetchError('No attempts remaining for today');

    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    await waitFor(() => {
      expect(screen.getByText('No attempts remaining for today')).toBeInTheDocument();
    });
  });

  test('shows generic error message when network fails during analysis', async () => {
    await renderApp();
    await uploadImage();
    mockFetchNetworkFailure();

    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    await waitFor(() => {
      expect(screen.getByText(/could not analyze image/i)).toBeInTheDocument();
    });
  });
});

// ── User Interactions ─────────────────────────────────────────────────────────

describe('User Interactions', () => {
  test('clicking upload button triggers file input', async () => {
    await renderApp();
    const input = document.querySelector('input[type="file"]');
    const clickSpy = jest.spyOn(input, 'click');
    fireEvent.click(screen.getByText(/upload a photo/i));
    expect(clickSpy).toHaveBeenCalled();
  });

  test('uploading a file moves to preview phase', async () => {
    await renderApp();
    await uploadImage();
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Retake')).toBeInTheDocument();
  });

  test('uploaded image is displayed in preview', async () => {
    await renderApp();
    await uploadImage();
    const img = screen.getByAltText('Your capture');
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('blob:mock-url');
  });

  test('submit button is disabled while analyzing', async () => {
    await renderApp();
    await uploadImage();

    // Mock a slow response
    global.fetch.mockReturnValueOnce(new Promise(() => {}));

    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    expect(screen.getByText('Analyzing…')).toBeDisabled();
  });

  test('clicking retake returns to hunt phase', async () => {
    await renderApp();
    await uploadImage();

    await act(async () => {
      fireEvent.click(screen.getByText('Retake'));
    });

    expect(screen.getByText("today's color")).toBeInTheDocument();
  });

  test('clicking hunt again after result resets to hunt phase', async () => {
    await renderApp();
    await uploadImage();
    mockFetchSuccess({ score: 500, attemptsRemaining: 5 });

    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    await waitFor(() => screen.getByText('Hunt again'));

    await act(async () => {
      fireEvent.click(screen.getByText('Hunt again'));
    });

    expect(screen.getByText("today's color")).toBeInTheDocument();
  });

  test('file input accepts only images', async () => {
    await renderApp();
    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('accept', 'image/*');
  });

  test('uploading no file does nothing', async () => {
    await renderApp();
    const input = document.querySelector('input[type="file"]');
    await act(async () => {
      fireEvent.change(input, { target: { files: [] } });
    });
    // Should still be in hunt phase
    expect(screen.getByText("today's color")).toBeInTheDocument();
  });
});

// ── Phase Transitions ─────────────────────────────────────────────────────────

describe('Phase Transitions', () => {
  test('loading → hunt after color fetched', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockColor }),
    });
    render(<App />);
    expect(document.querySelector('.spinner')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("today's color")).toBeInTheDocument();
    });
  });

  test('hunt → preview after image upload', async () => {
    await renderApp();
    expect(screen.getByText("today's color")).toBeInTheDocument();
    await uploadImage();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  test('preview → result after successful analysis', async () => {
    await renderApp();
    await uploadImage();
    mockFetchSuccess({ score: 650, attemptsRemaining: 5 });

    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    await waitFor(() => {
      expect(screen.getByText('650')).toBeInTheDocument();
      expect(screen.getByText('pts')).toBeInTheDocument();
    });
  });

  test('preview → preview (stays) after failed analysis', async () => {
    await renderApp();
    await uploadImage();
    mockFetchError('Analysis failed');

    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.getByText('Analysis failed')).toBeInTheDocument();
    });
  });

  test('result → hunt after clicking hunt again', async () => {
    await renderApp();
    await uploadImage();
    mockFetchSuccess({ score: 300, attemptsRemaining: 5 });

    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    await waitFor(() => screen.getByText('Hunt again'));

    await act(async () => {
      fireEvent.click(screen.getByText('Hunt again'));
    });

    expect(screen.getByText("today's color")).toBeInTheDocument();
  });

  test('hunt again button hidden when no attempts remaining', async () => {
    await renderApp();
    await uploadImage();
    mockFetchSuccess({ score: 300, attemptsRemaining: 0 });

    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    await waitFor(() => screen.getByText('pts'));
    expect(screen.queryByText('Hunt again')).not.toBeInTheDocument();
  });
});

// ── Score Labels ──────────────────────────────────────────────────────────────

describe('Score Labels', () => {
  async function getToResult(score, attemptsRemaining = 5) {
    await renderApp();
    await uploadImage();
    mockFetchSuccess({ score, attemptsRemaining });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });
    await waitFor(() => screen.getByText('pts'));
  }

  test('shows "Perfect match" for score > 800', async () => {
    await getToResult(850);
    expect(screen.getByText('Perfect match')).toBeInTheDocument();
  });

  test('shows "Great find" for score > 400', async () => {
    await getToResult(500);
    expect(screen.getByText('Great find')).toBeInTheDocument();
  });

  test('shows "Good eye" for score > 100', async () => {
    await getToResult(150);
    expect(screen.getByText('Good eye')).toBeInTheDocument();
  });

  test('shows "Keep hunting" for score <= 100', async () => {
    await getToResult(50);
    expect(screen.getByText('Keep hunting')).toBeInTheDocument();
  });

  test('displays correct score number', async () => {
    await getToResult(742);
    expect(screen.getByText('742')).toBeInTheDocument();
  });

  test('rounds decimal scores', async () => {
    await getToResult(742.7);
    expect(screen.getByText('743')).toBeInTheDocument();
  });
});
