import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';

function isDestroyable(val: any): val is { destroy(): void } {
  return 'destroy' in val && typeof val.destroy === 'function';
}

export class DependencyNotFoundError extends Error {
  constructor(token: string) {
    super(`No dependency provided for token ${token}`);
  }
}

export class InvalidDependencyError extends Error {
  constructor(token: string) {
    super(`Dependency was not instance of token ${token}`);
  }
}

interface Constructor<T> {
  new (...args: any[]): T;
}

class ProviderLayer {
  constructor(private readonly parentLayer?: ProviderLayer) {}

  private providers = new Map<Constructor<any>, any>();

  provide<T>(token: Constructor<T>, instanceCallback: () => T): void {
    if (!this.providers.has(token)) {
      this.providers.set(token, instanceCallback());
    }
  }

  getOr<T, U>(token: Constructor<T>, defaultCallback: () => U): T | U {
    const dep = this.providers.get(token);

    if (!dep) {
      if (this.parentLayer) {
        return this.parentLayer.getOr(token, defaultCallback);
      } else {
        return defaultCallback();
      }
    } else {
      return dep;
    }
  }

  clear(): void {
    for (const instance of Array.from(this.providers.values())) {
      if (isDestroyable(instance)) {
        instance.destroy();
      }
    }
  }

  get<T>(token: Constructor<T>): T {
    const dep = this.getOr(token, () => {
      throw new DependencyNotFoundError(token.toString());
    });

    if (!(dep instanceof token)) {
      throw new InvalidDependencyError(token.toString());
    }

    return dep;
  }
}

const ProviderLayerContext = React.createContext(new ProviderLayer());

function useProviderLayer(): ProviderLayer {
  return useContext(ProviderLayerContext);
}

/**
 * Get a dependency from the layer based on the constructor.
 *
 * If the dependency doesn't exist this method will throw an error.
 */
export function useDep<T>(token: Constructor<T>): T {
  const layer = useProviderLayer();
  return layer.get(token);
}

/**
 * Get a dependency from the layer based on the constructor. If it doesn't exist,
 * return whatever was provided by the callback.
 */
export function useDepOr<T, U>(
  token: Constructor<T>,
  defaultCallback: () => U
): T | U {
  const layer = useProviderLayer();
  return layer.getOr(token, defaultCallback);
}

/**
 * Get a dependency from the layer based on the constructor. If it doesn't exist,
 * return whatever was provided by the callback.
 */
export function useDepChecked<T>(token: Constructor<T>): T | undefined {
  const layer = useProviderLayer();
  return layer.getOr(token, () => undefined);
}

interface ProviderContext {
  provide: <T>(token: Constructor<T>, instanceCallback: () => T) => void;
  get: <T>(token: Constructor<T>) => T;
  getOr: <T, U>(token: Constructor<T>, defaultCallback: () => U) => T | U;
}

export type ProviderSetupFn = (context: ProviderContext) => void;

type ProviderProps = PropsWithChildren<{
  setup: ProviderSetupFn;
}>;

export function Provider({ setup, children }: ProviderProps): JSX.Element {
  const parentLayer = useProviderLayer();

  const currentLayer = useRef<ProviderLayer>(undefined as any);

  if (!currentLayer.current) {
    currentLayer.current = new ProviderLayer(parentLayer);
  }

  useEffect(() => {
    return () => {
      currentLayer.current.clear();
    };
  }, []);

  useMemo(() => {
    const layer = currentLayer.current;

    const provide = layer.provide.bind(layer);
    const getOr = layer.getOr.bind(layer);
    const get = layer.get.bind(layer);

    setup({ provide, getOr, get });
  }, [setup]);

  return (
    <ProviderLayerContext.Provider value={currentLayer.current}>
      {children}
    </ProviderLayerContext.Provider>
  );
}
