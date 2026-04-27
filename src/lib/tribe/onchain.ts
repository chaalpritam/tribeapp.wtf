import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type Connection,
} from "@solana/web3.js";
import { BN, type AnchorProvider } from "@coral-xyz/anchor";
import { PROGRAM_IDS } from "./constants";

// Raw transaction building — avoids Anchor IDL version issues in the browser.

function tidToBuffer(tid: number): Buffer {
  const buf = Buffer.alloc(8);
  let val = tid;
  for (let i = 0; i < 8; i++) {
    buf[i] = val & 0xff;
    val = Math.floor(val / 256);
  }
  return buf;
}

function readU64LE(data: Uint8Array, offset: number): number {
  let val = 0;
  for (let i = 0; i < 8; i++) {
    val += data[offset + i] * 2 ** (i * 8);
  }
  return val;
}

function bnToLeBuffer(val: number, size = 8): Buffer {
  return new BN(val).toArrayLike(Buffer, "le", size);
}

// Anchor instruction discriminators: SHA256("global:<name>")[0..8]
const DISC = {
  initialize:       Buffer.from([175, 175, 109,  31,  13, 152, 155, 237]),
  register:         Buffer.from([211, 124,  67,  15, 211, 194, 178, 240]),
  addAppKey:        Buffer.from([201, 126, 254, 221, 111, 252, 221, 120]),
  initProfile:      Buffer.from([210, 162, 212,  95,  95, 186,  89, 119]),
  follow:           Buffer.from([161,  61, 150, 122, 164, 153,   0,  18]),
  unfollow:         Buffer.from([122,  47,  24, 161,  12,  85, 224,  68]),
  registerUsername: Buffer.from([134,  54, 123, 181,  28, 151,  36,   0]),
  // tip-registry
  initSenderTipState: Buffer.from([ 71, 192, 153, 221, 140, 136, 155, 192]),
  sendTip:            Buffer.from([231,  88,  56, 242, 241,   6,  31,  59]),
  // karma-registry
  initKarmaAccount:   Buffer.from([  0, 123,  22, 226, 115,  30, 193, 246]),
  recordTipReceived:  Buffer.from([ 25, 115, 185,  32, 204, 249, 253, 223]),
  // event-registry
  eventInitCreatorState: Buffer.from([105,  60,   2,  31,  14, 151, 165,  18]),
  eventCreate:           Buffer.from([ 49, 219,  29, 203,  22,  98, 100,  87]),
  eventRsvp:             Buffer.from([134, 164, 221,  33, 183,  12,  73,  32]),
  eventUpdateRsvp:       Buffer.from([133, 246, 132,  11, 142, 135,  34,   5]),
  // poll-registry — `init_creator_state` shares its name across
  // event/task/poll/crowdfund so the discriminator collides; per-
  // program log routing means it never matters in practice.
  pollInitCreatorState:  Buffer.from([105,  60,   2,  31,  14, 151, 165,  18]),
  pollCreate:            Buffer.from([182, 171, 112, 238,   6, 219,  14, 110]),
  pollVote:              Buffer.from([227, 110, 155,  23, 136, 126, 172,  25]),
  // crowdfund-registry — same init_creator_state collision as event/poll
  cfInitCreatorState:    Buffer.from([105,  60,   2,  31,  14, 151, 165,  18]),
  cfCreateCrowdfund:     Buffer.from([142,  70,  11, 110,  16, 180,   1, 160]),
  cfPledge:              Buffer.from([235,  47, 156, 254,   0,  88, 212, 142]),
  cfClaimFunds:          Buffer.from([145,  36, 143, 242, 168,  66, 200, 155]),
  cfRefund:              Buffer.from([  2,  96, 183, 251,  63, 208,  46,  46]),
  // task-registry — same init_creator_state collision
  taskInitCreatorState:  Buffer.from([105,  60,   2,  31,  14, 151, 165,  18]),
  taskCreate:            Buffer.from([194,  80,   6, 180, 232, 127,  48, 171]),
  taskClaim:             Buffer.from([ 49, 222, 219, 238, 155,  68, 221, 136]),
  taskComplete:          Buffer.from([109, 167, 192,  41, 129, 108, 220, 196]),
  taskCancel:            Buffer.from([ 69, 228, 134, 187, 134, 105, 238,  48]),
  // channel-registry — first-write-wins ownership of a slug.
  channelRegister:       Buffer.from([  9, 188, 246, 127,  89,  91, 103,  50]),
  channelUpdate:         Buffer.from([ 75, 204,  94, 165,  60, 180, 193, 217]),
  channelTransfer:       Buffer.from([ 27,  30, 166, 145, 255, 253, 146, 226]),
};

// ── PDA Helpers ──────────────────────────────────────────────────────

function getGlobalStatePda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("global_state")],
    PROGRAM_IDS.tidRegistry
  )[0];
}

function getTidRecordPda(tid: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("tid"), tidToBuffer(tid)],
    PROGRAM_IDS.tidRegistry
  )[0];
}

function getCustodyLookupPda(custody: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("custody"), custody.toBuffer()],
    PROGRAM_IDS.tidRegistry
  )[0];
}

function getAppKeyPda(tid: number, appPubkey: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("app_key"), tidToBuffer(tid), appPubkey.toBuffer()],
    PROGRAM_IDS.appKeyRegistry
  )[0];
}

function getSocialProfilePda(tid: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("social_profile"), tidToBuffer(tid)],
    PROGRAM_IDS.socialGraph
  )[0];
}

function getLinkPda(followerTid: number, followingTid: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("link"), tidToBuffer(followerTid), tidToBuffer(followingTid)],
    PROGRAM_IDS.socialGraph
  )[0];
}

function getUsernameRecordPda(username: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("username"), Buffer.from(username)],
    PROGRAM_IDS.usernameRegistry
  )[0];
}

