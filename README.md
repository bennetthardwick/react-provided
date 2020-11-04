# react-provided

A dead simple dependency injection library for React inspired by Recoil.

## Usage

First create a "provider layer" by using the `Provider` component.

The `Provider` component has a setup function with a couple of useful methods:

- `get` - get a dependency from the parent layer
- `getOr` - get a dependency from the parent layer, or fun a function if it doesn't exist
- `provide` - provide a dependency on the current layer, everything will have access to this down the tree

Creating a layer looks like so:

```ts
<Provider setup={({ get, provide }) => {

  const myDep = get(MyDep);
  const myClass = get(MyClass);

  provide(MyOtherClass, () => new MyOtherClass(myClass, myDep));

}}>
  ...
</Provider>
```

Now that we've created a layer and provided the `MyOtherClass` dependency, it can be accessed from child components using the `useDep` hook.

It'll look something like this:

```ts
function ChildComponent() {
  const myOtherClass = useDep(MyOtherClass);

  // Do stuff with myOtherClass - it'll always be a stable reference.
}
```

### Cleanup

When a `Provider` layer is destroyed, you have the option to run some cleanup methods.
To do this, all you have to do is have a `destroy` method on your class.
It will be called when the layer is going to be destroyed.

## Why use this library?

- You don't want to be 100% married to React
- You're sick of your references not being stable
- You don't want to create hundreds of hooks
- React suggests not using `useMemo` for instantiating classes
- You want to share data around without having to worry about re-rendering components
