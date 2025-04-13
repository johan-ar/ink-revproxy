import React, { createContext, useContext, useEffect } from "react";
import clearScreen from "./util/clearScreen.js";
import { asReadable, useReadable, writable } from "./util/writable.js";

export type Location<T = undefined> = T extends undefined
  ? { path: string }
  : { path: string; state: T };

export type HistoryState = {
  current: number;
  history: [Location, ...Location[]];
};

export interface History extends ReturnType<typeof createHistory> {}

export const createHistory = () => {
  const toLocation = (location: Location<any> | string): Location<any> =>
    typeof location === "string" ? { path: location } : location;

  const history = writable<HistoryState>({
    current: 0,
    history: [{ path: "" }],
  }).extend((self) => {
    const location = <T,>() => {
      const $state = self.get();
      return $state.history[$state.current]! as Location<T>;
    };

    return {
      location,
      reset(initialLocation: Location) {
        self.update(($state) => {
          $state.current = 0;
          $state.history = [initialLocation];
        });
      },
      go(location: Location<any> | string) {
        const location_ = toLocation(location);
        location_.path = location_.path.split(/[/]+/g).join("/");
        self.update(($state) => {
          $state.history.splice($state.current + 1, Infinity, location_);
          $state.current = $state.history.length - 1;
        });
      },
      back() {
        self.update(($state) => {
          $state.current = Math.max($state.current - 1, 0);
        });
      },
      forward() {
        self.update(($state) => {
          $state.current = Math.min(
            $state.current + 1,
            $state.history.length - 1
          );
        });
      },
      match(other: Location | string) {
        const other_ = toLocation(other);
        return other_.path.startsWith(location().path);
      },
    };
  });

  history.subscribe(() => clearScreen());

  return asReadable(history);
};

const defaultHistory: History = createHistory();
export const history = defaultHistory;

export type RouterPros = React.PropsWithChildren<{
  initialPath?: string;
  history?: History;
  onChange?: (path: string) => void;
}>;

export const Router: React.FC<RouterPros> = ({
  history = defaultHistory,
  children,
  initialPath = "/",
  onChange,
}) => {
  if (history.get().history[0].path !== initialPath) {
    history.reset({ path: initialPath });
  }

  useEffect(() => {
    return history.subscribe(() => onChange?.(history.location().path));
  }, []);

  return (
    <HistoryContext.Provider value={history}>
      {children}
    </HistoryContext.Provider>
  );
};

export type RouteProps = React.PropsWithChildren<{
  path?: string | string[];
}>;

export const Route: React.FC<RouteProps> = ({ children, path = "" }) => {
  const history = useHistory<null>();
  const paths = Array.isArray(path) ? path : [path];
  const matched = paths.some((path) => history.match({ path }));

  return <>{matched ? children : null}</>;
};

const HistoryContext = createContext(defaultHistory);

export const useHistory = <T = any,>() => {
  const history = useContext(HistoryContext);
  const state = useReadable(history);

  return {
    ...state,
    ...history,
  };
};
