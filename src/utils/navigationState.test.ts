import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNavigationState,
  pushView,
  goBack,
  goForward,
  canGoBack,
  canGoForward,
  getCurrentView
} from './navigationState.ts';

test('createNavigationState initializes properly', () => {
  const nav = createNavigationState('home');
  assert.equal(getCurrentView(nav), 'home');
  assert.equal(canGoBack(nav), false);
  assert.equal(canGoForward(nav), false);
  assert.equal(nav.stack.length, 1);
});

test('pushView adds views and updates index', () => {
  let nav = createNavigationState('home');
  nav = pushView(nav, 'generator');
  assert.equal(getCurrentView(nav), 'generator');
  assert.equal(canGoBack(nav), true);
  assert.equal(canGoForward(nav), false);
  assert.equal(nav.stack.length, 2);

  nav = pushView(nav, 'professor_portal');
  assert.equal(getCurrentView(nav), 'professor_portal');
  assert.equal(nav.currentIndex, 2);
  assert.equal(nav.stack.length, 3);
});

test('pushing identical current view does not duplicate stack', () => {
  let nav = createNavigationState('home');
  nav = pushView(nav, 'home');
  assert.equal(nav.stack.length, 1);
  assert.equal(nav.currentIndex, 0);
});

test('goBack and goForward smoothly navigate without losing history', () => {
  let nav = createNavigationState('home');
  nav = pushView(nav, 'generator');
  nav = pushView(nav, 'professor_portal');

  assert.equal(getCurrentView(nav), 'professor_portal');

  // Step back to generator
  nav = goBack(nav);
  assert.equal(getCurrentView(nav), 'generator');
  assert.equal(canGoBack(nav), true);
  assert.equal(canGoForward(nav), true);

  // Step back to home
  nav = goBack(nav);
  assert.equal(getCurrentView(nav), 'home');
  assert.equal(canGoBack(nav), false);
  assert.equal(canGoForward(nav), true);

  // Attempting goBack when at start remains at start
  nav = goBack(nav);
  assert.equal(getCurrentView(nav), 'home');

  // Step forward back to generator
  nav = goForward(nav);
  assert.equal(getCurrentView(nav), 'generator');

  // Step forward back to professor_portal
  nav = goForward(nav);
  assert.equal(getCurrentView(nav), 'professor_portal');
  assert.equal(canGoForward(nav), false);
});

test('pushView while in the past truncates future history like browsers do', () => {
  let nav = createNavigationState('home');
  nav = pushView(nav, 'generator');
  nav = pushView(nav, 'professor_portal');

  // Go back to generator
  nav = goBack(nav);
  assert.equal(getCurrentView(nav), 'generator');

  // Push new view (home) from this middle point
  nav = pushView(nav, 'home');
  assert.equal(getCurrentView(nav), 'home');
  assert.equal(nav.stack.length, 3); // ['home', 'generator', 'home']
  assert.equal(canGoForward(nav), false); // forward history pruned
});
