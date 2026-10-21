/**
 * Gemma hook: turns a spoken or typed sale ("5 Maggi bechi") into structured items.
 *
 * The endpoint is read from VITE_GEMMA_ENDPOINT (see .env.example). It must answer with
 * strict JSON: { "items": [{ "name": string, "qty": number }] }
 *
 * `qty` is in display units (kg, L or pieces), the way a shopkeeper says it:
 * "aadha kilo" -> 0.5. Convert with toBaseQty(qty, product.unit) before touching Dexie.
 */

export interface ParsedSaleItem {
  name: string;
  qty: number;
}

export interface ParsedSale {
  items: ParsedSaleItem[];
}

export type GemmaErrorKind =
  | 'empty'
  | 'not-configured'
  | 'offline'
  | 'timeout'
  | 'network'
  | 'http'
  | 'bad-json'
  | 'bad-shape';

export class GemmaError extends Error {
  kind: GemmaErrorKind;

  constructor(kind: GemmaErrorKind, message: string) {
    super(message);
    this.name = 'GemmaError';
    this.kind = kind;
  }
}

const DEFAULT_ENDPOINT = import.meta.env.VITE_GEMMA_ENDPOINT as string | undefined;

/** Sent with every request so the endpoint can be a thin proxy in front of the model. */
const INSTRUCTION =
  'Extract the items sold from this shopkeeper sentence (Hindi, English or Hinglish). ' +
  'Reply with ONLY JSON in exactly this shape: {"items":[{"name":string,"qty":number}]}. ' +
  'qty is a number in kg, litres or pieces (for example "aadha kilo" is 0.5). No other text.';

export interface ParseOptions {
  endpoint?: string;
  timeoutMs?: number;
}

function validate(data: unknown): ParsedSale {
  const bad = (why: string) =>
    new GemmaError('bad-shape', `Gemma replied in an unexpected format (${why}).`);

  if (typeof data !== 'object' || data === null) throw bad('not an object');
  const rawItems = (data as { items?: unknown }).items;
  if (!Array.isArray(rawItems)) throw bad('items is not a list');

  const items = rawItems.map((raw, i): ParsedSaleItem => {
    if (typeof raw !== 'object' || raw === null) throw bad(`item ${i + 1} is not an object`);
    const { name, qty } = raw as Record<string, unknown>;
    if (typeof name !== 'string' || !name.trim()) throw bad(`item ${i + 1} has no name`);
    if (typeof qty !== 'number' || !Number.isFinite(qty) || qty <= 0)
      throw bad(`item ${i + 1} has an invalid qty`);
    return { name: name.trim(), qty };
  });

  return { items };
}

export async function parseSaleText(
  text: string,
  { endpoint = DEFAULT_ENDPOINT, timeoutMs = 8000 }: ParseOptions = {},
): Promise<ParsedSale> {
  const clean = text.trim();
  if (!clean) throw new GemmaError('empty', 'There was nothing to read.');
  if (!endpoint) throw new GemmaError('not-configured', 'Set VITE_GEMMA_ENDPOINT in your .env file.');
  if (!navigator.onLine)
    throw new GemmaError('offline', 'You are offline. Tap the item tiles to log this sale.');

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  let body: string;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ text: clean, instruction: INSTRUCTION }),
      signal: controller.signal,
    });
    if (!res.ok) throw new GemmaError('http', `Gemma endpoint returned ${res.status}.`);
    body = await res.text();
  } catch (err) {
    if (err instanceof GemmaError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError')
      throw new GemmaError('timeout', 'Gemma took too long to answer.');
    throw new GemmaError('network', 'Could not reach the Gemma endpoint.');
  } finally {
    window.clearTimeout(timer);
  }

  // Models sometimes wrap JSON in a ```json fence. Strip it, but stay strict about the rest.
  const unfenced = body.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(unfenced);
  } catch {
    throw new GemmaError('bad-json', 'Gemma did not reply with valid JSON.');
  }
  return validate(parsed);
}