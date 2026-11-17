import { Composition } from 'remotion';
import { HeroLoop, LOOP_FRAMES } from './HeroLoop';

export const RemotionRoot = () => (
  <Composition id="LoginHero" component={HeroLoop} durationInFrames={LOOP_FRAMES} fps={30} width={1080} height={1080} />
);
