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
 *    (TOTAL_FOUNDINGS, STARTING_LIVES, etc.) — panel shows a "restart required"
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
  | "Bureaucrat"
  | "Wisp"
  | "TAXGHOST"
  | "Founder"
  | "Consultant"
  | "Robot"
  | "Respawn"
  | "Rules";

// Generated from the live tuning panel at 2026-05-05T21:49:07.693Z.
// Replace the existing TUNING_FIELDS literal in
// src/config/tuningDefaults.ts with the array below.

export const TUNING_FIELDS: readonly TuningField[] = [
  // ─── Player ─────────────────────────────────────────
  {
    key: "PLAYER_MOVE_SPEED",
    section: "Player",
    label: "Run speed",
    default: 4,
    min: 1,
    max: 10,
    step: 0.1,
    liveReload: true,
    description: "How fast Jack runs left/right. Higher = quicker.",
  },

  // ─── Gravity ─────────────────────────────────────────
  {
    key: "GRAVITY_INITIAL_UP_VY",
    section: "Gravity",
    label: "Jump strength",
    default: 8,
    min: 1,
    max: 20,
    step: 0.1,
    liveReload: true,
    description:
      "How fast Jack launches upward when he jumps. Higher = jumps higher.",
  },
  {
    key: "GRAVITY_TERMINAL_VY",
    section: "Gravity",
    label: "Max fall speed",
    default: 4,
    min: 0.5,
    max: 12,
    step: 0.1,
    liveReload: true,
    description: "Cap on how fast Jack falls. Higher = drops faster.",
  },
  {
    key: "GRAVITY_FLOAT_INDEX",
    section: "Gravity",
    label: "Float drift",
    default: 77,
    min: 64,
    max: 100,
    step: 1,
    liveReload: true,
    description:
      "How fast Jack drifts down while floating (Space tap in air). 64 = perfect hover, higher = drifts down quicker.",
  },
  {
    key: "GRAVITY_FAST_FALL_INDEX",
    section: "Gravity",
    label: "Fast-fall speed",
    default: 119,
    min: 65,
    max: 127,
    step: 1,
    liveReload: true,
    description:
      "How quickly Jack drops when ↓ is held mid-air. Higher = snappier dive.",
  },
  {
    key: "JUMP_NORMAL_RATE",
    section: "Gravity",
    label: "Normal jump pace",
    default: 0.4,
    min: 0.1,
    max: 2,
    step: 0.05,
    liveReload: true,
    description:
      "How quickly a normal jump reaches its apex. 1.0 = default; lower = floatier; higher = snappier.",
  },
  {
    key: "JUMP_HIGH_RATE",
    section: "Gravity",
    label: "High jump pace (↑+Shift)",
    default: 0.28,
    min: 0.05,
    max: 1,
    step: 0.05,
    liveReload: true,
    description:
      "Pace of the high jump's ascent. Lower = floatier and higher peak.",
  },
  {
    key: "JUMP_SHORT_START_IDX",
    section: "Gravity",
    label: "Short jump weakness (↓+↑)",
    default: 16,
    min: 1,
    max: 50,
    step: 1,
    liveReload: true,
    description:
      "How much the short hop is weakened compared to a normal jump. Higher = shorter hop.",
  },
  {
    key: "JUMP_DESCENT_RATE",
    section: "Gravity",
    label: "Descent pace",
    default: 1.0,
    min: 0.3,
    max: 2.0,
    step: 0.05,
    liveReload: true,
    description:
      "How quickly the gravity LUT advances during the descent half (apex → terminal). 1.0 = default; lower = stretches the gentle early-fall before terminal kicks in; higher = snaps to terminal faster.",
  },

  // ─── Coins ─────────────────────────────────────────
  {
    key: "POWER_COIN_SPAWN_INTERVAL",
    section: "Coins",
    label: "Power coin: foundings to earn one",
    default: 18,
    min: 4,
    max: 60,
    step: 1,
    liveReload: false,
    description:
      "How many foundings (counted as: firefounding=2, normal=1) the player must collect before a Power coin appears.",
  },
  {
    key: "POWER_COIN_MAX_PER_LEVEL",
    section: "Coins",
    label: "Power coin: max per level",
    default: 2,
    min: 0,
    max: 10,
    step: 1,
    liveReload: false,
    description: "Hard cap on Power coins that can spawn in a single level.",
  },
  {
    key: "P_COIN_TOKEN_FIREFOUNDING",
    section: "Coins",
    label: "Power coin: credit per firefounding",
    default: 2,
    min: 1,
    max: 10,
    step: 1,
    liveReload: true,
    description:
      "How much progress each firefounding (the lit one in sequence) gives toward the next Power coin.",
  },
  {
    key: "P_COIN_TOKEN_NORMAL",
    section: "Coins",
    label: "Power coin: credit per normal founding",
    default: 1,
    min: 0,
    max: 10,
    step: 1,
    liveReload: true,
    description:
      "How much progress each normal founding gives toward the next Power coin.",
  },
  {
    key: "BONUS_COIN_SPAWN_INTERVAL",
    section: "Coins",
    label: "Bonus coin: score per spawn",
    default: 5000,
    min: 500,
    max: 50000,
    step: 100,
    liveReload: false,
    description:
      "Every N points the player scores spawns a Bonus coin (multiplier-up).",
  },
  {
    key: "BONUS_COIN_MAX_PER_LEVEL",
    section: "Coins",
    label: "Bonus coin: max per level",
    default: 5,
    min: 0,
    max: 20,
    step: 1,
    liveReload: false,
    description: "Hard cap on Bonus coins per level.",
  },
  {
    key: "EXTRA_LIFE_COIN_RATIO",
    section: "Coins",
    label: "Extra life: bonus coins needed",
    default: 8,
    min: 1,
    max: 30,
    step: 1,
    liveReload: false,
    description:
      "How many Bonus coins the player must collect before an Extra-life coin spawns.",
  },
  {
    key: "EXTRA_LIFE_DEATH_GENEROSITY",
    section: "Coins",
    label: "Extra life: extra credit per death",
    default: 2,
    min: 0,
    max: 8,
    step: 1,
    liveReload: false,
    description:
      "Each life Jack has lost so far gives this many extra credits toward the next Extra-life coin (so struggling players get them sooner).",
  },
  {
    key: "F_COIN_RUN_CHANCE",
    section: "Coins",
    label: "Founder coin: chance per run",
    default: 0.05,
    min: 0,
    max: 1,
    step: 0.01,
    liveReload: false,
    description:
      "Probability (0–1) that an F-coin (Founder Mode) appears at all during a full run. Rolled once at game start. Never spawns on level 1.",
  },
  {
    key: "F_COIN_TRIGGER_MIN_FOUNDING",
    section: "Coins",
    label: "Founder coin: earliest founding trigger",
    default: 1,
    min: 1,
    max: 23,
    step: 1,
    liveReload: false,
    description:
      "Earliest founding count on the target level that can trigger an F-coin spawn. Default 1 — fully random across all founding collections.",
  },
  {
    key: "F_COIN_TRIGGER_MAX_FOUNDING",
    section: "Coins",
    label: "Founder coin: latest founding trigger",
    default: 23,
    min: 1,
    max: 23,
    step: 1,
    liveReload: false,
    description:
      "Latest founding count on the target level that can trigger an F-coin spawn. Random in [earliest..latest].",
  },
  {
    key: "P_DURATION_BLUE",
    section: "Coins",
    label: "Power coin freeze: Blue (ms)",
    default: 3000,
    min: 500,
    max: 30000,
    step: 250,
    liveReload: true,
    description:
      "Freeze duration when the Blue (tier 1) Power coin is collected.",
  },
  {
    key: "P_DURATION_PINK",
    section: "Coins",
    label: "Power coin freeze: Pink (ms)",
    default: 4000,
    min: 500,
    max: 30000,
    step: 250,
    liveReload: true,
    description: "Freeze duration for the Pink Power coin.",
  },
  {
    key: "P_DURATION_PURPLE",
    section: "Coins",
    label: "Power coin freeze: Purple (ms)",
    default: 5000,
    min: 500,
    max: 30000,
    step: 250,
    liveReload: true,
    description: "Freeze duration for the Purple Power coin.",
  },
  {
    key: "P_DURATION_LIME",
    section: "Coins",
    label: "Power coin freeze: Lime (ms)",
    default: 6000,
    min: 500,
    max: 30000,
    step: 250,
    liveReload: true,
    description: "Freeze duration for the Lime Power coin.",
  },
  {
    key: "P_DURATION_CYAN",
    section: "Coins",
    label: "Power coin freeze: Cyan (ms)",
    default: 7000,
    min: 500,
    max: 30000,
    step: 250,
    liveReload: true,
    description: "Freeze duration for the Cyan Power coin.",
  },
  {
    key: "P_DURATION_YELLOW",
    section: "Coins",
    label: "Power coin freeze: Yellow (ms)",
    default: 8000,
    min: 500,
    max: 30000,
    step: 250,
    liveReload: true,
    description: "Freeze duration for the Yellow Power coin.",
  },
  {
    key: "P_DURATION_GRAY",
    section: "Coins",
    label: "Power coin freeze: Gray (ms)",
    default: 10000,
    min: 500,
    max: 30000,
    step: 250,
    liveReload: true,
    description: "Freeze duration for the Gray (top tier) Power coin.",
  },

  // ─── Bureaucrat ─────────────────────────────────────────
  {
    key: "BUREAUCRAT_BASE_SPEED",
    section: "Bureaucrat",
    label: "Walk speed (start of level)",
    default: 1,
    min: 0.1,
    max: 8,
    step: 0.1,
    liveReload: true,
    description: "How fast a freshly-spawned bureaucrat walks.",
  },
  {
    key: "BUREAUCRAT_MAX_SPEED",
    section: "Bureaucrat",
    label: "Walk speed (cap after scaling)",
    default: 4.5,
    min: 0.5,
    max: 12,
    step: 0.1,
    liveReload: true,
    description:
      "Bureaucrats speed up over time within a level. This is the upper cap.",
  },
  {
    key: "BUREAUCRAT_SPEED_SCALING",
    section: "Bureaucrat",
    label: "Speed ramp-up per second",
    default: 0.25,
    min: 0,
    max: 2,
    step: 0.01,
    liveReload: true,
    description:
      "How much the walk speed increases each second the bureaucrat stays alive.",
  },
  {
    key: "BUREAUCRAT_FALL_GRAVITY",
    section: "Bureaucrat",
    label: "Drop gravity",
    default: 0.3,
    min: 0.05,
    max: 2,
    step: 0.05,
    liveReload: true,
    description:
      "How quickly a bureaucrat accelerates downward when it drops off a platform.",
  },
  {
    key: "BUREAUCRAT_DEFAULT_WALK_LENGTHS",
    section: "Bureaucrat",
    label: "Default walks before drop",
    default: 1,
    min: 1,
    max: 20,
    step: 1,
    liveReload: false,
    description:
      "Default number of edge-touches before a bureaucrat drops off (overridden per-instance in the editor).",
  },

  // ─── Wisp ─────────────────────────────────────────
  {
    key: "WISP_BASE_SPEED",
    section: "Wisp",
    label: "Hop animation speed (start)",
    default: 1.5,
    min: 0.1,
    max: 8,
    step: 0.1,
    liveReload: true,
    description:
      "How fast the wisp animates each hop on a freshly-spawned wisp.",
  },
  {
    key: "WISP_MAX_SPEED",
    section: "Wisp",
    label: "Hop animation speed (cap)",
    default: 4,
    min: 0.5,
    max: 12,
    step: 0.1,
    liveReload: true,
    description: "Upper cap on hop animation speed after the in-level ramp-up.",
  },
  {
    key: "WISP_SPEED_SCALING",
    section: "Wisp",
    label: "Speed ramp-up per second",
    default: 0.2,
    min: 0,
    max: 2,
    step: 0.01,
    liveReload: true,
    description:
      "How much hop animation speed grows each second the wisp is alive.",
  },
  {
    key: "WISP_BASE_DIRECTNESS",
    section: "Wisp",
    label: "Tracking accuracy (start)",
    default: 0.4,
    min: 0,
    max: 1,
    step: 0.05,
    liveReload: true,
    description:
      "How accurately the wisp's path picks Jack at level start. 0 = wandery, 1 = perfect.",
  },
  {
    key: "WISP_MAX_DIRECTNESS",
    section: "Wisp",
    label: "Tracking accuracy (cap)",
    default: 0.85,
    min: 0,
    max: 1,
    step: 0.05,
    liveReload: true,
    description: "Cap after the per-second ramp-up.",
  },
  {
    key: "WISP_DIRECTNESS_SCALING",
    section: "Wisp",
    label: "Tracking ramp-up per second",
    default: 0.12,
    min: 0,
    max: 0.5,
    step: 0.01,
    liveReload: true,
    description: "How much tracking accuracy grows each second.",
  },
  {
    key: "WISP_BASE_UPDATE_INTERVAL",
    section: "Wisp",
    label: "Decision interval (start, ms)",
    default: 130,
    min: 30,
    max: 2000,
    step: 10,
    liveReload: true,
    description:
      "How often the wisp re-evaluates its target at level start. Lower = re-thinks faster.",
  },
  {
    key: "WISP_MIN_UPDATE_INTERVAL",
    section: "Wisp",
    label: "Decision interval (cap, ms)",
    default: 130,
    min: 30,
    max: 2000,
    step: 10,
    liveReload: true,
    description: "Floor on decision interval after ramp-up.",
  },
  {
    key: "WISP_UPDATE_INTERVAL_SCALING",
    section: "Wisp",
    label: "Decision interval ramp (ms/sec)",
    default: -6,
    min: -100,
    max: 0,
    step: 1,
    liveReload: true,
    description: "Negative = wisp thinks faster every second. 0 = no change.",
  },
  {
    key: "WISP_HOP_DISTANCE",
    section: "Wisp",
    label: "Hop distance (px)",
    default: 50,
    min: 5,
    max: 200,
    step: 5,
    liveReload: true,
    description: "How far the wisp hops in one step toward Jack.",
  },
  {
    key: "WISP_HOP_REST_MS",
    section: "Wisp",
    label: "Pause between hops (ms)",
    default: 175,
    min: 0,
    max: 3000,
    step: 25,
    liveReload: true,
    description: "Idle time between hops. 0 = continuous hopping.",
  },
  {
    key: "WISP_TARGET_DELAY_MS",
    section: "Wisp",
    label: "Target lag (ms)",
    default: 300,
    min: 0,
    max: 5000,
    step: 50,
    liveReload: true,
    description:
      "Wisp chases where Jack WAS, not where he is now. Higher = easier to dodge.",
  },

  // ─── TAXGHOST ─────────────────────────────────────────
  {
    key: "TAXGHOST_BASE_SPEED",
    section: "TAXGHOST",
    label: "Speed (start of level)",
    default: 2.5,
    min: 0.1,
    max: 12,
    step: 0.1,
    liveReload: true,
    description: "How fast a freshly-spawned TAXGHOST drifts.",
  },
  {
    key: "TAXGHOST_MAX_SPEED",
    section: "TAXGHOST",
    label: "Speed (cap after scaling)",
    default: 8.5,
    min: 0.5,
    max: 16,
    step: 0.1,
    liveReload: true,
    description: "Upper cap on TAXGHOST drift speed.",
  },
  {
    key: "TAXGHOST_SPEED_SCALING",
    section: "TAXGHOST",
    label: "Speed ramp-up per second",
    default: 0.06,
    min: 0,
    max: 2,
    step: 0.01,
    liveReload: true,
    description: "How much TAXGHOST drift speed grows each second.",
  },
  {
    key: "TAXGHOST_BASE_AMBUSH_INTERVAL",
    section: "TAXGHOST",
    label: "Time between charges (start, ms)",
    default: 5000,
    min: 500,
    max: 30000,
    step: 100,
    liveReload: true,
    description: "How often the TAXGHOST charges Jack at level start.",
  },
  {
    key: "TAXGHOST_MIN_AMBUSH_INTERVAL",
    section: "TAXGHOST",
    label: "Time between charges (cap, ms)",
    default: 700,
    min: 100,
    max: 30000,
    step: 100,
    liveReload: true,
    description: "Floor on charge interval after ramp-down.",
  },
  {
    key: "TAXGHOST_AMBUSH_INTERVAL_SCALING",
    section: "TAXGHOST",
    label: "Charge interval ramp (ms/sec)",
    default: -380,
    min: -2000,
    max: 0,
    step: 10,
    liveReload: true,
    description: "Negative = charges sooner each second. 0 = no change.",
  },
  {
    key: "TAXGHOST_DIST_FACTOR_NEAR",
    section: "TAXGHOST",
    label: "Speed multiplier near Jack",
    default: 0.4,
    min: 0.1,
    max: 2,
    step: 0.05,
    liveReload: true,
    description:
      "Speed × this when the TAXGHOST is close to Jack. <1 = slows down on approach.",
  },
  {
    key: "TAXGHOST_DIST_FACTOR_FAR",
    section: "TAXGHOST",
    label: "Speed multiplier far from Jack",
    default: 1.5,
    min: 0.5,
    max: 4,
    step: 0.05,
    liveReload: true,
    description: "Speed × this when the TAXGHOST is far. >1 = closes distance fast.",
  },
  {
    key: "TAXGHOST_DIST_RAMP_PX",
    section: "TAXGHOST",
    label: "Distance for full far-multiplier (px)",
    default: 400,
    min: 50,
    max: 1500,
    step: 10,
    liveReload: true,
    description:
      "At distances ≥ this, the TAXGHOST uses the full far-multiplier; nearer distances blend toward the near-multiplier.",
  },

  // ─── Founder ─────────────────────────────────────────
  {
    key: "FOUNDER_BASE_SPEED",
    section: "Founder",
    label: "Speed (start of level)",
    default: 3,
    min: 0.1,
    max: 8,
    step: 0.1,
    liveReload: true,
    description: "How fast a freshly-spawned founder floats.",
  },
  {
    key: "FOUNDER_MAX_SPEED",
    section: "Founder",
    label: "Speed (cap after scaling)",
    default: 5,
    min: 0.5,
    max: 12,
    step: 0.1,
    liveReload: true,
    description: "Upper cap on founder float speed.",
  },
  {
    key: "FOUNDER_SPEED_SCALING",
    section: "Founder",
    label: "Speed ramp-up per second",
    default: 0.4,
    min: 0,
    max: 2,
    step: 0.01,
    liveReload: true,
    description: "How much founder speed grows each second.",
  },
  {
    key: "FOUNDER_BASE_BOUNCE_ANGLE",
    section: "Founder",
    label: "Bounce wobble (start)",
    default: 0.25,
    min: 0,
    max: 2,
    step: 0.05,
    liveReload: true,
    description:
      "How unpredictable the bounce angle is at level start. 0 = perfect mirror, higher = more random kick.",
  },
  {
    key: "FOUNDER_MAX_BOUNCE_ANGLE",
    section: "Founder",
    label: "Bounce wobble (cap)",
    default: 0.42,
    min: 0,
    max: 2,
    step: 0.05,
    liveReload: true,
    description: "Upper cap on bounce randomness.",
  },
  {
    key: "FOUNDER_BOUNCE_ANGLE_SCALING",
    section: "Founder",
    label: "Bounce wobble ramp/sec",
    default: 0.006,
    min: 0,
    max: 0.1,
    step: 0.001,
    liveReload: true,
    description: "How fast the wobble grows each second.",
  },
  {
    key: "FOUNDER_SURPRISE_INTERVAL_MIN",
    section: "Founder",
    label: "Surprise — min interval (ms)",
    default: 5000,
    min: 1000,
    max: 60000,
    step: 250,
    liveReload: true,
    description: "Earliest a surprise dash can fire after the previous one.",
  },
  {
    key: "FOUNDER_SURPRISE_INTERVAL_MAX",
    section: "Founder",
    label: "Surprise — max interval (ms)",
    default: 10000,
    min: 1000,
    max: 120000,
    step: 250,
    liveReload: true,
    description: "Latest a surprise dash will fire after the previous one.",
  },
  {
    key: "FOUNDER_SURPRISE_DURATION",
    section: "Founder",
    label: "Surprise dash length (ms)",
    default: 1000,
    min: 100,
    max: 5000,
    step: 50,
    liveReload: true,
    description: "How long the dash itself lasts.",
  },
  {
    key: "FOUNDER_SURPRISE_BOOST",
    section: "Founder",
    label: "Surprise dash speed (×)",
    default: 1.6,
    min: 1,
    max: 5,
    step: 0.1,
    liveReload: true,
    description: "Speed multiplier during the dash. 1 = no boost.",
  },

  // ─── Consultant ─────────────────────────────────────────
  {
    key: "CONSULTANT_DEFAULT_SPEED",
    section: "Consultant",
    label: "Bounce speed",
    default: 1.2,
    min: 0.1,
    max: 8,
    step: 0.1,
    liveReload: true,
    description:
      "Base velocity magnitude. Higher = faster bouncing AND stronger pull toward Jack's column.",
  },
  {
    key: "CONSULTANT_HOMING_RATIO",
    section: "Consultant",
    label: "Pull toward Jack (X) — full strength",
    default: 0.045,
    min: 0,
    max: 0.1,
    step: 0.005,
    liveReload: true,
    description:
      "Maximum pull strength toward Jack's X column once the ramp completes. 0 = pure free bouncing.",
  },
  {
    key: "CONSULTANT_HOMING_RAMP_MS",
    section: "Consultant",
    label: "Pull ramp-up time (ms)",
    default: 12000,
    min: 0,
    max: 60000,
    step: 250,
    liveReload: true,
    description:
      "How long after the consultant appears before the pull reaches full strength. Starts at 0, grows linearly. 0 = instant (no ramp).",
  },
  {
    key: "CONSULTANT_VELOCITY_CAP_MULT",
    section: "Consultant",
    label: "Top speed (× bounce speed)",
    default: 2.3,
    min: 1,
    max: 8,
    step: 0.05,
    liveReload: true,
    description:
      "Cap on per-axis velocity, expressed as a multiple of Bounce speed. Lower = consultant never gets ferociously fast even after many bounces.",
  },
  {
    key: "CONSULTANT_FREE_KICK_MULT",
    section: "Consultant",
    label: "Initial kick — free axis (Y, ×)",
    default: 1.5,
    min: 0,
    max: 4,
    step: 0.05,
    liveReload: true,
    description:
      "Strength of the random starting kick on the free (Y) axis. 0 = no initial bounce; higher = more lively at spawn.",
  },
  {
    key: "CONSULTANT_CONSTRAINED_KICK_MULT",
    section: "Consultant",
    label: "Initial kick — constrained axis (X, ×)",
    default: 1.5,
    min: 0,
    max: 4,
    step: 0.05,
    liveReload: true,
    description:
      "Strength of the random starting kick on the constrained (X / tracking) axis. Higher = bouncier ricochet around Jack's column from frame one.",
  },

  // ─── Robot ─────────────────────────────────────────
  {
    key: "ROBOT_DEFAULT_SPEED",
    section: "Robot",
    label: "Bounce speed",
    default: 1.4,
    min: 0.1,
    max: 8,
    step: 0.1,
    liveReload: true,
    description:
      "Base velocity magnitude. Higher = faster bouncing AND stronger pull toward Jack's row.",
  },
  {
    key: "ROBOT_HOMING_RATIO",
    section: "Robot",
    label: "Pull toward Jack (Y) — full strength",
    default: 0.045,
    min: 0,
    max: 0.1,
    step: 0.005,
    liveReload: true,
    description:
      "Maximum pull strength toward Jack's Y row once the ramp completes. 0 = pure free bouncing.",
  },
  {
    key: "ROBOT_HOMING_RAMP_MS",
    section: "Robot",
    label: "Pull ramp-up time (ms)",
    default: 12000,
    min: 0,
    max: 60000,
    step: 250,
    liveReload: true,
    description:
      "How long after the robot appears before the pull reaches full strength. Starts at 0, grows linearly. 0 = instant (no ramp).",
  },
  {
    key: "ROBOT_VELOCITY_CAP_MULT",
    section: "Robot",
    label: "Top speed (× bounce speed)",
    default: 2.3,
    min: 1,
    max: 8,
    step: 0.05,
    liveReload: true,
    description:
      "Cap on per-axis velocity, expressed as a multiple of Bounce speed. Lower = robot never gets ferociously fast even after many bounces.",
  },
  {
    key: "ROBOT_FREE_KICK_MULT",
    section: "Robot",
    label: "Initial kick — free axis (X, ×)",
    default: 1.5,
    min: 0,
    max: 4,
    step: 0.05,
    liveReload: true,
    description:
      "Strength of the random starting kick on the free (X) axis. 0 = no initial bounce; higher = more lively at spawn.",
  },
  {
    key: "ROBOT_CONSTRAINED_KICK_MULT",
    section: "Robot",
    label: "Initial kick — constrained axis (Y, ×)",
    default: 1.5,
    min: 0,
    max: 4,
    step: 0.05,
    liveReload: true,
    description:
      "Strength of the random starting kick on the constrained (Y / tracking) axis. Higher = bouncier ricochet around Jack's row from frame one.",
  },

  // ─── Respawn ─────────────────────────────────────────
  {
    key: "RESPAWN_BUREAUCRAT_MS",
    section: "Respawn",
    label: "Bureaucrat: time to respawn (ms)",
    default: 5000,
    min: 0,
    max: 60000,
    step: 250,
    liveReload: true,
    description: "How long after a bureaucrat is killed before it reappears.",
  },
  {
    key: "RESPAWN_WISP_MS",
    section: "Respawn",
    label: "Wisp: time to respawn (ms)",
    default: 5000,
    min: 0,
    max: 60000,
    step: 250,
    liveReload: true,
    description: "How long after a wisp is killed before it reappears.",
  },
  {
    key: "RESPAWN_TAXGHOST_MS",
    section: "Respawn",
    label: "TAXGHOST: time to respawn (ms)",
    default: 5000,
    min: 0,
    max: 60000,
    step: 250,
    liveReload: true,
    description: "How long after a TAXGHOST is killed before it reappears.",
  },
  {
    key: "RESPAWN_FOUNDER_MS",
    section: "Respawn",
    label: "Founder: time to respawn (ms)",
    default: 5000,
    min: 0,
    max: 60000,
    step: 250,
    liveReload: true,
    description: "How long after a founder is killed before it reappears.",
  },

  // ─── Rules ─────────────────────────────────────────
  {
    key: "TOTAL_FOUNDINGS",
    section: "Rules",
    label: "Foundings per level",
    default: 23,
    min: 1,
    max: 50,
    step: 1,
    liveReload: false,
    description: "How many foundings Jack needs to collect to clear a level.",
  },
  {
    key: "STARTING_LIVES",
    section: "Rules",
    label: "Lives at game start",
    default: 3,
    min: 1,
    max: 9,
    step: 1,
    liveReload: false,
    description: "How many lives Jack has when a new game begins.",
  },
  {
    key: "MAX_LIVES",
    section: "Rules",
    label: "Maximum lives",
    default: 9,
    min: 1,
    max: 99,
    step: 1,
    liveReload: true,
    description: "Cap on lives — Extra-life coins past this are wasted.",
  },
  {
    key: "SPAWN_INVULN_MS",
    section: "Rules",
    label: "Monster spawn invuln (ms)",
    default: 500,
    min: 0,
    max: 3000,
    step: 50,
    liveReload: true,
    description:
      "How long after spawning a monster is harmless to Jack (so monsters can't spawn directly on him).",
  },
  {
    key: "MUTATION_PASSTHROUGH_MS",
    section: "Rules",
    label: "Transform pass-through (ms)",
    default: 500,
    min: 0,
    max: 3000,
    step: 50,
    liveReload: true,
    description:
      "Safe window after a bureaucrat transforms (or unfreezes from Power coin) — Jack can pass through safely.",
  },
] as const;

/** Build a map for O(1) lookups. */
export const TUNING_DEFAULTS: Readonly<Record<string, number>> = Object.freeze(
  Object.fromEntries(TUNING_FIELDS.map((f) => [f.key, f.default])),
);

/** Distinct sections in the order they appear above (preserves panel order). */
export const TUNING_SECTIONS: readonly TuningSection[] = Array.from(
  new Set(TUNING_FIELDS.map((f) => f.section)),
) as readonly TuningSection[];
