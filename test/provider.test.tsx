import React from 'react';
import {
  Provider,
  useDep,
  ProviderSetupFn,
  useDepOr,
  useDepChecked,
} from '../src';

import { renderHook } from '@testing-library/react-hooks';

class TestClass {
  name = 'test';
}

class AnotherTestClass {
  constructor(public parent: TestClass) {}
}

const DEFAULT_SETUP_FN: ProviderSetupFn = ({ provide, get }) => {
  provide(TestClass, () => new TestClass());
  provide(AnotherTestClass, () => new AnotherTestClass(get(TestClass)));
};

describe('react-provided', () => {
  describe('useDep', () => {
    it('should get a dep', () => {
      const { result } = renderHook(() => useDep(AnotherTestClass), {
        wrapper: ({ children }) => (
          <Provider setup={DEFAULT_SETUP_FN}>{children}</Provider>
        ),
      });

      expect(result.current).toBeInstanceOf(AnotherTestClass);
    });

    it('should not get a dep', () => {
      const { result } = renderHook(() => useDep(AnotherTestClass), {
        wrapper: ({ children }) => (
          <Provider setup={() => {}}>{children}</Provider>
        ),
      });

      expect(result.error.message).toContain(
        'No dependency provided for token'
      );
    });
  });

  describe('useDepOr', () => {
    it('should get a dep', () => {
      const { result } = renderHook(
        () => useDepOr(AnotherTestClass, () => 'wow'),
        {
          wrapper: ({ children }) => (
            <Provider setup={DEFAULT_SETUP_FN}>{children}</Provider>
          ),
        }
      );

      expect(result.current).toBeInstanceOf(AnotherTestClass);
    });

    it("should use the default if dep doesn't exist", () => {
      const { result } = renderHook(
        () => useDepOr(AnotherTestClass, () => 'dep default'),
        {
          wrapper: ({ children }) => (
            <Provider setup={() => {}}>{children}</Provider>
          ),
        }
      );

      expect(result.current).toBe('dep default');
    });
  });

  describe('useDepChecked', () => {
    it('should get a dep', () => {
      const { result } = renderHook(() => useDepChecked(AnotherTestClass), {
        wrapper: ({ children }) => (
          <Provider setup={DEFAULT_SETUP_FN}>{children}</Provider>
        ),
      });

      expect(result.current).toBeInstanceOf(AnotherTestClass);
    });

    it('should not get a dep', () => {
      const { result } = renderHook(() => useDepChecked(AnotherTestClass), {
        wrapper: ({ children }) => (
          <Provider setup={() => {}}>{children}</Provider>
        ),
      });

      expect(result.current).toBeUndefined();
    });
  });
});