function getTidUsernamePda(tid: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("tid_username"), tidToBuffer(tid)],
    PROGRAM_IDS.usernameRegistry
  )[0];
}

// ── Read Functions ───────────────────────────────────────────────────

export async function getTidByCustody(
  connection: Connection,
  walletPubkey: PublicKey
): Promise<number | null> {
  const pda = getCustodyLookupPda(walletPubkey);
  const info = await connection.getAccountInfo(pda);
  if (!info || info.data.length < 16) return null;
  return readU64LE(info.data, 8);
}

export async function hasUsername(
  connection: Connection,
  tid: number
): Promise<boolean> {
  const pda = getTidUsernamePda(tid);
  const info = await connection.getAccountInfo(pda);
  return info !== null;
}

export async function hasSocialProfile(
  connection: Connection,
  tid: number
): Promise<boolean> {
  const pda = getSocialProfilePda(tid);
  const info = await connection.getAccountInfo(pda);
  return info !== null;
}

// ── Write Functions ──────────────────────────────────────────────────

export async function registerTid(
  provider: AnchorProvider,
  recoveryAddress: PublicKey
): Promise<{ tx: string | null; tid: number }> {
  const existingTid = await getTidByCustody(
    provider.connection,
    provider.wallet.publicKey
  );
  if (existingTid !== null) {
    return { tx: null, tid: existingTid };
  }

  const globalState = getGlobalStatePda();
  const info = await provider.connection.getAccountInfo(globalState);
  if (!info) throw new Error("Global state not initialized");

  const tidCounter = readU64LE(info.data, 8);
  const nextTid = tidCounter + 1;

  const tidRecord = getTidRecordPda(nextTid);
  const custodyLookup = getCustodyLookupPda(provider.wallet.publicKey);

  const data = Buffer.concat([DISC.register, recoveryAddress.toBuffer()]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.tidRegistry,
    keys: [
      { pubkey: globalState, isSigner: false, isWritable: true },
      { pubkey: tidRecord, isSigner: false, isWritable: true },
      { pubkey: custodyLookup, isSigner: false, isWritable: true },
      { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const txn = new Transaction().add(ix);
  const sig = await provider.sendAndConfirm(txn);
  return { tx: sig, tid: nextTid };
}

export async function addAppKey(
  provider: AnchorProvider,
  tid: number,
  appPubkey: PublicKey,
  scope = 0,
  expiresAt = 0
): Promise<string> {
  const tidRecord = getTidRecordPda(tid);
  const appKeyRecord = getAppKeyPda(tid, appPubkey);

  const data = Buffer.concat([
    DISC.addAppKey,
    appPubkey.toBuffer(),
    Buffer.from([scope]),
    bnToLeBuffer(expiresAt, 8),
  ]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.appKeyRegistry,
    keys: [
      { pubkey: tidRecord, isSigner: false, isWritable: false },
      { pubkey: appKeyRecord, isSigner: false, isWritable: true },
      { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  return provider.sendAndConfirm(new Transaction().add(ix));
}

export async function registerUsername(
  provider: AnchorProvider,
  tid: number,
  username: string
): Promise<string | null> {
  if (await hasUsername(provider.connection, tid)) return null;

  const tidRecord = getTidRecordPda(tid);
  const usernameRecord = getUsernameRecordPda(username);
  const tidUsername = getTidUsernamePda(tid);

  const usernameBytes = Buffer.from(username, "utf-8");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(usernameBytes.length);

  const data = Buffer.concat([DISC.registerUsername, lenBuf, usernameBytes]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.usernameRegistry,
    keys: [
      { pubkey: tidRecord, isSigner: false, isWritable: false },
      { pubkey: usernameRecord, isSigner: false, isWritable: true },
      { pubkey: tidUsername, isSigner: false, isWritable: true },
      { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  return provider.sendAndConfirm(new Transaction().add(ix));
}

export async function initSocialProfile(
  provider: AnchorProvider,
  tid: number
): Promise<string | null> {
  if (await hasSocialProfile(provider.connection, tid)) return null;

  const tidRecord = getTidRecordPda(tid);
  const profile = getSocialProfilePda(tid);

  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.socialGraph,
    keys: [
      { pubkey: tidRecord, isSigner: false, isWritable: false },
      { pubkey: profile, isSigner: false, isWritable: true },
      { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: DISC.initProfile,
  });

  return provider.sendAndConfirm(new Transaction().add(ix));
}

export async function follow(
  provider: AnchorProvider,
  followerTid: number,
  followingTid: number
): Promise<string> {
  const followerTidRecord = getTidRecordPda(followerTid);
  const followerProfile = getSocialProfilePda(followerTid);
  const followingProfile = getSocialProfilePda(followingTid);
  const link = getLinkPda(followerTid, followingTid);

  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.socialGraph,
    keys: [
      { pubkey: followerTidRecord, isSigner: false, isWritable: false },
      { pubkey: followerProfile, isSigner: false, isWritable: true },
      { pubkey: followingProfile, isSigner: false, isWritable: true },
      { pubkey: link, isSigner: false, isWritable: true },
      { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: DISC.follow,
  });

  return provider.sendAndConfirm(new Transaction().add(ix));
}

export async function unfollow(
  provider: AnchorProvider,
  followerTid: number,
  followingTid: number
): Promise<string> {
  const followerTidRecord = getTidRecordPda(followerTid);
  const followerProfile = getSocialProfilePda(followerTid);
  const followingProfile = getSocialProfilePda(followingTid);
  const link = getLinkPda(followerTid, followingTid);

  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.socialGraph,
    keys: [
      { pubkey: followerTidRecord, isSigner: false, isWritable: false },
      { pubkey: followerProfile, isSigner: false, isWritable: true },
      { pubkey: followingProfile, isSigner: false, isWritable: true },
      { pubkey: link, isSigner: false, isWritable: true },
      { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },
    ],
    data: DISC.unfollow,
  });

  return provider.sendAndConfirm(new Transaction().add(ix));
}

// ── Tips ─────────────────────────────────────────────────────────────

function getSenderTipStatePda(sender: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("tip-sender"), sender.toBuffer()],
    PROGRAM_IDS.tipRegistry
  )[0];
}

function getTipRecordPda(sender: PublicKey, tipId: bigint): PublicKey {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(tipId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("tip"), sender.toBuffer(), idBuf],
    PROGRAM_IDS.tipRegistry
  )[0];
}

/**
 * Resolve a TID to its current custody wallet by reading the on-chain
 * TidRecord. Layout: 8-byte Anchor disc + tid(8) + custody(32) + ...
 */
export async function getCustodyByTid(
  connection: Connection,
  tid: number
): Promise<PublicKey | null> {
  const pda = getTidRecordPda(tid);
  const info = await connection.getAccountInfo(pda);
  if (!info || info.data.length < 48) return null;
  return new PublicKey(info.data.slice(16, 48));
}

export async function hasSenderTipState(
  connection: Connection,
  sender: PublicKey
): Promise<boolean> {
  const pda = getSenderTipStatePda(sender);
  const info = await connection.getAccountInfo(pda);
  return info !== null;
}

/** SenderTipState.next_tip_id sits at offset 48 (8 disc + 32 sender + 8 tid). */
async function getNextTipId(
  connection: Connection,
  sender: PublicKey
): Promise<bigint> {
  const pda = getSenderTipStatePda(sender);
  const info = await connection.getAccountInfo(pda);
  if (!info) throw new Error("SenderTipState not initialized");
  return info.data.readBigUInt64LE(48);
}

export async function initSenderTipState(
  provider: AnchorProvider,
  senderTid: number
): Promise<string | null> {
  if (await hasSenderTipState(provider.connection, provider.wallet.publicKey)) {
    return null;
  }
  const senderState = getSenderTipStatePda(provider.wallet.publicKey);
  const data = Buffer.concat([
    DISC.initSenderTipState,
    bnToLeBuffer(senderTid, 8),
  ]);
  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.tipRegistry,
    keys: [
      { pubkey: senderState, isSigner: false, isWritable: true },
      { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
  return provider.sendAndConfirm(new Transaction().add(ix));
}

/**
 * Send a tip on chain. Lazy-inits the SenderTipState PDA on first
 * use so callers don't need a separate setup step. `targetHash`
 * optionally anchors the tip to a piece of content (32-byte blake3
 * hash of a tweet, etc.).
 */
export async function sendTipOnchain(
  provider: AnchorProvider,
  args: {
    senderTid: number;
    recipient: PublicKey;
    recipientTid: number;
    amountLamports: bigint;
    targetHash?: Uint8Array;
  }
): Promise<{ txSig: string; tipId: bigint; tipRecord: PublicKey }> {
  await initSenderTipState(provider, args.senderTid);

  const sender = provider.wallet.publicKey;
  const senderState = getSenderTipStatePda(sender);
  const tipId = await getNextTipId(provider.connection, sender);
  const tipRecord = getTipRecordPda(sender, tipId);

  const hasTarget = !!args.targetHash;
  const targetBuf = Buffer.alloc(32);
  if (hasTarget) {
    if (args.targetHash!.length !== 32) {
      throw new Error("targetHash must be exactly 32 bytes");
    }
    targetBuf.set(args.targetHash!);
  }

  const data = Buffer.concat([
    DISC.sendTip,
    bnToLeBuffer(args.recipientTid, 8),
    new BN(args.amountLamports.toString()).toArrayLike(Buffer, "le", 8),
    targetBuf,
    Buffer.from([hasTarget ? 1 : 0]),
  ]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.tipRegistry,
    keys: [
      { pubkey: senderState, isSigner: false, isWritable: true },
      { pubkey: tipRecord, isSigner: false, isWritable: true },
      { pubkey: sender, isSigner: true, isWritable: true },
      { pubkey: args.recipient, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const txSig = await provider.sendAndConfirm(new Transaction().add(ix));
  return { txSig, tipId, tipRecord };
}

// ── Karma ────────────────────────────────────────────────────────────

function getKarmaAccountPda(tid: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("karma"), tidToBuffer(tid)],
    PROGRAM_IDS.karmaRegistry
  )[0];
}

function getKarmaProofPda(sourceRecord: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("karma-proof"), sourceRecord.toBuffer()],
    PROGRAM_IDS.karmaRegistry
  )[0];
}

export async function hasKarmaAccount(
  connection: Connection,
  tid: number
): Promise<boolean> {
  const info = await connection.getAccountInfo(getKarmaAccountPda(tid));
  return info !== null;
}

/**
 * Credit a TID's karma for a tip they received. Bundles
 * `init_karma_account` (when the recipient has none yet) +
 * `record_tip_received` into a single transaction so the auto-claim
 * UX is one wallet prompt. The signer pays the small KarmaProof and
 * (optionally) KarmaAccount rent.
 *
 * Idempotent: the per-tip KarmaProof PDA's `init` constraint causes
 * a re-run for the same tip to fail — surface the failure as
 * "already claimed" at the call site rather than throwing further.
 */
export async function recordTipReceivedOnchain(
  provider: AnchorProvider,
  args: {
    recipientTid: number;
    /** TipRecord PDA produced by sendTipOnchain. */
    tipRecord: PublicKey;
  }
): Promise<{ txSig: string; karmaAccount: PublicKey; karmaProof: PublicKey }> {
  const karmaAccount = getKarmaAccountPda(args.recipientTid);
  const karmaProof = getKarmaProofPda(args.tipRecord);
  const payer = provider.wallet.publicKey;

  const txn = new Transaction();

  // Lazy-init the KarmaAccount on first credit.
  if (!(await hasKarmaAccount(provider.connection, args.recipientTid))) {
    const initData = Buffer.concat([
      DISC.initKarmaAccount,
      bnToLeBuffer(args.recipientTid, 8),
    ]);
    txn.add(
      new TransactionInstruction({
        programId: PROGRAM_IDS.karmaRegistry,
        keys: [
          { pubkey: karmaAccount, isSigner: false, isWritable: true },
          { pubkey: payer, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: initData,
      })
    );
  }

  txn.add(
    new TransactionInstruction({
      programId: PROGRAM_IDS.karmaRegistry,
      keys: [
        { pubkey: karmaAccount, isSigner: false, isWritable: true },
        { pubkey: args.tipRecord, isSigner: false, isWritable: false },
        { pubkey: karmaProof, isSigner: false, isWritable: true },
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: DISC.recordTipReceived,
    })
  );

  const txSig = await provider.sendAndConfirm(txn);
  return { txSig, karmaAccount, karmaProof };
}

// ── Events ───────────────────────────────────────────────────────────

function getEventCreatorStatePda(creator: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("event-creator"), creator.toBuffer()],
    PROGRAM_IDS.eventRegistry
  )[0];
}

function getEventPda(creator: PublicKey, eventId: bigint): PublicKey {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(eventId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("event"), creator.toBuffer(), idBuf],
    PROGRAM_IDS.eventRegistry
  )[0];
}

function getRsvpPda(eventPda: PublicKey, attendee: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rsvp"), eventPda.toBuffer(), attendee.toBuffer()],
    PROGRAM_IDS.eventRegistry
  )[0];
}

export async function hasEventCreatorState(
  connection: Connection,
  creator: PublicKey
): Promise<boolean> {
  const info = await connection.getAccountInfo(getEventCreatorStatePda(creator));
  return info !== null;
}

/** CreatorEventState.next_event_id sits at offset 48 (8 disc + 32 creator + 8 tid). */
async function getNextEventId(
  connection: Connection,
  creator: PublicKey
): Promise<bigint> {
  const info = await connection.getAccountInfo(
    getEventCreatorStatePda(creator)
  );
  if (!info) throw new Error("CreatorEventState not initialized");
  return info.data.readBigUInt64LE(48);
}

function writeFloat64LE(value: number): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeDoubleLE(value, 0);
  return buf;
}

function writeI64LE(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(typeof value === "bigint" ? value : BigInt(value), 0);
  return buf;
}

/**
 * Create an on-chain Event. Lazy-inits the creator state PDA on
 * first use so callers don't need a separate setup step.
 *
 * `metadataHash` should be the BLAKE3 hash of the off-chain
 * EVENT_ADD envelope so the on-chain Event PDA points back to the
 * envelope (apps can fetch /v1/messages/:hash for title /
 * description / location_text).
 */
export async function createEventOnchain(
  provider: AnchorProvider,
  args: {
    creatorTid: number;
    startsAtUnix: number;
    endsAtUnix?: number;
    latitude?: number;
    longitude?: number;
    /** 32-byte BLAKE3 hash. Pass an all-zero buffer to skip the link. */
    metadataHash: Uint8Array;
  }
): Promise<{ txSig: string; eventPda: PublicKey; eventId: bigint }> {
  if (args.metadataHash.length !== 32) {
    throw new Error("metadataHash must be exactly 32 bytes");
  }

  const creator = provider.wallet.publicKey;
  const creatorState = getEventCreatorStatePda(creator);

  const txn = new Transaction();

  // Lazy-init creator state. SenderTipState pattern: the PDA is a
  // small counter so the first time costs the user a tiny rent
  // payment, then every subsequent event reuses it.
  if (!(await hasEventCreatorState(provider.connection, creator))) {
    const initData = Buffer.concat([
      DISC.eventInitCreatorState,
      bnToLeBuffer(args.creatorTid, 8),
    ]);
    txn.add(
      new TransactionInstruction({
        programId: PROGRAM_IDS.eventRegistry,
        keys: [
          { pubkey: creatorState, isSigner: false, isWritable: true },
          { pubkey: creator, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: initData,
      })
    );
  }

  // For event PDA derivation we need next_event_id. If we just
  // included init, it's 0; otherwise read from chain.
  let eventId: bigint;
  if (txn.instructions.length === 0) {
    eventId = await getNextEventId(provider.connection, creator);
  } else {
    eventId = BigInt(0);
  }
  const eventPda = getEventPda(creator, eventId);

  const hasEnd = args.endsAtUnix !== undefined;
  const hasLocation =
    args.latitude !== undefined || args.longitude !== undefined;

  // Args layout (mirrors the program signature):
  //   starts_at i64 | ends_at i64 | has_end u8 | latitude f64
  //   | longitude f64 | has_location u8 | metadata_hash [u8;32]
  const createData = Buffer.concat([
    DISC.eventCreate,
    writeI64LE(args.startsAtUnix),
    writeI64LE(args.endsAtUnix ?? 0),
    Buffer.from([hasEnd ? 1 : 0]),
    writeFloat64LE(args.latitude ?? 0),
    writeFloat64LE(args.longitude ?? 0),
    Buffer.from([hasLocation ? 1 : 0]),
    Buffer.from(args.metadataHash),
  ]);
  txn.add(
    new TransactionInstruction({
      programId: PROGRAM_IDS.eventRegistry,
      keys: [
        { pubkey: creatorState, isSigner: false, isWritable: true },
        { pubkey: eventPda, isSigner: false, isWritable: true },
        { pubkey: creator, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: createData,
    })
  );

  const txSig = await provider.sendAndConfirm(txn);
  return { txSig, eventPda, eventId };
}

/** Cast or change an RSVP for an event. status: 1=Yes, 2=No, 3=Maybe. */
export async function rsvpEventOnchain(
  provider: AnchorProvider,
  args: {
    eventPda: PublicKey;
    attendeeTid: number;
    status: 1 | 2 | 3;
    /** True when this is changing an existing RSVP. */
    isUpdate?: boolean;
  }
): Promise<{ txSig: string; rsvpPda: PublicKey }> {
  const attendee = provider.wallet.publicKey;
  const rsvpPda = getRsvpPda(args.eventPda, attendee);

  if (args.isUpdate) {
    // update_rsvp(status: u8) — accounts: event(mut), rsvp(mut), attendee(signer)
    const data = Buffer.concat([DISC.eventUpdateRsvp, Buffer.from([args.status])]);
    const ix = new TransactionInstruction({
      programId: PROGRAM_IDS.eventRegistry,
      keys: [
        { pubkey: args.eventPda, isSigner: false, isWritable: true },
        { pubkey: rsvpPda, isSigner: false, isWritable: true },
        { pubkey: attendee, isSigner: true, isWritable: false },
      ],
      data,
    });
    const txSig = await provider.sendAndConfirm(new Transaction().add(ix));
    return { txSig, rsvpPda };
  }

  // rsvp(attendee_tid: u64, status: u8) — accounts: event(mut),
  //   rsvp_record(init), attendee(signer, mut), system_program
  const data = Buffer.concat([
    DISC.eventRsvp,
    bnToLeBuffer(args.attendeeTid, 8),
    Buffer.from([args.status]),
  ]);
  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.eventRegistry,
    keys: [
      { pubkey: args.eventPda, isSigner: false, isWritable: true },
      { pubkey: rsvpPda, isSigner: false, isWritable: true },
      { pubkey: attendee, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
  const txSig = await provider.sendAndConfirm(new Transaction().add(ix));
  return { txSig, rsvpPda };
}

// ── Polls ────────────────────────────────────────────────────────────

function getPollCreatorStatePda(creator: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("poll-creator"), creator.toBuffer()],
    PROGRAM_IDS.pollRegistry
  )[0];
}

function getPollPda(creator: PublicKey, pollId: bigint): PublicKey {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(pollId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), creator.toBuffer(), idBuf],
    PROGRAM_IDS.pollRegistry
  )[0];
}

function getPollVotePda(pollPda: PublicKey, voter: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("poll-vote"), pollPda.toBuffer(), voter.toBuffer()],
    PROGRAM_IDS.pollRegistry
  )[0];
}

export async function hasPollCreatorState(
  connection: Connection,
  creator: PublicKey
): Promise<boolean> {
  const info = await connection.getAccountInfo(getPollCreatorStatePda(creator));
  return info !== null;
}

/** CreatorPollState.next_poll_id sits at offset 48 (8 disc + 32 creator + 8 tid). */
async function getNextPollId(
  connection: Connection,
  creator: PublicKey
): Promise<bigint> {
  const info = await connection.getAccountInfo(
    getPollCreatorStatePda(creator)
  );
  if (!info) throw new Error("CreatorPollState not initialized");
  return info.data.readBigUInt64LE(48);
}

/**
 * Create an on-chain Poll. Lazy-inits the creator state PDA on
 * first use. `metadataHash` should be the BLAKE3 hash of the
 * off-chain POLL_ADD envelope so the on-chain Poll PDA points back
 * to the question + option labels.
 *
 * `optionCount` must be in 2..=8 (capped on chain to keep tally
 * fixed-size). `expiresAtUnix` is optional; pass undefined to
 * create a poll that never expires.
 */
export async function createPollOnchain(
  provider: AnchorProvider,
  args: {
    creatorTid: number;
    optionCount: number;
    expiresAtUnix?: number;
    /** 32-byte BLAKE3 hash of the off-chain POLL_ADD envelope. */
    metadataHash: Uint8Array;
  }
): Promise<{ txSig: string; pollPda: PublicKey; pollId: bigint }> {
  if (args.optionCount < 2 || args.optionCount > 8) {
    throw new Error("optionCount must be between 2 and 8");
  }
  if (args.metadataHash.length !== 32) {
    throw new Error("metadataHash must be exactly 32 bytes");
  }

  const creator = provider.wallet.publicKey;
  const creatorState = getPollCreatorStatePda(creator);

  const txn = new Transaction();

  if (!(await hasPollCreatorState(provider.connection, creator))) {
    const initData = Buffer.concat([
      DISC.pollInitCreatorState,
      bnToLeBuffer(args.creatorTid, 8),
    ]);
    txn.add(
      new TransactionInstruction({
        programId: PROGRAM_IDS.pollRegistry,
        keys: [
          { pubkey: creatorState, isSigner: false, isWritable: true },
          { pubkey: creator, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: initData,
      })
    );
  }

  let pollId: bigint;
  if (txn.instructions.length === 0) {
    pollId = await getNextPollId(provider.connection, creator);
  } else {
    pollId = BigInt(0);
  }
  const pollPda = getPollPda(creator, pollId);

  const hasExpiry = args.expiresAtUnix !== undefined;
  // Args layout: option_count u8 | expires_at i64 | has_expiry u8
  //   | metadata_hash [u8; 32]
  const createData = Buffer.concat([
    DISC.pollCreate,
    Buffer.from([args.optionCount]),
    writeI64LE(args.expiresAtUnix ?? 0),
    Buffer.from([hasExpiry ? 1 : 0]),
    Buffer.from(args.metadataHash),
  ]);
  txn.add(
    new TransactionInstruction({
      programId: PROGRAM_IDS.pollRegistry,
      keys: [
        { pubkey: creatorState, isSigner: false, isWritable: true },
        { pubkey: pollPda, isSigner: false, isWritable: true },
        { pubkey: creator, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: createData,
    })
  );

  const txSig = await provider.sendAndConfirm(txn);
  return { txSig, pollPda, pollId };
}

/** Cast an on-chain vote on a Poll PDA. The `init` constraint on
 *  the per-(poll, voter) Vote PDA enforces one-vote-per-TID, so a
 *  redelivered tx fails with "already voted". */
export async function votePollOnchain(
  provider: AnchorProvider,
  args: {
    pollPda: PublicKey;
    voterTid: number;
    optionIndex: number;
  }
): Promise<{ txSig: string; votePda: PublicKey }> {
  const voter = provider.wallet.publicKey;
  const votePda = getPollVotePda(args.pollPda, voter);

  // Args: voter_tid u64 | option_index u8
  const data = Buffer.concat([
    DISC.pollVote,
    bnToLeBuffer(args.voterTid, 8),
    Buffer.from([args.optionIndex]),
  ]);
  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.pollRegistry,
    keys: [
      { pubkey: args.pollPda, isSigner: false, isWritable: true },
      { pubkey: votePda, isSigner: false, isWritable: true },
      { pubkey: voter, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
  const txSig = await provider.sendAndConfirm(new Transaction().add(ix));
  return { txSig, votePda };
}

// ── Crowdfunds ───────────────────────────────────────────────────────

function getCrowdfundCreatorStatePda(creator: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("cf-creator"), creator.toBuffer()],
    PROGRAM_IDS.crowdfundRegistry
  )[0];
}

function getCrowdfundPda(creator: PublicKey, crowdfundId: bigint): PublicKey {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(crowdfundId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("crowdfund"), creator.toBuffer(), idBuf],
    PROGRAM_IDS.crowdfundRegistry
  )[0];
}

function getPledgePda(crowdfundPda: PublicKey, backer: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pledge"), crowdfundPda.toBuffer(), backer.toBuffer()],
    PROGRAM_IDS.crowdfundRegistry
  )[0];
}

export async function hasCrowdfundCreatorState(
  connection: Connection,
  creator: PublicKey
): Promise<boolean> {
  const info = await connection.getAccountInfo(
    getCrowdfundCreatorStatePda(creator)
  );
  return info !== null;
}

/** CreatorCrowdfundState.next_crowdfund_id sits at offset 48
 *  (8 disc + 32 creator + 8 tid). */
async function getNextCrowdfundId(
  connection: Connection,
  creator: PublicKey
): Promise<bigint> {
  const info = await connection.getAccountInfo(
    getCrowdfundCreatorStatePda(creator)
  );
  if (!info) throw new Error("CreatorCrowdfundState not initialized");
  return info.data.readBigUInt64LE(48);
}

/**
 * Create an on-chain crowdfund campaign. Lazy-inits the per-creator
 * counter PDA on first use. The Crowdfund PDA itself doubles as the
 * lamport vault — pledges System-CPI lamports into it; claim/refund
 * directly mutate the PDA's lamport balance.
 *
 * `metadataHash` should be the BLAKE3 hash of the off-chain
 * CROWDFUND_ADD envelope so the on-chain Crowdfund points back to
 * title / description / image / currency.
 */
export async function createCrowdfundOnchain(
  provider: AnchorProvider,
  args: {
    creatorTid: number;
    /** Goal in lamports. */
    goalAmountLamports: bigint;
    /** Unix seconds; must be in the future. */
    deadlineAtUnix: number;
    metadataHash: Uint8Array;
  }
): Promise<{ txSig: string; crowdfundPda: PublicKey; crowdfundId: bigint }> {
  if (args.metadataHash.length !== 32) {
    throw new Error("metadataHash must be exactly 32 bytes");
  }
  if (args.goalAmountLamports <= BigInt(0)) {
    throw new Error("goalAmountLamports must be > 0");
  }

  const creator = provider.wallet.publicKey;
  const creatorState = getCrowdfundCreatorStatePda(creator);

  const txn = new Transaction();

  if (!(await hasCrowdfundCreatorState(provider.connection, creator))) {
    const initData = Buffer.concat([
      DISC.cfInitCreatorState,
      bnToLeBuffer(args.creatorTid, 8),
    ]);
    txn.add(
      new TransactionInstruction({
        programId: PROGRAM_IDS.crowdfundRegistry,
        keys: [
          { pubkey: creatorState, isSigner: false, isWritable: true },
          { pubkey: creator, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: initData,
      })
    );
  }

  let crowdfundId: bigint;
  if (txn.instructions.length === 0) {
    crowdfundId = await getNextCrowdfundId(provider.connection, creator);
  } else {
    crowdfundId = BigInt(0);
  }
  const crowdfundPda = getCrowdfundPda(creator, crowdfundId);

  // Args: goal_amount u64 | deadline_at i64 | metadata_hash [u8;32]
  const createData = Buffer.concat([
    DISC.cfCreateCrowdfund,
    new BN(args.goalAmountLamports.toString()).toArrayLike(Buffer, "le", 8),
    writeI64LE(args.deadlineAtUnix),
    Buffer.from(args.metadataHash),
  ]);
  txn.add(
    new TransactionInstruction({
      programId: PROGRAM_IDS.crowdfundRegistry,
      keys: [
        { pubkey: creatorState, isSigner: false, isWritable: true },
        { pubkey: crowdfundPda, isSigner: false, isWritable: true },
        { pubkey: creator, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: createData,
    })
  );

  const txSig = await provider.sendAndConfirm(txn);
  return { txSig, crowdfundPda, crowdfundId };
}

/**
 * Pledge `amountLamports` to a campaign. The Pledge PDA seeded by
 * (crowdfund, backer) accumulates across multiple pledges from the
 * same backer (init_if_needed in the program, no-op when re-pledging).
 */
export async function pledgeCrowdfundOnchain(
  provider: AnchorProvider,
  args: {
    crowdfundPda: PublicKey;
    backerTid: number;
    amountLamports: bigint;
  }
): Promise<{ txSig: string; pledgePda: PublicKey }> {
  if (args.amountLamports <= BigInt(0)) {
    throw new Error("amountLamports must be > 0");
  }
  const backer = provider.wallet.publicKey;
  const pledgePda = getPledgePda(args.crowdfundPda, backer);

  // Args: backer_tid u64 | amount u64
  const data = Buffer.concat([
    DISC.cfPledge,
    bnToLeBuffer(args.backerTid, 8),
    new BN(args.amountLamports.toString()).toArrayLike(Buffer, "le", 8),
  ]);
  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.crowdfundRegistry,
    keys: [
      { pubkey: args.crowdfundPda, isSigner: false, isWritable: true },
      { pubkey: pledgePda, isSigner: false, isWritable: true },
      { pubkey: backer, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
  const txSig = await provider.sendAndConfirm(new Transaction().add(ix));
  return { txSig, pledgePda };
}

/** Creator-only. Once the deadline passes and the goal is met, sweep
 *  the vault into the creator's wallet and mark the campaign Succeeded. */
export async function claimCrowdfundFundsOnchain(
  provider: AnchorProvider,
  crowdfundPda: PublicKey
): Promise<{ txSig: string }> {
  const creator = provider.wallet.publicKey;
  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.crowdfundRegistry,
    keys: [
      { pubkey: crowdfundPda, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: true },
    ],
    data: DISC.cfClaimFunds,
  });
  const txSig = await provider.sendAndConfirm(new Transaction().add(ix));
  return { txSig };
}

/** Backer-only. Once the deadline passes and the goal wasn't met,
 *  return the backer's pledge from the vault. Closes the Pledge PDA;
 *  rent goes back to the backer. */
export async function refundCrowdfundOnchain(
  provider: AnchorProvider,
  crowdfundPda: PublicKey
): Promise<{ txSig: string; pledgePda: PublicKey }> {
  const backer = provider.wallet.publicKey;
  const pledgePda = getPledgePda(crowdfundPda, backer);
  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.crowdfundRegistry,
    keys: [
      { pubkey: crowdfundPda, isSigner: false, isWritable: true },
      { pubkey: pledgePda, isSigner: false, isWritable: true },
      { pubkey: backer, isSigner: true, isWritable: true },
    ],
    data: DISC.cfRefund,
  });
  const txSig = await provider.sendAndConfirm(new Transaction().add(ix));
  return { txSig, pledgePda };
}

// ── Tasks ────────────────────────────────────────────────────────────

function getTaskCreatorStatePda(creator: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("task-creator"), creator.toBuffer()],
    PROGRAM_IDS.taskRegistry
  )[0];
}

function getTaskPda(creator: PublicKey, taskId: bigint): PublicKey {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(taskId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("task"), creator.toBuffer(), idBuf],
    PROGRAM_IDS.taskRegistry
  )[0];
}

export async function hasTaskCreatorState(
  connection: Connection,
  creator: PublicKey
): Promise<boolean> {
  const info = await connection.getAccountInfo(getTaskCreatorStatePda(creator));
  return info !== null;
}

/** CreatorTaskState.next_task_id sits at offset 48 (8 disc + 32 creator + 8 tid). */
async function getNextTaskId(
  connection: Connection,
  creator: PublicKey
): Promise<bigint> {
  const info = await connection.getAccountInfo(getTaskCreatorStatePda(creator));
  if (!info) throw new Error("CreatorTaskState not initialized");
  return info.data.readBigUInt64LE(48);
}

/**
 * Create an on-chain Task. Lazy-inits the per-creator counter PDA
 * on first use. When `rewardLamports > 0`, the creator escrows that
 * amount into the Task PDA — released to the claimer on
 * complete_task or refunded on cancel_task.
 *
 * `metadataHash` should be the BLAKE3 hash of the off-chain
 * TASK_ADD envelope so the on-chain Task PDA points back to title /
 * description / reward_text.
 */
export async function createTaskOnchain(
  provider: AnchorProvider,
  args: {
    creatorTid: number;
    /** Reward in lamports. Pass 0 for no escrow. */
    rewardLamports: bigint;
    metadataHash: Uint8Array;
  }
): Promise<{ txSig: string; taskPda: PublicKey; taskId: bigint }> {
  if (args.metadataHash.length !== 32) {
    throw new Error("metadataHash must be exactly 32 bytes");
  }
  if (args.rewardLamports < BigInt(0)) {
    throw new Error("rewardLamports must be >= 0");
  }

  const creator = provider.wallet.publicKey;
  const creatorState = getTaskCreatorStatePda(creator);

  const txn = new Transaction();

  if (!(await hasTaskCreatorState(provider.connection, creator))) {
    const initData = Buffer.concat([
      DISC.taskInitCreatorState,
      bnToLeBuffer(args.creatorTid, 8),
    ]);
    txn.add(
      new TransactionInstruction({
        programId: PROGRAM_IDS.taskRegistry,
        keys: [
          { pubkey: creatorState, isSigner: false, isWritable: true },
          { pubkey: creator, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: initData,
      })
    );
  }

  let taskId: bigint;
  if (txn.instructions.length === 0) {
    taskId = await getNextTaskId(provider.connection, creator);
  } else {
    taskId = BigInt(0);
  }
  const taskPda = getTaskPda(creator, taskId);

  // Args: reward_amount u64 | metadata_hash [u8;32]
  const createData = Buffer.concat([
    DISC.taskCreate,
    new BN(args.rewardLamports.toString()).toArrayLike(Buffer, "le", 8),
    Buffer.from(args.metadataHash),
  ]);
  txn.add(
    new TransactionInstruction({
      programId: PROGRAM_IDS.taskRegistry,
      keys: [
        { pubkey: creatorState, isSigner: false, isWritable: true },
        { pubkey: taskPda, isSigner: false, isWritable: true },
        { pubkey: creator, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: createData,
    })
  );

  const txSig = await provider.sendAndConfirm(txn);
  return { txSig, taskPda, taskId };
}

/** Claim an Open task. Locks it to the signer until complete or cancel.
 *  Cannot be the creator (program rejects self-claim). */
export async function claimTaskOnchain(
  provider: AnchorProvider,
  args: {
    taskPda: PublicKey;
    claimerTid: number;
  }
): Promise<{ txSig: string }> {
  const claimer = provider.wallet.publicKey;
  // Args: claimer_tid u64
  const data = Buffer.concat([
    DISC.taskClaim,
    bnToLeBuffer(args.claimerTid, 8),
  ]);
  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.taskRegistry,
    keys: [
      { pubkey: args.taskPda, isSigner: false, isWritable: true },
      { pubkey: claimer, isSigner: true, isWritable: false },
    ],
    data,
  });
  const txSig = await provider.sendAndConfirm(new Transaction().add(ix));
  return { txSig };
}

/** Creator-only. Releases any escrowed reward to the claimer of
 *  record. The claimer pubkey is required because the program's
 *  has_one constraint verifies it against task.claimer. */
export async function completeTaskOnchain(
  provider: AnchorProvider,
  args: {
    taskPda: PublicKey;
    claimer: PublicKey;
  }
): Promise<{ txSig: string }> {
  const creator = provider.wallet.publicKey;
  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.taskRegistry,
    keys: [
      { pubkey: args.taskPda, isSigner: false, isWritable: true },
      { pubkey: args.claimer, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: true },
    ],
    data: DISC.taskComplete,
  });
  const txSig = await provider.sendAndConfirm(new Transaction().add(ix));
  return { txSig };
}

/** Creator-only. Refunds any escrowed reward and marks the task
 *  Cancelled. Only valid while the task is still Open (the program
 *  rejects cancel after a claim). */
export async function cancelTaskOnchain(
  provider: AnchorProvider,
  taskPda: PublicKey
): Promise<{ txSig: string }> {
  const creator = provider.wallet.publicKey;
  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.taskRegistry,
    keys: [
      { pubkey: taskPda, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: true },
    ],
    data: DISC.taskCancel,
  });
  const txSig = await provider.sendAndConfirm(new Transaction().add(ix));
  return { txSig };
}

// ── channel-registry helpers ─────────────────────────────────────────

/** Channel-id slug regex — matches the program's validate_channel_id. */
const CHANNEL_ID_REGEX = /^[a-z0-9-]+$/;
/** Reserved id rejected by the program; "general" is the always-on default. */
const RESERVED_GENERAL_ID = "general";

export const CHANNEL_KIND_CITY = 2;
export const CHANNEL_KIND_INTEREST = 3;

/** Run the same checks the program does so we fail fast in the
 *  browser before the wallet pops up a sign sheet. */
export function validateChannelId(id: string): void {
  if (!id) throw new Error("channel id must not be empty");
  if (id.length > 32) throw new Error("on-chain channel id is capped at 32 bytes");
  if (!CHANNEL_ID_REGEX.test(id)) {
    throw new Error("channel id must match /^[a-z0-9-]+$/");
  }
  if (id === RESERVED_GENERAL_ID) {
    throw new Error('"general" is reserved for the hub-seeded default channel');
  }
}

function getChannelPda(id: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("channel"), Buffer.from(id)],
    PROGRAM_IDS.channelRegistry
  )[0];
}

