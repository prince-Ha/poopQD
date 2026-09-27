import { CharacterSkin } from '../types/game';
import bakugoNormal from '../assets/heads/bakugo_normal.png';
import bakugoHit from '../assets/heads/bakugo_hit.png';
import ganadiNormal from '../assets/heads/ganadi_normal.png';
import ganadiHit from '../assets/heads/ganadi_hit.png';
import pikachuNormal from '../assets/heads/pikachu_normal.png';
import pikachuHit from '../assets/heads/pikachu_hit.png';
import giyeongNormal from '../assets/heads/giyeong_normal.png';
import giyeongHit from '../assets/heads/giyeong_hit.png';
import saitamaNormal from '../assets/heads/saitama_normal.png';
import saitamaHit from '../assets/heads/saitama_hit.png';

// 졸라맨 얼굴 사진: normal = 평소 / hit = 오답·똥 맞았을 때
// (선생님이 준 원본을 좌우로 자르고 바깥 흰 배경만 투명하게 한 것. 그림 자체는 그대로)
export const HEAD_IMAGES: Record<CharacterSkin, { normal: string; hit: string }> = {
  bakugo: { normal: bakugoNormal, hit: bakugoHit },
  ganadi: { normal: ganadiNormal, hit: ganadiHit },
  pikachu: { normal: pikachuNormal, hit: pikachuHit },
  giyeong: { normal: giyeongNormal, hit: giyeongHit },
  saitama: { normal: saitamaNormal, hit: saitamaHit },
};
