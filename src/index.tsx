/* @refresh reload */
import {render} from 'solid-js/web';
import AuthCardsHost from './AuthCardsHost';
import './global.css';
import './tweb-vendored.css';

// tweb gates hover styles on `html.no-touch` and animations on
// `body.animation-level-2`. Without these classes the vendored rules
// (e.g. .input-field-input hover, label transitions) wouldn't apply.
document.documentElement.classList.add('no-touch');
document.body.classList.add('animation-level-2');

render(() => <AuthCardsHost />, document.getElementById('root')!);
