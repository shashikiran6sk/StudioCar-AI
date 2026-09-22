import type {
  AuthUser,
  PhoneOtpDriver,
  ClaimPhoneOtpVerificationCommand,
  ClaimPhoneOtpVerificationResult,
  CompletePhoneOtpCommand,
  CreatePhoneOtpChallengeCommand,
  CreatePhoneOtpChallengeResult,
  IdentityLinkResult,
  LinkPhoneIdentity,
  LinkPhoneIdentityCommand,
  PhoneOtpWidget,
  PhoneStart,
  PhoneOtpCompletionResult,
  PhoneVerify,
} from "@studiocar/contracts";

import type {
  ActiveSession,
  PreparedSession,
} from "../session-service";

export enum PhoneOtpIdentificationStatus {
  Verified = "verified",
  Rejected = "rejected",
  Unavailable = "unavailable",
}

/**
 * Digits only, without a leading plus, exactly as MSG91 names a handset.
 */
export type ProviderMsisdn = string;

export type PhoneOtpIdentification =
  | {
      status: PhoneOtpIdentificationStatus.Verified;
      identifier: ProviderMsisdn;
    }
  | { status: PhoneOtpIdentificationStatus.Rejected }
  | { status: PhoneOtpIdentificationStatus.Unavailable };

/**
 * The browser sends and collects the OTP through the provider widget. The
 * server never sees the code: it presents the resulting access token and asks
 * whose handset it proves.
 */
export interface PhoneOtpProvider {
  readonly driver: PhoneOtpDriver;
  identify(accessToken: string): Promise<PhoneOtpIdentification>;
}

export interface PhoneOtpChallengeStore {
  createRateLimited(
    command: CreatePhoneOtpChallengeCommand,
  ): Promise<CreatePhoneOtpChallengeResult>;
  markSent(
    challengeId: string,
    providerRequestId: string | null,
    sentAt: Date,
  ): Promise<boolean>;
  markSendFailed(
    challengeId: string,
    failureCode: string,
    failedAt: Date,
  ): Promise<boolean>;
  claimVerification(
    command: ClaimPhoneOtpVerificationCommand,
  ): Promise<ClaimPhoneOtpVerificationResult>;
  recordInvalid(
    challengeId: string,
    attemptId: string,
    completedAt: Date,
  ): Promise<boolean>;
  /**
   * Claiming the provider token hash is what makes a verified access token
   * single use across challenges; a replay collides on the unique index.
   */
  recordProviderVerified(
    challengeId: string,
    attemptId: string,
    providerTokenHash: string,
    completedAt: Date,
  ): Promise<boolean>;
  recordProviderError(
    challengeId: string,
    attemptId: string,
    completedAt: Date,
  ): Promise<boolean>;
}

export interface PhoneIdentityLinkStore {
  linkPhone(command: LinkPhoneIdentityCommand): Promise<IdentityLinkResult>;
}

export interface PhoneOtpCompletionStore {
  complete(command: CompletePhoneOtpCommand): Promise<PhoneOtpCompletionResult>;
}

export interface SessionPreparer {
  prepareIssue(): PreparedSession;
}

export interface StartedPhoneOtp {
  challengeId: string;
  expiresAt: Date;
  browserBinding: string;
}

export interface PhoneOtpWidgetConfiguration {
  describe(): PhoneOtpWidget;
}

export interface CompletedPhoneOtp {
  token: string;
  expiresAt: Date;
  session: ActiveSession;
  user: AuthUser;
}

export interface PhoneOtpApplication {
  start(input: PhoneStart, clientAddress: string): Promise<StartedPhoneOtp>;
  verify(
    input: PhoneVerify,
    browserBinding: string,
    clientAddress: string,
  ): Promise<CompletedPhoneOtp>;
  /**
   * Proves a phone number for an account that is already signed in. It runs the
   * same challenge, rate-limit, identifier-assertion and single-use-token path
   * as signing in, then attaches the identity instead of issuing a session.
   */
  link(
    userId: string,
    input: LinkPhoneIdentity,
    browserBinding: string,
    clientAddress: string,
  ): Promise<IdentityLinkResult>;
}
