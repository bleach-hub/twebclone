import {createEffect, onCleanup, onMount} from 'solid-js';
import lottie, {AnimationItem} from 'lottie-web';

const TGS = (name: string) => `/assets/tgs/${name}.json`;

/**
 * Tracking monkey for the code card (port of components/monkeys/tracking.ts).
 * An idle animation loops while the code is empty; once digits arrive, a second
 * "tracking" animation drives the monkey's eyes to follow the entered position.
 *
 * Frame math is lifted from tweb: with max=45, the target frame for the tracking
 * clip is `round(min(45, pos) * 165/45 + 11.33)`, where `pos = frac * 45` and
 * `frac = (1 + filledCount) / total`.
 */
export function TrackingMonkey(props: {filled: number; total: number; size?: number}) {
  const size = props.size ?? 130;
  let host!: HTMLDivElement;
  let idle: AnimationItem | undefined;
  let track: AnimationItem | undefined;
  let needFrame = 0;
  const MAX = 45;

  function playTo(pos: number) {
    if(!track) return;
    pos = Math.min(pos, 30);
    const frame = pos ? Math.round(Math.min(MAX, pos) * (165 / MAX) + 11.33) : 0;

    if(frame) {
      idle?.stop();
      if(idle) idle.container && ((idle.container as HTMLElement).style.display = 'none');
      (track as any).wrapper.style.display = '';
    }

    const direction = needFrame > frame ? -1 : 1;
    needFrame = frame;
    track.setDirection(direction as 1 | -1);
    track.play();
  }

  onMount(() => {
    const idleHost = document.createElement('div');
    const trackHost = document.createElement('div');
    [idleHost, trackHost].forEach((el) => {
      el.style.position = 'absolute';
      el.style.inset = '0';
      host.append(el);
    });
    host.style.position = 'relative';
    host.style.width = host.style.height = size + 'px';

    idle = lottie.loadAnimation({
      container: idleHost, renderer: 'svg', loop: true, autoplay: true, path: TGS('TwoFactorSetupMonkeyIdle')
    });
    track = lottie.loadAnimation({
      container: trackHost, renderer: 'svg', loop: false, autoplay: false, path: TGS('TwoFactorSetupMonkeyTracking')
    });
    (track as any).wrapper && ((track as any).wrapper.style.display = props.filled ? '' : 'none');

    track.addEventListener('enterFrame', () => {
      const cur = track!.currentFrame;
      const dir = (track as any).playDirection;
      if((dir === 1 && cur >= needFrame) || (dir === -1 && cur <= needFrame)) {
        track!.pause();
      }
      if(Math.round(cur) === 0 && needFrame === 0 && idle) {
        (idle.container as HTMLElement).style.display = '';
        idle.play();
        (track as any).wrapper.style.display = 'none';
      }
    });
  });

  // React to digit-count changes.
  createEffect(() => {
    const frac = (1 + props.filled) / (props.total || 1);
    playTo(props.filled ? frac * MAX : 0);
  });

  onCleanup(() => {
    idle?.destroy();
    track?.destroy();
  });

  return <div ref={host} class="monkey-host" />;
}

/**
 * Password monkey for the password card (port of components/monkeys/password.ts).
 * Uses the "Peek" clip: frame 0 = eyes covered, frame 16 = peeking. Revealing the
 * password plays 0→16; hiding it plays 16→0.
 */
export function PasswordMonkey(props: {reveal: boolean; size?: number}) {
  const size = props.size ?? 130;
  let host!: HTMLDivElement;
  let anim: AnimationItem | undefined;
  let needFrame = 0;
  let ready = false;

  function apply(reveal: boolean) {
    if(!anim || !ready) return;
    if(reveal) {
      anim.setDirection(1);
      anim.goToAndStop(0, true);
      needFrame = 16;
    } else {
      anim.setDirection(-1);
      anim.goToAndStop(16, true);
      needFrame = 0;
    }
    anim.play();
  }

  onMount(() => {
    host.style.width = host.style.height = size + 'px';
    anim = lottie.loadAnimation({
      container: host, renderer: 'svg', loop: false, autoplay: false, path: TGS('TwoFactorSetupMonkeyPeek')
    });
    anim.addEventListener('enterFrame', () => {
      const cur = anim!.currentFrame;
      const dir = (anim as any).playDirection;
      if((dir === 1 && cur >= needFrame) || (dir === -1 && cur <= needFrame)) {
        anim!.pause();
      }
    });
    anim.addEventListener('DOMLoaded', () => {
      ready = true;
      anim!.goToAndStop(0, true); // start covered
    });
  });

  createEffect(() => apply(props.reveal));

  onCleanup(() => anim?.destroy());

  return <div ref={host} class="monkey-host" />;
}
