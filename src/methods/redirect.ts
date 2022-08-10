import {
  Clock,
  createEvent,
  createStore,
  Event,
  is,
  sample,
  Store,
} from 'effector';
import { RouteInstance, RouteQuery } from '../types';

type RedirectParams<T, Params> = Params extends { [key in string]: never }
  ? {
      clock?: Clock<T>;
      route: RouteInstance<Params>;
      query?: ((clock: T) => RouteQuery) | Store<RouteQuery> | RouteQuery;
    }
  :
      | {
          clock?: Clock<T>;
          route: RouteInstance<Params>;
          params: ((clock: T) => Params) | Store<Params> | Params;
          query?: ((clock: T) => RouteQuery) | Store<RouteQuery> | RouteQuery;
        }
      | {
          clock?: Clock<{
            params: Params;
            query?: RouteQuery;
          }>;
          route: RouteInstance<Params>;
          params?: ((clock: T) => Params) | Store<Params> | Params;
          query?: ((clock: T) => RouteQuery) | Store<RouteQuery> | RouteQuery;
        };

/** Opens passed `route` upon `clock` trigger */
export const redirect = <T, Params>(options: RedirectParams<T, Params>) => {
  const clock = options.clock
    ? sample({ clock: options.clock as Event<T> })
    : createEvent<T>();
  // @ts-expect-error
  let params = toStore(options.params || {});
  let query = toStore(options.query || {});

  sample({
    clock: clock,
    source: { params, query },
    fn: ({ params, query }, clock) => ({
      params: typeof params === 'function' ? params(clock) : params,
      query: typeof query === 'function' ? query(clock) : query,
    }),
    target: options.route.navigate,
  });
  return clock;
};

const toStore = <T>(payload: T | Store<T>): Store<T> => {
  return is.store(payload) ? payload : createStore(payload as T);
};
