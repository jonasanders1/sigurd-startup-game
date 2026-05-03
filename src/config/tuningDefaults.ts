/**
 * Single source of truth for every tunable game parameter exposed via the
 * editor's Tuning Panel.
 *
 * Each entry carries:
 *  - `key`: stable identifier (used as the localStorage key, the lookup key
 *    for `getTuned`, and the display data-attribute)
 *  - `section`: tab group in the panel
 *  - `label`: human-readable name
 *  - `default`: the canonical fallback value
 *  - `min` / `max` / `step`: input constraints
 *  - `liveReload`: true if changes take effect immediately mid-game (most
 *    physics knobs); false if the value is only read at level/game start
 *    (TOTAL_BOMBS, STARTING_LIVES, etc.) — panel shows a "restart required"
 *    badge for these.
 *  - `description?`: tooltip text
 *
 * Adding a new tunable: append a metadata entry here, then read it with
 * `getTuned(key)` at the call site. The panel renders it automatically.
 *
 * No SCORING values appear here — points/multipliers/bonus tables are
 * fixed per the BJ ruleset.
 */

export type TuningField = {
  key: string;
  section: TuningSection;
  label: string;
  default: number;
  min: number;
  max: number;
  step: number;
  liveReload: boolean;
  description?: string;
};

export type TuningSection =
  | "Player"
  | "Gravity"
  | "Coins"
  | "Mummy"
  | "Bird"
  | "UFO"
  | "Horn"
  | "Sphere"
  | "Orb"
  | "Respawn"
  | "Rules";

