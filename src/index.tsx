/* @refresh reload */
import {render} from 'solid-js/web';
import AuthCardsHost from './AuthCardsHost';
import './global.css';

render(() => <AuthCardsHost />, document.getElementById('root')!);

// Reveal the UI one frame after first paint — the pre-JS gradient (inline
// script in index.html) has already painted by then, so the order is:
//   1) blank black, 2) real gradient, 3) cards/auth fade in (~50ms after).
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.getElementById('root')?.classList.add('ready');
  });
});
