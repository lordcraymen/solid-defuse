import { createSignal, createEffect, onCleanup, Component, JSX, mergeProps, Accessor } from 'solid-js';
import { createStore } from './storeFactory';


const DefStore = createStore<{}>();
const UseStore = createStore<{}>();


const useSharedState: (store: typeof DefStore, topic?: string | symbol) => Accessor<{}> = (store, topic) => {
  
  const [state, setState] = createSignal(topic ? store(topic).getState() : {})
  
  createEffect(() => {
    if (!topic) return;
    const unsubscribe = store(topic).subscribe((newState) => setState(newState));
    onCleanup(unsubscribe);
  });

  return state;
};


interface BaseType {
  USE?: string | symbol;
  DEF?: string | symbol;
}

interface TypeWithDef<T> extends BaseType {
  DEF: string | symbol;
  children?: T extends { children: infer C } ? { children?: C } : {}
}

interface TypeWithUse<T> extends BaseType {
  USE: string | symbol;
  children?: never
}

type CombinedType<T> = (TypeWithUse<T> | TypeWithDef<T>) & T;

const withDefUse = <P extends {}>(Component: Component<P>) => (p: CombinedType<P>): JSX.Element => {
  const { DEF, USE, ...props } = p;

  const routeState = useSharedState(DefStore, DEF)
  const useState = useSharedState(UseStore, USE !== DEF ? USE : undefined)

  createEffect(() => DEF && UseStore(DEF).setState({ ...props, ...routeState() }))

  const instanceProps = mergeProps(props, useState(), routeState()) as P;

  return <Component {...instanceProps} /> 
}




type Topic = string | symbol

const Route = ({ from, fromField, to, toField }: { from: Topic, fromField: Topic, to: Topic, toField: Topic }) => {

  createEffect(() => {
    from && to && from !== to && fromField && toField && (() => {
      const fromState = UseStore(from);
      const toState = DefStore(to);
      const unsubscribe =  fromState.subscribe((value:{ [key in Topic]: any; }) => toState.setState((prevState:{}) => ({ ...prevState, ...{ [toField]: value[fromField] } })));
      onCleanup(unsubscribe);
    })();
  }, [from, fromField, to, toField]);

  return null;
};



export { withDefUse, Route }
