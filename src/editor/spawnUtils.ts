import { MonsterEntity } from "./types";

/**
 * A bureaucrat entity counts as a recurring spawn point whenever its
 * respawnInterval > 0, regardless of whether the "Delayed spawn" checkbox
 * is set. Both buildMap (runtime) and serialize (TS export) gate spawn-
 * point promotion on this predicate, so it lives here to keep them in sync.
 */
export const isRecurring = (m: MonsterEntity): boolean =>
  !!m.respawnInterval && m.respawnInterval > 0;