/**
 * Claim ownership of an unregistered channel slug on chain. First-
 * write-wins: the PDA is seeded by the literal id bytes so each id
 * maps to exactly one ChannelRecord across the whole network.
 *
 * `metadataHash` should be the BLAKE3 hash of the off-chain
 * CHANNEL_ADD envelope so the on-chain ChannelRecord points back to
 * the envelope (apps fetch /v1/messages/:hash for name + description).
 */
export async function registerChannelOnchain(
  provider: AnchorProvider,
  args: {
    id: string;
    kind: typeof CHANNEL_KIND_CITY | typeof CHANNEL_KIND_INTEREST;
    ownerTid: number;
    latitude?: number;
    longitude?: number;
    /** 32-byte BLAKE3 hash. Pass an all-zero buffer to skip the link. */
    metadataHash: Uint8Array;
  }
): Promise<{ txSig: string; channelPda: PublicKey }> {
  validateChannelId(args.id);
  if (args.metadataHash.length !== 32) {
    throw new Error("metadataHash must be exactly 32 bytes");
  }

  const owner = provider.wallet.publicKey;
  const channelPda = getChannelPda(args.id);
  const hasLocation =
    args.latitude !== undefined || args.longitude !== undefined;

  // Args layout (mirrors register_channel signature):
  //   id String (4-byte len + bytes)
  //   | kind u8 | owner_tid u64 | latitude f64 | longitude f64
  //   | has_location u8 | metadata_hash [u8;32]
  const idBytes = Buffer.from(args.id, "utf8");
  const idLenBuf = Buffer.alloc(4);
  idLenBuf.writeUInt32LE(idBytes.length, 0);

  const data = Buffer.concat([
    DISC.channelRegister,
    idLenBuf,
    idBytes,
    Buffer.from([args.kind]),
    bnToLeBuffer(args.ownerTid, 8),
    writeFloat64LE(args.latitude ?? 0),
    writeFloat64LE(args.longitude ?? 0),
    Buffer.from([hasLocation ? 1 : 0]),
    Buffer.from(args.metadataHash),
  ]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_IDS.channelRegistry,
    keys: [
      { pubkey: channelPda, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const txSig = await provider.sendAndConfirm(new Transaction().add(ix));
  return { txSig, channelPda };
}