export const TUNING_FIELDS: readonly TuningField[] = [
  // ─── Player ────────────────────────────────────────────────────────────
  {
    key: "PLAYER_MOVE_SPEED",
    section: "Player",
    label: "Run speed",
    default: 4,
    min: 1, max: 10, step: 0.1, liveReload: true,
    description: "How fast Jack runs left/right. Higher = quicker.",
  },

  // ─── Gravity / jump LUT ────────────────────────────────────────────────
  {
    key: "GRAVITY_INITIAL_UP_VY",
    section: "Gravity",
    label: "Jump strength",
    default: 11,
    min: 1, max: 20, step: 0.1, liveReload: true,
    description: "How fast Jack launches upward when he jumps. Higher = jumps higher.",
  },
  {
    key: "GRAVITY_TERMINAL_VY",
    section: "Gravity",
    label: "Max fall speed",
    default: 8,
    min: 0.5, max: 12, step: 0.1, liveReload: true,
    description: "Cap on how fast Jack falls. Higher = drops faster.",
  },
  {
    key: "GRAVITY_FLOAT_INDEX",
    section: "Gravity",
    label: "Float drift",
    default: 74,
    min: 64, max: 100, step: 1, liveReload: true,
    description: "How fast Jack drifts down while floating (Space tap in air). 64 = perfect hover, higher = drifts down quicker.",
  },
  {
    key: "GRAVITY_FAST_FALL_INDEX",
    section: "Gravity",
    label: "Fast-fall speed",
    default: 119,
    min: 65, max: 127, step: 1, liveReload: true,
    description: "How quickly Jack drops when ↓ is held mid-air. Higher = snappier dive.",
  },
  {
    key: "JUMP_NORMAL_RATE",
    section: "Gravity",
    label: "Normal jump pace",
    default: 1.0,
    min: 0.1, max: 2.0, step: 0.05, liveReload: true,
    description: "How quickly a normal jump reaches its apex. 1.0 = default; lower = floatier; higher = snappier.",
  },
  {
    key: "JUMP_HIGH_RATE",
    section: "Gravity",
    label: "High jump pace (↑+Shift)",
    default: 0.45,
    min: 0.05, max: 1.0, step: 0.05, liveReload: true,
    description: "Pace of the high jump's ascent. Lower = floatier and higher peak.",
  },
  {
    key: "JUMP_SHORT_START_IDX",
    section: "Gravity",
    label: "Short jump weakness (↓+↑)",
    default: 35,
    min: 1, max: 50, step: 1, liveReload: true,
    description: "How much the short hop is weakened compared to a normal jump. Higher = shorter hop.",
  },

  // ─── Coin spawning ─────────────────────────────────────────────────────
  {
    key: "POWER_COIN_SPAWN_INTERVAL",
    section: "Coins",
    label: "Power coin: bombs to earn one",
    default: 18,
    min: 4, max: 60, step: 1, liveReload: false,
    description: "How many bombs (counted as: firebomb=2, normal=1) the player must collect before a Power coin appears.",
  },
  {
    key: "POWER_COIN_MAX_PER_LEVEL",
    section: "Coins",
    label: "Power coin: max per level",
    default: 2,
    min: 0, max: 10, step: 1, liveReload: false,
    description: "Hard cap on Power coins that can spawn in a single level.",
  },
  {
    key: "P_COIN_TOKEN_FIREBOMB",
    section: "Coins",
    label: "Power coin: credit per firebomb",
    default: 2,
    min: 1, max: 10, step: 1, liveReload: true,
    description: "How much progress each firebomb (the lit one in sequence) gives toward the next Power coin.",
  },
  {
    key: "P_COIN_TOKEN_NORMAL",
    section: "Coins",
    label: "Power coin: credit per normal bomb",
    default: 1,
    min: 0, max: 10, step: 1, liveReload: true,
    description: "How much progress each normal bomb gives toward the next Power coin.",
  },
  {
    key: "BONUS_COIN_SPAWN_INTERVAL",
    section: "Coins",
    label: "Bonus coin: score per spawn",
    default: 5000,
    min: 500, max: 50_000, step: 100, liveReload: false,
    description: "Every N points the player scores spawns a Bonus coin (multiplier-up).",
  },
  {
    key: "BONUS_COIN_MAX_PER_LEVEL",
    section: "Coins",
    label: "Bonus coin: max per level",
    default: 5,
    min: 0, max: 20, step: 1, liveReload: false,
    description: "Hard cap on Bonus coins per level.",
  },
  {
    key: "EXTRA_LIFE_COIN_RATIO",
    section: "Coins",
    label: "Extra life: bonus coins needed",
    default: 8,
    min: 1, max: 30, step: 1, liveReload: false,
    description: "How many Bonus coins the player must collect before an Extra-life coin spawns.",
  },
  {
    key: "EXTRA_LIFE_DEATH_GENEROSITY",
    section: "Coins",
    label: "Extra life: extra credit per death",
    default: 2,
    min: 0, max: 8, step: 1, liveReload: false,
    description: "Each life Jack has lost so far gives this many extra credits toward the next Extra-life coin (so struggling players get them sooner).",
  },
  {
    key: "F_COIN_RUN_CHANCE",
    section: "Coins",
    label: "Founder coin: chance per run",
    default: 0.05,
    min: 0, max: 1, step: 0.01, liveReload: false,
    description: "Probability (0–1) that an F-coin (Founder Mode) appears at all during a full run. Rolled once at game start. Never spawns on level 1.",
  },
  {
    key: "F_COIN_TRIGGER_MIN_BOMB",
    section: "Coins",
    label: "Founder coin: earliest bomb trigger",
    default: 1,
    min: 1, max: 23, step: 1, liveReload: false,
    description: "Earliest bomb count on the target level that can trigger an F-coin spawn. Default 1 — fully random across all bomb collections.",
  },
  {
    key: "F_COIN_TRIGGER_MAX_BOMB",
    section: "Coins",
    label: "Founder coin: latest bomb trigger",
    default: 23,
    min: 1, max: 23, step: 1, liveReload: false,
    description: "Latest bomb count on the target level that can trigger an F-coin spawn. Random in [earliest..latest].",
  },

  // Power-coin freeze durations: while a Power coin is active, monsters
  // turn into collectable tokens for this many ms. The duration depends on
  // which tier (color) the player grabbed.
  { key: "P_DURATION_BLUE",   section: "Coins", label: "Power coin freeze: Blue (ms)",   default: 3000,  min: 500, max: 30_000, step: 250, liveReload: true, description: "Freeze duration when the Blue (tier 1) Power coin is collected." },
  { key: "P_DURATION_PINK",   section: "Coins", label: "Power coin freeze: Pink (ms)",   default: 4000,  min: 500, max: 30_000, step: 250, liveReload: true, description: "Freeze duration for the Pink Power coin." },
  { key: "P_DURATION_PURPLE", section: "Coins", label: "Power coin freeze: Purple (ms)", default: 5000,  min: 500, max: 30_000, step: 250, liveReload: true, description: "Freeze duration for the Purple Power coin." },
  { key: "P_DURATION_LIME",   section: "Coins", label: "Power coin freeze: Lime (ms)",   default: 6000,  min: 500, max: 30_000, step: 250, liveReload: true, description: "Freeze duration for the Lime Power coin." },
  { key: "P_DURATION_CYAN",   section: "Coins", label: "Power coin freeze: Cyan (ms)",   default: 7000,  min: 500, max: 30_000, step: 250, liveReload: true, description: "Freeze duration for the Cyan Power coin." },
  { key: "P_DURATION_YELLOW", section: "Coins", label: "Power coin freeze: Yellow (ms)", default: 8000,  min: 500, max: 30_000, step: 250, liveReload: true, description: "Freeze duration for the Yellow Power coin." },
  { key: "P_DURATION_GRAY",   section: "Coins", label: "Power coin freeze: Gray (ms)",   default: 10000, min: 500, max: 30_000, step: 250, liveReload: true, description: "Freeze duration for the Gray (top tier) Power coin." },

  // ─── Mummy ─────────────────────────────────────────────────────────────
  { key: "MUMMY_BASE_SPEED",    section: "Mummy", label: "Walk speed (start of level)",  default: 1,    min: 0.1, max: 8,   step: 0.1, liveReload: true, description: "How fast a freshly-spawned mummy walks." },
  { key: "MUMMY_MAX_SPEED",     section: "Mummy", label: "Walk speed (cap after scaling)", default: 4.2,  min: 0.5, max: 12,  step: 0.1, liveReload: true, description: "Mummies speed up over time within a level. This is the upper cap." },
  { key: "MUMMY_SPEED_SCALING", section: "Mummy", label: "Speed ramp-up per second",     default: 0.15, min: 0,   max: 2,   step: 0.01, liveReload: true, description: "How much the walk speed increases each second the mummy stays alive." },
  { key: "MUMMY_FALL_GRAVITY",  section: "Mummy", label: "Drop gravity",                  default: 0.3,  min: 0.05, max: 2,  step: 0.05, liveReload: true, description: "How quickly a mummy accelerates downward when it drops off a platform." },
  { key: "MUMMY_DEFAULT_WALK_LENGTHS", section: "Mummy", label: "Default walks before drop", default: 1, min: 1, max: 20, step: 1, liveReload: false, description: "Default number of edge-touches before a mummy drops off (overridden per-instance in the editor)." },

  // ─── Bird ──────────────────────────────────────────────────────────────
  { key: "BIRD_BASE_SPEED",            section: "Bird", label: "Hop animation speed (start)", default: 0.5,  min: 0.1, max: 8,    step: 0.1, liveReload: true, description: "How fast the bird animates each hop on a freshly-spawned bird." },
  { key: "BIRD_MAX_SPEED",             section: "Bird", label: "Hop animation speed (cap)",  default: 4.2,  min: 0.5, max: 12,   step: 0.1, liveReload: true, description: "Upper cap on hop animation speed after the in-level ramp-up." },
  { key: "BIRD_SPEED_SCALING",         section: "Bird", label: "Speed ramp-up per second",   default: 0.15, min: 0,   max: 2,    step: 0.01, liveReload: true, description: "How much hop animation speed grows each second the bird is alive." },
  { key: "BIRD_BASE_DIRECTNESS",       section: "Bird", label: "Tracking accuracy (start)",  default: 0.3,  min: 0,   max: 1,    step: 0.05, liveReload: true, description: "How accurately the bird's path picks Jack at level start. 0 = wandery, 1 = perfect." },
  { key: "BIRD_MAX_DIRECTNESS",        section: "Bird", label: "Tracking accuracy (cap)",    default: 0.85, min: 0,   max: 1,    step: 0.05, liveReload: true, description: "Cap after the per-second ramp-up." },
  { key: "BIRD_DIRECTNESS_SCALING",    section: "Bird", label: "Tracking ramp-up per second", default: 0.06, min: 0,   max: 0.5,  step: 0.01, liveReload: true, description: "How much tracking accuracy grows each second." },
  { key: "BIRD_BASE_UPDATE_INTERVAL",  section: "Bird", label: "Decision interval (start, ms)", default: 200,  min: 30,  max: 2000, step: 10, liveReload: true, description: "How often the bird re-evaluates its target at level start. Lower = re-thinks faster." },
  { key: "BIRD_MIN_UPDATE_INTERVAL",   section: "Bird", label: "Decision interval (cap, ms)", default: 130,  min: 30,  max: 2000, step: 10, liveReload: true, description: "Floor on decision interval after ramp-up." },
  { key: "BIRD_UPDATE_INTERVAL_SCALING", section: "Bird", label: "Decision interval ramp (ms/sec)", default: -6, min: -100, max: 0, step: 1, liveReload: true, description: "Negative = bird thinks faster every second. 0 = no change." },
  { key: "BIRD_HOP_DISTANCE",          section: "Bird", label: "Hop distance (px)",          default: 50,   min: 5,   max: 200,  step: 5,  liveReload: true, description: "How far the bird hops in one step toward Jack." },
  { key: "BIRD_HOP_REST_MS",           section: "Bird", label: "Pause between hops (ms)",    default: 200,  min: 0,   max: 3000, step: 25, liveReload: true, description: "Idle time between hops. 0 = continuous hopping." },
  { key: "BIRD_TARGET_DELAY_MS",       section: "Bird", label: "Target lag (ms)",            default: 500,  min: 0,   max: 5000, step: 50, liveReload: true, description: "Bird chases where Jack WAS, not where he is now. Higher = easier to dodge." },

  // ─── UFO ───────────────────────────────────────────────────────────────
  { key: "UFO_BASE_SPEED",        section: "UFO", label: "Speed (start of level)",       default: 2,     min: 0.1, max: 12,   step: 0.1, liveReload: true, description: "How fast a freshly-spawned UFO drifts." },
  { key: "UFO_MAX_SPEED",         section: "UFO", label: "Speed (cap after scaling)",    default: 8.5,   min: 0.5, max: 16,   step: 0.1, liveReload: true, description: "Upper cap on UFO drift speed." },
  { key: "UFO_SPEED_SCALING",     section: "UFO", label: "Speed ramp-up per second",     default: 0.06,  min: 0,   max: 2,    step: 0.01, liveReload: true, description: "How much UFO drift speed grows each second." },
  { key: "UFO_BASE_AMBUSH_INTERVAL", section: "UFO", label: "Time between charges (start, ms)", default: 5000, min: 500, max: 30_000, step: 100, liveReload: true, description: "How often the UFO charges Jack at level start." },
  { key: "UFO_MIN_AMBUSH_INTERVAL",  section: "UFO", label: "Time between charges (cap, ms)", default: 700,  min: 100, max: 30_000, step: 100, liveReload: true, description: "Floor on charge interval after ramp-down." },
  { key: "UFO_AMBUSH_INTERVAL_SCALING", section: "UFO", label: "Charge interval ramp (ms/sec)", default: -380, min: -2000, max: 0, step: 10, liveReload: true, description: "Negative = charges sooner each second. 0 = no change." },
  { key: "UFO_DIST_FACTOR_NEAR",  section: "UFO", label: "Speed multiplier near Jack",   default: 0.4, min: 0.1, max: 2,  step: 0.05, liveReload: true, description: "Speed × this when the UFO is close to Jack. <1 = slows down on approach." },
  { key: "UFO_DIST_FACTOR_FAR",   section: "UFO", label: "Speed multiplier far from Jack", default: 1.5, min: 0.5, max: 4,  step: 0.05, liveReload: true, description: "Speed × this when the UFO is far. >1 = closes distance fast." },
  { key: "UFO_DIST_RAMP_PX",      section: "UFO", label: "Distance for full far-multiplier (px)", default: 400, min: 50, max: 1500, step: 10, liveReload: true, description: "At distances ≥ this, the UFO uses the full far-multiplier; nearer distances blend toward the near-multiplier." },

  // ─── Horn ──────────────────────────────────────────────────────────────
  { key: "HORN_BASE_SPEED",            section: "Horn", label: "Speed (start of level)",      default: 2,     min: 0.1, max: 8,    step: 0.1, liveReload: true, description: "How fast a freshly-spawned horn floats." },
  { key: "HORN_MAX_SPEED",             section: "Horn", label: "Speed (cap after scaling)",   default: 4.2,   min: 0.5, max: 12,   step: 0.1, liveReload: true, description: "Upper cap on horn float speed." },
  { key: "HORN_SPEED_SCALING",         section: "Horn", label: "Speed ramp-up per second",    default: 0.38,  min: 0,   max: 2,    step: 0.01, liveReload: true, description: "How much horn speed grows each second." },
  { key: "HORN_BASE_BOUNCE_ANGLE",     section: "Horn", label: "Bounce wobble (start)",       default: 0.2, min: 0, max: 2, step: 0.05, liveReload: true, description: "How unpredictable the bounce angle is at level start. 0 = perfect mirror, higher = more random kick." },
  { key: "HORN_MAX_BOUNCE_ANGLE",      section: "Horn", label: "Bounce wobble (cap)",         default: 0.42, min: 0, max: 2, step: 0.05, liveReload: true, description: "Upper cap on bounce randomness." },
  { key: "HORN_BOUNCE_ANGLE_SCALING",  section: "Horn", label: "Bounce wobble ramp/sec",      default: 0.006, min: 0, max: 0.1, step: 0.001, liveReload: true, description: "How fast the wobble grows each second." },
  { key: "HORN_SURPRISE_INTERVAL_MIN", section: "Horn", label: "Surprise — min interval (ms)", default: 5000,  min: 1000, max: 60_000, step: 250, liveReload: true, description: "Earliest a surprise dash can fire after the previous one." },
  { key: "HORN_SURPRISE_INTERVAL_MAX", section: "Horn", label: "Surprise — max interval (ms)", default: 10_000, min: 1000, max: 120_000, step: 250, liveReload: true, description: "Latest a surprise dash will fire after the previous one." },
  { key: "HORN_SURPRISE_DURATION",     section: "Horn", label: "Surprise dash length (ms)",   default: 1000, min: 100, max: 5000, step: 50, liveReload: true, description: "How long the dash itself lasts." },
  { key: "HORN_SURPRISE_BOOST",        section: "Horn", label: "Surprise dash speed (×)",     default: 1.6,   min: 1, max: 5, step: 0.1, liveReload: true, description: "Speed multiplier during the dash. 1 = no boost." },

  // ─── Sphere ────────────────────────────────────────────────────────────
  { key: "SPHERE_DEFAULT_SPEED",         section: "Sphere", label: "Bounce speed",         default: 1.2, min: 0.1, max: 8, step: 0.1, liveReload: true, description: "Base velocity magnitude. Higher = faster bouncing AND stronger pull toward Jack's column." },
  { key: "SPHERE_HOMING_RATIO",          section: "Sphere", label: "Pull toward Jack (X) — full strength", default: 0.02, min: 0, max: 0.1, step: 0.005, liveReload: true, description: "Maximum pull strength toward Jack's X column once the ramp completes. 0 = pure free bouncing." },
  { key: "SPHERE_HOMING_RAMP_MS",        section: "Sphere", label: "Pull ramp-up time (ms)", default: 12000, min: 0, max: 60000, step: 250, liveReload: true, description: "How long after the sphere appears before the pull reaches full strength. Starts at 0, grows linearly. 0 = instant (no ramp)." },
  { key: "SPHERE_VELOCITY_CAP_MULT",     section: "Sphere", label: "Top speed (× bounce speed)", default: 2.25, min: 1, max: 8, step: 0.05, liveReload: true, description: "Cap on per-axis velocity, expressed as a multiple of Bounce speed. Lower = sphere never gets ferociously fast even after many bounces." },
  { key: "SPHERE_FREE_KICK_MULT",        section: "Sphere", label: "Initial kick — free axis (Y, ×)", default: 1.0, min: 0, max: 4, step: 0.05, liveReload: true, description: "Strength of the random starting kick on the free (Y) axis. 0 = no initial bounce; higher = more lively at spawn." },
  { key: "SPHERE_CONSTRAINED_KICK_MULT", section: "Sphere", label: "Initial kick — constrained axis (X, ×)", default: 1.5, min: 0, max: 4, step: 0.05, liveReload: true, description: "Strength of the random starting kick on the constrained (X / tracking) axis. Higher = bouncier ricochet around Jack's column from frame one." },

  // ─── Orb ───────────────────────────────────────────────────────────────
  { key: "ORB_DEFAULT_SPEED",            section: "Orb", label: "Bounce speed",         default: 1.4, min: 0.1, max: 8, step: 0.1, liveReload: true, description: "Base velocity magnitude. Higher = faster bouncing AND stronger pull toward Jack's row." },
  { key: "ORB_HOMING_RATIO",             section: "Orb", label: "Pull toward Jack (Y) — full strength", default: 0.02, min: 0, max: 0.1, step: 0.005, liveReload: true, description: "Maximum pull strength toward Jack's Y row once the ramp completes. 0 = pure free bouncing." },
  { key: "ORB_HOMING_RAMP_MS",           section: "Orb", label: "Pull ramp-up time (ms)", default: 12000, min: 0, max: 60000, step: 250, liveReload: true, description: "How long after the orb appears before the pull reaches full strength. Starts at 0, grows linearly. 0 = instant (no ramp)." },
  { key: "ORB_VELOCITY_CAP_MULT",        section: "Orb", label: "Top speed (× bounce speed)", default: 2.25, min: 1, max: 8, step: 0.05, liveReload: true, description: "Cap on per-axis velocity, expressed as a multiple of Bounce speed. Lower = orb never gets ferociously fast even after many bounces." },
  { key: "ORB_FREE_KICK_MULT",           section: "Orb", label: "Initial kick — free axis (X, ×)", default: 1.0, min: 0, max: 4, step: 0.05, liveReload: true, description: "Strength of the random starting kick on the free (X) axis. 0 = no initial bounce; higher = more lively at spawn." },
  { key: "ORB_CONSTRAINED_KICK_MULT",    section: "Orb", label: "Initial kick — constrained axis (Y, ×)", default: 1.5, min: 0, max: 4, step: 0.05, liveReload: true, description: "Strength of the random starting kick on the constrained (Y / tracking) axis. Higher = bouncier ricochet around Jack's row from frame one." },

  // ─── Respawn ───────────────────────────────────────────────────────────
  { key: "RESPAWN_MUMMY_MS",  section: "Respawn", label: "Mummy: time to respawn (ms)", default: 8000,  min: 0, max: 60_000, step: 250, liveReload: true, description: "How long after a mummy is killed before it reappears." },
  { key: "RESPAWN_BIRD_MS",   section: "Respawn", label: "Bird: time to respawn (ms)",  default: 7000,  min: 0, max: 60_000, step: 250, liveReload: true, description: "How long after a bird is killed before it reappears." },
  { key: "RESPAWN_UFO_MS",    section: "Respawn", label: "UFO: time to respawn (ms)",   default: 10_000, min: 0, max: 60_000, step: 250, liveReload: true, description: "How long after a UFO is killed before it reappears." },
  { key: "RESPAWN_HORN_MS",   section: "Respawn", label: "Horn: time to respawn (ms)",  default: 15_000, min: 0, max: 60_000, step: 250, liveReload: true, description: "How long after a horn is killed before it reappears." },

  // ─── Rules ─────────────────────────────────────────────────────────────
  { key: "TOTAL_BOMBS",       section: "Rules", label: "Bombs per level",      default: 23, min: 1,  max: 50, step: 1, liveReload: false, description: "How many bombs Jack needs to collect to clear a level." },
  { key: "STARTING_LIVES",    section: "Rules", label: "Lives at game start",  default: 3,  min: 1,  max: 9,  step: 1, liveReload: false, description: "How many lives Jack has when a new game begins." },
  { key: "MAX_LIVES",         section: "Rules", label: "Maximum lives",        default: 9,  min: 1,  max: 99, step: 1, liveReload: true, description: "Cap on lives — Extra-life coins past this are wasted." },
  { key: "SPAWN_INVULN_MS",   section: "Rules", label: "Monster spawn invuln (ms)", default: 500, min: 0, max: 3000, step: 50, liveReload: true, description: "How long after spawning a monster is harmless to Jack (so monsters can't spawn directly on him)." },
  { key: "MUTATION_PASSTHROUGH_MS", section: "Rules", label: "Transform pass-through (ms)", default: 500, min: 0, max: 3000, step: 50, liveReload: true, description: "Safe window after a mummy transforms (or unfreezes from Power coin) — Jack can pass through safely." },
] as const;

/** Build a map for O(1) lookups. */
export const TUNING_DEFAULTS: Readonly<Record<string, number>> = Object.freeze(
  Object.fromEntries(TUNING_FIELDS.map((f) => [f.key, f.default]))
);

/** Distinct sections in the order they appear above (preserves panel order). */
export const TUNING_SECTIONS: readonly TuningSection[] = Array.from(
  new Set(TUNING_FIELDS.map((f) => f.section))
) as readonly TuningSection[];
