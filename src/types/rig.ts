export interface RigSensorTag {
  id: string; // уникальный тег для данной вышки (псевдоним)
  baseTag: string; // базовый тег
  name: string; // человекочитаемое имя
  ok: boolean; // статус "зелёный/красный"
  blockId: string; // идентификатор блока на схеме (совпадает с id сегмента)
}

export interface Rig {
  id: string;
  name: string;
  ok: boolean;
  image?: string;
  sensors: RigSensorTag[];
}


