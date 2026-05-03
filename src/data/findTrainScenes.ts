export type FindTrainTarget = { id: string; label: string; x: number; y: number; w: number; h: number };
export type FindTrainScene = { id: string; image: string; correctNum: number; trains: FindTrainTarget[] };

const target = (index: number, x: number, y: number, w: number, h: number): FindTrainTarget => ({
  id: `train-${index}`,
  label: `でんしゃ${index}`,
  x,
  y,
  w,
  h,
});

export const FIND_TRAIN_SCENES: FindTrainScene[] = [
  {
    id: 'find-1',
    image: 'find-yard-01.png',
    correctNum: 1,
    trains: [
      target(1, 7, 22, 85, 64),
    ],
  },
  {
    id: 'find-2',
    image: 'find-yard-02.png',
    correctNum: 2,
    trains: [
      target(1, 20, 41, 27, 16),
      target(2, 66, 32, 31, 52),
    ],
  },
  {
    id: 'find-3',
    image: 'find-yard-03.png',
    correctNum: 3,
    trains: [
      target(1, 8, 47, 28, 35),
      target(2, 39, 46, 19, 36),
      target(3, 67, 38, 27, 45),
    ],
  },
  {
    id: 'find-4',
    image: 'find-yard-04.png',
    correctNum: 4,
    trains: [
      target(1, 12, 66, 30, 22),
      target(2, 34, 31, 30, 14),
      target(3, 65, 17, 32, 22),
      target(4, 75, 57, 21, 27),
    ],
  },
  {
    id: 'find-5',
    image: 'find-yard-05.png',
    correctNum: 5,
    trains: [
      target(1, 4, 53, 18, 27),
      target(2, 18, 48, 25, 25),
      target(3, 43, 43, 24, 45),
      target(4, 66, 48, 17, 39),
      target(5, 79, 33, 20, 39),
    ],
  },
  {
    id: 'find-6',
    image: 'find-yard-06.png',
    correctNum: 6,
    trains: [
      target(1, 2, 57, 17, 30),
      target(2, 18, 52, 20, 34),
      target(3, 36, 54, 19, 29),
      target(4, 55, 47, 17, 33),
      target(5, 73, 52, 13, 29),
      target(6, 83, 47, 16, 33),
    ],
  },
  {
    id: 'find-7',
    image: 'find-yard-07.png',
    correctNum: 7,
    trains: [
      target(1, 3, 25, 31, 17),
      target(2, 36, 26, 22, 14),
      target(3, 64, 24, 30, 17),
      target(4, 3, 66, 25, 22),
      target(5, 30, 57, 23, 31),
      target(6, 52, 62, 20, 24),
      target(7, 74, 61, 23, 28),
    ],
  },
  {
    id: 'find-8',
    image: 'find-yard-08.png',
    correctNum: 8,
    trains: [
      target(1, 2, 51, 14, 33),
      target(2, 15, 47, 14, 35),
      target(3, 29, 45, 14, 35),
      target(4, 43, 45, 12, 35),
      target(5, 55, 46, 11, 32),
      target(6, 66, 42, 13, 35),
      target(7, 77, 42, 13, 35),
      target(8, 88, 38, 12, 35),
    ],
  },
  {
    id: 'find-9',
    image: 'find-yard-09.png',
    correctNum: 9,
    trains: [
      target(1, 7, 15, 27, 14),
      target(2, 37, 15, 25, 12),
      target(3, 72, 13, 27, 12),
      target(4, 0, 39, 25, 20),
      target(5, 41, 36, 23, 22),
      target(6, 17, 57, 22, 25),
      target(7, 43, 69, 18, 22),
      target(8, 71, 69, 22, 23),
      target(9, 72, 42, 25, 28),
    ],
  },
  {
    id: 'find-10',
    image: 'find-yard-10.png',
    correctNum: 10,
    trains: [
      target(1, 28, 25, 15, 20),
      target(2, 43, 25, 13, 20),
      target(3, 55, 22, 13, 22),
      target(4, 66, 26, 13, 20),
      target(5, 78, 24, 16, 20),
      target(6, 5, 55, 17, 24),
      target(7, 26, 57, 17, 30),
      target(8, 48, 50, 16, 37),
      target(9, 66, 54, 14, 28),
      target(10, 78, 50, 20, 26),
    ],
  },
];
