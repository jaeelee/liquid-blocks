/** 한 병에서 다른 병으로의 액체 이동. game-board의 Move와 형태는 같지만,
 * features 레이어가 pages 레이어를 참조할 수 없어 이 슬라이스 전용으로 별도 선언한다. */
export interface Move {
  from: number;
  to: number;
  amount: number;
}
