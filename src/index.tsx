/* @refresh reload */
import {render} from 'solid-js/web';
import AuthCardsHost from './AuthCardsHost';
import './global.css';

render(() => <AuthCardsHost />, document.getElementById('root')!);
