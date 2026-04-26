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
